output "vpc_id" {
  description = "VPC ID"
  value       = module.vpc.vpc_id
}

output "cognito_user_pool_id" {
  description = "Cognito User Pool ID — set as COGNITO_USER_POOL_ID env var"
  value       = module.cognito.user_pool_id
}

output "cognito_client_id" {
  description = "Cognito App Client ID — set as COGNITO_CLIENT_ID env var"
  value       = module.cognito.client_id
}

output "cognito_user_pool_arn" {
  description = "Cognito User Pool ARN"
  value       = module.cognito.user_pool_arn
}

output "dynamodb_users_table" {
  description = "DynamoDB Users table name"
  value       = module.dynamodb.users_table_name
}

output "dynamodb_users_table_arn" {
  description = "DynamoDB Users table ARN"
  value       = module.dynamodb.users_table_arn
}

output "dynamodb_plans_table" {
  description = "DynamoDB Plans table name"
  value       = module.dynamodb.plans_table_name
}

output "dynamodb_plans_table_arn" {
  description = "DynamoDB Plans table ARN"
  value       = module.dynamodb.plans_table_arn
}

output "dynamodb_orders_table" {
  description = "DynamoDB Orders table name"
  value       = module.dynamodb.orders_table_name
}

output "dynamodb_orders_table_arn" {
  description = "DynamoDB Orders table ARN"
  value       = module.dynamodb.orders_table_arn
}

output "sqs_order_events_queue_url" {
  description = "SQS Order Events queue URL"
  value       = module.sqs.order_events_queue_url
}

output "sqs_order_events_queue_arn" {
  description = "SQS Order Events queue ARN"
  value       = module.sqs.order_events_queue_arn
}

output "sqs_order_events_dlq_arn" {
  description = "SQS Order Events DLQ ARN"
  value       = module.sqs.order_events_dlq_arn
}

output "aws_region" {
  description = "AWS region"
  value       = var.aws_region
}

# --- IAM ---

output "iam_developer_access_keys" {
  description = "IAM access keys for developer users"
  value       = module.iam.developer_access_keys
  sensitive   = true
}

# --- ECS / Deployment ---

output "cloudfront_domain" {
  description = "CloudFront distribution domain name"
  value       = module.cloudfront.distribution_domain_name
}

output "api_gateway_endpoint" {
  description = "API Gateway invoke URL"
  value       = module.api_gateway.api_endpoint
}

output "s3_frontend_bucket" {
  description = "S3 bucket name for frontend assets"
  value       = module.cloudfront.s3_bucket_name
}

output "ecr_repository_urls" {
  description = "Map of service name to ECR repository URL"
  value       = module.ecs.ecr_repository_urls
}

output "ecs_cluster_name" {
  description = "ECS cluster name"
  value       = module.ecs.cluster_name
}

output "cloudfront_distribution_id" {
  description = "CloudFront distribution ID"
  value       = module.cloudfront.distribution_id
}

output "github_actions_role_arn" {
  description = "IAM role ARN for GitHub Actions OIDC"
  value       = module.iam.github_actions_role_arn
}

# --- Bedrock Agent ---

output "bedrock_agent_id" {
  description = "Bedrock Agent ID"
  value       = module.bedrock.agent_id
}

output "bedrock_knowledge_base_id" {
  description = "Bedrock Knowledge Base ID"
  value       = module.bedrock.knowledge_base_id
}

output "opensearch_collection_endpoint" {
  description = "OpenSearch Serverless collection endpoint"
  value       = module.opensearch.collection_endpoint
}

output "kb_s3_bucket_name" {
  description = "S3 bucket for knowledge base documents"
  value       = module.bedrock.kb_s3_bucket_name
}

output "bedrock_data_source_id" {
  description = "Bedrock Knowledge Base data source ID"
  value       = module.bedrock.data_source_id
}
