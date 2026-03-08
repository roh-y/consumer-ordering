locals {
  prefix = "${var.project_name}-${var.environment}"
}

# --- S3 Bucket for Knowledge Base Documents ---

resource "aws_s3_bucket" "kb_docs" {
  bucket        = "${local.prefix}-kb-docs-${data.aws_caller_identity.current.account_id}"
  force_destroy = true

  tags = { Name = "${local.prefix}-kb-docs" }
}

resource "aws_s3_bucket_versioning" "kb_docs" {
  bucket = aws_s3_bucket.kb_docs.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "kb_docs" {
  bucket = aws_s3_bucket.kb_docs.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "kb_docs" {
  bucket                  = aws_s3_bucket.kb_docs.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

data "aws_caller_identity" "current" {}
data "aws_region" "current" {}
