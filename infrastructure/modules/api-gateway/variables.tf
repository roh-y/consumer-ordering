variable "project_name" {
  description = "Project name used as prefix for all resources"
  type        = string
}

variable "environment" {
  description = "Deployment environment"
  type        = string
}

variable "aws_region" {
  description = "AWS region"
  type        = string
}

variable "cognito_user_pool_id" {
  description = "Cognito User Pool ID for JWT authorizer"
  type        = string
}

variable "cognito_client_id" {
  description = "Cognito App Client ID for JWT audience"
  type        = string
}

variable "alb_listener_arn" {
  description = "Internal ALB listener ARN"
  type        = string
}

variable "alb_dns_name" {
  description = "Internal ALB DNS name"
  type        = string
}

variable "alb_security_group_id" {
  description = "ALB security group ID"
  type        = string
}

variable "private_subnet_ids" {
  description = "Private subnet IDs for VPC Link"
  type        = list(string)
}

variable "vpc_id" {
  description = "VPC ID"
  type        = string
}

# --- Chat API Lambda (optional — for Bedrock Agent chat endpoint) ---

variable "enable_chat_api" {
  description = "Whether to create the chat API Lambda integration"
  type        = bool
  default     = false
}

variable "chat_api_lambda_invoke_arn" {
  description = "Invoke ARN of the chat API Lambda function"
  type        = string
  default     = ""
}

variable "chat_api_lambda_function_name" {
  description = "Function name of the chat API Lambda"
  type        = string
  default     = ""
}
