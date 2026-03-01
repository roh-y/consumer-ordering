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
