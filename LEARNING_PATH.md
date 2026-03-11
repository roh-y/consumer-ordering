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

## Week 5: AI Customer Support Agent (Phase 4)

12. **Read [AWS_SERVICES_GUIDE.md](AWS_SERVICES_GUIDE.md)** — Focus on the Bedrock, Bedrock Agents, and FAISS Vector Search sections
13. **Read [DEVELOPMENT_GUIDE.md](DEVELOPMENT_GUIDE.md)** — "How to Work with the Customer Support Agent" section covers setup, deployment, and modification
14. **Read the Terraform modules** in this order:
    - `infrastructure/modules/bedrock/main.tf` — Agent, action groups, IAM roles
    - `infrastructure/modules/lambda/main.tf` — Lambda functions (actions, KB search, chat API) and permissions
15. **Read the Lambda code**:
    - `services/recommendation-service/lambda/action_group/handler.py` — How DynamoDB is queried for the agent
    - `services/recommendation-service/lambda/kb_search/handler.py` — How FAISS vector search works
    - `services/recommendation-service/lambda/chat_api/handler.py` — How the API Gateway request becomes a Bedrock Agent invocation
16. **Read the knowledge base documents**:
    - `services/recommendation-service/knowledge-base/plans/` — Plan detail docs
    - `services/recommendation-service/knowledge-base/faq/` — FAQ documents
    - `services/recommendation-service/knowledge-base/comparison/` — Plan comparison guide
    - `services/recommendation-service/knowledge-base/policies/` — Return/cancellation policy
17. **Read the frontend integration**:
    - `frontend/src/services/chatService.ts` — API client
    - `frontend/src/store/chatStore.ts` — Chat state management (Zustand)
    - `frontend/src/components/ChatWidget.tsx` — Chat UI component
18. **Deploy and test the agent** — Follow the deployment steps in DEVELOPMENT_GUIDE.md, then open the chat widget and try these queries:
    - "What plans do you offer?" (knowledge base retrieval)
    - "Compare Standard and Premium" (knowledge base)
    - "Show me my orders" (action group — DynamoDB)
    - "Which plan is best for streaming?" (recommendation using KB context)
19. **Trace the request** — Check CloudWatch Logs for both Lambda functions to see how the Bedrock Agent orchestrates KB retrieval and action group calls

## Ongoing

As new phases are added, repeat the pattern:
- Read the service README
- Read the code
- Run it locally
- Trace a request end-to-end
