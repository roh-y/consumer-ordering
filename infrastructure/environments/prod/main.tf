module "root" {
  source = "../../"

  project_name = var.project_name
  environment  = var.environment
  aws_region   = var.aws_region
  vpc_cidr     = var.vpc_cidr
}

output "cognito_user_pool_id" {
  value = module.root.cognito_user_pool_id
}

output "cognito_client_id" {
  value = module.root.cognito_client_id
}

output "dynamodb_users_table" {
  value = module.root.dynamodb_users_table
}
