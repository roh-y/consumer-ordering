#!/usr/bin/env bash
# Upload knowledge base documents to S3 and trigger Bedrock ingestion.
# Usage: ./scripts/upload-kb-docs.sh
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
TF_DIR="$PROJECT_ROOT/infrastructure/environments/dev"
KB_DOCS_DIR="$PROJECT_ROOT/services/recommendation-service/knowledge-base"

echo "==> Reading Terraform outputs..."
S3_BUCKET=$(cd "$TF_DIR" && terraform output -raw kb_s3_bucket_name)
KB_ID=$(cd "$TF_DIR" && terraform output -raw bedrock_knowledge_base_id)
DS_ID=$(cd "$TF_DIR" && terraform output -raw bedrock_data_source_id)

echo "    S3 Bucket:    $S3_BUCKET"
echo "    KB ID:        $KB_ID"
echo "    Data Source:  $DS_ID"

echo "==> Syncing KB docs to s3://$S3_BUCKET/ ..."
aws s3 sync "$KB_DOCS_DIR" "s3://$S3_BUCKET/" --delete

echo "==> Starting Bedrock ingestion job..."
INGESTION_JOB=$(aws bedrock-agent start-ingestion-job \
  --knowledge-base-id "$KB_ID" \
  --data-source-id "$DS_ID" \
  --query 'ingestionJob.ingestionJobId' \
  --output text)

echo "    Ingestion Job ID: $INGESTION_JOB"
echo "==> Done! Ingestion typically takes 2-5 minutes."
echo "    Check status: aws bedrock-agent get-ingestion-job --knowledge-base-id $KB_ID --data-source-id $DS_ID --ingestion-job-id $INGESTION_JOB"
