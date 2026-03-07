variable "project_name" {
  description = "Project name used as prefix for all resources"
  type        = string
}

variable "environment" {
  description = "Deployment environment"
  type        = string
}

variable "services" {
  description = "Map of service name to port"
  type        = map(number)
}

variable "ecs_cluster_name" {
  description = "Name of the ECS cluster (for alarm dimensions)"
  type        = string
}

variable "log_retention_days" {
  description = "CloudWatch log retention in days"
  type        = number
  default     = 14
}

variable "alarm_sns_topic_arn" {
  description = "Optional SNS topic ARN for alarm notifications"
  type        = string
  default     = ""
}
