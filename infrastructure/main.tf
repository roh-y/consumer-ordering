provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = var.project_name
      Environment = var.environment
      ManagedBy   = "terraform"
    }
  }
}

# --- VPC ---
module "vpc" {
  source       = "./modules/vpc"
  project_name = var.project_name
  environment  = var.environment
  vpc_cidr     = var.vpc_cidr
}

# --- Cognito ---
module "cognito" {
  source       = "./modules/cognito"
  project_name = var.project_name
  environment  = var.environment
}

# --- DynamoDB ---
module "dynamodb" {
  source       = "./modules/dynamodb"
  project_name = var.project_name
  environment  = var.environment
}

# --- SQS ---
module "sqs" {
  source       = "./modules/sqs"
  project_name = var.project_name
  environment  = var.environment
}

# --- SES ---
module "ses" {
  source       = "./modules/ses"
  project_name = var.project_name
  environment  = var.environment
  sender_email = var.ses_sender_email
}

# --- IAM ---
module "iam" {
  source       = "./modules/iam"
  project_name = var.project_name
  environment  = var.environment
  developers   = var.developers

  dynamodb_table_arns = [
    module.dynamodb.users_table_arn,
    module.dynamodb.plans_table_arn,
    module.dynamodb.orders_table_arn,
  ]

  cognito_user_pool_arn = module.cognito.user_pool_arn

  sqs_queue_arns = [
    module.sqs.order_events_queue_arn,
    module.sqs.order_events_dlq_arn,
  ]

  # GitHub Actions OIDC
  aws_region                  = var.aws_region
  github_repository           = var.github_repository
  github_actions_admin_access = var.github_actions_admin_access
  s3_frontend_bucket_arn      = module.cloudfront.s3_bucket_arn
  cloudfront_distribution_id  = module.cloudfront.distribution_id
}

# --- Monitoring (log groups must exist before ECS tasks start) ---
module "monitoring" {
  source       = "./modules/monitoring"
  project_name = var.project_name
  environment  = var.environment

  ecs_cluster_name = "${var.project_name}-${var.environment}-cluster"
  sqs_queue_name   = module.sqs.order_events_queue_name

  services = {
    "user-service"         = 8081
    "plan-catalog-service" = 8082
    "order-service"        = 8083
    "notification-service" = 8084
  }
}

# --- ECS / Fargate ---
module "ecs" {
  source       = "./modules/ecs"
  project_name = var.project_name
  environment  = var.environment
  aws_region   = var.aws_region

  vpc_id             = module.vpc.vpc_id
  private_subnet_ids = module.vpc.private_subnet_ids

  log_group_names = module.monitoring.log_group_names

  dynamodb_table_arns = [
    module.dynamodb.users_table_arn,
    module.dynamodb.plans_table_arn,
    module.dynamodb.orders_table_arn,
  ]

  sqs_queue_arns = [
    module.sqs.order_events_queue_arn,
    module.sqs.order_events_dlq_arn,
  ]

  cognito_user_pool_arn = module.cognito.user_pool_arn

  services = {
    "user-service" = {
      port          = 8081
      health_path   = "/actuator/health"
      cpu           = var.ecs_service_cpu
      memory        = var.ecs_service_memory
      desired_count = var.ecs_desired_count
      environment = {
        SERVER_PORT          = "8081"
        AWS_REGION           = var.aws_region
        COGNITO_USER_POOL_ID = module.cognito.user_pool_id
        COGNITO_CLIENT_ID    = module.cognito.client_id
        DYNAMODB_TABLE_NAME  = module.dynamodb.users_table_name
      }
    }

    "plan-catalog-service" = {
      port          = 8082
      health_path   = "/actuator/health"
      cpu           = var.ecs_service_cpu
      memory        = var.ecs_service_memory
      desired_count = var.ecs_desired_count
      environment = {
        SERVER_PORT          = "8082"
        AWS_REGION           = var.aws_region
        COGNITO_USER_POOL_ID = module.cognito.user_pool_id
        DYNAMODB_TABLE_NAME  = module.dynamodb.plans_table_name
      }
    }

    "order-service" = {
      port          = 8083
      health_path   = "/actuator/health"
      cpu           = var.ecs_service_cpu
      memory        = var.ecs_service_memory
      desired_count = var.ecs_desired_count
      environment = {
        SERVER_PORT                = "8083"
        AWS_REGION                 = var.aws_region
        COGNITO_USER_POOL_ID       = module.cognito.user_pool_id
        DYNAMODB_TABLE_NAME        = module.dynamodb.orders_table_name
        SQS_ORDER_EVENTS_QUEUE_URL = module.sqs.order_events_queue_url
        PLAN_CATALOG_SERVICE_URL   = "__ALB_DNS__"
        USER_SERVICE_URL           = "__ALB_DNS__"
      }
    }

    "notification-service" = {
      port          = 8084
      health_path   = "/actuator/health"
      cpu           = var.ecs_service_cpu
      memory        = var.ecs_service_memory
      desired_count = var.ecs_desired_count
      environment = {
        SERVER_PORT                = "8084"
        AWS_REGION                 = var.aws_region
        SQS_ORDER_EVENTS_QUEUE_URL = module.sqs.order_events_queue_url
        SES_FROM_EMAIL             = var.ses_sender_email
      }
    }
  }
}

# --- Bedrock Agent (Knowledge Base role created first — no OpenSearch dependency) ---
module "bedrock" {
  source       = "./modules/bedrock"
  project_name = var.project_name
  environment  = var.environment

  opensearch_collection_arn = module.opensearch.collection_arn
  action_group_lambda_arn   = module.lambda_functions.action_group_lambda_arn
}

# --- OpenSearch Serverless (vector store for Bedrock KB) ---
module "opensearch" {
  source       = "./modules/opensearch"
  project_name = var.project_name
  environment  = var.environment

  bedrock_kb_role_arn = module.bedrock.kb_role_arn
}

# --- Lambda Functions (action group + chat API) ---
module "lambda_functions" {
  source       = "./modules/lambda"
  project_name = var.project_name
  environment  = var.environment

  orders_table_name = module.dynamodb.orders_table_name
  users_table_name  = module.dynamodb.users_table_name
  plans_table_name  = module.dynamodb.plans_table_name
  orders_table_arn  = module.dynamodb.orders_table_arn
  users_table_arn   = module.dynamodb.users_table_arn
  plans_table_arn   = module.dynamodb.plans_table_arn

  bedrock_agent_id       = module.bedrock.agent_id
  bedrock_agent_alias_id = module.bedrock.agent_alias_id
}

# --- API Gateway ---
module "api_gateway" {
  source       = "./modules/api-gateway"
  project_name = var.project_name
  environment  = var.environment
  aws_region   = var.aws_region

  cognito_user_pool_id = module.cognito.user_pool_id
  cognito_client_id    = module.cognito.client_id

  alb_listener_arn      = module.ecs.alb_listener_arn
  alb_dns_name          = module.ecs.alb_dns_name
  alb_security_group_id = module.ecs.alb_security_group_id

  private_subnet_ids = module.vpc.private_subnet_ids
  vpc_id             = module.vpc.vpc_id

  # Chat API Lambda integration
  chat_api_lambda_invoke_arn    = module.lambda_functions.chat_api_lambda_invoke_arn
  chat_api_lambda_function_name = module.lambda_functions.chat_api_lambda_function_name
}

# --- CloudFront + S3 ---
module "cloudfront" {
  source       = "./modules/cloudfront"
  project_name = var.project_name
  environment  = var.environment

  api_gateway_endpoint = module.api_gateway.api_endpoint
  api_gateway_id       = module.api_gateway.api_id
}
