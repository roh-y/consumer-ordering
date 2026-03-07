# --- GitHub Actions OIDC Provider ---

data "aws_caller_identity" "current" {}

resource "aws_iam_openid_connect_provider" "github_actions" {
  url = "https://token.actions.githubusercontent.com"

  client_id_list = ["sts.amazonaws.com"]

  thumbprint_list = ["6938fd4d98bab03faadb97b34396831e3780aea1"]

  tags = {
    Name = "${var.project_name}-${var.environment}-github-oidc"
  }
}

# --- GitHub Actions Deploy Role ---

data "aws_iam_policy_document" "github_actions_trust" {
  statement {
    sid     = "GitHubActionsOIDC"
    effect  = "Allow"
    actions = ["sts:AssumeRoleWithWebIdentity"]

    principals {
      type        = "Federated"
      identifiers = [aws_iam_openid_connect_provider.github_actions.arn]
    }

    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:aud"
      values   = ["sts.amazonaws.com"]
    }

    condition {
      test     = "StringLike"
      variable = "token.actions.githubusercontent.com:sub"
      values   = ["repo:${var.github_repository}:*"]
    }
  }
}

data "aws_iam_policy_document" "github_actions_deploy" {
  # ECR: auth token (global)
  statement {
    sid       = "ECRAuth"
    effect    = "Allow"
    actions   = ["ecr:GetAuthorizationToken"]
    resources = ["*"]
  }

  # ECR: push images to project repos
  statement {
    sid    = "ECRPush"
    effect = "Allow"
    actions = [
      "ecr:BatchCheckLayerAvailability",
      "ecr:GetDownloadUrlForLayer",
      "ecr:BatchGetImage",
      "ecr:PutImage",
      "ecr:InitiateLayerUpload",
      "ecr:UploadLayerPart",
      "ecr:CompleteLayerUpload",
    ]
    resources = [
      "arn:aws:ecr:${var.aws_region}:${data.aws_caller_identity.current.account_id}:repository/${var.project_name}-${var.environment}-*"
    ]
  }

  # ECS: deploy services
  statement {
    sid    = "ECSDeploy"
    effect = "Allow"
    actions = [
      "ecs:UpdateService",
      "ecs:DescribeServices",
      "ecs:DescribeTasks",
      "ecs:ListTasks",
    ]
    resources = ["*"]

    condition {
      test     = "ArnLike"
      variable = "ecs:cluster"
      values = [
        "arn:aws:ecs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:cluster/${var.project_name}-${var.environment}-cluster"
      ]
    }
  }

  # ECS: wait for services-stable requires DescribeClusters
  statement {
    sid    = "ECSDescribeCluster"
    effect = "Allow"
    actions = [
      "ecs:DescribeClusters",
    ]
    resources = [
      "arn:aws:ecs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:cluster/${var.project_name}-${var.environment}-cluster"
    ]
  }

  # S3: frontend bucket access
  dynamic "statement" {
    for_each = var.s3_frontend_bucket_arn != "" ? [1] : []
    content {
      sid    = "S3Frontend"
      effect = "Allow"
      actions = [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject",
        "s3:ListBucket",
      ]
      resources = [
        var.s3_frontend_bucket_arn,
        "${var.s3_frontend_bucket_arn}/*",
      ]
    }
  }

  # CloudFront: cache invalidation
  dynamic "statement" {
    for_each = var.cloudfront_distribution_id != "" ? [1] : []
    content {
      sid    = "CloudFrontInvalidation"
      effect = "Allow"
      actions = [
        "cloudfront:CreateInvalidation",
      ]
      resources = [
        "arn:aws:cloudfront::${data.aws_caller_identity.current.account_id}:distribution/${var.cloudfront_distribution_id}"
      ]
    }
  }
}

resource "aws_iam_role" "github_actions" {
  name               = "${var.project_name}-${var.environment}-github-actions"
  assume_role_policy = data.aws_iam_policy_document.github_actions_trust.json

  tags = {
    Name = "${var.project_name}-${var.environment}-github-actions"
  }
}

resource "aws_iam_role_policy" "github_actions_deploy" {
  count  = var.github_actions_admin_access ? 0 : 1
  name   = "${var.project_name}-${var.environment}-github-actions-deploy"
  role   = aws_iam_role.github_actions.id
  policy = data.aws_iam_policy_document.github_actions_deploy.json
}

# --- Admin access for full Terraform deploy/destroy from CI ---

resource "aws_iam_role_policy_attachment" "github_actions_admin" {
  count      = var.github_actions_admin_access ? 1 : 0
  role       = aws_iam_role.github_actions.name
  policy_arn = "arn:aws:iam::aws:policy/AdministratorAccess"
}

resource "aws_iam_role_policy" "github_actions_terraform_state" {
  count = var.github_actions_admin_access ? 1 : 0
  name  = "${var.project_name}-${var.environment}-github-actions-tf-state"
  role  = aws_iam_role.github_actions.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "TerraformStateBucket"
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject",
          "s3:ListBucket",
        ]
        Resource = [
          "arn:aws:s3:::consumer-ordering-terraform-state",
          "arn:aws:s3:::consumer-ordering-terraform-state/*",
        ]
      },
      {
        Sid    = "TerraformLockTable"
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:DeleteItem",
        ]
        Resource = "arn:aws:dynamodb:${var.aws_region}:${data.aws_caller_identity.current.account_id}:table/consumer-ordering-terraform-locks"
      },
    ]
  })
}
