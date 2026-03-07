output "log_group_names" {
  description = "Map of service name to CloudWatch log group name"
  value       = { for k, v in aws_cloudwatch_log_group.ecs : k => v.name }
}

output "log_group_arns" {
  description = "Map of service name to CloudWatch log group ARN"
  value       = { for k, v in aws_cloudwatch_log_group.ecs : k => v.arn }
}

output "dashboard_name" {
  description = "CloudWatch dashboard name"
  value       = aws_cloudwatch_dashboard.ecs.dashboard_name
}
