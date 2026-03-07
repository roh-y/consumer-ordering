output "order_events_queue_url" {
  value = aws_sqs_queue.order_events.url
}

output "order_events_queue_arn" {
  value = aws_sqs_queue.order_events.arn
}

output "order_events_dlq_url" {
  value = aws_sqs_queue.order_events_dlq.url
}

output "order_events_dlq_arn" {
  value = aws_sqs_queue.order_events_dlq.arn
}

output "order_events_queue_name" {
  value = aws_sqs_queue.order_events.name
}
