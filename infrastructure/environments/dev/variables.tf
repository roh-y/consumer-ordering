variable "project_name" {
  type    = string
  default = "consumer-ordering"
}

variable "environment" {
  type    = string
  default = "dev"
}

variable "aws_region" {
  type    = string
  default = "us-east-1"
}

variable "vpc_cidr" {
  type    = string
  default = "10.0.0.0/16"
}

variable "developers" {
  description = "List of developer names to provision IAM users for"
  type        = list(string)
  default     = []
}

variable "ecs_service_cpu" {
  type    = number
  default = 512
}

variable "ecs_service_memory" {
  type    = number
  default = 1024
}

variable "ecs_desired_count" {
  type    = number
  default = 1
}

variable "github_repository" {
  type    = string
  default = "roh-y/consumer-ordering"
}
