# Order Service

Manages plan subscription orders — create, list, view, and cancel orders. Publishes order events to SQS.

## Port

`8083`

## Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/orders` | JWT | Create a new order |
| GET | `/api/orders` | JWT | List current user's orders |
| GET | `/api/orders/{orderId}` | JWT | Get order details |
| PUT | `/api/orders/{orderId}/cancel` | JWT | Cancel a pending order |

All endpoints require a valid JWT. The user ID is extracted from the JWT `sub` claim.

## Order Flow

1. User selects a plan and submits an order
2. Order service fetches plan details from plan-catalog-service
3. Order is saved to DynamoDB with status `PENDING`
4. `order-created` event is published to SQS
5. User can view orders and cancel pending ones

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `AWS_REGION` | `us-east-1` | AWS region |
| `DYNAMODB_ORDERS_TABLE` | `consumer-ordering-orders` | DynamoDB table name |
| `SQS_ORDER_EVENTS_QUEUE_URL` | — | SQS queue URL for order events |
| `PLAN_CATALOG_SERVICE_URL` | `http://localhost:8082` | Plan catalog service base URL |
| `COGNITO_USER_POOL_ID` | — | Required for JWT validation |
| `AWS_ACCESS_KEY_ID` | — | AWS credentials |
| `AWS_SECRET_ACCESS_KEY` | — | AWS credentials |

## Local Development

```bash
# Set env vars (or use .env file)
export SPRING_PROFILES_ACTIVE=dev

# Build and run (requires plan-catalog-service running on 8082)
./mvnw spring-boot:run

# Run tests
./mvnw test
```
