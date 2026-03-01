# Learning Path

Suggested reading order for a new developer joining this project.

## Week 1: Understand the Big Picture

1. **Read [README.md](README.md)** — What this app does, how to run it
2. **Read [ARCHITECTURE.md](ARCHITECTURE.md)** — System design, service responsibilities, data flows
3. **Read [AWS_SERVICES_GUIDE.md](AWS_SERVICES_GUIDE.md)** — Focus on Cognito + DynamoDB sections first

## Week 2: Backend Deep Dive

4. **Read `services/user-service/README.md`** — Service overview, endpoints, how to run
5. **Read the code** in this order:
   - `UserServiceApplication.java` — Entry point
   - `config/` — How AWS clients are configured
   - `model/User.java` — The DynamoDB entity
   - `model/dto/` — Request/response shapes
   - `repository/UserRepository.java` — How we talk to DynamoDB
   - `service/CognitoAuthService.java` — How we talk to Cognito
   - `service/UserService.java` — Business logic orchestration
   - `controller/UserController.java` — REST endpoints
   - `exception/GlobalExceptionHandler.java` — Error handling
6. **Run the app locally**, register a user, and trace the request through logs

## Week 3: Frontend

7. **Read `frontend/README.md`** — Overview and setup
8. **Read the code** in this order:
   - `src/types/index.ts` — TypeScript types
   - `src/store/authStore.ts` — State management
   - `src/services/api.ts` — Axios setup with interceptors
   - `src/services/userService.ts` — API calls
   - `src/App.tsx` — Routing
   - `src/pages/` — Each page component
   - `src/components/` — Shared components

## Week 4: Infrastructure

9. **Read `infrastructure/` Terraform files** in this order:
   - `variables.tf` — Input variables
   - `main.tf` — Root module (calls sub-modules)
   - `modules/cognito/main.tf` — How Cognito is configured
   - `modules/dynamodb/main.tf` — How DynamoDB tables are defined
   - `modules/vpc/main.tf` — Networking setup
   - `environments/dev/` — Environment-specific config

10. **Read [CI_CD_GUIDE.md](CI_CD_GUIDE.md)** — How the pipeline works
11. **Read [DEVELOPMENT_GUIDE.md](DEVELOPMENT_GUIDE.md)** — How to add features

## Ongoing

As new phases are added, repeat the pattern:
- Read the service README
- Read the code
- Run it locally
- Trace a request end-to-end
