# Remote state in S3 with DynamoDB locking.
# Prerequisites: run `cd bootstrap && terraform init && terraform apply` first.
# Then: `terraform init -migrate-state` to move local state to S3.

terraform {
  backend "s3" {
    bucket         = "consumer-ordering-terraform-state"
    key            = "state/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "consumer-ordering-terraform-locks"
    encrypt        = true
  }
}
