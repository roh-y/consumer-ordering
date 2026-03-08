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

**Why we use it**: The customer support agent uses Claude 3 Haiku (via Bedrock) to have natural conversations about wireless plans, check order status, and make recommendations.

**How it's configured**: See `infrastructure/modules/bedrock/main.tf`.

### Bedrock Agents
**What it is**: A higher-level Bedrock feature that orchestrates an AI agent. Unlike raw model invocation, an agent can:
- **Search a Knowledge Base** (RAG) — automatically retrieves relevant documents before answering
- **Call Action Groups** — invokes Lambda functions to query live data (like DynamoDB)
- **Maintain conversation sessions** — remembers context across multiple messages

**Key components in our project**:
- **Agent** — The orchestrator. Uses Claude 3 Haiku as its foundation model. Has a system prompt (instruction) defining its personality and responsibilities.
- **Knowledge Base** — A collection of markdown documents (plan details, FAQs, policies) that the agent can search. Documents are chunked, embedded with Titan Text Embeddings V2, and stored as vectors in OpenSearch Serverless.
- **Data Source** — S3 bucket containing the knowledge base documents. When you run `make upload-kb-docs`, documents are synced to S3 and an ingestion job converts them to vector embeddings.
- **Action Group** — A Lambda function with an OpenAPI schema that the agent can call. Our action group handles four operations: `getOrderStatus`, `getOrdersByUser`, `getUserProfile`, `listPlans`.
- **Agent Alias** — A stable identifier (like `live`) used for runtime invocation. Required to call `invoke_agent()`.

**How the agent decides what to do**: When a user sends "What plans do you offer?", the agent recognizes this as a knowledge question and searches the KB. When a user asks "Show me my orders", the agent calls the `getOrdersByUser` action. It can also combine both — e.g., "Which plan is best for my usage?" might search the KB for plan details, call `getUserProfile` to see the current plan, and then generate a recommendation.

**Cost**: Claude 3 Haiku is ~$0.25 per million input tokens and ~$1.25 per million output tokens. At demo usage levels, this is under $1/month.

### Bedrock Knowledge Base
**What it is**: A managed RAG pipeline. You point it at an S3 bucket of documents, and Bedrock handles chunking, embedding, and indexing automatically.

**Embedding model**: Amazon Titan Text Embeddings V2 converts text chunks into 1024-dimensional vectors. Similar text produces similar vectors, enabling semantic search.

**How ingestion works**:
1. Upload markdown files to S3 (`make upload-kb-docs`)
2. Bedrock's ingestion job reads each file, splits it into chunks (~300 tokens each)
3. Each chunk is converted to a vector using Titan Embeddings V2
4. Vectors are stored in OpenSearch Serverless
5. When the agent needs context, it converts the user's question to a vector and finds the most similar document chunks

### OpenSearch Serverless
**What it is**: A search and analytics engine. We use it specifically for **vector search** — finding document chunks that are semantically similar to a user's question.

**VECTORSEARCH collection type**: OpenSearch Serverless collections have different types. We use VECTORSEARCH, which is optimized for storing and querying vector embeddings. It creates the vector index automatically when Bedrock ingests documents.

**What is RAG?**: Retrieval-Augmented Generation. Instead of asking an AI model to answer from its training data alone, we first search our own data (plan descriptions, features) for relevant context, then include that context in the prompt. This makes responses more accurate and grounded in our actual plan offerings.

**Policies**: OpenSearch Serverless uses three types of policies instead of traditional cluster configuration:
- **Encryption policy** — Enables encryption at rest (AWS-owned key)
- **Network policy** — Controls access (we use public access so Bedrock can reach it)
- **Data access policy** — IAM-based permissions (grants the Bedrock KB role read/write access)

**How it's configured**: See `infrastructure/modules/opensearch/main.tf`.

**Cost**: OpenSearch Serverless has a minimum cost of ~$24/month per collection (2 OCUs baseline). This is the largest cost component of the AI agent. Consider this before deploying.

## CDN & DNS

### CloudFront
**What it is**: A Content Delivery Network. Caches your static files (React app) at edge locations worldwide for faster loading.

### Route 53
**What it is**: AWS's DNS service. Maps your domain name (e.g., `plans.example.com`) to your CloudFront distribution.
