# Development Guide

How to add features, run tests, and debug this project.

## How to Add a New API Endpoint

Example: adding `GET /api/users/search?email=...`

### 1. Add the DTO (if needed)

Create a new class in `services/user-service/src/main/java/.../model/dto/`:

```java
@Data
@Builder
public class SearchResponse {
    private String userId;
    private String email;
    private String firstName;
}
```

### 2. Add the service method

In `UserService.java`:

```java
public SearchResponse searchByEmail(String email) {
    User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new RuntimeException("User not found"));
    return SearchResponse.builder()
            .userId(user.getUserId())
            .email(user.getEmail())
            .firstName(user.getFirstName())
            .build();
}
```

### 3. Add the controller endpoint

In `UserController.java`:

```java
@GetMapping("/search")
public ResponseEntity<SearchResponse> search(@RequestParam String email) {
    return ResponseEntity.ok(userService.searchByEmail(email));
}
```

### 4. Update SecurityConfig (if needed)

If the endpoint should be public, add it to the `requestMatchers` list in `SecurityConfig.java`.

### 5. Write a test

Add a test in `UserServiceApplicationTests.java` or a new test file.

### 6. Test it

```bash
cd services/user-service
./mvnw test
./mvnw spring-boot:run -Dspring-boot.run.profiles=dev
curl http://localhost:8081/api/users/search?email=test@example.com
```

## How to Add a New React Page

### 1. Create the page component

Create `frontend/src/pages/NewPage.tsx`:

```tsx
export default function NewPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">New Page</h1>
      <p>Content here</p>
    </div>
  )
}
```

### 2. Add the route

In `frontend/src/App.tsx`, add inside the `<Route element={<Layout />}>`:

```tsx
<Route path="/new-page" element={<NewPage />} />
```

Wrap with `<ProtectedRoute>` if it requires authentication.

### 3. Add navigation link

In `frontend/src/components/Layout.tsx`, add a `<Link>` in the nav.

## How to Add a New DynamoDB Table

### 1. Add Terraform resource

In `infrastructure/modules/dynamodb/main.tf`:

```hcl
resource "aws_dynamodb_table" "my_table" {
  name         = "${var.project_name}-my-table"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "myId"

  attribute {
    name = "myId"
    type = "S"
  }
}
```

### 2. Add the output

In `infrastructure/modules/dynamodb/outputs.tf`:

```hcl
output "my_table_name" {
  value = aws_dynamodb_table.my_table.name
}
```

### 3. Apply

```bash
cd infrastructure/environments/dev
terraform plan    # Review changes
terraform apply   # Create the table
```

## How to Run Tests

```bash
# Backend
cd services/user-service
./mvnw test

# Frontend
cd frontend
npm test -- --run    # Single run
npm test             # Watch mode

# All at once
make test
```

## How to Debug

### Backend (Spring Boot)

1. Check logs — Spring Boot logs to stdout by default
2. Use Swagger UI: http://localhost:8081/swagger-ui.html
3. Check health: http://localhost:8081/actuator/health
4. Enable debug logging in `application-dev.yml`:
   ```yaml
   logging:
     level:
       com.consumerordering: DEBUG
   ```

### Frontend (React)

1. Browser DevTools → Console for errors
2. Browser DevTools → Network to see API calls
3. React DevTools extension for component state
4. TanStack Query DevTools (add `<ReactQueryDevtools />` to App.tsx)

## Common Errors

| Error | Cause | Fix |
|-------|-------|-----|
| `COGNITO_USER_POOL_ID is empty` | Env var not set | Run `scripts/setup-aws.sh` or export vars |
| `JwtDecoder` error on startup | Missing JWT issuer config | Set `COGNITO_USER_POOL_ID` and `AWS_REGION` |
| `ResourceNotFoundException` | DynamoDB table doesn't exist | Run `terraform apply` |
| CORS error in browser | Backend not allowing frontend origin | Check `SecurityConfig.java` CORS config |
| 401 on profile endpoint | Token expired | Login again or check refresh token logic |

## How to Add a New Microservice

Follow these steps when adding a new Spring Boot microservice (e.g., `notification-service`).

### 1. Create the Spring Boot project

```bash
mkdir -p services/notification-service
cd services/notification-service
```

Use Spring Initializr or copy an existing service's structure. Include:
- `src/main/java/com/consumerordering/notificationservice/`
- `src/main/resources/application.yml` and `application-dev.yml`
- `pom.xml` with Spring Boot 3.4, Java 21
- `mvnw` / `mvnw.cmd` (Maven wrapper)

### 2. Add a Dockerfile

Follow the existing pattern (multi-stage build):

```dockerfile
FROM eclipse-temurin:21-jdk-alpine AS build
WORKDIR /app
COPY . .
RUN ./mvnw package -DskipTests -B

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
EXPOSE 8084
ENTRYPOINT ["java", "-jar", "app.jar"]
```

### 3. Add Terraform resources

You need three things in your Terraform infrastructure:

**ECR repository** — in `infrastructure/main.tf`, add the repo to the ECS module or create a new `aws_ecr_repository` resource.

**ECS task definition + service** — add to the ECS module (`infrastructure/modules/ecs/`):
- Task definition with the new container image, port, environment variables
- ECS service with desired count and ALB target group

**ALB target group + listener rule** — route traffic from the API Gateway or ALB to the new service on its port.

### 4. Wire into `docker-compose.yml`

Add a new service block:

```yaml
notification-service:
  build: ./services/notification-service
  container_name: co-notification-service
  ports:
    - "8084:8084"
  env_file:
    - path: .env
      required: false
  environment:
    - SPRING_PROFILES_ACTIVE=dev
    - AWS_REGION=${AWS_REGION:-us-east-1}
    # Add service-specific env vars here
  restart: unless-stopped
  healthcheck:
    test: ["CMD", "curl", "-f", "http://localhost:8084/actuator/health"]
    interval: 30s
    timeout: 5s
    retries: 3
    start_period: 60s
  networks:
    - co-network
```

### 5. Add to CI workflow

In `.github/workflows/ci.yml`, add a new job:

```yaml
notification-service:
  name: Notification Service (Build + Test)
  runs-on: ubuntu-latest
  defaults:
    run:
      working-directory: services/notification-service
  steps:
    - uses: actions/checkout@v4
    - name: Set up Java 21
      uses: actions/setup-java@v4
      with:
        distribution: temurin
        java-version: 21
        cache: maven
    - name: Build
      run: ./mvnw package -DskipTests -B
    - name: Test
      run: ./mvnw test -B
```

### 6. Add to Deploy workflow

In `.github/workflows/deploy.yml`, the deploy workflow auto-detects changes via paths-filter. Add the new filter:

```yaml
# In the detect-changes job, under the paths-filter filters:
notification-service:
  - 'services/notification-service/**'
```

And add it to the dynamic matrix builder:

```bash
if [ "${{ steps.changes.outputs.notification-service }}" == "true" ]; then
  matrix=$(echo "$matrix" | jq -c '. + [{"service": "notification-service", "path": "services/notification-service"}]')
fi
```

Update the `backend-any` output to include the new service.

### 7. Add Makefile targets

```makefile
build-notification-service:
	cd services/notification-service && ./mvnw package -DskipTests

test-notification-service:
	cd services/notification-service && ./mvnw test

clean-notification-service:
	cd services/notification-service && ./mvnw clean
```

Add `notification-service` to the `build`, `test`, `clean`, and `deploy-backend` aggregate targets.

## How to Work with the Customer Support Agent (Phase 4)

The recommendation service is an AI-powered customer support agent built with Amazon Bedrock Agents. Unlike the Spring Boot services, it uses Python Lambda functions and AWS-managed AI services.

### Architecture Overview

```
User → ChatWidget → API Gateway (POST /api/agent/chat)
                         → Chat API Lambda (extracts JWT userId, invokes Bedrock Agent)
                              → Bedrock Agent (Nova Lite)
                                   ├── KB Search Lambda (FAISS vector search)
                                   └── Action Group Lambda (DynamoDB queries)
```

### Key Files

| File | Purpose |
|------|---------|
| `services/recommendation-service/knowledge-base/` | Markdown docs used to build the FAISS vector index |
| `services/recommendation-service/lambda/action_group/handler.py` | DynamoDB queries (orders, users, plans) |
| `services/recommendation-service/lambda/kb_search/handler.py` | FAISS vector search for KB queries |
| `services/recommendation-service/lambda/chat_api/handler.py` | API Gateway → Bedrock Agent bridge |
| `scripts/build-faiss-index.py` | Build-time script to chunk, embed, and index KB docs |
| `infrastructure/modules/bedrock/main.tf` | Agent + action groups |
| `infrastructure/modules/lambda/main.tf` | Lambda functions + IAM roles + FAISS layer |
| `frontend/src/components/ChatWidget.tsx` | Floating chat UI component |
| `frontend/src/store/chatStore.ts` | Zustand store for chat state |
| `frontend/src/services/chatService.ts` | API client for chat endpoint |

### Prerequisites

Before deploying the agent, you must enable two foundation models in the AWS Bedrock console:

1. Go to **Amazon Bedrock** → **Model access** in the AWS Console
2. Request access to:
   - **Amazon Nova Lite** (for the agent's conversational model)
   - **Amazon Titan Text Embeddings V2** (for the knowledge base embeddings)
3. Wait for access to be granted (usually instant)

You also need **Docker** installed to build the FAISS Lambda layer.

### Initial Deployment

```bash
# 1. Build the FAISS index from KB docs (requires: pip install faiss-cpu numpy boto3)
make build-faiss-index

# 2. Build the FAISS Lambda layer (requires Docker)
make build-faiss-layer

# 3. Deploy infrastructure (creates Bedrock Agent, Lambdas)
cd infrastructure
terraform init
terraform apply

# 4. Deploy the frontend with the chat widget
make deploy-frontend
```

Or use the combined target:
```bash
make deploy-agent    # Builds FAISS index + layer, then runs terraform apply
```

### How to Update Knowledge Base Content

The agent's knowledge comes from markdown files in `services/recommendation-service/knowledge-base/`. To update what the agent knows:

1. **Edit or add markdown files** in the knowledge-base directory:
   - `plans/` — One file per plan (features, pricing, best-for scenarios)
   - `faq/` — Frequently asked questions (general, billing)
   - `comparison/` — Plan comparison tables and guides
   - `policies/` — Return policy, cancellation rules

2. **Rebuild the FAISS index and redeploy**:
   ```bash
   make deploy-agent
   ```
   This rebuilds the vector index from the KB docs, rebuilds the Lambda layer, and runs `terraform apply` to update the Lambda.

3. **Test** in the Bedrock console "Test" panel or via the frontend chat widget.

### How to Add a New Action to the Agent

The agent can call "actions" — Lambda functions that query live data. To add a new action:

1. **Add the handler function** in `services/recommendation-service/lambda/action_group/handler.py`:
   ```python
   def get_something_new(params):
       # Query DynamoDB or another data source
       table = dynamodb.Table(os.environ["SOME_TABLE_NAME"])
       response = table.get_item(Key={"id": params.get("id")})
       return response.get("Item", {})
   ```

2. **Add routing** in the same file's `handler()` function:
   ```python
   elif api_path == "/getSomethingNew" and http_method == "GET":
       result = get_something_new(params)
   ```

3. **Update the OpenAPI schema** in `infrastructure/modules/bedrock/main.tf` inside the `aws_bedrockagent_agent_action_group` resource. Add a new path to the `api_schema` payload:
   ```hcl
   "/getSomethingNew" = {
     get = {
       summary     = "Get something new"
       operationId = "getSomethingNew"
       parameters  = [...]
       responses   = { ... }
     }
   }
   ```

4. **Apply infrastructure changes and redeploy**:
   ```bash
   cd infrastructure && terraform apply
   ```

### How to Change the Agent's Personality or Instructions

The agent's system prompt is in `infrastructure/modules/bedrock/main.tf` inside the `aws_bedrockagent_agent` resource's `instruction` field. Edit it and run `terraform apply`.

### How to Test the Agent

**From the AWS Console:**
1. Go to **Amazon Bedrock** → **Agents**
2. Select the agent → click **Test** in the right panel
3. Try queries like "What plans do you offer?" or "Compare Standard and Premium"

**From the frontend:**
1. Log in to the app
2. Click the chat bubble (bottom-right corner)
3. Test queries:
   - "What plans do you offer?" (knowledge base lookup)
   - "Compare Standard and Premium" (knowledge base)
   - "Show me my orders" (action group — DynamoDB query)
   - "Which plan is best for streaming?" (recommendation)

**Debugging:**
- Check CloudWatch Logs for the Lambda functions:
  - `/aws/lambda/consumer-ordering-dev-agent-actions` — Action group invocations
  - `/aws/lambda/consumer-ordering-dev-chat-api` — Chat API requests
- Each Lambda logs the incoming event, making it easy to trace issues

### Frontend Chat Widget

The `ChatWidget` component (`frontend/src/components/ChatWidget.tsx`) is a floating button that expands into a chat panel. Key behaviors:

- Only visible to **authenticated users** (checks `useAuthStore().isAuthenticated`)
- Messages are stored in a Zustand store (`chatStore.ts`) — **not persisted** across page reloads
- Session ID is managed per conversation — clearing the chat starts a new agent session
- The widget uses the app's indigo color theme and Tailwind CSS

## How to Enhance an Existing Service

The typical development loop for modifying an existing microservice:

### Local development

```bash
# Start all services locally
docker compose up -d --build

# Or run just the service you're working on natively
cd services/user-service
./mvnw spring-boot:run -Dspring-boot.run.profiles=dev
```

Make changes, test locally, iterate.

### Run tests

```bash
# Test just your service
make test-user-service

# Or run all tests
make test
```

### Push to a feature branch

```bash
git checkout -b feature/my-change
git add -A
git commit -m "Add new endpoint to user service"
git push -u origin feature/my-change
```

Open a pull request. The **CI workflow** runs automatically — builds and tests all services. Fix any failures before merging.

### Merge to main

Once the PR is approved and CI passes, merge to `main`. The **Deploy workflow** triggers automatically and:

1. Detects which services changed (only your service, not others)
2. Builds a new Docker image and pushes it to ECR
3. Updates the ECS service to pull the new image
4. Verifies the deployment is stable

You don't need to do anything — the pipeline handles it. Check the **Actions** tab to monitor progress.
