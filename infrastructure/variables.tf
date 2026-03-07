variable "project_name" {
  description = "Project name used as prefix for all resources"
  type        = string
  default     = "consumer-ordering"
}

variable "environment" {
  description = "Deployment environment (dev, staging, prod)"
  type        = string
  default     = "dev"
}

variable "aws_region" {
  description = "AWS region for all resources"
  type        = string
  default     = "us-east-1"
}

variable "vpc_cidr" {
  description = "CIDR block for the VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "developers" {
  description = "List of developer names to provision IAM users for"
  type        = list(string)
  default     = []
}

# --- ECS Sizing ---

variable "ecs_service_cpu" {
  description = "CPU units for each ECS service (256, 512, 1024, etc.)"
  type        = number
  default     = 512
}

variable "ecs_service_memory" {
  description = "Memory (MB) for each ECS service"
  type        = number
  default     = 1024
}

variable "ecs_desired_count" {
  description = "Desired number of tasks per ECS service"
  type        = number
  default     = 1
}

# --- SES ---

variable "ses_sender_email" {
  description = "Email address to use as SES sender (must be verified)"
  type        = string
  default     = "noreply@example.com"
}

# --- GitHub Actions ---

variable "github_repository" {
  description = "GitHub repository (owner/repo) for OIDC trust"
  type        = string
  default     = "roh-y/consumer-ordering"
}

variable "github_actions_admin_access" {
  description = "Grant GitHub Actions role AdministratorAccess for full Terraform deploy/destroy from CI"
  type        = bool
  default     = true
}
