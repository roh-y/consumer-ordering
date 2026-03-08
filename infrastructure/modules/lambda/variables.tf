variable "project_name" {
  description = "Project name used as prefix"
  type        = string
}

variable "environment" {
  description = "Deployment environment"
  type        = string
}

# DynamoDB table names (for action group Lambda)
variable "orders_table_name" {
  description = "DynamoDB orders table name"
  type        = string
}

variable "users_table_name" {
  description = "DynamoDB users table name"
  type        = string
}

variable "plans_table_name" {
  description = "DynamoDB plans table name"
  type        = string
}

# DynamoDB table ARNs (for IAM policy)
variable "orders_table_arn" {
  description = "DynamoDB orders table ARN"
  type        = string
}

variable "users_table_arn" {
  description = "DynamoDB users table ARN"
  type        = string
}

variable "plans_table_arn" {
  description = "DynamoDB plans table ARN"
  type        = string
}

# SQS (for action group Lambda to publish plan change events)
variable "sqs_order_events_queue_arn" {
  description = "ARN of the SQS order events queue"
  type        = string
}

variable "sqs_order_events_queue_url" {
  description = "URL of the SQS order events queue"
  type        = string
}

# Bedrock Agent (for chat API Lambda)
variable "bedrock_agent_id" {
  description = "Bedrock Agent ID"
  type        = string
}

variable "bedrock_agent_alias_id" {
  description = "Bedrock Agent Alias ID"
  type        = string
}

variable "allowed_origin" {
  description = "Allowed CORS origin for chat API Lambda"
  type        = string
  default     = "*"
}
