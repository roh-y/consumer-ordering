.PHONY: build test up down clean setup seed build-user-service test-user-service build-plan-catalog-service test-plan-catalog-service build-order-service test-order-service build-notification-service test-notification-service build-frontend test-frontend tf-init tf-plan tf-apply deploy-login deploy-service deploy-backend deploy-frontend deploy-all export-data import-data

# ========================
# Top-Level Targets
# ========================

build: build-user-service build-plan-catalog-service build-order-service build-notification-service build-frontend ## Build all services

test: test-user-service test-plan-catalog-service test-order-service test-notification-service test-frontend ## Run all tests

up: ## Start all services with Docker Compose
	docker compose up -d --build

down: ## Stop all services
	docker compose down

clean: clean-user-service clean-plan-catalog-service clean-order-service clean-notification-service clean-frontend ## Clean all build artifacts

setup: ## Run developer onboarding (usage: make setup NAME=yourname)
	./scripts/dev-setup.sh $(NAME)

seed: ## Seed DynamoDB with sample data
	./scripts/seed-data.sh

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
# Plan Catalog Service
# ========================

build-plan-catalog-service: ## Build plan-catalog-service
	cd services/plan-catalog-service && ./mvnw package -DskipTests

test-plan-catalog-service: ## Run plan-catalog-service tests
	cd services/plan-catalog-service && ./mvnw test

clean-plan-catalog-service:
	cd services/plan-catalog-service && ./mvnw clean

# ========================
# Order Service
# ========================

build-order-service: ## Build order-service
	cd services/order-service && ./mvnw package -DskipTests

test-order-service: ## Run order-service tests
	cd services/order-service && ./mvnw test

clean-order-service:
	cd services/order-service && ./mvnw clean

# ========================
# Notification Service
# ========================

build-notification-service: ## Build notification-service
	cd services/notification-service && ./mvnw package -DskipTests

test-notification-service: ## Run notification-service tests
	cd services/notification-service && ./mvnw test

clean-notification-service:
	cd services/notification-service && ./mvnw clean

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
# Data Export/Import
# ========================

export-data: ## Export DynamoDB tables and Cognito users
	./scripts/export-data.sh

import-data: ## Import DynamoDB data from export (usage: make import-data DIR=data-exports/YYYYMMDD_HHMMSS)
	./scripts/import-data.sh $(DIR)

# ========================
# Deploy
# ========================

AWS_REGION ?= us-east-1
ECS_CLUSTER ?= consumer-ordering-dev-cluster
ECR_REGISTRY ?= $(shell aws sts get-caller-identity --query Account --output text).dkr.ecr.$(AWS_REGION).amazonaws.com

deploy-login: ## Login to Amazon ECR
	aws ecr get-login-password --region $(AWS_REGION) | docker login --username AWS --password-stdin $(ECR_REGISTRY)

deploy-service: ## Build, push, and deploy a single service (usage: make deploy-service SERVICE=user-service)
	@test -n "$(SERVICE)" || (echo "ERROR: SERVICE is required (e.g., make deploy-service SERVICE=user-service)" && exit 1)
	docker build -t $(ECR_REGISTRY)/consumer-ordering-dev-$(SERVICE):latest services/$(SERVICE)
	docker push $(ECR_REGISTRY)/consumer-ordering-dev-$(SERVICE):latest
	aws ecs update-service --cluster $(ECS_CLUSTER) --service consumer-ordering-dev-$(SERVICE) --force-new-deployment --region $(AWS_REGION)
	aws ecs wait services-stable --cluster $(ECS_CLUSTER) --services consumer-ordering-dev-$(SERVICE) --region $(AWS_REGION)

deploy-backend: ## Build, push, and deploy all backend services
	$(MAKE) deploy-service SERVICE=user-service
	$(MAKE) deploy-service SERVICE=plan-catalog-service
	$(MAKE) deploy-service SERVICE=order-service
	$(MAKE) deploy-service SERVICE=notification-service

deploy-frontend: ## Build and deploy frontend to S3/CloudFront
	cd frontend && VITE_API_URL=$$(cd ../infrastructure/environments/dev && terraform output -raw api_gateway_endpoint) npm run build
	@S3_BUCKET=$$(cd infrastructure/environments/dev && terraform output -raw s3_frontend_bucket) && \
	aws s3 sync frontend/dist/assets s3://$$S3_BUCKET/assets --cache-control "public, max-age=31536000, immutable" && \
	aws s3 sync frontend/dist s3://$$S3_BUCKET --exclude "assets/*" --cache-control "no-cache, no-store, must-revalidate"
	@CF_DIST=$$(cd infrastructure/environments/dev && terraform output -raw cloudfront_distribution_id) && \
	aws cloudfront create-invalidation --distribution-id $$CF_DIST --paths "/*"

deploy-all: deploy-backend deploy-frontend ## Deploy all services and frontend

# ========================
# Help
# ========================

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'
