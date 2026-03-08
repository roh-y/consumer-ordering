# Developer Onboarding Guide

Welcome to the **Consumer Ordering** platform — a microservices-based wireless phone plan ordering system built on AWS. This guide walks you through the entire system so you can start contributing quickly.

> **Prerequisites you should have before starting:**
> - GitHub repo access
> - AWS IAM credentials (get account ID from team lead)
> - Java 21, Node.js 22, Docker, AWS CLI v2, Terraform 1.6+

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Project Structure](#2-project-structure)
3. [AWS Services Map](#3-aws-services-map)
4. [Terraform — Infrastructure as Code](#4-terraform--infrastructure-as-code)
5. [Networking & Security](#5-networking--security)
6. [ECS & ECR — Container Deployment](#6-ecs--ecr--container-deployment)
7. [Services Deep Dive](#7-services-deep-dive)
8. [Authentication Flow](#8-authentication-flow)
9. [Data Layer](#9-data-layer)
10. [AI Customer Support — Bedrock Agent](#10-ai-customer-support--bedrock-agent)
11. [CI/CD Pipeline](#11-cicd-pipeline)
12. [Local Development](#12-local-development)
13. [Common Tasks](#13-common-tasks)

---

## 1. Architecture Overview

```
                         ┌──────────────┐
                         │  CloudFront  │
                         │   (CDN)      │
                         └──────┬───────┘
                                │
                 ┌──────────────┼──────────────┐
                 │ /            │ /api/*        │ /api/agent/chat
                 ▼              ▼               ▼
          ┌──────────┐   ┌───────────┐   ┌───────────┐
          │ S3 Bucket│   │    API    │   │    API    │
          │(Frontend)│   │  Gateway  │   │  Gateway  │
          └──────────┘   │  (HTTP)   │   │ → Lambda  │
                         └─────┬─────┘   └─────┬─────┘
                               │               │
                         ┌─────┴─────┐   ┌─────┴──────┐
                         │ VPC Link  │   │ Chat API   │
                         └─────┬─────┘   │ Lambda     │
                               │         └─────┬──────┘
                         ┌─────┴─────┐         │
                         │ Internal  │   ┌─────┴──────┐
                         │   ALB     │   │  Bedrock   │
                         └─────┬─────┘   │  Agent     │
                               │         └──┬─────┬───┘
              ┌────────┬───────┼────────┐   │     │
              │        │       │        │   │     │
              ▼        ▼       ▼        ▼   ▼     ▼
          ┌───────┐┌───────┐┌───────┐┌─────────┐┌─────────┐
          │ User  ││ Plan  ││ Order ││ Action  ││Knowledge│
          │Service││Catalog││Service││ Group   ││  Base   │
          │ :8081 ││Service││ :8083 ││ Lambda  ││(OpenSearch)
          │       ││ :8082 ││       ││         ││         │
          └───┬───┘└───┬───┘└───┬───┘└────┬────┘└─────────┘
              │        │       │         │
              ▼        ▼       ▼         │      ┌──────────┐
          ┌───────┐┌───────┐┌───────┐    │      │Notif.    │
          │Users  ││Plans  ││Orders │    │      │Service   │
          │Table  ││Table  ││Table  │◄───┘      │ :8084    │
          └───────┘└───────┘└───┬───┘           └────┬─────┘
                                │                    │
                                ▼                    ▼
                          ┌──────────┐         ┌──────────┐
                          │   SQS    │────────►│   SES    │
                          │  Queue   │         │ (Email)  │
                          └──────────┘         └──────────┘
```

**Request flow:** Browser → CloudFront → API Gateway (JWT auth via Cognito) → VPC Link → Internal ALB → ECS service → DynamoDB

### Services at a Glance

| Service | Port | Purpose | DynamoDB Table |
|---------|------|---------|----------------|
| user-service | 8081 | Registration, auth, profiles | `consumer-ordering-users` |
| plan-catalog-service | 8082 | Wireless plan catalog (CRUD) | `consumer-ordering-plans` |
| order-service | 8083 | Plan subscriptions & orders | `consumer-ordering-orders` |
| notification-service | 8084 | Email notifications (SQS → SES) | — |
| recommendation-service | Lambda | AI chat support (Bedrock Agent) | Reads all tables |

---

## 2. Project Structure

```
consumer-ordering/
├── infrastructure/              # Terraform IaC
│   ├── main.tf                  # Module wiring (13 modules)
│   ├── variables.tf             # Input variables with defaults
│   ├── outputs.tf               # Exported values
│   ├── backend.tf               # S3 state backend config
│   └── modules/
│       ├── api-gateway/         # HTTP API v2, JWT auth, routes
│       ├── bedrock/             # Agent, knowledge base, action group schema
│       ├── cloudfront/          # CDN + S3 frontend origin
│       ├── cognito/             # User pool, app client, groups
│       ├── dynamodb/            # 3 tables with GSIs
│       ├── ecs/                 # Cluster, services, ECR, ALB, IAM
│       ├── iam/                 # Developer group, GitHub Actions role
│       ├── lambda/              # Action group + chat API functions
│       ├── monitoring/          # CloudWatch logs, alarms, dashboards
│       ├── opensearch/          # AOSS vector collection for KB
│       ├── ses/                 # Email identity
│       ├── sqs/                 # Order events queue + DLQ
│       └── vpc/                 # VPC, subnets, NAT, IGW
├── services/
│   ├── user-service/            # Spring Boot (Java 21)
│   ├── plan-catalog-service/    # Spring Boot (Java 21)
│   ├── order-service/           # Spring Boot (Java 21)
│   ├── notification-service/    # Spring Boot (Java 21)
│   └── recommendation-service/  # Python Lambdas + KB docs
│       ├── lambda/
│       │   ├── action_group/    # DynamoDB queries for Bedrock Agent
│       │   └── chat_api/        # Bedrock Agent Runtime invocation
│       └── knowledge-base/      # Plan docs, FAQs, policies
├── frontend/                    # React + Vite + Tailwind
├── scripts/
│   ├── dev-setup.sh             # First-time developer setup
│   └── seed-data.sh             # Seed DynamoDB with sample plans
├── .github/workflows/
│   ├── ci.yml                   # Build + test on PR/push
│   ├── deploy.yml               # Auto-deploy changed services
│   ├── deploy-all.yml           # Manual full deploy
│   └── destroy.yml              # Manual teardown
├── docker-compose.yml           # Local multi-service orchestration
├── Makefile                     # Developer commands
└── .env.example                 # Environment variable template
```

---

## 3. AWS Services Map

Every AWS resource is created by Terraform. Here's the mapping from module to what it creates:

| Terraform Module | AWS Service(s) | Purpose |
|-----------------|----------------|---------|
| `modules/vpc` | VPC, Subnets, NAT GW, IGW, Route Tables | Network isolation |
| `modules/cognito` | Cognito User Pool, App Client, Groups | User auth & JWT tokens |
| `modules/dynamodb` | 3 DynamoDB Tables + GSIs | Data storage |
| `modules/sqs` | SQS Queue + Dead Letter Queue | Async order events |
| `modules/ses` | SES Email Identity | Transactional emails |
| `modules/ecs` | ECS Cluster, 4 Services, 4 ECR Repos, ALB, IAM Roles, Security Groups | Container hosting |
| `modules/monitoring` | CloudWatch Log Groups, Alarms, Dashboards | Observability |
| `modules/api-gateway` | HTTP API v2, JWT Authorizer, VPC Link, Routes | API entry point |
| `modules/cloudfront` | CloudFront Distribution, S3 Bucket (frontend) | CDN + static hosting |
| `modules/bedrock` | Bedrock Agent, Knowledge Base, S3 KB Bucket | AI customer support |
| `modules/opensearch` | AOSS Collection (vector search) | KB vector embeddings |
| `modules/lambda` | 2 Lambda Functions (Python 3.12) | Agent action group + chat API |
| `modules/iam` | IAM Group, GitHub Actions Role | Developer & CI/CD access |

**Naming convention:** `{project_name}-{environment}-{resource}` → e.g., `consumer-ordering-dev-cluster`

---

## 4. Terraform — Infrastructure as Code

### How It Works

`infrastructure/main.tf` wires all 13 modules together, passing outputs between them (e.g., VPC subnet IDs → ECS module, Cognito pool ID → API Gateway module).

### State Management

| Component | Value |
|-----------|-------|
| State bucket | `consumer-ordering-terraform-state` |
| State key | `state/terraform.tfstate` |
| Lock table | `consumer-ordering-terraform-locks` |
| Region | `us-east-1` |
| Encryption | Enabled |

> See `infrastructure/backend.tf`

### Key Variables (`infrastructure/variables.tf`)

| Variable | Default | Description |
|----------|---------|-------------|
| `project_name` | `consumer-ordering` | Prefix for all resources |
| `environment` | `dev` | Environment tag |
| `aws_region` | `us-east-1` | AWS region |
| `vpc_cidr` | `10.0.0.0/16` | VPC address space |
| `ecs_service_cpu` | `512` | CPU units per task (0.5 vCPU) |
| `ecs_service_memory` | `1024` | Memory per task (1 GB) |
| `ecs_desired_count` | `1` | Tasks per service |
| `ses_sender_email` | `noreply@example.com` | From address for emails |
| `github_repository` | `roh-y/consumer-ordering` | For GitHub Actions OIDC |

### Running Terraform

```bash
cd infrastructure

# Initialize (downloads providers, configures backend)
terraform init

# Preview changes
terraform plan

# Apply changes
terraform apply
```

---

## 5. Networking & Security

### VPC Layout

```
VPC: 10.0.0.0/16
├── Public Subnets (ALB, NAT Gateway)
│   ├── AZ-1: 10.0.0.0/24
│   └── AZ-2: 10.0.1.0/24
├── Private Subnets (ECS Tasks)
│   ├── AZ-1: 10.0.10.0/24
│   └── AZ-2: 10.0.11.0/24
├── Internet Gateway → Public Route Table
└── NAT Gateway (single, in public subnet 1) → Private Route Table
```

> See `infrastructure/modules/vpc/main.tf`

### Security Groups

| Security Group | Inbound | Outbound | Purpose |
|---------------|---------|----------|---------|
| ALB SG | HTTP (80) from VPC CIDR | All | Internal load balancer |
| ECS Tasks SG | Service ports from ALB SG | All | Container traffic |
| VPC Link SG | — | Port 80 to ALB | API Gateway → ALB |

### API Gateway Authorization

- **Public routes** (no auth): `POST /api/users/register`, `/confirm`, `/login`, `/refresh`, `GET /api/plans`, `GET /api/plans/{planId}`
- **Protected routes** (JWT required): `ANY /api/{proxy+}`, `POST /api/agent/chat`
- JWT authorizer validates tokens against Cognito User Pool
- Identity source: `Authorization` header

### Route Table (API Gateway → ALB)

| Path Pattern | Target | Auth |
|-------------|--------|------|
| `POST /api/users/register` | ALB → user-service:8081 | None |
| `POST /api/users/confirm` | ALB → user-service:8081 | None |
| `POST /api/users/login` | ALB → user-service:8081 | None |
| `POST /api/users/refresh` | ALB → user-service:8081 | None |
| `GET /api/plans` | ALB → plan-catalog-service:8082 | None |
| `GET /api/plans/{planId}` | ALB → plan-catalog-service:8082 | None |
| `POST /api/agent/chat` | Lambda (chat API) | JWT |
| `ANY /api/{proxy+}` | ALB (catch-all) | JWT |

> See `infrastructure/modules/api-gateway/main.tf`

---

## 6. ECS & ECR — Container Deployment

### For Spring Boot Developers

If you're coming from a Spring Boot background:
- **ECR** (Elastic Container Registry) = private Docker Hub. Each service has its own repo where Docker images are stored.
- **ECS** (Elastic Container Service) with **Fargate** = managed Docker hosting. You don't manage servers — AWS runs your containers.
- **Task Definition** = your `docker run` command as code (image, ports, env vars, CPU/memory).
- **Service** = keeps N copies of your task running, replaces unhealthy ones.
- **ALB** (Application Load Balancer) = routes requests to the right service based on URL path.

### ECR Repositories

One repo per service: `consumer-ordering-dev-{service-name}`

- Image scanning on push: enabled
- Lifecycle policy: keeps last 10 images (older ones auto-deleted)
- Images tagged with both `latest` and git commit SHA

### ECS Cluster & Services

| Service | Container Port | Health Check | CPU | Memory |
|---------|---------------|--------------|-----|--------|
| user-service | 8081 | `/actuator/health` | 512 (0.5 vCPU) | 1024 MB |
| plan-catalog-service | 8082 | `/actuator/health` | 512 | 1024 MB |
| order-service | 8083 | `/actuator/health` | 512 | 1024 MB |
| notification-service | 8084 | `/actuator/health` | 512 | 1024 MB |

- Network mode: `awsvpc` (each task gets its own ENI in a private subnet)
- Launch type: Fargate (serverless — no EC2 instances to manage)
- Container insights: enabled for monitoring
- Health check: interval 30s, healthy threshold 2, unhealthy threshold 3, start period 120s

### ALB Path-Based Routing

The internal ALB listens on port 80 and routes by URL path:

| Path Pattern | Target Group | Service Port |
|-------------|-------------|-------------|
| `/api/users*` | user-service TG | 8081 |
| `/api/plans*` | plan-catalog-service TG | 8082 |
| `/api/orders*` | order-service TG | 8083 |

> The notification-service has no ALB route — it only consumes from SQS.

### How Deployment Works

1. CI builds Docker image from service's `Dockerfile`
2. Image pushed to ECR with `latest` tag
3. `aws ecs update-service --force-new-deployment` triggers rolling update
4. ECS pulls new `latest` image and starts new tasks
5. ALB health checks pass → old tasks drain and stop

### IAM Roles

| Role | Permissions | Purpose |
|------|-------------|---------|
| Task Execution Role | `AmazonECSTaskExecutionRolePolicy` | Pull images from ECR, write CloudWatch logs |
| Task Role | DynamoDB, SQS, SES, Cognito | Application-level AWS access |

**Task Role permissions include:**
- **DynamoDB:** GetItem, PutItem, UpdateItem, DeleteItem, Query, Scan, BatchGetItem, BatchWriteItem
- **SQS:** SendMessage, ReceiveMessage, DeleteMessage, GetQueueAttributes
- **SES:** SendEmail, SendRawEmail
- **Cognito:** AdminGetUser, AdminCreateUser, AdminSetUserPassword, AdminInitiateAuth, AdminRespondToAuthChallenge

> See `infrastructure/modules/ecs/` — `ecr.tf`, `services.tf`, `alb.tf`, `iam.tf`, `security_groups.tf`

---

## 7. Services Deep Dive

All Spring Boot services use **Spring Boot 3.4.3** with **Java 21** and **AWS SDK v2 (2.25.16)**.

### user-service (port 8081)

**Purpose:** User registration, authentication, and profile management via Cognito.

**DynamoDB Table:** `consumer-ordering-users` (key: `userId`, GSI: `email-index`)

**Environment Variables:**
| Variable | Example |
|----------|---------|
| `SERVER_PORT` | `8081` |
| `AWS_REGION` | `us-east-1` |
| `COGNITO_USER_POOL_ID` | `us-east-1_XXXXXXXXX` |
| `COGNITO_CLIENT_ID` | `xxxxxxxxxxxxxxxxxxxxxxxxxx` |
| `DYNAMODB_USERS_TABLE` | `consumer-ordering-users` |

**Key Endpoints:** `/api/users/register`, `/api/users/confirm`, `/api/users/login`, `/api/users/refresh`, `/api/users/profile`

**Swagger UI:** `/swagger-ui.html`

---

### plan-catalog-service (port 8082)

**Purpose:** CRUD operations for wireless plan catalog.

**DynamoDB Table:** `consumer-ordering-plans` (key: `planId`)

**Environment Variables:**
| Variable | Example |
|----------|---------|
| `SERVER_PORT` | `8082` |
| `AWS_REGION` | `us-east-1` |
| `COGNITO_USER_POOL_ID` | `us-east-1_XXXXXXXXX` |
| `DYNAMODB_PLANS_TABLE` | `consumer-ordering-plans` |

**Key Endpoints:** `GET /api/plans`, `GET /api/plans/{planId}`, `POST /api/plans`, `PUT /api/plans/{planId}`

---

### order-service (port 8083)

**Purpose:** Order management — creating subscriptions, tracking status, and publishing order events to SQS.

**DynamoDB Table:** `consumer-ordering-orders` (keys: `orderId` hash + `userId` range, GSI: `userId-index`)

**Environment Variables:**
| Variable | Example |
|----------|---------|
| `SERVER_PORT` | `8083` |
| `AWS_REGION` | `us-east-1` |
| `COGNITO_USER_POOL_ID` | `us-east-1_XXXXXXXXX` |
| `DYNAMODB_ORDERS_TABLE` | `consumer-ordering-orders` |
| `SQS_ORDER_EVENTS_QUEUE_URL` | `https://sqs.us-east-1.amazonaws.com/...` |
| `PLAN_CATALOG_SERVICE_URL` | `http://localhost:8082` (local) |
| `USER_SERVICE_URL` | `http://localhost:8081` (local) |

**Key Endpoints:** `POST /api/orders`, `GET /api/orders`, `GET /api/orders/{orderId}`

**Connects to:** plan-catalog-service (validate plan), user-service (get user), SQS (publish events)

> In ECS, inter-service calls go through the ALB (e.g., `http://{alb-dns}/api/plans`). Locally, services call each other directly.

---

### notification-service (port 8084)

**Purpose:** Listens on SQS for order events and sends email notifications via SES.

**No ALB route** — this service only consumes messages, it doesn't serve HTTP API requests (except health check).

**Environment Variables:**
| Variable | Example |
|----------|---------|
| `SERVER_PORT` | `8084` |
| `AWS_REGION` | `us-east-1` |
| `SQS_ORDER_EVENTS_QUEUE_URL` | `https://sqs.us-east-1.amazonaws.com/...` |
| `SES_FROM_EMAIL` | `noreply@example.com` |

**No Spring Security** — this service doesn't handle user requests.

---

### recommendation-service (Lambda)

**Purpose:** AI-powered customer support chatbot using Amazon Bedrock.

Two Lambda functions (Python 3.12):

**chat_api** — Entry point for the chat widget
- Triggered by: `POST /api/agent/chat` (via API Gateway)
- Extracts `userId` from JWT claims
- Invokes Bedrock Agent with streaming response
- Env vars: `BEDROCK_AGENT_ID`, `BEDROCK_AGENT_ALIAS_ID`

**action_group** — Called by the Bedrock Agent to query data
- Operations: `getOrderStatus`, `getOrdersByUser`, `getUserProfile`, `listPlans`, `getCurrentPlan`, `changePlan`
- Reads/writes DynamoDB tables, publishes SQS events
- Env vars: `ORDERS_TABLE_NAME`, `USERS_TABLE_NAME`, `PLANS_TABLE_NAME`, `SQS_ORDER_EVENTS_QUEUE_URL`

> See `services/recommendation-service/lambda/`

---

### Frontend (React + Vite)

**Tech stack:** React 19, Vite, Tailwind CSS, Zustand (state), React Query, React Router

**Key configuration:**
- Dev server: `http://localhost:5173` (Vite proxy forwards `/api/*` to backend services)
- Production: Static files served from S3 via CloudFront, nginx for Docker
- Auth: `amazon-cognito-identity-js` for Cognito integration
- API client: Axios with JWT interceptor (auto-attaches Bearer token, handles 401 refresh)

**Environment Variables** (see `.env.example` or `frontend/.env.example`):
- `VITE_COGNITO_USER_POOL_ID`
- `VITE_COGNITO_CLIENT_ID`
- `VITE_API_URL`

> See `frontend/vite.config.ts`, `frontend/src/services/api.ts`

---

## 8. Authentication Flow

### Cognito User Pool Configuration

| Setting | Value |
|---------|-------|
| Sign-in attribute | Email |
| Password policy | 8+ chars, uppercase, lowercase, numbers |
| Email verification | Code-based |
| Access token lifetime | 1 hour |
| ID token lifetime | 1 hour |
| Refresh token lifetime | 30 days |
| Auth flows | USER_PASSWORD_AUTH, REFRESH_TOKEN_AUTH, USER_SRP_AUTH |
| Client secret | None (public SPA client) |
| User groups | `admin` (precedence 1), `user` (precedence 10) |

### Flow

```
1. Register    POST /api/users/register  → Cognito creates user (UNCONFIRMED)
                                          → Sends verification code via email

2. Confirm     POST /api/users/confirm   → User submits code
                                          → Cognito confirms user (CONFIRMED)

3. Login       POST /api/users/login     → Cognito returns:
                                            - Access Token (1hr, used for API auth)
                                            - ID Token (1hr, contains user claims)
                                            - Refresh Token (30d, used to get new tokens)

4. API Call    GET /api/orders           → Frontend sends: Authorization: Bearer {accessToken}
                                          → API Gateway JWT authorizer validates against Cognito
                                          → Request forwarded to backend service

5. Refresh     POST /api/users/refresh   → Frontend sends refresh token
                                          → Cognito returns new access + ID tokens
```

### How Spring Security Validates JWTs

Each Spring Boot service (except notification-service) is configured as an OAuth2 Resource Server:

```yaml
# application.yml (simplified)
spring:
  security:
    oauth2:
      resourceserver:
        jwt:
          jwk-set-uri: https://cognito-idp.{region}.amazonaws.com/{pool-id}/.well-known/jwks.json
```

Spring Security downloads Cognito's public keys and validates every request's JWT signature, expiration, and issuer.

> See `infrastructure/modules/cognito/main.tf`

---

## 9. Data Layer

### DynamoDB Tables

All tables use **PAY_PER_REQUEST** billing (no capacity planning needed).

| Table | Hash Key | Range Key | GSI | Purpose |
|-------|----------|-----------|-----|---------|
| `consumer-ordering-users` | `userId` (S) | — | `email-index` (email → all) | User profiles |
| `consumer-ordering-plans` | `planId` (S) | — | — | Plan catalog |
| `consumer-ordering-orders` | `orderId` (S) | `userId` (S) | `userId-index` (userId → all) | Orders |

> See `infrastructure/modules/dynamodb/main.tf`

### SQS — Order Events Queue

| Setting | Value |
|---------|-------|
| Queue name | `consumer-ordering-dev-order-events` |
| Visibility timeout | 60 seconds |
| Message retention | 4 days |
| DLQ | `consumer-ordering-dev-order-events-dlq` |
| Max receive count | 3 (then moves to DLQ) |
| DLQ retention | 14 days |

**Event flow:** order-service → SQS → notification-service → SES (email)

> See `infrastructure/modules/sqs/main.tf`

### SES — Email

- Email identity configured via Terraform (must be verified in SES console)
- Default sender: `noreply@example.com`
- In sandbox mode: can only send to verified email addresses

> See `infrastructure/modules/ses/main.tf`

---

## 10. AI Customer Support — Bedrock Agent

### Architecture

```
Chat Widget (React)
    │
    ▼
POST /api/agent/chat (API Gateway, JWT auth)
    │
    ▼
Chat API Lambda ──► Bedrock Agent (Nova Lite model)
                         │
                    ┌────┴────┐
                    ▼         ▼
              Knowledge    Action Group
                Base         Lambda
                  │            │
                  ▼            ▼
              OpenSearch    DynamoDB
              (AOSS)       (all tables)
```

### Components

| Component | Details |
|-----------|---------|
| **Model** | Amazon Nova Lite v1 |
| **Agent alias** | `live` (required for runtime invocation) |
| **Session TTL** | 10 minutes |
| **Embedding model** | Amazon Titan Embed Text v2 |
| **Vector store** | OpenSearch Serverless (VECTORSEARCH type) |

### Knowledge Base

Documents in `services/recommendation-service/knowledge-base/`:
- `plans/` — Basic, Standard, Premium, Unlimited plan details
- `faq/` — General FAQ, billing FAQ
- `policies/` — Return policy
- `comparison/` — Plan comparison guide

These are synced to S3 and ingested into the OpenSearch vector index for RAG (Retrieval-Augmented Generation).

### Action Group Operations

The Bedrock Agent can call these via the action_group Lambda:

| Action | Method | Description |
|--------|--------|-------------|
| `getOrderStatus` | GET | Look up order by orderId |
| `getOrdersByUser` | GET | List all orders for a user |
| `getUserProfile` | GET | Get user profile |
| `listPlans` | GET | List all available plans |
| `getCurrentPlan` | GET | Get user's active plan |
| `changePlan` | POST | Change plan, cancel old orders, send email notification |

> See `infrastructure/modules/bedrock/main.tf`, `services/recommendation-service/`

---

## 11. CI/CD Pipeline

### Workflow Overview

```
Code Push / PR to main
        │
        ▼
┌───────────────┐
│   ci.yml      │  Build + test all services, frontend, terraform validate
└───────┬───────┘
        │ (on success, main branch only)
        ▼
┌───────────────┐
│  deploy.yml   │  Detect changes → build only changed → push to ECR → ECS redeploy
└───────────────┘

Manual triggers:
┌───────────────┐
│deploy-all.yml │  Terraform apply → build ALL services → deploy everything + KB docs
└───────────────┘
┌───────────────┐
│  destroy.yml  │  Empty S3/ECR → terraform destroy (requires typing "destroy" to confirm)
└───────────────┘
```

### ci.yml — Continuous Integration

**Triggers:** PR to main, push to main

| Job | What It Does |
|-----|-------------|
| user-service | Java 21: `./mvnw package -DskipTests` → `./mvnw test` |
| plan-catalog-service | Java 21: same as above |
| order-service | Java 21: same as above |
| notification-service | Java 21: same as above |
| frontend | Node 22: `npm ci` → `npm run build` → `npm test -- --run` |
| terraform | Terraform 1.6.6: `init` → `fmt -check` → `validate` |

### deploy.yml — Auto Deploy (Changed Services Only)

**Triggers:** Automatically after CI succeeds on main

1. **Detect changes** — uses path filters to identify which services changed
2. **Build backend** — Docker build + push to ECR (only changed services, with `latest` + SHA tags)
3. **Build frontend** — `npm build` → S3 sync (hashed assets get 1-year cache, HTML gets no-cache) → CloudFront invalidation
4. **Deploy backend** — `aws ecs update-service --force-new-deployment` for each changed service
5. **Verify** — `aws ecs wait services-stable`, then generate deployment summary

### deploy-all.yml — Full Deploy (Manual)

**Trigger:** Manual dispatch (with optional `skip_infra` flag)

Runs everything: Terraform apply → KB docs upload + Bedrock ingestion → build all 4 services → deploy to ECS → build and deploy frontend → verify

### destroy.yml — Teardown (Manual)

**Trigger:** Manual dispatch, requires typing `"destroy"` as confirmation

Empties S3 buckets → deletes ECR images → `terraform destroy -auto-approve`

### AWS Credentials

All workflows use `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` stored as GitHub repo secrets (IAM user: `Vinay-Dev`).

> See `.github/workflows/`

---

## 12. Local Development

### Prerequisites

| Tool | Version | Check |
|------|---------|-------|
| Java | 21 | `java -version` |
| Node.js | 22 | `node -v` |
| Docker | Latest | `docker --version` |
| AWS CLI | v2 | `aws --version` |
| Terraform | 1.6+ | `terraform -v` |

### First-Time Setup

```bash
# Option 1: Automated setup (provisions infra, creates .env, seeds data)
make setup NAME=yourname
# or
./scripts/dev-setup.sh yourname

# Option 2: Manual setup
# 1. Copy environment template
cp .env.example .env
# 2. Fill in AWS credentials and resource IDs (get from team lead)
# 3. Seed DynamoDB with sample plans
./scripts/seed-data.sh
```

The setup script:
1. Checks all prerequisites are installed
2. Verifies AWS credentials work
3. Runs Terraform to provision infrastructure
4. Extracts Terraform outputs into `.env`
5. Seeds DynamoDB with 4 sample plans (Basic $35, Standard $55, Premium $75, Unlimited $90)
6. Validates AWS access

### Running Locally

```bash
# Start all services with Docker Compose
make up
# or
docker-compose up

# Stop all services
make down

# Build all services
make build

# Run tests
make test
```

**Local ports:**
| Service | URL |
|---------|-----|
| Frontend | `http://localhost:3000` (Docker) or `http://localhost:5173` (Vite dev) |
| user-service | `http://localhost:8081` |
| plan-catalog-service | `http://localhost:8082` |
| order-service | `http://localhost:8083` |
| notification-service | `http://localhost:8084` |

The frontend Vite dev server proxies `/api/*` to the correct backend service automatically (see `frontend/vite.config.ts`).

### Key Makefile Targets

| Target | Description |
|--------|-------------|
| `make setup NAME=x` | First-time developer setup |
| `make build` | Build all services |
| `make test` | Run all tests |
| `make up` / `make down` | Start/stop Docker Compose |
| `make seed` | Seed DynamoDB with sample data |
| `make deploy-service SERVICE=x` | Deploy a single service to ECS |
| `make deploy-backend` | Deploy all backend services |
| `make deploy-frontend` | Build + deploy frontend to S3/CloudFront |
| `make deploy-all` | Deploy everything |
| `make deploy-login` | Login to Amazon ECR |
| `make upload-kb-docs` | Upload KB docs to S3 |
| `make tf-init` / `make tf-plan` / `make tf-apply` | Terraform commands |
| `make export-data` | Export DynamoDB + Cognito data |
| `make import-data DIR=...` | Import DynamoDB data |

---

## 13. Common Tasks

### Deploy a Single Service Change

```bash
# 1. Make your code changes in services/user-service/

# 2. Build and test locally
cd services/user-service && ./mvnw test

# 3. Option A: Push to main — CI runs, deploy.yml auto-detects the change
git push origin main

# 3. Option B: Deploy manually
make deploy-login
make deploy-service SERVICE=user-service
```

### Run Terraform Changes

```bash
cd infrastructure
terraform init          # First time or after provider changes
terraform plan          # Preview what will change
terraform apply         # Apply (will prompt for confirmation)
```

Or use Makefile (runs from `infrastructure/environments/dev`):
```bash
make tf-plan
make tf-apply
```

### Add a New API Endpoint

1. Add the endpoint in the Spring Boot service (controller → service → repository)
2. If it needs to be public (no auth), add a route in `infrastructure/modules/api-gateway/main.tf`
3. Otherwise, it's automatically covered by the `ANY /api/{proxy+}` catch-all route (JWT required)
4. Run `terraform apply` if you changed API Gateway routes

### Check Logs (CloudWatch)

```bash
# View recent logs for a service
aws logs tail /ecs/consumer-ordering-dev-user-service --follow

# Search logs
aws logs filter-log-events \
  --log-group-name /ecs/consumer-ordering-dev-order-service \
  --filter-pattern "ERROR"
```

Log groups follow the pattern: `/ecs/consumer-ordering-dev-{service-name}`

### Seed Data

```bash
# Seed sample plans into DynamoDB
make seed
# or
./scripts/seed-data.sh
```

This creates 4 wireless plans: Basic ($35/mo, 5GB), Standard ($55/mo, 15GB), Premium ($75/mo, 50GB), Unlimited Plus ($90/mo, unlimited).

### Access Swagger UI

Each Spring Boot service exposes API docs at `/swagger-ui.html`:
- `http://localhost:8081/swagger-ui.html` (user-service)
- `http://localhost:8082/swagger-ui.html` (plan-catalog-service)
- `http://localhost:8083/swagger-ui.html` (order-service)
