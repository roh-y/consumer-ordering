variable "project_name" {
  description = "Project name used as prefix for all resources"
  type        = string
}

variable "environment" {
  description = "Deployment environment"
  type        = string
}

variable "sender_email" {
  description = "Email address to verify for SES sending"
  type        = string
}
