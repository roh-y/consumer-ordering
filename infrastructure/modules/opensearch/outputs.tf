output "collection_arn" {
  description = "OpenSearch Serverless collection ARN"
  value       = aws_opensearchserverless_collection.kb.arn
}

output "collection_endpoint" {
  description = "OpenSearch Serverless collection endpoint"
  value       = aws_opensearchserverless_collection.kb.collection_endpoint
}

output "collection_name" {
  description = "OpenSearch Serverless collection name"
  value       = aws_opensearchserverless_collection.kb.name
}
