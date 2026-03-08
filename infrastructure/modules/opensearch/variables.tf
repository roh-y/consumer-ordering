variable "project_name" {
  description = "Project name used as prefix"
  type        = string
}

variable "environment" {
  description = "Deployment environment"
  type        = string
}

variable "bedrock_kb_role_arn" {
  description = "IAM role ARN for Bedrock Knowledge Base (granted data access)"
  type        = string
}
