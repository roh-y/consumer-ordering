.PHONY: build test up down clean build-user-service test-user-service build-frontend test-frontend tf-init tf-plan tf-apply

# ========================
# Top-Level Targets
# ========================

build: build-user-service build-frontend ## Build all services

test: test-user-service test-frontend ## Run all tests

up: ## Start all services with Docker Compose
	docker compose up -d --build

down: ## Stop all services
	docker compose down

clean: clean-user-service clean-frontend ## Clean all build artifacts

# ========================
# User Service
# ========================

build-user-service: ## Build user-service
	cd services/user-service && ./mvnw package -DskipTests

test-user-service: ## Run user-service tests
	cd services/user-service && ./mvnw test

clean-user-service:
	cd services/user-service && ./mvnw clean

# ========================
# Frontend
# ========================

build-frontend: ## Build frontend
	cd frontend && npm run build

test-frontend: ## Run frontend tests
	cd frontend && npm test -- --run

clean-frontend:
	cd frontend && rm -rf dist node_modules

# ========================
# Terraform
# ========================

tf-init: ## Initialize Terraform
	cd infrastructure/environments/dev && terraform init

tf-plan: ## Plan Terraform changes
	cd infrastructure/environments/dev && terraform plan

tf-apply: ## Apply Terraform changes
	cd infrastructure/environments/dev && terraform apply

# ========================
# Help
# ========================

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'
