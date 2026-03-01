#!/usr/bin/env bash
# setup-aws.sh — Validates AWS credentials and displays Terraform resource IDs.
# Run this after `terraform apply` to get the values needed for env vars.

set -euo pipefail

echo "=== AWS Credentials Check ==="

# Verify AWS CLI is configured
if ! aws sts get-caller-identity &>/dev/null; then
  echo "ERROR: AWS credentials not configured. Run 'aws configure' first."
  exit 1
fi

IDENTITY=$(aws sts get-caller-identity)
echo "Account: $(echo "$IDENTITY" | grep -o '"Account": "[^"]*"' | cut -d'"' -f4)"
echo "User:    $(echo "$IDENTITY" | grep -o '"Arn": "[^"]*"' | cut -d'"' -f4)"
echo ""

echo "=== Terraform Outputs ==="
echo "Run these commands to get your resource IDs:"
echo ""
echo "  cd infrastructure/environments/dev"
echo "  terraform output"
echo ""

# If Terraform state exists, show outputs directly
TF_DIR="$(dirname "$0")/../infrastructure/environments/dev"
if [ -f "$TF_DIR/.terraform/terraform.tfstate" ] || [ -f "$TF_DIR/terraform.tfstate" ]; then
  echo "=== Current Terraform Outputs ==="
  cd "$TF_DIR"
  terraform output 2>/dev/null || echo "(Run 'terraform apply' first)"
else
  echo "Terraform has not been initialized yet."
  echo "Run: cd infrastructure/environments/dev && terraform init && terraform apply"
fi
