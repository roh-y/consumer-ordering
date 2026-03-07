# Plan Catalog Service

Manages the wireless plan catalog — CRUD operations for plans stored in DynamoDB.

## Port

`8082`

## Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/plans` | Public | List all plans |
| GET | `/api/plans/{planId}` | Public | Get plan by ID |
| POST | `/api/plans` | JWT | Create a new plan |
| PUT | `/api/plans/{planId}` | JWT | Update a plan |
| DELETE | `/api/plans/{planId}` | JWT | Delete a plan |

## Data Seeder

On startup, if the plans table is empty, 4 default plans are seeded automatically (Basic, Standard, Premium, Unlimited Plus).

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `AWS_REGION` | `us-east-1` | AWS region |
| `DYNAMODB_PLANS_TABLE` | `consumer-ordering-plans` | DynamoDB table name |
| `COGNITO_USER_POOL_ID` | — | Required for JWT validation |
| `AWS_ACCESS_KEY_ID` | — | AWS credentials |
| `AWS_SECRET_ACCESS_KEY` | — | AWS credentials |

## Local Development

```bash
# Set env vars (or use .env file)
export SPRING_PROFILES_ACTIVE=dev

# Build and run
./mvnw spring-boot:run

# Run tests
./mvnw test
```
