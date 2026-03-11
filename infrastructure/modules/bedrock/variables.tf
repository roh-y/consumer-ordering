variable "project_name" {
  description = "Project name used as prefix"
  type        = string
}

variable "environment" {
  description = "Deployment environment"
  type        = string
}

variable "action_group_lambda_arn" {
  description = "ARN of the action group Lambda function"
  type        = string
}

variable "kb_search_lambda_arn" {
  description = "ARN of the KB search Lambda function (FAISS-based)"
  type        = string
}
