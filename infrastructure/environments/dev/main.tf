module "root" {
  source = "../../"

  project_name = var.project_name
  environment  = var.environment
  aws_region   = var.aws_region
  vpc_cidr     = var.vpc_cidr
  developers   = var.developers

  ecs_service_cpu    = var.ecs_service_cpu
  ecs_service_memory = var.ecs_service_memory
  ecs_desired_count  = var.ecs_desired_count

  github_repository = var.github_repository
}

output "cognito_user_pool_id" {
  value = module.root.cognito_user_pool_id
}

output "cognito_client_id" {
  value = module.root.cognito_client_id
}

output "cognito_user_pool_arn" {
  value = module.root.cognito_user_pool_arn
}

output "dynamodb_users_table" {
  value = module.root.dynamodb_users_table
}

output "dynamodb_users_table_arn" {
  value = module.root.dynamodb_users_table_arn
}

output "dynamodb_plans_table" {
  value = module.root.dynamodb_plans_table
}

output "dynamodb_plans_table_arn" {
  value = module.root.dynamodb_plans_table_arn
}

output "dynamodb_orders_table" {
  value = module.root.dynamodb_orders_table
}

output "dynamodb_orders_table_arn" {
  value = module.root.dynamodb_orders_table_arn
}

output "sqs_order_events_queue_url" {
  value = module.root.sqs_order_events_queue_url
}

output "sqs_order_events_queue_arn" {
  value = module.root.sqs_order_events_queue_arn
}

output "sqs_order_events_dlq_arn" {
  value = module.root.sqs_order_events_dlq_arn
}

output "aws_region" {
  value = module.root.aws_region
}

output "iam_developer_access_keys" {
  value     = module.root.iam_developer_access_keys
  sensitive = true
}

output "cloudfront_domain" {
  value = module.root.cloudfront_domain
}

output "api_gateway_endpoint" {
  value = module.root.api_gateway_endpoint
}

output "s3_frontend_bucket" {
  value = module.root.s3_frontend_bucket
}

output "ecr_repository_urls" {
  value = module.root.ecr_repository_urls
}

output "ecs_cluster_name" {
  value = module.root.ecs_cluster_name
}

output "cloudfront_distribution_id" {
  value = module.root.cloudfront_distribution_id
}

output "github_actions_role_arn" {
  value = module.root.github_actions_role_arn
}

output "bedrock_agent_id" {
  value = module.root.bedrock_agent_id
}

