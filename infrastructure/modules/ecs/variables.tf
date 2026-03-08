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

variable "vpc_id" {
  description = "VPC ID"
  type        = string
}

variable "private_subnet_ids" {
  description = "List of private subnet IDs for ALB and ECS tasks"
  type        = list(string)
}

variable "services" {
  description = "Map of service configurations"
  type = map(object({
    port          = number
    health_path   = string
    cpu           = number
    memory        = number
    desired_count = number
    environment   = map(string)
  }))
}

variable "dynamodb_table_arns" {
  description = "List of DynamoDB table ARNs for task role permissions"
  type        = list(string)
}

variable "sqs_queue_arns" {
  description = "List of SQS queue ARNs for task role permissions"
  type        = list(string)
}

variable "cognito_user_pool_arn" {
  description = "Cognito User Pool ARN for task role permissions"
  type        = string
}

variable "ses_identity_arn" {
  description = "ARN of the SES email identity for sending emails"
  type        = string
}

variable "log_group_names" {
  description = "Map of service name to CloudWatch log group name"
  type        = map(string)
}
