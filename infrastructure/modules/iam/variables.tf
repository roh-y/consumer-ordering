variable "project_name" {
  description = "Project name used as prefix for IAM resources"
  type        = string
}

variable "environment" {
  description = "Deployment environment"
  type        = string
}

variable "developers" {
  description = "List of developer names to create IAM users for"
  type        = list(string)
  default     = []
}

variable "dynamodb_table_arns" {
  description = "List of DynamoDB table ARNs to grant access to"
  type        = list(string)
}

variable "cognito_user_pool_arn" {
  description = "Cognito User Pool ARN"
  type        = string
}

variable "sqs_queue_arns" {
  description = "List of SQS queue ARNs to grant access to"
  type        = list(string)
}

# --- GitHub Actions OIDC ---

variable "github_repository" {
  description = "GitHub repository (owner/repo) for OIDC trust"
  type        = string
  default     = "roh-y/consumer-ordering"
}

variable "aws_region" {
  description = "AWS region for scoping IAM policies"
  type        = string
}

variable "s3_frontend_bucket_arn" {
  description = "ARN of the S3 bucket for frontend assets"
  type        = string
  default     = ""
}

variable "cloudfront_distribution_id" {
  description = "CloudFront distribution ID for cache invalidation permissions"
  type        = string
  default     = ""
}
