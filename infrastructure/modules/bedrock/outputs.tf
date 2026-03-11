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
