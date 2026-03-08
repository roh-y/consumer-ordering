# Consumer Ordering — Wireless Plan Purchasing Demo

A demo mobile web application that simulates purchasing wireless service plans (like Verizon). Built to learn AWS services, CI/CD pipelines, and RAG-based recommendations. No real fulfillment or payments — purely educational.

## What Does This App Do?

A customer can:
1. **Register** for an account (email + password)
2. **Browse** wireless plans (Basic, Standard, Premium, Unlimited)
3. **Select** a plan and go through a simulated checkout
4. **View** their profile and order history
5. **Chat with an AI support agent** — a floating chat widget powered by Amazon Bedrock Agents that can answer plan questions, check order status, recommend plans, and handle billing inquiries using RAG (Retrieval-Augmented Generation)

## Architecture

```
Frontend (React)  →  API Gateway  →  Microservices (Spring Boot on ECS/Fargate)
                                  →  DynamoDB (NoSQL database)
                                  →  Cognito (Authentication)
                                  →  SQS/SNS (Messaging)
                                  →  Lambda → Bedrock Agent (Claude 3 Haiku)
                                              ├── Knowledge Base (OpenSearch + S3)
                                              └── Action Group (DynamoDB queries)
```

See [ARCHITECTURE.md](ARCHITECTURE.md) for the full system design.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Tailwind CSS, TypeScript |
| Backend | Java 21, Spring Boot 3.4, AWS SDK v2 |
| Auth | Amazon Cognito (JWT tokens) |
| Database | Amazon DynamoDB |
| AI/Chat | Amazon Bedrock (Claude 3 Haiku), OpenSearch Serverless |
| Infrastructure | Terraform |
| CI/CD | GitHub Actions |
| Containers | Docker, ECS/Fargate |

## Prerequisites

Before you start, make sure you have these installed:

- **Java 21** — `java -version` should show 21+
- **Node.js 22** — `node -v` should show v22+
- **AWS CLI** — `aws --version` and configured with `aws configure`
- **Terraform** — `terraform -v` should show 1.5+
- **Docker** — `docker -v` (optional, for containerized runs)

## Getting Started

### 1. Clone the repo

```bash
git clone <repo-url>
cd consumer-ordering
```

### 2. Create AWS resources with Terraform

```bash
cd infrastructure/environments/dev
terraform init
terraform apply
```

This creates a Cognito user pool, DynamoDB tables, and a VPC in your AWS account.

### 3. Set environment variables

Copy the Terraform outputs into your environment:

```bash
export COGNITO_USER_POOL_ID=$(terraform output -raw cognito_user_pool_id)
export COGNITO_CLIENT_ID=$(terraform output -raw cognito_client_id)
export AWS_REGION=us-east-1
```

### 4. Start the backend

```bash
cd services/user-service
./mvnw spring-boot:run -Dspring-boot.run.profiles=dev
```

The API starts on http://localhost:8081. Check health at http://localhost:8081/actuator/health.

### 5. Start the frontend

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173 in your browser.

### 6. Try it out

1. Register a new account
2. Check your email for the verification code
3. Confirm your account
4. Log in
5. Browse wireless plans
6. View/edit your profile

## Project Structure

```
consumer-ordering/
├── services/
│   ├── user-service/          # Spring Boot — auth + profiles
│   ├── plan-catalog-service/  # Spring Boot — plan CRUD
│   ├── order-service/         # Spring Boot — orders + SQS events
│   ├── notification-service/  # Spring Boot — SQS consumer + SES emails
│   └── recommendation-service/# Python Lambda — AI support agent
│       ├── knowledge-base/    #   Plan docs, FAQs, policies (uploaded to S3)
│       └── lambda/            #   action_group/ + chat_api/ handlers
├── frontend/                  # React + Vite SPA (includes ChatWidget)
├── infrastructure/            # Terraform modules
│   └── modules/
│       ├── bedrock/           #   Bedrock Agent, Knowledge Base, S3
│       ├── opensearch/        #   OpenSearch Serverless (vector store)
│       ├── lambda/            #   Lambda functions for agent
│       └── ...                #   vpc, cognito, dynamodb, ecs, etc.
├── scripts/                   # Setup + seed + KB upload scripts
├── .github/workflows/         # CI + Deploy pipelines
├── docker-compose.yml
└── Makefile
```

## Useful Commands

```bash
# Build & Test
make build              # Build all services
make test               # Run all tests
make up                 # Start with Docker Compose
make down               # Stop Docker Compose

# Terraform
make tf-plan            # Preview Terraform changes
make tf-apply           # Apply Terraform changes

# Bedrock Agent
make upload-kb-docs     # Upload knowledge base docs to S3, trigger ingestion
make deploy-agent       # Deploy agent infrastructure + upload KB docs

# Deploy to AWS
make deploy-login       # Login to Amazon ECR
make deploy-service SERVICE=user-service  # Deploy one service
make deploy-backend     # Deploy all backend services
make deploy-frontend    # Build & deploy frontend to S3/CloudFront
make deploy-all         # Deploy everything (backend + frontend)
```

## Documentation

- [ARCHITECTURE.md](ARCHITECTURE.md) — System design and data flows
- [AWS_SERVICES_GUIDE.md](AWS_SERVICES_GUIDE.md) — AWS services explained
- [DEVELOPMENT_GUIDE.md](DEVELOPMENT_GUIDE.md) — How to add features
- [CI_CD_GUIDE.md](CI_CD_GUIDE.md) — Pipeline explained
- [LEARNING_PATH.md](LEARNING_PATH.md) — Suggested reading order

## Cost

This project uses AWS free tier where possible:
- **Cognito**: Free for first 50,000 MAU
- **DynamoDB**: On-demand pricing, essentially $0 for demo usage
- **VPC + NAT Gateway**: ~$1/day when running (destroy when not in use)
- **OpenSearch Serverless**: ~$24/month minimum (2 OCU baseline for vector search collection)
- **Bedrock (Claude 3 Haiku + Titan Embeddings)**: Pay-per-token, ~$1-2/month at demo usage
- **Lambda**: First 1M requests/month free, essentially $0

**Total with AI agent**: ~$25-30/month. Without deploying the Bedrock/OpenSearch modules, cost stays under $5/month.
