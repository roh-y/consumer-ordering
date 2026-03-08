output "agent_id" {
  description = "Bedrock Agent ID"
  value       = aws_bedrockagent_agent.support.agent_id
}

output "agent_alias_id" {
  description = "Bedrock Agent Alias ID"
  value       = aws_bedrockagent_agent_alias.live.agent_alias_id
}

output "agent_arn" {
  description = "Bedrock Agent ARN"
  value       = aws_bedrockagent_agent.support.agent_arn
}

output "knowledge_base_id" {
  description = "Bedrock Knowledge Base ID"
  value       = aws_bedrockagent_knowledge_base.plans.id
}

output "kb_role_arn" {
  description = "IAM role ARN for the Knowledge Base"
  value       = aws_iam_role.kb.arn
}

output "kb_s3_bucket_name" {
  description = "S3 bucket name for KB documents"
  value       = aws_s3_bucket.kb_docs.id
}

output "kb_s3_bucket_arn" {
  description = "S3 bucket ARN for KB documents"
  value       = aws_s3_bucket.kb_docs.arn
}

output "data_source_id" {
  description = "Bedrock Knowledge Base data source ID"
  value       = aws_bedrockagent_data_source.s3.data_source_id
}
