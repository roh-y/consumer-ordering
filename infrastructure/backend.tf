# Uncomment to use S3 backend for remote state (recommended for team use).
# First create the S3 bucket and DynamoDB lock table, then uncomment.
#
# terraform {
#   backend "s3" {
#     bucket         = "consumer-ordering-terraform-state"
#     key            = "state/terraform.tfstate"
#     region         = "us-east-1"
#     dynamodb_table = "consumer-ordering-terraform-locks"
#     encrypt        = true
#   }
# }
