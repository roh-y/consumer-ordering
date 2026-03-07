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
