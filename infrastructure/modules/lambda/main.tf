locals {
  prefix = "${var.project_name}-${var.environment}"
}

data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

# ===========================================================
# Action Group Lambda — queries DynamoDB for Bedrock Agent
# ===========================================================

data "archive_file" "action_group" {
  type        = "zip"
  source_file = "${path.module}/../../../services/recommendation-service/lambda/action_group/handler.py"
  output_path = "${path.module}/files/action_group.zip"
}

resource "aws_iam_role" "action_group" {
  name = "${local.prefix}-agent-actions-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect    = "Allow"
        Principal = { Service = "lambda.amazonaws.com" }
        Action    = "sts:AssumeRole"
      }
    ]
  })

  tags = { Name = "${local.prefix}-agent-actions-role" }
}

resource "aws_iam_role_policy" "action_group" {
  name = "${local.prefix}-agent-actions-policy"
  role = aws_iam_role.action_group.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "DynamoDBRead"
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:Query",
          "dynamodb:Scan",
        ]
        Resource = [
          var.orders_table_arn,
          "${var.orders_table_arn}/index/*",
          var.users_table_arn,
          "${var.users_table_arn}/index/*",
          var.plans_table_arn,
        ]
      },
      {
        Sid    = "CloudWatchLogs"
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
        ]
        Resource = "arn:aws:logs:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:*"
      }
    ]
  })
}

resource "aws_lambda_function" "action_group" {
  function_name    = "${local.prefix}-agent-actions"
  role             = aws_iam_role.action_group.arn
  handler          = "handler.handler"
  runtime          = "python3.12"
  timeout          = 30
  memory_size      = 256
  filename         = data.archive_file.action_group.output_path
  source_code_hash = data.archive_file.action_group.output_base64sha256

  environment {
    variables = {
      ORDERS_TABLE_NAME = var.orders_table_name
      USERS_TABLE_NAME  = var.users_table_name
      PLANS_TABLE_NAME  = var.plans_table_name
    }
  }

  tags = { Name = "${local.prefix}-agent-actions" }
}

# Allow Bedrock to invoke the action group Lambda
resource "aws_lambda_permission" "bedrock_invoke" {
  statement_id   = "AllowBedrockInvoke"
  action         = "lambda:InvokeFunction"
  function_name  = aws_lambda_function.action_group.function_name
  principal      = "bedrock.amazonaws.com"
  source_account = data.aws_caller_identity.current.account_id
}

# ===========================================================
# Chat API Lambda — POST /api/agent/chat → Bedrock Agent
# ===========================================================

data "archive_file" "chat_api" {
  type        = "zip"
  source_file = "${path.module}/../../../services/recommendation-service/lambda/chat_api/handler.py"
  output_path = "${path.module}/files/chat_api.zip"
}

resource "aws_iam_role" "chat_api" {
  name = "${local.prefix}-chat-api-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect    = "Allow"
        Principal = { Service = "lambda.amazonaws.com" }
        Action    = "sts:AssumeRole"
      }
    ]
  })

  tags = { Name = "${local.prefix}-chat-api-role" }
}

resource "aws_iam_role_policy" "chat_api" {
  name = "${local.prefix}-chat-api-policy"
  role = aws_iam_role.chat_api.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid      = "InvokeAgent"
        Effect   = "Allow"
        Action   = "bedrock:InvokeAgent"
        Resource = "arn:aws:bedrock:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:agent-alias/${var.bedrock_agent_id}/${var.bedrock_agent_alias_id}"
      },
      {
        Sid    = "CloudWatchLogs"
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
        ]
        Resource = "arn:aws:logs:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:*"
      }
    ]
  })
}

resource "aws_lambda_function" "chat_api" {
  function_name    = "${local.prefix}-chat-api"
  role             = aws_iam_role.chat_api.arn
  handler          = "handler.handler"
  runtime          = "python3.12"
  timeout          = 60
  memory_size      = 256
  filename         = data.archive_file.chat_api.output_path
  source_code_hash = data.archive_file.chat_api.output_base64sha256

  environment {
    variables = {
      BEDROCK_AGENT_ID       = var.bedrock_agent_id
      BEDROCK_AGENT_ALIAS_ID = var.bedrock_agent_alias_id
    }
  }

  tags = { Name = "${local.prefix}-chat-api" }
}
