# AWS Services Guide

Every AWS service used in this project, explained for beginners.

## Compute

### ECS/Fargate (Elastic Container Service)
**What it is**: A service that runs Docker containers in the cloud without managing servers.

**Analogy**: Think of it like a vending machine for containers. You put in your Docker image, tell it how much CPU/memory you need, and AWS handles the rest — no need to manage the actual computer it runs on.

**Why we use it**: Our Spring Boot services are packaged as Docker containers. Fargate runs them on-demand so we don't need to provision EC2 instances.

**How it's configured**: See `infrastructure/modules/ecs/` (Phase 2+).

**Cost**: ~$0.04/hour per vCPU + $0.004/hour per GB memory. Only pay when containers are running.

### Lambda
**What it is**: Run code without any server. Upload a function, AWS runs it when triggered.

**Why we use it**: The recommendation service is a Python function that runs on-demand when a user asks for plan suggestions.

**Cost**: First 1M requests/month free. Essentially $0 for this demo.

## Authentication

### Cognito
**What it is**: AWS's managed authentication service. It handles user registration, login, password reset, email verification, and issues JWT tokens.

**User Pools vs Identity Pools**:
- **User Pool** (what we use): A user directory. Stores usernames/passwords, handles sign-up/sign-in, issues JWT tokens. Think of it like "the login system."
- **Identity Pool**: Maps authenticated users to temporary AWS credentials. Used when your frontend needs direct access to S3 or DynamoDB. We don't use this.

**JWT Tokens Explained**:
When a user logs in, Cognito returns three tokens:
1. **Access Token** — Proves the user is authenticated. Sent with every API request. Expires in 1 hour.
2. **ID Token** — Contains user attributes (email, name). Used by the frontend to display user info.
3. **Refresh Token** — A long-lived token (30 days) used to get new access/id tokens without re-entering password.

**How we use it**: The user-service calls Cognito SDK to register/login users. Spring Security validates JWTs using Cognito's JWKS endpoint (a public URL with the signing keys).

**Cost**: Free for first 50,000 monthly active users.

## Database

### DynamoDB
**What it is**: A fully managed NoSQL database. Instead of tables with rows/columns (like MySQL), it stores items with flexible attributes.

**Key Concepts**:
- **Partition Key (PK)**: The primary way to look up items. Like a primary key in SQL. Example: `userId`.
- **Sort Key (SK)**: Optional second part of the key. Allows multiple items per partition key. Example: `orderId`.
- **Global Secondary Index (GSI)**: An alternate way to query items. Example: look up users by `email` instead of `userId`.
- **On-Demand vs Provisioned**: On-demand = pay per request (good for unpredictable traffic). Provisioned = pre-allocate read/write capacity (cheaper for steady traffic).

**Why NoSQL?**: For this app, we mostly do simple key-value lookups (get user by ID, get plan by ID). DynamoDB handles this with single-digit millisecond latency and zero maintenance.

**How it's configured**: See `infrastructure/modules/dynamodb/main.tf`.

**Cost**: On-demand pricing. $1.25 per million write requests, $0.25 per million read requests. Essentially $0 for demo usage.

## Networking

### VPC (Virtual Private Cloud)
**What it is**: Your own private network in AWS. All your resources live inside it.

**Analogy**: A VPC is like your own private office building. You control who can enter (security groups), which floors are accessible (subnets), and how people get to the internet (gateways).

**Key Components**:
- **Subnets**: Divisions within the VPC. **Public subnets** have internet access (for the ALB). **Private subnets** don't (for the backend services — more secure).
- **Internet Gateway**: The building's front door. Allows public subnets to reach the internet.
- **NAT Gateway**: Allows private subnets to make outgoing internet calls (e.g., to call AWS APIs) without being directly reachable from the internet.
- **Security Groups**: Firewalls for individual resources. "Allow traffic on port 8081 from the ALB only."

**How it's configured**: See `infrastructure/modules/vpc/main.tf`. We create 2 AZs (availability zones) for high availability, each with a public and private subnet.

### ALB (Application Load Balancer)
**What it is**: Distributes incoming traffic across multiple containers.

**Why we use it**: When we have 2+ instances of user-service running, the ALB spreads requests evenly and routes based on URL path.

## Messaging

### SQS (Simple Queue Service)
**What it is**: A message queue. Service A puts a message in the queue, Service B reads it later.

**When to use it**: When you want services to communicate without waiting for each other. Example: Order Service places an order, puts a message on SQS, and responds to the user immediately. Notification Service reads the message later and sends a confirmation email.

**Cost**: First 1M requests/month free.

### SNS (Simple Notification Service)
**What it is**: Pub/sub messaging. One publisher sends a message to a "topic," and all subscribers receive it.

**SQS vs SNS**: SQS is point-to-point (one sender → one receiver). SNS is pub/sub (one sender → many receivers). They're often used together: SNS topic → fans out to multiple SQS queues.

## AI/ML

### Bedrock
**What it is**: AWS's managed service for foundation models (like Claude). You send a prompt, get a response. No ML infrastructure to manage.

**Why we use it**: The customer support agent uses Amazon Nova Lite (via Bedrock) to have natural conversations about wireless plans, check order status, and make recommendations.

**How it's configured**: See `infrastructure/modules/bedrock/main.tf`.

### Bedrock Agents
**What it is**: A higher-level Bedrock feature that orchestrates an AI agent. Unlike raw model invocation, an agent can:
- **Call Action Groups** — invokes Lambda functions to search a knowledge base or query live data (like DynamoDB)
- **Maintain conversation sessions** — remembers context across multiple messages

**Key components in our project**:
- **Agent** — The orchestrator. Uses Amazon Nova Lite as its foundation model. Has a system prompt (instruction) defining its personality and responsibilities.
- **Knowledge Base Search Action Group** — A Lambda function that performs vector similarity search using a FAISS index bundled in the deployment package. The agent calls `searchKnowledgeBase` when it needs plan/policy/FAQ information.
- **Customer Actions Action Group** — A Lambda function with an OpenAPI schema that queries DynamoDB. Handles: `getOrderStatus`, `getOrdersByUser`, `getUserProfile`, `listPlans`, `getCurrentPlan`, `changePlan`.
- **Agent Alias** — A stable identifier (like `live`) used for runtime invocation. Required to call `invoke_agent()`.

**How the agent decides what to do**: When a user sends "What plans do you offer?", the agent recognizes this as a knowledge question and calls `searchKnowledgeBase`. When a user asks "Show me my orders", the agent calls the `getOrdersByUser` action. It can also combine both — e.g., "Which plan is best for my usage?" might search the KB for plan details, call `getUserProfile` to see the current plan, and then generate a recommendation.

**Cost**: Amazon Nova Lite is very cost-effective. At demo usage levels, this is under $1/month.

### FAISS Vector Search (Knowledge Base)
**What it is**: FAISS (Facebook AI Similarity Search) is an open-source library for efficient vector similarity search. We use it as an embedded vector database inside a Lambda function, replacing the previous OpenSearch Serverless setup.

**What is RAG?**: Retrieval-Augmented Generation. Instead of asking an AI model to answer from its training data alone, we first search our own data (plan descriptions, features) for relevant context, then include that context in the prompt. This makes responses more accurate and grounded in our actual plan offerings.

**How it works**:
1. At build time, `scripts/build-faiss-index.py` reads all KB markdown files from `services/recommendation-service/knowledge-base/`
2. Each document is split into chunks by `##` headers
3. Each chunk is embedded into a 1024-dimensional vector using Amazon Titan Text Embeddings V2
4. Vectors are saved as a FAISS index file (`faiss_index.bin`) + metadata JSON, bundled with the Lambda
5. At runtime, the user's query is embedded with Titan, and FAISS finds the most similar document chunks
6. The agent uses the search results to generate accurate, grounded answers

**Why FAISS instead of OpenSearch Serverless?**: OpenSearch Serverless has a minimum cost of ~$350/month (2 OCUs running 24/7). For ~8 small documents, an embedded FAISS index in Lambda costs essentially $0 and adds only ~1-2 seconds of cold start time.

**How it's configured**: Lambda function at `infrastructure/modules/lambda/main.tf`, build script at `scripts/build-faiss-index.py`.

**Cost**: Essentially $0 (just Lambda invocations + pennies for Titan embedding calls).

## CDN & DNS

### CloudFront
**What it is**: A Content Delivery Network. Caches your static files (React app) at edge locations worldwide for faster loading.

### Route 53
**What it is**: AWS's DNS service. Maps your domain name (e.g., `plans.example.com`) to your CloudFront distribution.
