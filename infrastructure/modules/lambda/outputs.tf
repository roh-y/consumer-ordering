output "action_group_lambda_arn" {
  description = "ARN of the action group Lambda function"
  value       = aws_lambda_function.action_group.arn
}

output "action_group_lambda_function_name" {
  description = "Name of the action group Lambda function"
  value       = aws_lambda_function.action_group.function_name
}

output "kb_search_lambda_arn" {
  description = "ARN of the KB search Lambda function"
  value       = aws_lambda_function.kb_search.arn
}

output "kb_search_lambda_function_name" {
  description = "Name of the KB search Lambda function"
  value       = aws_lambda_function.kb_search.function_name
}

output "chat_api_lambda_arn" {
  description = "ARN of the chat API Lambda function"
  value       = aws_lambda_function.chat_api.arn
}

output "chat_api_lambda_function_name" {
  description = "Name of the chat API Lambda function"
  value       = aws_lambda_function.chat_api.function_name
}

output "chat_api_lambda_invoke_arn" {
  description = "Invoke ARN of the chat API Lambda (for API Gateway)"
  value       = aws_lambda_function.chat_api.invoke_arn
}
