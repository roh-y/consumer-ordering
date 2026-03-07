locals {
  group_name = "${var.project_name}-${var.environment}-developers"
  # Include table ARNs and their GSI index ARNs
  dynamodb_resource_arns = flatten([
    var.dynamodb_table_arns,
    [for arn in var.dynamodb_table_arns : "${arn}/index/*"],
  ])
}

# --- IAM Group ---

resource "aws_iam_group" "developers" {
  name = local.group_name
}

# --- Combined Policy ---

data "aws_iam_policy_document" "developer_access" {
  # DynamoDB: read/write on project tables and their indexes
  statement {
    sid    = "DynamoDBAccess"
    effect = "Allow"
    actions = [
      "dynamodb:GetItem",
      "dynamodb:PutItem",
      "dynamodb:UpdateItem",
      "dynamodb:DeleteItem",
      "dynamodb:Query",
      "dynamodb:Scan",
      "dynamodb:BatchGetItem",
      "dynamodb:BatchWriteItem",
      "dynamodb:DescribeTable",
    ]
    resources = local.dynamodb_resource_arns
  }

  # Cognito: admin and user-facing auth actions
  statement {
    sid    = "CognitoAccess"
    effect = "Allow"
    actions = [
      "cognito-idp:AdminCreateUser",
      "cognito-idp:AdminDeleteUser",
      "cognito-idp:AdminGetUser",
      "cognito-idp:AdminUpdateUserAttributes",
      "cognito-idp:AdminInitiateAuth",
      "cognito-idp:AdminRespondToAuthChallenge",
      "cognito-idp:AdminSetUserPassword",
      "cognito-idp:ListUsers",
      "cognito-idp:SignUp",
      "cognito-idp:InitiateAuth",
      "cognito-idp:RespondToAuthChallenge",
      "cognito-idp:DescribeUserPool",
      "cognito-idp:DescribeUserPoolClient",
    ]
    resources = [var.cognito_user_pool_arn]
  }

  # SQS: send/receive/delete on project queues
  statement {
    sid    = "SQSAccess"
    effect = "Allow"
    actions = [
      "sqs:SendMessage",
      "sqs:ReceiveMessage",
      "sqs:DeleteMessage",
      "sqs:GetQueueAttributes",
      "sqs:GetQueueUrl",
    ]
    resources = var.sqs_queue_arns
  }
}

resource "aws_iam_group_policy" "developer_access" {
  name   = "${var.project_name}-${var.environment}-developer-access"
  group  = aws_iam_group.developers.name
  policy = data.aws_iam_policy_document.developer_access.json
}

# --- IAM Users ---

resource "aws_iam_user" "developers" {
  for_each = toset(var.developers)
  name     = "${var.project_name}-${var.environment}-${each.value}"

  tags = {
    Developer = each.value
  }
}

resource "aws_iam_user_group_membership" "developers" {
  for_each = toset(var.developers)
  user     = aws_iam_user.developers[each.value].name
  groups   = [aws_iam_group.developers.name]
}

resource "aws_iam_access_key" "developers" {
  for_each = toset(var.developers)
  user     = aws_iam_user.developers[each.value].name
}
