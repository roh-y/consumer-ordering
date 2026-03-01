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

output "dynamodb_users_table" {
  description = "DynamoDB Users table name"
  value       = module.dynamodb.users_table_name
}
