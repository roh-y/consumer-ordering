# Architecture

## System Overview

This application follows a **microservices architecture** where each service handles one business domain. Services communicate over REST APIs and asynchronous messaging (SQS).

```
                         ┌──────────────┐
                         │  Route 53    │  (DNS — maps domain to CloudFront)
                         └──────┬───────┘
                                │
                         ┌──────▼───────┐
                         │  CloudFront  │  (CDN — caches static files, routes API calls)
                         └──────┬───────┘
                                │
              ┌─────────────────┼─────────────────┐
              │                                   │
     ┌────────▼─────────┐              ┌─────────▼──────────┐
     │  S3 (React SPA)  │              │  API Gateway (REST)│
     │  Static website  │              │  Routes + auth     │
     └──────────────────┘              └──────┬──────┬──────┘
                                              │      │
                              ┌───────────────┘      └──────────────┐
                              │                                     │
                     ┌────────▼─────────┐                ┌─────────▼─────────┐
                     │ Cognito Authorizer│                │ Lambda (Chat API) │
                     │ (validates JWT)   │                │ Bedrock Agent     │
                     └────────┬─────────┘                └───────────────────┘
                              │
                     ┌────────▼─────────┐
                     │  ALB / Service   │
                     │  Discovery       │
                     └──┬─────┬─────┬───┘
                        │     │     │
          ┌─────────────┘     │     └──────────────┐
          │                   │                    │
 ┌────────▼────┐  ┌──────────▼──┐  ┌──────────────▼──┐
 │User Service │  │Plan Catalog │  │Order Service    │
 │(Spring Boot)│  │(Spring Boot)│  │(Spring Boot)    │
 │ECS/Fargate  │  │ECS/Fargate  │  │ECS/Fargate      │
 └──────┬──────┘  └──────┬──────┘  └───────┬─────────┘
        │                │                  │
        ▼                ▼                  ▼
   ┌─────────┐     ┌─────────┐       ┌──────────┐     ┌───────────────────┐
   │DynamoDB │     │DynamoDB │       │DynamoDB  │     │Notification Svc   │
   │Users    │     │Plans    │       │Orders    │     │(Node.js) ◄── SQS  │
   └─────────┘     └─────────┘       └──────────┘     └───────────────────┘
```

## Services

### User Service (Phase 1 — Current)
- **Tech**: Java 21, Spring Boot 3.4
- **Purpose**: User registration, login, profile management
- **Auth**: Amazon Cognito (creates users, issues JWT tokens)
- **Database**: DynamoDB `consumer-ordering-users` table
- **Port**: 8081

### Plan Catalog Service (Phase 2)
- **Purpose**: CRUD for wireless plans, admin management
- **Database**: DynamoDB `consumer-ordering-plans` table

### Order Service (Phase 2)
- **Purpose**: Cart, checkout simulation, order history
- **Database**: DynamoDB `consumer-ordering-orders` table
- **Messaging**: Publishes order events to SQS

### Notification Service (Phase 3)
- **Tech**: Node.js, TypeScript
- **Purpose**: Consumes SQS messages, sends simulated notifications

### Recommendation Service / Customer Support Agent (Phase 4)
- **Tech**: Python 3.12 Lambda functions
- **Purpose**: AI-powered customer support agent using Amazon Bedrock Agents
- **Model**: Amazon Nova Lite (via Bedrock) for conversational responses
- **Knowledge Base**: Plan docs, FAQs, comparisons, and policies are chunked and embedded at build time using Titan Embeddings v2, stored as a FAISS vector index bundled with the Lambda deployment package
- **Three Lambda Functions**:
  - `chat-api` — Receives `POST /api/agent/chat` from API Gateway, extracts userId from JWT, invokes the Bedrock Agent, and returns the streaming response
  - `agent-actions` — Action group Lambda invoked by the Bedrock Agent to query DynamoDB (order status, user profile, plan listings)
  - `kb-search` — Action group Lambda that performs FAISS vector similarity search against the embedded knowledge base index
- **Capabilities**: Answer plan questions, compare plans, check order status, recommend plans based on needs, handle billing/policy queries
- **Frontend**: Floating chat widget (bottom-right corner) visible only to authenticated users

## Data Flow: Customer Support Chat

Here's what happens when a user sends a message in the chat widget:

```
React ChatWidget           API Gateway           Chat API Lambda         Bedrock Agent
    │                          │                       │                       │
    │──POST /api/agent/chat──►│                       │                       │
    │  {message, sessionId}   │──(JWT verified)──────►│                       │
    │                          │                       │──invoke_agent()──────►│
    │                          │                       │                       │
    │                          │                       │   ┌──────────────────┤
    │                          │                       │   │ 1. Search KB     │
    │                          │                       │   │    (FAISS Lambda │
    │                          │                       │   │    vector search)│
    │                          │                       │   │                  │
    │                          │                       │   │ 2. Call Action   │
    │                          │                       │   │    Group Lambda  │
    │                          │                       │   │    (DynamoDB     │
    │                          │                       │   │    queries)      │
    │                          │                       │   │                  │
    │                          │                       │   │ 3. Generate      │
    │                          │                       │   │    response with │
    │                          │                       │   │    Nova Lite     │
    │                          │                       │   └──────────────────┤
    │                          │                       │◄──streaming response──│
    │◄──{message, sessionId}───│◄──────────────────────│                       │
```

**Key points:**
- The Bedrock Agent decides autonomously whether to search the knowledge base (via the FAISS search Lambda), call the customer actions Lambda, or both, based on the user's question
- Session state (userId) is passed to the agent so it can look up user-specific data without the user providing their ID
- Sessions are ephemeral — stored in Bedrock Agent Runtime, not persisted across page reloads
- The knowledge base uses RAG: plan documents are chunked and embedded with Titan Embeddings v2 at build time, stored as a FAISS index bundled with the KB search Lambda

## Data Flow: User Registration

Here's what happens step-by-step when a user registers:

1. User fills out the registration form in the **React frontend**
2. Frontend sends `POST /api/users/register` to the **user-service**
3. User-service calls **Cognito** `SignUp` API → Cognito creates the user and sends a verification email
4. Cognito returns a `userSub` (UUID) → this becomes the user's ID everywhere
5. User-service stores the profile in **DynamoDB** (userId, email, name, etc.)
6. User receives the verification email with a 6-digit code
7. User enters the code → Frontend sends `POST /api/users/confirm`
8. User-service calls Cognito `ConfirmSignUp` → account is now active
9. User can now log in

## Data Flow: Login

1. User enters email + password in the **React frontend**
2. Frontend sends `POST /api/users/login` to the **user-service**
3. User-service calls **Cognito** `InitiateAuth` with `USER_PASSWORD_AUTH` flow
4. Cognito validates credentials and returns three JWT tokens:
   - **Access Token** (1 hour) — used for API authorization
   - **ID Token** (1 hour) — contains user attributes
   - **Refresh Token** (30 days) — used to get new access tokens
5. Frontend stores tokens in localStorage via Zustand
6. All subsequent API calls include `Authorization: Bearer <accessToken>`
7. Spring Security validates the JWT using Cognito's JWKS endpoint

## DynamoDB Table Design

### Users Table
| Attribute | Type | Description |
|-----------|------|-------------|
| `userId` (PK) | String | Cognito sub UUID |
| `email` (GSI) | String | User's email address |
| `firstName` | String | |
| `lastName` | String | |
| `phoneNumber` | String | |
| `address` | String | |
| `planId` | String | Currently subscribed plan |
| `createdAt` | String | ISO timestamp |
| `updatedAt` | String | ISO timestamp |

**Why DynamoDB?** For this demo, we need fast key-value lookups by userId and email. DynamoDB's on-demand billing means $0 cost at low volume, and it scales automatically if needed.

**Why not RDS/PostgreSQL?** DynamoDB is simpler to set up (no connection pools, no schema migrations) and teaches NoSQL patterns. A real production app might use Aurora for complex queries.

## Authentication Flow

```
React App                    User Service               Cognito
    │                            │                         │
    │──POST /register──────────►│                         │
    │                            │──SignUp───────────────►│
    │                            │◄──userSub──────────────│
    │                            │──save to DynamoDB       │
    │◄──profile──────────────────│                         │
    │                            │                         │
    │──POST /confirm────────────►│                         │
    │                            │──ConfirmSignUp────────►│
    │◄──200 OK───────────────────│                         │
    │                            │                         │
    │──POST /login──────────────►│                         │
    │                            │──InitiateAuth─────────►│
    │                            │◄──JWT tokens────────────│
    │◄──tokens───────────────────│                         │
    │                            │                         │
    │──GET /profile──────────────►│                         │
    │  (Authorization: Bearer)   │──validate JWT──────────►│
    │                            │◄──valid─────────────────│
    │                            │──read from DynamoDB     │
    │◄──profile──────────────────│                         │
```
