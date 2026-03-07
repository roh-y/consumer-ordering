# Terraform Guide

A beginner-friendly walkthrough of the infrastructure-as-code (IaC) that powers the
Consumer Ordering platform. Every example uses real code from this project.

> **Companion files** — open the `infrastructure/` directory in your editor alongside
> this guide. For AWS service details see [AWS_SERVICES_GUIDE.md](AWS_SERVICES_GUIDE.md).

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Core Concepts](#2-core-concepts)
3. [Project File Structure](#3-project-file-structure)
4. [Module Deep Dives](#4-module-deep-dives)
5. [Module Dependency Graph](#5-module-dependency-graph)
6. [Environment Structure](#6-environment-structure)
7. [Common Commands](#7-common-commands)
8. [State Management](#8-state-management)
9. [Cost Breakdown](#9-cost-breakdown)
10. [Troubleshooting](#10-troubleshooting)
11. [Capstone Exercise](#11-capstone-exercise)
12. [Quick Reference Card](#12-quick-reference-card)
13. [Further Reading](#13-further-reading)

---

## 1. Introduction

### What Is Terraform?

Think of Terraform as a **recipe for your cloud infrastructure**. Instead of clicking
through the AWS Console to create a VPC, database tables, and containers, you write
what you want in `.tf` files and Terraform makes it happen. This is called
**Infrastructure as Code (IaC)**.

### Why IaC Instead of the AWS Console?

| Manual (Console)                       | IaC (Terraform)                          |
|----------------------------------------|------------------------------------------|
| Click through dozens of screens        | Run one command: `terraform apply`       |
| Hard to remember what you changed      | Changes are tracked in git               |
| Impossible to reproduce exactly        | Same config = same infrastructure        |
| One environment at a time              | Spin up dev, staging, prod from one base |
| "It works on my account"               | Shared, reviewable code                  |

### Prerequisites

- **Terraform** >= 1.5.0 — [install guide](https://developer.hashicorp.com/terraform/install)
- **AWS CLI** configured with credentials — run `aws configure`
- A text editor with HCL syntax highlighting (VS Code + HashiCorp Terraform extension)

### How to Use This Guide

Open `infrastructure/` in your editor. Each section references real files with
`file:line` markers so you can jump straight to the source.

---

## 2. Core Concepts

### Providers — "Which cloud are we talking to?"

A **provider** is a plugin that lets Terraform talk to a specific cloud. Ours uses
the AWS provider.

```hcl
# infrastructure/main.tf:1-11
provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = var.project_name
      Environment = var.environment
      ManagedBy   = "terraform"
    }
  }
}
```

The `default_tags` block automatically labels every resource with the project name,
environment, and a `ManagedBy = "terraform"` tag so you can tell which resources
Terraform manages.

The required provider version is pinned in `infrastructure/versions.tf:1-10`:

```hcl
terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}
```

`~> 5.0` means "any 5.x version" — it allows patch/minor updates but not a jump to 6.x.

---

### Resources — "The things Terraform creates"

A **resource** is a single piece of infrastructure: a database table, a queue, a VPC.
Here is the Users table from `modules/dynamodb/main.tf:9-31`:

```hcl
resource "aws_dynamodb_table" "users" {
  name         = "${var.project_name}-users"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "userId"

  attribute {
    name = "userId"
    type = "S"
  }

  attribute {
    name = "email"
    type = "S"
  }

  global_secondary_index {
    name            = "email-index"
    hash_key        = "email"
    projection_type = "ALL"
  }

  tags = { Name = "${local.name_prefix}-users" }
}
```

The pattern is always `resource "<provider>_<type>" "<local_name>" { ... }`. You
reference this resource elsewhere as `aws_dynamodb_table.users`.

---

### Variables — "Knobs you can turn"

Variables make your configuration reusable. From `infrastructure/variables.tf:1-5`:

```hcl
variable "project_name" {
  description = "Project name used as prefix for all resources"
  type        = string
  default     = "consumer-ordering"
}
```

Each variable has a **type** (string, number, list, map) and an optional **default**.
If there is no default, Terraform will prompt you for a value.

You set variable values in a `terraform.tfvars` file. From
`infrastructure/environments/dev/terraform.tfvars`:

```hcl
project_name = "consumer-ordering"
environment  = "dev"
aws_region   = "us-east-1"
vpc_cidr     = "10.0.0.0/16"
```

**Precedence** (lowest to highest): variable default -> `terraform.tfvars` -> `-var` CLI flag.

---

### Outputs — "Values Terraform tells you after it runs"

Outputs expose important values like IDs and URLs. From `infrastructure/outputs.tf:6-9`:

```hcl
output "cognito_user_pool_id" {
  description = "Cognito User Pool ID — set as COGNITO_USER_POOL_ID env var"
  value       = module.cognito.user_pool_id
}
```

After `terraform apply`, you can retrieve any output:

```bash
terraform output cognito_user_pool_id
# "us-east-1_AbCdEfGhI"
```

Some outputs are marked `sensitive = true` (like IAM access keys) and will be hidden
unless you explicitly ask: `terraform output -json iam_developer_access_keys`.

---

### State — "Terraform's memory"

Terraform tracks every resource it creates in a **state file** (`terraform.tfstate`).
This is how it knows what exists, what changed, and what to delete.

- The state file is Terraform's single source of truth
- It maps your `.tf` code to real AWS resources
- **Never edit it by hand** — use `terraform state` commands
- The `.gitignore` excludes `*.tfstate` and `*.tfstate.*` (lines 50-51)

If you lose the state file, Terraform forgets what it created. See
[State Management](#8-state-management) for how to protect it.

---

### Modules — "Reusable building blocks"

A **module** is a folder of `.tf` files that creates a group of related resources.
Our root `main.tf` calls nine modules. Here is the VPC module call from
`infrastructure/main.tf:14-19`:

```hcl
module "vpc" {
  source       = "./modules/vpc"
  project_name = var.project_name
  environment  = var.environment
  vpc_cidr     = var.vpc_cidr
}
```

`source` tells Terraform where to find the module. Inputs (`project_name`, etc.)
flow in as variables; outputs (`module.vpc.vpc_id`) flow back out.

---

### Try It Yourself #1

```bash
cd infrastructure/environments/dev
terraform init
```

Look at the output — Terraform downloads the AWS provider plugin into
`.terraform/providers/`. Check `.gitignore` line 49: `.terraform/` is excluded
because these plugins are large binaries that can be re-downloaded.

---

## 3. Project File Structure

```
infrastructure/
├── main.tf                        # Root module — wires all 9 modules together
├── variables.tf                   # Input variables (project_name, environment, etc.)
├── outputs.tf                     # Exposed values (Cognito IDs, ECR URLs, etc.)
├── versions.tf                    # Terraform and provider version constraints
├── backend.tf                     # Remote state config (commented out)
│
├── environments/
│   ├── dev/
│   │   ├── main.tf                # Dev wrapper — calls root module with dev settings
│   │   ├── variables.tf           # Dev variable declarations
│   │   └── terraform.tfvars       # Dev values (vpc_cidr = "10.0.0.0/16")
│   └── prod/
│       ├── main.tf                # Prod wrapper — calls root module with prod settings
│       └── variables.tf           # Prod variable declarations (vpc_cidr = "10.1.0.0/16")
│
└── modules/
    ├── vpc/                       # VPC, subnets, NAT Gateway, route tables
    ├── cognito/                   # User pool and app client
    ├── dynamodb/                  # Users, Plans, Orders tables
    ├── sqs/                       # Order events queue + dead-letter queue
    ├── monitoring/                # CloudWatch log groups, alarms, dashboard
    ├── ecs/                       # Fargate cluster, ECR, ALB, task definitions, services
    ├── iam/                       # Developer users/groups, GitHub Actions OIDC role
    ├── api-gateway/               # HTTP API, JWT authorizer, VPC Link, routes
    └── cloudfront/                # S3 bucket, CloudFront distribution, OAC
```

### The "Wrapper Module" Pattern

You never run `terraform apply` from the root `infrastructure/` directory. Instead, you
run from an **environment directory** like `environments/dev/`. The wrapper calls the
root module and passes environment-specific values:

```hcl
# infrastructure/environments/dev/main.tf:1-15
module "root" {
  source = "../../"

  project_name = var.project_name
  environment  = var.environment
  aws_region   = var.aws_region
  vpc_cidr     = var.vpc_cidr
  developers   = var.developers

  ecs_service_cpu    = var.ecs_service_cpu
  ecs_service_memory = var.ecs_service_memory
  ecs_desired_count  = var.ecs_desired_count

  github_repository = var.github_repository
}
```

This pattern gives each environment its own state file and variable values while
sharing the same module code.

---

## 4. Module Deep Dives

Each module follows the same structure: `main.tf` (resources), `variables.tf` (inputs),
`outputs.tf` (values exposed to other modules).

---

### 4.1 vpc — Network foundation

> **What You Will Learn**: VPC layout, public vs. private subnets, NAT Gateway

**What This Module Creates**:
- 1 VPC (`consumer-ordering-dev-vpc`)
- 2 public subnets (one per availability zone)
- 2 private subnets (one per availability zone)
- 1 Internet Gateway
- 1 NAT Gateway + Elastic IP
- Route tables for public and private subnets

**Why It Exists**: Every AWS resource that needs a network (ECS tasks, ALB, API Gateway
VPC Link) lives inside this VPC. Public subnets have internet access through the Internet
Gateway. Private subnets route outbound traffic through the NAT Gateway — services can
pull Docker images and call AWS APIs but cannot be reached directly from the internet.

**Key Code Walkthrough** (`modules/vpc/main.tf`):

The module uses `cidrsubnet()` to carve subnets from the VPC CIDR (line 30):

```hcl
cidr_block = cidrsubnet(var.vpc_cidr, 8, count.index)       # Public: 10.0.0.0/24, 10.0.1.0/24
cidr_block = cidrsubnet(var.vpc_cidr, 8, count.index + 10)  # Private: 10.0.10.0/24, 10.0.11.0/24
```

A single NAT Gateway (line 71-78) keeps costs low in dev. Production would use one per AZ
for high availability.

**Inputs**:

| Variable       | Type   | Default        | Description              |
|----------------|--------|----------------|--------------------------|
| `project_name` | string | —              | Resource name prefix     |
| `environment`  | string | —              | dev, staging, prod       |
| `vpc_cidr`     | string | `10.0.0.0/16`  | VPC address range        |

**Outputs**:

| Output               | Description                         |
|----------------------|-------------------------------------|
| `vpc_id`             | VPC ID                              |
| `public_subnet_ids`  | List of public subnet IDs           |
| `private_subnet_ids` | List of private subnet IDs          |

---

### 4.2 cognito — User authentication

> **What You Will Learn**: User pool configuration, app client setup, token validity

**What This Module Creates**:
- 1 Cognito User Pool (`consumer-ordering-dev-users`)
- 1 App Client (`consumer-ordering-dev-client`) — no secret (public SPA client)

**Why It Exists**: Handles user registration, email verification, login, and JWT token
issuance. The React frontend and API Gateway both use Cognito for authentication.

**Key Code Walkthrough** (`modules/cognito/main.tf`):

The password policy (lines 14-20) requires 8+ chars, uppercase, lowercase, and numbers:

```hcl
password_policy {
  minimum_length    = 8
  require_lowercase = true
  require_numbers   = true
  require_symbols   = false
  require_uppercase = true
}
```

The app client (lines 72-94) is a **public client** (`generate_secret = false`) because
it is used by a browser-based React SPA. Tokens expire after 1 hour; refresh tokens
last 30 days.

**Inputs**:

| Variable       | Type   | Description          |
|----------------|--------|----------------------|
| `project_name` | string | Resource name prefix |
| `environment`  | string | dev, staging, prod   |

**Outputs**:

| Output          | Description              |
|-----------------|--------------------------|
| `user_pool_id`  | Cognito User Pool ID     |
| `user_pool_arn` | Cognito User Pool ARN    |
| `client_id`     | App Client ID            |

---

### 4.3 dynamodb — Data storage

> **What You Will Learn**: Table design, partition/sort keys, Global Secondary Indexes

**What This Module Creates**:
- `consumer-ordering-users` — PK: `userId`, GSI: `email-index`
- `consumer-ordering-plans` — PK: `planId`
- `consumer-ordering-orders` — PK: `orderId`, SK: `userId`, GSI: `userId-index`

**Why It Exists**: Stores users, available plans, and customer orders. All tables use
`PAY_PER_REQUEST` billing, which means zero cost at low volume (no pre-provisioned
capacity).

**Key Code Walkthrough** (`modules/dynamodb/main.tf`):

The orders table (lines 48-71) uses a **composite key** — `orderId` as the partition key
and `userId` as the sort key. The `userId-index` GSI lets you query "all orders for
user X" efficiently:

```hcl
global_secondary_index {
  name            = "userId-index"
  hash_key        = "userId"
  projection_type = "ALL"
}
```

**Inputs**:

| Variable       | Type   | Description          |
|----------------|--------|----------------------|
| `project_name` | string | Resource name prefix |
| `environment`  | string | dev, staging, prod   |

**Outputs**:

| Output              | Description                |
|---------------------|----------------------------|
| `users_table_name`  | Users table name           |
| `users_table_arn`   | Users table ARN            |
| `plans_table_name`  | Plans table name           |
| `plans_table_arn`   | Plans table ARN            |
| `orders_table_name` | Orders table name          |
| `orders_table_arn`  | Orders table ARN           |

---

### 4.4 sqs — Asynchronous messaging

> **What You Will Learn**: Queues, dead-letter queues, redrive policies

**What This Module Creates**:
- `consumer-ordering-dev-order-events` — main queue (4-day retention)
- `consumer-ordering-dev-order-events-dlq` — dead-letter queue (14-day retention)

**Why It Exists**: When the order-service creates an order, it publishes an event to the
queue. A consumer (future Phase 3) processes these events asynchronously. If processing
fails 3 times, the message moves to the DLQ for manual inspection.

**Key Code Walkthrough** (`modules/sqs/main.tf`):

The redrive policy (lines 21-24) defines the retry behavior:

```hcl
redrive_policy = jsonencode({
  deadLetterTargetArn = aws_sqs_queue.order_events_dlq.arn
  maxReceiveCount     = 3
})
```

`visibility_timeout_seconds = 60` means a message is hidden from other consumers for 60
seconds while being processed.

**Inputs**:

| Variable       | Type   | Description          |
|----------------|--------|----------------------|
| `project_name` | string | Resource name prefix |
| `environment`  | string | dev, staging, prod   |

**Outputs**:

| Output                    | Description               |
|---------------------------|---------------------------|
| `order_events_queue_url`  | Main queue URL             |
| `order_events_queue_arn`  | Main queue ARN             |
| `order_events_dlq_url`   | Dead-letter queue URL      |
| `order_events_dlq_arn`   | Dead-letter queue ARN      |

---

### 4.5 monitoring — Observability

> **What You Will Learn**: Log groups, CloudWatch alarms, dashboards

**What This Module Creates**:
- 3 CloudWatch log groups (`/ecs/consumer-ordering-dev-{service}`)
- 6 CloudWatch metric alarms (CPU > 80% and Memory > 85% per service)
- 1 CloudWatch dashboard (`consumer-ordering-dev-ecs`)

**Why It Exists**: ECS tasks write logs to CloudWatch. The alarms notify you (via an
optional SNS topic) when a service is under heavy load. The dashboard gives a visual
overview of CPU and memory across all three services.

**Key Code Walkthrough** (`modules/monitoring/main.tf`):

Log groups are created with `for_each` (lines 7-12), which creates one per service:

```hcl
resource "aws_cloudwatch_log_group" "ecs" {
  for_each = var.services

  name              = "/ecs/${local.prefix}-${each.key}"
  retention_in_days = var.log_retention_days
}
```

The CPU alarm (lines 16-37) triggers when average CPU exceeds 80% over two consecutive
5-minute periods.

**Inputs**:

| Variable              | Type        | Default | Description                    |
|-----------------------|-------------|---------|--------------------------------|
| `project_name`        | string      | —       | Resource name prefix           |
| `environment`         | string      | —       | dev, staging, prod             |
| `services`            | map(number) | —       | Map of service name to port    |
| `ecs_cluster_name`    | string      | —       | Cluster name for alarm dims    |
| `log_retention_days`  | number      | `14`    | Days to keep logs              |
| `alarm_sns_topic_arn` | string      | `""`    | Optional SNS topic for alerts  |

**Outputs**:

| Output            | Description                                  |
|-------------------|----------------------------------------------|
| `log_group_names` | Map of service name to log group name        |
| `log_group_arns`  | Map of service name to log group ARN         |
| `dashboard_name`  | CloudWatch dashboard name                    |

---

### 4.6 ecs — Container orchestration (largest module)

> **What You Will Learn**: Fargate cluster, ECR repositories, ALB routing, task
> definitions, IAM roles, security groups

**What This Module Creates**:
- 1 ECS Fargate cluster (`consumer-ordering-dev-cluster`)
- 3 ECR repositories (one per service, with lifecycle policies keeping last 10 images)
- 1 internal Application Load Balancer + 3 target groups with path-based routing
- 3 task definitions (Fargate, awsvpc networking, 512 CPU / 1024 MB memory)
- 3 ECS services (desired count = 1)
- 2 IAM roles (task execution role + task role)
- 2 security groups (ALB + ECS tasks)

**Why It Exists**: Runs the three Java Spring Boot microservices (user-service,
plan-catalog-service, order-service) as Fargate containers. The ALB routes `/api/users*`
to user-service, `/api/plans*` to plan-catalog-service, and `/api/orders*` to
order-service.

**Key Code Walkthrough**:

This module is split across multiple files:

| File                  | What It Defines                                 |
|-----------------------|-------------------------------------------------|
| `main.tf`             | ECS cluster with Container Insights             |
| `ecr.tf`              | ECR repos + lifecycle policies                  |
| `iam.tf`              | Task execution role + task role with DynamoDB/SQS/Cognito access |
| `security_groups.tf`  | ALB SG (HTTP from VPC) + ECS tasks SG (ALB only)|
| `alb.tf`              | Internal ALB, target groups, path-based routing  |
| `services.tf`         | Task definitions + ECS services                 |
| `outputs.tf`          | Cluster name, ALB DNS, ECR URLs, service names   |

**Path-based routing** (`alb.tf:57-77`): The ALB listener has a default 404 response.
Listener rules route by URL path:

```hcl
condition {
  path_pattern {
    values = [
      each.key == "user-service" ? "/api/users*" :
      each.key == "plan-catalog-service" ? "/api/plans*" :
      each.key == "order-service" ? "/api/orders*" :
      "/api/${each.key}*"
    ]
  }
}
```

**Two IAM roles** (`iam.tf`):
- **Task execution role** (lines 3-23): Lets ECS pull images from ECR and write logs.
  Uses the AWS-managed `AmazonECSTaskExecutionRolePolicy`.
- **Task role** (lines 27-99): Gives the running application access to DynamoDB, SQS,
  and Cognito. This is the role your Java code uses at runtime.

**Task definitions** (`services.tf:1-52`): Each task definition uses `for_each` over the
services map. The `__ALB_DNS__` placeholder for the order-service's
`PLAN_CATALOG_SERVICE_URL` is replaced at plan time with the actual ALB DNS name:

```hcl
environment = [
  for k, v in each.value.environment : {
    name  = k
    value = v == "__ALB_DNS__" ? "http://${aws_lb.internal.dns_name}" : v
  }
]
```

**Inputs**:

| Variable              | Type         | Description                              |
|-----------------------|--------------|------------------------------------------|
| `project_name`        | string       | Resource name prefix                     |
| `environment`         | string       | dev, staging, prod                       |
| `aws_region`          | string       | AWS region                               |
| `vpc_id`              | string       | VPC ID (from vpc module)                 |
| `private_subnet_ids`  | list(string) | Private subnets (from vpc module)        |
| `services`            | map(object)  | Service configs (port, cpu, memory, env) |
| `dynamodb_table_arns` | list(string) | DynamoDB ARNs for IAM policy             |
| `sqs_queue_arns`      | list(string) | SQS ARNs for IAM policy                  |
| `cognito_user_pool_arn`| string      | Cognito ARN for IAM policy               |
| `log_group_names`     | map(string)  | Log groups (from monitoring module)      |

**Outputs**:

| Output                       | Description                        |
|------------------------------|------------------------------------|
| `cluster_id`                 | ECS cluster ID                     |
| `cluster_name`               | ECS cluster name                   |
| `alb_dns_name`               | Internal ALB DNS name              |
| `alb_listener_arn`           | ALB HTTP listener ARN              |
| `alb_security_group_id`      | ALB security group ID              |
| `ecs_tasks_security_group_id`| ECS tasks security group ID        |
| `ecr_repository_urls`        | Map of service name to ECR repo URL|
| `service_names`              | Map of service name to ECS service |

---

### 4.7 iam — Access control

> **What You Will Learn**: IAM groups, developer users, GitHub Actions OIDC federation

**What This Module Creates**:
- 1 IAM group (`consumer-ordering-dev-developers`)
- IAM users + access keys (one per developer in the `developers` list)
- 1 GitHub Actions OIDC provider
- 1 GitHub Actions deploy role with ECR, ECS, S3, and CloudFront permissions

**Why It Exists**: Developers get scoped-down IAM credentials for local development
(DynamoDB, Cognito, SQS access only). GitHub Actions uses OIDC federation — no
long-lived AWS keys stored in GitHub secrets.

**Key Code Walkthrough**:

This module has two files:

| File              | What It Defines                               |
|-------------------|-----------------------------------------------|
| `main.tf`         | Developer group, policy, users, access keys   |
| `github-oidc.tf`  | OIDC provider + deploy role                   |

The OIDC trust policy (`github-oidc.tf:19-42`) restricts which GitHub repo and branch
can assume the role:

```hcl
condition {
  test     = "StringLike"
  variable = "token.actions.githubusercontent.com:sub"
  values   = ["repo:${var.github_repository}:ref:refs/heads/main"]
}
```

Only pushes to `main` in `roh-y/consumer-ordering` can deploy.

**Inputs**:

| Variable                     | Type         | Description                        |
|------------------------------|-------------|------------------------------------|
| `project_name`               | string      | Resource name prefix               |
| `environment`                | string      | dev, staging, prod                 |
| `developers`                 | list(string)| Developer names to create users for|
| `dynamodb_table_arns`        | list(string)| Tables to grant access to          |
| `cognito_user_pool_arn`      | string      | Cognito pool to grant access to    |
| `sqs_queue_arns`             | list(string)| Queues to grant access to          |
| `github_repository`          | string      | GitHub repo for OIDC trust         |
| `aws_region`                 | string      | Region for IAM policy scoping      |
| `s3_frontend_bucket_arn`     | string      | S3 bucket for deploy permissions   |
| `cloudfront_distribution_id` | string      | CloudFront ID for invalidation     |

**Outputs**:

| Output                     | Description                            |
|----------------------------|----------------------------------------|
| `developer_access_keys`   | Access keys per developer (sensitive)  |
| `group_name`               | IAM group name                         |
| `github_actions_role_arn`  | Role ARN for GitHub Actions workflows  |

---

### 4.8 api-gateway — API routing and authentication

> **What You Will Learn**: HTTP API, JWT authorizer, VPC Link, route definitions

**What This Module Creates**:
- 1 HTTP API (`consumer-ordering-dev-api`)
- 1 JWT authorizer (validates Cognito tokens)
- 1 VPC Link + security group (connects API Gateway to the private ALB)
- 1 HTTP_PROXY integration (forwards to ALB via VPC Link)
- 7 public routes (register, confirm, login, refresh, GET plans, GET plan by ID)
- 1 authenticated catch-all route (`ANY /api/{proxy+}`)
- 1 auto-deploy stage (`$default`)
- 1 access log group

**Why It Exists**: API Gateway is the public entry point for all API traffic. It handles
CORS, validates JWT tokens on protected routes, and forwards requests through a VPC Link
to the internal ALB. Public routes (login, registration, plan browsing) skip
authentication.

**Key Code Walkthrough** (`modules/api-gateway/main.tf`):

The JWT authorizer (lines 21-31) validates tokens against Cognito:

```hcl
resource "aws_apigatewayv2_authorizer" "cognito" {
  api_id           = aws_apigatewayv2_api.main.id
  authorizer_type  = "JWT"
  identity_sources = ["$request.header.Authorization"]
  name             = "${local.prefix}-cognito-authorizer"

  jwt_configuration {
    audience = [var.cognito_client_id]
    issuer   = "https://cognito-idp.${var.aws_region}.amazonaws.com/${var.cognito_user_pool_id}"
  }
}
```

The authenticated catch-all route (lines 109-116) protects everything under `/api/`
that is not explicitly defined as a public route:

```hcl
resource "aws_apigatewayv2_route" "authenticated" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "ANY /api/{proxy+}"
  target    = "integrations/${aws_apigatewayv2_integration.alb.id}"

  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.cognito.id
}
```

**Inputs**:

| Variable                | Type         | Description                        |
|-------------------------|--------------|------------------------------------|
| `project_name`          | string       | Resource name prefix               |
| `environment`           | string       | dev, staging, prod                 |
| `aws_region`            | string       | AWS region                         |
| `cognito_user_pool_id`  | string       | User pool for JWT validation       |
| `cognito_client_id`     | string       | Client ID for JWT audience         |
| `alb_listener_arn`      | string       | ALB listener to forward to         |
| `alb_dns_name`          | string       | ALB DNS name                       |
| `alb_security_group_id` | string       | ALB SG for VPC Link egress rule    |
| `private_subnet_ids`    | list(string) | Subnets for VPC Link               |
| `vpc_id`                | string       | VPC for security group             |

**Outputs**:

| Output              | Description              |
|---------------------|--------------------------|
| `api_endpoint`      | API Gateway invoke URL   |
| `api_id`            | API Gateway ID           |
| `api_execution_arn` | API Gateway execution ARN|

---

### 4.9 cloudfront — CDN and frontend hosting

> **What You Will Learn**: S3 bucket, Origin Access Control, CloudFront distribution,
> SPA routing

**What This Module Creates**:
- 1 private S3 bucket (`consumer-ordering-dev-frontend-{account_id}`)
- 1 Origin Access Control (OAC) for secure S3 access
- 1 CloudFront distribution with two origins (S3 + API Gateway)
- S3 bucket policy allowing only CloudFront access

**Why It Exists**: Serves the React SPA from S3 via CloudFront's global edge network.
API calls (`/api/*`) are forwarded to API Gateway. The S3 bucket is completely private —
only CloudFront can read from it via OAC.

**Key Code Walkthrough**:

This module has two files:

| File      | What It Defines                                    |
|-----------|----------------------------------------------------|
| `s3.tf`   | S3 bucket, public access block, bucket policy      |
| `main.tf` | OAC, CloudFront distribution with S3 + API origins |

The distribution has two behaviors (`main.tf`):
- **Default** (lines 46-63): Serves static files from S3 with caching (1-hour default TTL)
- **`/api/*`** (lines 66-85): Forwards to API Gateway with **zero caching** (TTL = 0),
  passes Authorization and Content-Type headers

SPA client-side routing (lines 88-98) — when CloudFront gets a 403 or 404 from S3
(e.g., user navigates to `/plans/123`), it returns `index.html` with a 200 status so
React Router can handle the route:

```hcl
custom_error_response {
  error_code         = 403
  response_code      = 200
  response_page_path = "/index.html"
}
```

**Inputs**:

| Variable               | Type   | Description                       |
|------------------------|--------|-----------------------------------|
| `project_name`         | string | Resource name prefix              |
| `environment`          | string | dev, staging, prod                |
| `api_gateway_endpoint` | string | API Gateway URL for /api/* origin |
| `api_gateway_id`       | string | API Gateway ID                    |

**Outputs**:

| Output                    | Description                    |
|---------------------------|--------------------------------|
| `distribution_id`         | CloudFront distribution ID     |
| `distribution_domain_name`| CloudFront domain name         |
| `s3_bucket_name`          | S3 bucket name                 |
| `s3_bucket_arn`           | S3 bucket ARN                  |

---

## 5. Module Dependency Graph

Terraform automatically determines the order to create resources by following
references between modules. Here is how our nine modules connect:

```
 ╔═══════════════════════════════════════════════════════════════════════════╗
 ║                      TERRAFORM MODULE DEPENDENCY MAP                    ║
 ╚═══════════════════════════════════════════════════════════════════════════╝

  FOUNDATION LAYER (no dependencies — created first)
 ┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┐
   ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌─────┐  ┌────────────┐
 │ │    vpc    │  │  cognito  │  │  dynamodb  │  │ sqs │  │ monitoring │ │
   │           │  │           │  │            │  │     │  │            │
 │ │ VPC       │  │ User Pool │  │ 3 tables:  │  │ Q + │  │ Log groups │ │
   │ 2 pub sub │  │ App Client│  │ users      │  │ DLQ │  │ Alarms     │
 │ │ 2 prv sub │  │ JWT tokens│  │ plans      │  │     │  │ Dashboard  │ │
   │ NAT GW    │  │           │  │ orders     │  │     │  │            │
 │ │ Route tbl │  │           │  │            │  │     │  │            │ │
   └─────┬─────┘  └─────┬─────┘  └──────┬─────┘  └──┬──┘  └──────┬─────┘
 └ ─ ─ ─ ┼ ─ ─ ─ ─ ─ ─ ┼ ─ ─ ─ ─ ─ ─ ─┼─ ─ ─ ─ ─ ┼ ─ ─ ─ ─ ─ ┼ ─ ─ ─┘
          │              │               │           │             │
          │   ┌──────────┤       ┌───────┴───────┐   │             │
          │   │          │       │               │   │             │
          ▼   ▼          │       ▼               ▼   ▼             ▼
 ┌─────────────────────────────────────────────────────────────────────────┐
 │                                                                         │
 │   ┌─────────────────────────────────────────────────────────────────┐   │
 │   │                          ecs                                    │   │
 │   │                                                                 │   │
 │   │  vpc ──────► private_subnet_ids, vpc_id                        │   │
 │   │  cognito ──► user_pool_arn (task IAM policy)                   │   │
 │   │  dynamodb ─► table_arns (task IAM policy)                      │   │
 │   │  sqs ──────► queue_arns (task IAM policy)                      │   │
 │   │  monitoring► log_group_names (container log config)            │   │
 │   │                                                                 │   │
 │   │  Creates: Fargate cluster, 3 ECR repos, internal ALB,          │   │
 │   │           3 task definitions, 3 services, IAM roles, SGs       │   │
 │   └──────────────────────────────┬──────────────────────────────────┘   │
 │                                  │                                      │
 │  COMPUTE LAYER                   │ alb_listener_arn, alb_dns_name,     │
 │                                  │ alb_security_group_id               │
 └──────────────────────────────────┼──────────────────────────────────────┘
                                    │
          ┌─────────────────────────┤
          │                         │
          ▼                         ▼
 ┌──────────────────────────────────────────────────────────────────────────┐
 │                                                                          │
 │   ┌──────────────────────────────────────────────────────────────────┐   │
 │   │                       api-gateway                                │   │
 │   │                                                                  │   │
 │   │  vpc ──────► vpc_id, private_subnet_ids (VPC Link)              │   │
 │   │  cognito ──► user_pool_id, client_id (JWT authorizer)           │   │
 │   │  ecs ──────► alb_listener_arn, alb_dns, alb_sg (integration)    │   │
 │   │                                                                  │   │
 │   │  Creates: HTTP API, JWT authorizer, VPC Link,                   │   │
 │   │           public routes + authenticated catch-all               │   │
 │   └───────────────────────────┬──────────────────────────────────────┘   │
 │                               │                                          │
 │  API LAYER                    │ api_endpoint, api_id                     │
 │                               │                                          │
 └───────────────────────────────┼──────────────────────────────────────────┘
                                 │
                                 ▼
 ┌──────────────────────────────────────────────────────────────────────────┐
 │                                                                          │
 │   ┌──────────────────────────────────────────────────────────────────┐   │
 │   │                       cloudfront                                 │   │
 │   │                                                                  │   │
 │   │  api_gateway ► api_endpoint (API origin for /api/*)             │   │
 │   │                                                                  │   │
 │   │  Creates: S3 bucket (private), OAC, CloudFront distribution     │   │
 │   │           with S3 origin (static) + API origin (/api/*)         │   │
 │   └───────────────────────────┬──────────────────────────────────────┘   │
 │                               │                                          │
 │  CDN LAYER                    │ s3_bucket_arn, distribution_id           │
 │                               │                                          │
 └───────────────────────────────┼──────────────────────────────────────────┘
                                 │
                                 ▼
 ┌──────────────────────────────────────────────────────────────────────────┐
 │                                                                          │
 │   ┌──────────────────────────────────────────────────────────────────┐   │
 │   │                          iam                                     │   │
 │   │                                                                  │   │
 │   │  dynamodb ──► table_arns (developer policy)                     │   │
 │   │  cognito ───► user_pool_arn (developer policy)                  │   │
 │   │  sqs ───────► queue_arns (developer policy)                     │   │
 │   │  cloudfront ► s3_bucket_arn, distribution_id (deploy perms)     │   │
 │   │                                                                  │   │
 │   │  Creates: Developer group + users, GitHub Actions OIDC role     │   │
 │   └──────────────────────────────────────────────────────────────────┘   │
 │                                                                          │
 │  ACCESS CONTROL LAYER                                                    │
 │                                                                          │
 └──────────────────────────────────────────────────────────────────────────┘


  REQUEST FLOW (how traffic reaches your services):

  User ──► CloudFront ──► /api/* ──► API Gateway ──► VPC Link ──► ALB ──► ECS Tasks
                     └──► /*    ──► S3 Bucket (React SPA)
```

### Full Dependency List

| Module         | Depends On                                              |
|----------------|---------------------------------------------------------|
| **vpc**        | *(none — foundation module)*                            |
| **cognito**    | *(none — standalone)*                                   |
| **dynamodb**   | *(none — standalone)*                                   |
| **sqs**        | *(none — standalone)*                                   |
| **monitoring** | *(none — standalone, but must exist before ECS)*        |
| **iam**        | dynamodb, cognito, sqs, cloudfront                      |
| **ecs**        | vpc, dynamodb, sqs, cognito, monitoring                 |
| **api_gateway**| vpc, cognito, ecs                                       |
| **cloudfront** | api_gateway                                             |

### How to Read This

Look at the module calls in `infrastructure/main.tf`. Each `module.X.some_output`
reference creates a dependency. For example, the ECS module receives
`module.vpc.private_subnet_ids` (line 92), so Terraform knows it must create the VPC
before ECS.

Terraform resolves this entire graph automatically — you never need to specify order
manually.

---

## 6. Environment Structure

### How Dev vs. Prod Work

Each environment is a thin wrapper that calls the same root module with different values:

```
environments/dev/terraform.tfvars    →  vpc_cidr = "10.0.0.0/16", environment = "dev"
environments/prod/variables.tf       →  vpc_cidr = "10.1.0.0/16", environment = "prod"
```

Because each environment runs from its own directory, each gets:
- Its own `terraform.tfstate` (completely independent infrastructure)
- Its own `.terraform/` provider cache
- Its own variable values

### Variable Precedence

Variables are resolved in this order (last wins):

1. `variable` block `default` value (lowest priority)
2. `terraform.tfvars` file (auto-loaded)
3. `*.auto.tfvars` files (auto-loaded, alphabetical)
4. `-var` or `-var-file` CLI flags (highest priority)

Example: `ecs_desired_count` defaults to `1` in `variables.tf`. You could override it
for a load test:

```bash
terraform apply -var="ecs_desired_count=3"
```

### Try It Yourself #2

Compare the VPC CIDRs between environments:

```bash
# Dev uses 10.0.0.0/16
cat infrastructure/environments/dev/terraform.tfvars | grep vpc_cidr

# Prod uses 10.1.0.0/16
cat infrastructure/environments/prod/variables.tf | grep -A1 vpc_cidr
```

Different CIDRs mean the two VPCs could be peered without address conflicts.

---

## 7. Common Commands

All commands should be run from an environment directory:

```bash
cd infrastructure/environments/dev
```

Or use the Makefile shortcuts from the project root.

---

### `terraform init` — "Like npm install"

Downloads provider plugins and initializes the backend.

```bash
terraform init
```

**Makefile shortcut**: `make tf-init`

You need to re-run `init` when you:
- Add a new provider
- Change the backend configuration
- Clone the repo for the first time

---

### `terraform plan` — "Dry run / print preview"

Shows what Terraform **would** change without actually changing anything.

```bash
terraform plan
```

**Makefile shortcut**: `make tf-plan`

Sample output:

```
Plan: 47 to add, 0 to change, 0 to destroy.
```

Always review the plan before applying. Look for unexpected destroys (marked with `-`).

---

### `terraform apply` — "Makes it real"

Creates, updates, or deletes resources to match your code.

```bash
terraform apply
```

**Makefile shortcut**: `make tf-apply`

Terraform shows the plan and asks for confirmation. Type `yes` to proceed.

To skip the confirmation prompt (CI/CD pipelines):

```bash
terraform apply -auto-approve
```

---

### `terraform output` — "Get values from the last apply"

Retrieves output values without re-running apply.

```bash
# All outputs
terraform output

# Single value (useful in scripts)
terraform output -raw cognito_user_pool_id

# Sensitive values
terraform output -json iam_developer_access_keys
```

The deploy targets in the `Makefile` use `terraform output` to get the S3 bucket name,
CloudFront distribution ID, and API Gateway endpoint.

---

### `terraform destroy` — "The undo button"

Deletes **all** resources managed by Terraform in this state file.

```bash
terraform destroy
```

> **Warning**: This is irreversible. All data in DynamoDB tables, all ECS services,
> the entire VPC — everything goes. Use this to tear down dev environments when you
> are done to save costs.

To destroy a single resource instead of everything:

```bash
terraform destroy -target=module.monitoring
```

---

### `terraform state list / show` — "Debugging"

Inspect what Terraform knows about:

```bash
# List all tracked resources
terraform state list

# Show details for a specific resource
terraform state show module.dynamodb.aws_dynamodb_table.users
```

---

## 8. State Management

### Local State (Current Setup)

By default, Terraform stores state in a local file: `terraform.tfstate`. This works
fine for solo development but has risks:

- **Lose the file = lose track of your infrastructure** (Terraform does not know what
  it created)
- **No locking** — two people running `apply` simultaneously can corrupt the state
- **Sensitive data** — state contains resource IDs, ARNs, and sometimes secrets

The `.gitignore` excludes state files (lines 50-51):

```
*.tfstate
*.tfstate.*
```

### Remote State with S3 (Recommended for Teams)

The project has a **commented-out** S3 backend in `infrastructure/backend.tf`:

```hcl
# terraform {
#   backend "s3" {
#     bucket         = "consumer-ordering-terraform-state"
#     key            = "state/terraform.tfstate"
#     region         = "us-east-1"
#     dynamodb_table = "consumer-ordering-terraform-locks"
#     encrypt        = true
#   }
# }
```

Each field explained:

| Field            | Purpose                                              |
|------------------|------------------------------------------------------|
| `bucket`         | S3 bucket that stores the state file                 |
| `key`            | Path within the bucket (like a file path)            |
| `region`         | AWS region for the S3 bucket                         |
| `dynamodb_table` | DynamoDB table used for **state locking**             |
| `encrypt`        | Encrypts the state file at rest using SSE-S3          |

### Step-by-Step: Enable Remote State

1. **Create the S3 bucket**:
   ```bash
   aws s3api create-bucket \
     --bucket consumer-ordering-terraform-state \
     --region us-east-1
   ```

2. **Enable versioning** (so you can recover from bad applies):
   ```bash
   aws s3api put-bucket-versioning \
     --bucket consumer-ordering-terraform-state \
     --versioning-configuration Status=Enabled
   ```

3. **Create the lock table**:
   ```bash
   aws dynamodb create-table \
     --table-name consumer-ordering-terraform-locks \
     --attribute-definitions AttributeName=LockID,AttributeType=S \
     --key-schema AttributeName=LockID,KeyType=HASH \
     --billing-mode PAY_PER_REQUEST
   ```

4. **Uncomment** the backend block in `infrastructure/backend.tf`

5. **Migrate** existing state:
   ```bash
   cd infrastructure/environments/dev
   terraform init -migrate-state
   ```

   Terraform will ask "Do you want to copy existing state?" — answer `yes`.

### Try It Yourself #3

```bash
cd infrastructure/environments/dev
terraform state list | head -20
terraform state list | wc -l    # Count total resources
```

---

## 9. Cost Breakdown

All prices are for `us-east-1` as of 2025. Costs assume the dev configuration
(1 task per service, 512 CPU / 1024 MB memory).

### Free at Demo Scale

| Service    | Why It Is Free                                          |
|------------|--------------------------------------------------------|
| Cognito    | First 50,000 MAU free                                  |
| DynamoDB   | PAY_PER_REQUEST — 25 GB storage + 25 RCU/WCU free tier |
| SQS        | First 1 million requests/month free                    |
| CloudWatch | 10 custom metrics + 10 alarms free tier                |
| IAM        | Always free                                            |
| API Gateway| First 1 million HTTP API calls/month free              |

### Low Cost (~$3/month)

| Service    | Estimated Cost | Notes                                |
|------------|---------------|--------------------------------------|
| CloudFront | ~$1/mo        | First 1 TB transfer free; minimal at demo scale |
| S3         | ~$0.03/mo     | Frontend assets are typically < 50 MB |
| Dashboard  | $3/mo         | Per dashboard (free for first 3)     |

### Significant Cost (~$121/month)

| Service     | Estimated Cost | Notes                                           |
|-------------|---------------|-------------------------------------------------|
| NAT Gateway | ~$32/mo       | $0.045/hr + $0.045/GB processed                 |
| Fargate     | ~$73/mo       | 3 tasks x 0.5 vCPU x 1 GB ($0.04048/hr per vCPU + $0.004445/hr per GB) |
| ALB         | ~$16/mo       | $0.0225/hr + LCU charges                        |

### Total: ~$125/month running 24/7

> **Cost-saving tip**: Run `terraform destroy` when you are not actively using the
> infrastructure. Recreate it with `terraform apply` — the entire stack comes up in
> about 10 minutes.

For detailed AWS service descriptions, see [AWS_SERVICES_GUIDE.md](AWS_SERVICES_GUIDE.md).

---

## 10. Troubleshooting

### 1. "No valid credential sources found"

```
Error: No valid credential sources found
```

**Cause**: AWS CLI is not configured.
**Fix**: Run `aws configure` and enter your access key, secret key, and region.

---

### 2. "No configuration files"

```
Error: No configuration files
```

**Cause**: You are running Terraform from the wrong directory.
**Fix**: `cd infrastructure/environments/dev` (or use `make tf-plan`).

---

### 3. "Error acquiring the state lock"

```
Error: Error acquiring the state lock
```

**Cause**: A previous `terraform apply` crashed or was interrupted, leaving a lock.
**Fix**:

```bash
terraform force-unlock LOCK_ID
```

The lock ID is shown in the error message. Only use this if you are sure no one else
is running Terraform.

---

### 4. "ResourceAlreadyExistsException"

```
Error: creating DynamoDB Table (consumer-ordering-users): ResourceAlreadyExistsException
```

**Cause**: The resource exists in AWS but is not in Terraform's state (e.g., it was
created manually).
**Fix**: Import it:

```bash
terraform import module.dynamodb.aws_dynamodb_table.users consumer-ordering-users
```

---

### 5. "Cycle detected"

```
Error: Cycle: module.a, module.b
```

**Cause**: Two modules reference each other's outputs, creating a circular dependency.
**Fix**: Restructure the dependency — pass the value as a variable instead of using a
module output, or break the cycle by splitting a module.

---

### 6. "Provider configuration not present"

```
Error: Provider configuration not present
```

**Cause**: You have not run `terraform init` (or the `.terraform/` directory was deleted).
**Fix**: Run `terraform init`.

---

### 7. NAT Gateway EIP Limit

```
Error: Error allocating EIP: AddressLimitExceeded
```

**Cause**: Your AWS account has reached its Elastic IP limit (default: 5 per region).
**Fix**: Request a limit increase in the AWS Service Quotas console, or release unused
EIPs.

---

### 8. Cognito User Pool Name Collision

```
Error: creating Cognito User Pool (consumer-ordering-dev-users): InvalidParameterException
```

**Cause**: A user pool with the same name already exists (possibly from a previous
deployment with different state).
**Fix**: Ensure the `project_name` + `environment` combination is unique, or delete the
orphaned user pool in the AWS Console.

---

## 11. Capstone Exercise

Put it all together by deploying the full stack end-to-end.

### Step 1: Initialize

```bash
cd infrastructure/environments/dev
terraform init
```

### Step 2: Preview

```bash
terraform plan
```

Read the output. You should see ~47 resources to add.

### Step 3: Deploy

```bash
terraform apply
```

Type `yes` when prompted. This takes about 5-10 minutes.

### Step 4: Inspect Outputs

```bash
terraform output cognito_user_pool_id
terraform output api_gateway_endpoint
terraform output cloudfront_domain
terraform output ecr_repository_urls
```

### Step 5: Modify a Variable

Change the ECS desired count to 2:

```bash
terraform plan -var="ecs_desired_count=2"
```

Notice how Terraform shows only the ECS services changing — everything else stays the
same. **Do not apply** (this would double your Fargate cost).

### Step 6: Check State

```bash
terraform state list | wc -l          # Total resources
terraform state list | grep module.ecs # ECS resources only
terraform state show module.vpc.aws_vpc.main
```

### Step 7: Clean Up

```bash
terraform destroy
```

Type `yes` to delete everything and stop incurring costs.

---

## 12. Quick Reference Card

| Task                          | Command                                          |
|-------------------------------|--------------------------------------------------|
| Initialize                    | `make tf-init` or `terraform init`               |
| Preview changes               | `make tf-plan` or `terraform plan`               |
| Apply changes                 | `make tf-apply` or `terraform apply`             |
| Destroy everything            | `terraform destroy`                              |
| Get an output value           | `terraform output -raw <name>`                   |
| List all managed resources    | `terraform state list`                           |
| Inspect a resource            | `terraform state show <address>`                 |
| Import existing resource      | `terraform import <address> <id>`                |
| Force-unlock stuck state      | `terraform force-unlock <lock_id>`               |
| Format code                   | `terraform fmt -recursive`                       |
| Validate syntax               | `terraform validate`                             |
| Upgrade providers             | `terraform init -upgrade`                        |

---

## 13. Further Reading

### Project Documentation

- [ARCHITECTURE.md](ARCHITECTURE.md) — System design and service interactions
- [AWS_SERVICES_GUIDE.md](AWS_SERVICES_GUIDE.md) — Deep dive into each AWS service
- [CI_CD_GUIDE.md](CI_CD_GUIDE.md) — GitHub Actions deployment pipeline
- [DEVELOPMENT_GUIDE.md](DEVELOPMENT_GUIDE.md) — Local development setup
- [LEARNING_PATH.md](LEARNING_PATH.md) — Suggested order for learning the project

### Official Terraform Documentation

- [Terraform Language Documentation](https://developer.hashicorp.com/terraform/language)
- [AWS Provider Reference](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
- [Terraform Best Practices](https://developer.hashicorp.com/terraform/cloud-docs/recommended-practices)
- [State Management](https://developer.hashicorp.com/terraform/language/state)

### Next Step

Consider adding this guide to `LEARNING_PATH.md` as a recommended resource after the
AWS Services Guide. Suggested placement: between "Infrastructure" and "Deployment"
sections.
