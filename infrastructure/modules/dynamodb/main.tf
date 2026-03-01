locals {
  name_prefix = "${var.project_name}-${var.environment}"
}

# --- Users Table ---
# PK: userId (Cognito sub UUID)
# GSI: email-index (for looking up users by email address)
# PAY_PER_REQUEST billing keeps costs at $0 for low-volume demo usage
resource "aws_dynamodb_table" "users" {
  name         = "${var.project_name}-users"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "userId"

  attribute {
    name = "userId"
    type = "S"
  }

  attribute {
    name = "email"
    type = "S"
  }

  global_secondary_index {
    name            = "email-index"
    hash_key        = "email"
    projection_type = "ALL"
  }

  tags = { Name = "${local.name_prefix}-users" }
}

# --- Plans Table (for Phase 2) ---
resource "aws_dynamodb_table" "plans" {
  name         = "${var.project_name}-plans"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "planId"

  attribute {
    name = "planId"
    type = "S"
  }

  tags = { Name = "${local.name_prefix}-plans" }
}

# --- Orders Table (for Phase 2) ---
resource "aws_dynamodb_table" "orders" {
  name         = "${var.project_name}-orders"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "orderId"
  range_key    = "userId"

  attribute {
    name = "orderId"
    type = "S"
  }

  attribute {
    name = "userId"
    type = "S"
  }

  global_secondary_index {
    name            = "userId-index"
    hash_key        = "userId"
    projection_type = "ALL"
  }

  tags = { Name = "${local.name_prefix}-orders" }
}
