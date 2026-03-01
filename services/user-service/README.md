# User Service

Handles user registration, authentication (via Cognito), and profile management (via DynamoDB).

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/users/register` | Public | Register a new user |
| POST | `/api/users/confirm` | Public | Confirm email with verification code |
| POST | `/api/users/login` | Public | Login, returns JWT tokens |
| POST | `/api/users/refresh` | Public | Refresh access token |
| GET | `/api/users/profile` | JWT | Get current user's profile |
| PUT | `/api/users/profile` | JWT | Update current user's profile |

## Example Requests

### Register
```bash
curl -X POST http://localhost:8081/api/users/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"MyPass123","firstName":"John","lastName":"Doe"}'
```

### Confirm
```bash
curl -X POST http://localhost:8081/api/users/confirm \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","confirmationCode":"123456"}'
```

### Login
```bash
curl -X POST http://localhost:8081/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"MyPass123"}'
```

### Get Profile
```bash
curl http://localhost:8081/api/users/profile \
  -H "Authorization: Bearer <access-token>"
```

## Running Locally

```bash
# Set env vars (from Terraform outputs)
export COGNITO_USER_POOL_ID=us-east-1_xxxxx
export COGNITO_CLIENT_ID=xxxxxxxxx
export AWS_REGION=us-east-1

# Run
./mvnw spring-boot:run -Dspring-boot.run.profiles=dev
```

Service starts on http://localhost:8081.

## Running Tests

```bash
./mvnw test
```

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `COGNITO_USER_POOL_ID` | Cognito User Pool ID | `us-east-1_AbCdEfG` |
| `COGNITO_CLIENT_ID` | Cognito App Client ID | `1abc2def3ghi4jkl` |
| `AWS_REGION` | AWS region | `us-east-1` |
| `DYNAMODB_USERS_TABLE` | DynamoDB table name | `consumer-ordering-users` |

## Directory Structure

```
src/main/java/com/consumerordering/userservice/
├── UserServiceApplication.java  — Spring Boot entry point
├── config/
│   ├── AwsConfig.java           — AWS region + credentials
│   ├── DynamoDbConfig.java      — DynamoDB enhanced client
│   ├── CognitoConfig.java       — Cognito client
│   └── SecurityConfig.java      — JWT validation, CORS, public endpoints
├── controller/
│   └── UserController.java      — REST endpoints
├── service/
│   ├── UserService.java         — Business logic
│   └── CognitoAuthService.java  — Cognito SDK operations
├── repository/
│   └── UserRepository.java      — DynamoDB operations
├── model/
│   ├── User.java                — DynamoDB entity
│   └── dto/                     — Request/response DTOs
└── exception/
    └── GlobalExceptionHandler.java — Error handling
```
