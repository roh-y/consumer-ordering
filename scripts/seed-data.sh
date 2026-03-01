#!/usr/bin/env bash
# seed-data.sh — Seeds DynamoDB with sample wireless plans.
# Run this after Terraform has created the plans table.

set -euo pipefail

TABLE_NAME="${DYNAMODB_PLANS_TABLE:-consumer-ordering-plans}"
REGION="${AWS_REGION:-us-east-1}"

echo "Seeding plans table: $TABLE_NAME (region: $REGION)"

aws dynamodb put-item --table-name "$TABLE_NAME" --region "$REGION" --item '{
  "planId": {"S": "basic"},
  "name": {"S": "Basic"},
  "description": {"S": "Perfect for light users who mostly use Wi-Fi"},
  "pricePerMonth": {"N": "35"},
  "dataGB": {"N": "5"},
  "features": {"L": [
    {"S": "Unlimited talk & text"},
    {"S": "5G access"},
    {"S": "5 GB high-speed data"},
    {"S": "Mexico & Canada included"}
  ]}
}'

aws dynamodb put-item --table-name "$TABLE_NAME" --region "$REGION" --item '{
  "planId": {"S": "standard"},
  "name": {"S": "Standard"},
  "description": {"S": "Great for everyday use with plenty of data"},
  "pricePerMonth": {"N": "55"},
  "dataGB": {"N": "15"},
  "features": {"L": [
    {"S": "Unlimited talk & text"},
    {"S": "5G Ultra Wideband"},
    {"S": "15 GB high-speed data"},
    {"S": "Disney+ Basic included"},
    {"S": "Mexico & Canada included"}
  ]}
}'

aws dynamodb put-item --table-name "$TABLE_NAME" --region "$REGION" --item '{
  "planId": {"S": "premium"},
  "name": {"S": "Premium"},
  "description": {"S": "Our best plan for power users and streamers"},
  "pricePerMonth": {"N": "75"},
  "dataGB": {"N": "50"},
  "features": {"L": [
    {"S": "Unlimited talk & text"},
    {"S": "5G Ultra Wideband"},
    {"S": "50 GB premium data"},
    {"S": "Disney+, Hulu, ESPN+ included"},
    {"S": "25 GB mobile hotspot"},
    {"S": "International texting"}
  ]}
}'

aws dynamodb put-item --table-name "$TABLE_NAME" --region "$REGION" --item '{
  "planId": {"S": "unlimited"},
  "name": {"S": "Unlimited Plus"},
  "description": {"S": "Truly unlimited with no compromises"},
  "pricePerMonth": {"N": "90"},
  "dataGB": {"N": "-1"},
  "features": {"L": [
    {"S": "Unlimited talk & text"},
    {"S": "5G Ultra Wideband"},
    {"S": "Unlimited premium data"},
    {"S": "Disney+, Hulu, ESPN+, Apple Music"},
    {"S": "50 GB mobile hotspot"},
    {"S": "International calling & texting"},
    {"S": "Smartwatch & tablet plan included"}
  ]}
}'

echo "Done! Seeded 4 plans."
