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

output "index_created" {
  description = "Signals that the vector index has been created"
  value       = null_resource.create_vector_index.id
}
