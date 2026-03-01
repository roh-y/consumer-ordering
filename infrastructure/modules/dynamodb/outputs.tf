output "users_table_name" {
  value = aws_dynamodb_table.users.name
}

output "users_table_arn" {
  value = aws_dynamodb_table.users.arn
}

output "plans_table_name" {
  value = aws_dynamodb_table.plans.name
}

output "orders_table_name" {
  value = aws_dynamodb_table.orders.name
}
