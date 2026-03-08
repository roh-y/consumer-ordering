locals {
  prefix          = "${var.project_name}-${var.environment}"
  collection_name = "${var.project_name}-${var.environment}-kb"
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
      AllowFromPublic = true
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
        "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root",
      ]
    }
  ])
}

# --- Create Vector Index ---
# The index must exist before Bedrock Knowledge Base can be created.

resource "null_resource" "create_vector_index" {
  depends_on = [
    aws_opensearchserverless_collection.kb,
    aws_opensearchserverless_access_policy.kb,
  ]

  provisioner "local-exec" {
    command = "python3 ${path.module}/../../../scripts/create-opensearch-index.py ${aws_opensearchserverless_collection.kb.collection_endpoint}"
    environment = {
      AWS_DEFAULT_REGION = data.aws_region.current.name
    }
  }

  triggers = {
    collection_endpoint = aws_opensearchserverless_collection.kb.collection_endpoint
  }
}
