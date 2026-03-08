locals {
  prefix          = "${var.project_name}-${var.environment}"
  collection_name = "${var.project_name}-${var.environment}-kb"

  # Extract deployer identity for AOSS IAM permissions
  caller_arn_parts = split(":", data.aws_caller_identity.current.arn)
  caller_entity    = length(local.caller_arn_parts) >= 6 ? local.caller_arn_parts[5] : ""
  is_iam_user      = startswith(local.caller_entity, "user/")
  caller_user_name = local.is_iam_user ? split("/", local.caller_entity)[1] : ""
}

data "aws_caller_identity" "current" {}
data "aws_region" "current" {}


# --- OpenSearch Serverless Collection (VECTORSEARCH) ---

resource "aws_opensearchserverless_security_policy" "encryption" {
  name = "${local.prefix}-kb-enc"
  type = "encryption"
  policy = jsonencode({
    Rules = [
      {
        Resource     = ["collection/${local.collection_name}"]
        ResourceType = "collection"
      }
    ]
    AWSOwnedKey = true
  })
}

resource "aws_opensearchserverless_security_policy" "network" {
  name = "${local.prefix}-kb-net"
  type = "network"
  policy = jsonencode([
    {
      Rules = [
        {
          Resource     = ["collection/${local.collection_name}"]
          ResourceType = "collection"
        }
      ]
      AllowFromPublic = false
    }
  ])
}

resource "aws_opensearchserverless_collection" "kb" {
  name = local.collection_name
  type = "VECTORSEARCH"

  depends_on = [
    aws_opensearchserverless_security_policy.encryption,
    aws_opensearchserverless_security_policy.network,
  ]

  tags = { Name = "${local.prefix}-kb-collection" }
}

# --- Data Access Policy ---
# Grants the Bedrock Knowledge Base role access to the collection

resource "aws_opensearchserverless_access_policy" "kb" {
  name = "${local.prefix}-kb-access"
  type = "data"
  policy = jsonencode([
    {
      Rules = [
        {
          Resource     = ["collection/${local.collection_name}"]
          ResourceType = "collection"
          Permission = [
            "aoss:CreateCollectionItems",
            "aoss:DeleteCollectionItems",
            "aoss:UpdateCollectionItems",
            "aoss:DescribeCollectionItems",
          ]
        },
        {
          Resource     = ["index/${local.collection_name}/*"]
          ResourceType = "index"
          Permission = [
            "aoss:CreateIndex",
            "aoss:DeleteIndex",
            "aoss:UpdateIndex",
            "aoss:DescribeIndex",
            "aoss:ReadDocument",
            "aoss:WriteDocument",
          ]
        }
      ]
      Principal = [
        var.bedrock_kb_role_arn,
        data.aws_caller_identity.current.arn,
      ]
    }
  ])
}

# --- IAM Permission for Deployer ---
# The deployer needs aoss:APIAccessAll at the IAM level to make HTTP API calls
# to the OpenSearch Serverless collection endpoint (separate from data access policy).

resource "aws_iam_user_policy" "deployer_aoss" {
  count = local.is_iam_user ? 1 : 0
  name  = "${local.prefix}-deployer-aoss"
  user  = local.caller_user_name

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = "aoss:APIAccessAll"
      Resource = aws_opensearchserverless_collection.kb.arn
    }]
  })
}

# --- Create Vector Index ---
# The index must exist before Bedrock Knowledge Base can be created.

resource "null_resource" "create_vector_index" {
  depends_on = [
    aws_opensearchserverless_collection.kb,
    aws_opensearchserverless_access_policy.kb,
    aws_iam_user_policy.deployer_aoss,
  ]

  provisioner "local-exec" {
    command = "pip3 install -q opensearch-py requests-aws4auth && python3 ${path.module}/../../../scripts/create-opensearch-index.py ${aws_opensearchserverless_collection.kb.collection_endpoint}"
    environment = {
      AWS_DEFAULT_REGION = data.aws_region.current.name
    }
  }

  triggers = {
    collection_endpoint = aws_opensearchserverless_collection.kb.collection_endpoint
  }
}
