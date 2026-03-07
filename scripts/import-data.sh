#!/usr/bin/env bash
set -euo pipefail

# Import DynamoDB items from a previous export
# Usage: ./scripts/import-data.sh <export-dir>
# Example: ./scripts/import-data.sh data-exports/20260307_120000

EXPORT_DIR="${1:-}"
REGION="${AWS_REGION:-us-east-1}"

if [ -z "${EXPORT_DIR}" ]; then
  echo "Usage: $0 <export-dir>"
  echo "Example: $0 data-exports/20260307_120000"
  echo ""
  echo "Available exports:"
  ls -d data-exports/*/ 2>/dev/null || echo "  (none found)"
  exit 1
fi

if [ ! -d "${EXPORT_DIR}" ]; then
  echo "ERROR: Directory not found: ${EXPORT_DIR}"
  exit 1
fi

echo "=== Data Import ==="
echo "Region: ${REGION}"
echo "Import from: ${EXPORT_DIR}"
echo ""

TABLES=(
  "consumer-ordering-users"
  "consumer-ordering-plans"
  "consumer-ordering-orders"
)

for TABLE in "${TABLES[@]}"; do
  FILE="${EXPORT_DIR}/${TABLE}.json"
  if [ ! -f "${FILE}" ]; then
    echo "Skipping ${TABLE} (no export file)"
    continue
  fi

  COUNT=$(jq '.Count' "${FILE}")
  echo "Importing ${COUNT} items into ${TABLE}..."

  # Extract items and batch write
  jq -c '.Items[]' "${FILE}" | while read -r ITEM; do
    aws dynamodb put-item \
      --table-name "${TABLE}" \
      --item "${ITEM}" \
      --region "${REGION}" 2>/dev/null || {
      echo "  WARNING: Failed to import an item into ${TABLE}"
    }
  done

  echo "  Done"
done

echo ""
echo "=== Import complete ==="
echo "Note: Cognito users cannot be automatically re-imported (passwords are not exported)."
echo "Users will need to re-register or be recreated via AWS CLI."
