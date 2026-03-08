locals {
  prefix = "${var.project_name}-${var.environment}"
}

resource "aws_ecs_cluster" "main" {
  name = "${local.prefix}-cluster"

  setting {
    name  = "containerInsights"
    value = "enhanced"
  }
}
