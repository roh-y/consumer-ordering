#!/usr/bin/env bash
set -euo pipefail

# Export DynamoDB tables and Cognito user list for data preservation across terraform destroy
# Usage: ./scripts/export-data.sh

REGION="${AWS_REGION:-us-east-1}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
EXPORT_DIR="data-exports/${TIMESTAMP}"

echo "=== Data Export ==="
echo "Region: ${REGION}"
echo "Export directory: ${EXPORT_DIR}"
echo ""

mkdir -p "${EXPORT_DIR}"

# Export DynamoDB tables
TABLES=(
  "consumer-ordering-users"
  "consumer-ordering-plans"
  "consumer-ordering-orders"
)

for TABLE in "${TABLES[@]}"; do
  echo "Exporting ${TABLE}..."
  aws dynamodb scan \
    --table-name "${TABLE}" \
    --region "${REGION}" \
    --output json > "${EXPORT_DIR}/${TABLE}.json" 2>/dev/null || {
    echo "  WARNING: Could not export ${TABLE} (table may not exist)"
    continue
  }
  COUNT=$(jq '.Count' "${EXPORT_DIR}/${TABLE}.json")
  echo "  Exported ${COUNT} items"
done

# Export Cognito user list
echo "Exporting Cognito users..."
USER_POOL_ID=$(cd infrastructure/environments/dev && terraform output -raw cognito_user_pool_id 2>/dev/null || echo "")
if [ -n "${USER_POOL_ID}" ]; then
  aws cognito-idp list-users \
    --user-pool-id "${USER_POOL_ID}" \
    --region "${REGION}" \
    --output json > "${EXPORT_DIR}/cognito-users.json"
  COUNT=$(jq '.Users | length' "${EXPORT_DIR}/cognito-users.json")
  echo "  Exported ${COUNT} Cognito users"
else
  echo "  WARNING: Could not determine Cognito User Pool ID"
fi

echo ""
echo "=== Export complete ==="
echo "Files saved to: ${EXPORT_DIR}/"
ls -la "${EXPORT_DIR}/"
