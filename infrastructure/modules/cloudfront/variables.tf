variable "project_name" {
  description = "Project name used as prefix for all resources"
  type        = string
}

variable "environment" {
  description = "Deployment environment"
  type        = string
}

variable "api_gateway_endpoint" {
  description = "API Gateway invoke URL (e.g., https://abc123.execute-api.us-east-1.amazonaws.com)"
  type        = string
}

variable "api_gateway_id" {
  description = "API Gateway ID"
  type        = string
}
