locals {
  name_prefix = "${var.project_name}-${var.environment}"
}

# --- Dead-Letter Queue ---
# Messages that fail processing after max retries land here for inspection
resource "aws_sqs_queue" "order_events_dlq" {
  name                      = "${local.name_prefix}-order-events-dlq"
  message_retention_seconds = 1209600 # 14 days

  tags = { Name = "${local.name_prefix}-order-events-dlq" }
}

# --- Order Events Queue ---
# Order-service publishes order-created events here; consumer processes them in Phase 3
resource "aws_sqs_queue" "order_events" {
  name                       = "${local.name_prefix}-order-events"
  visibility_timeout_seconds = 60
  message_retention_seconds  = 345600 # 4 days

  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.order_events_dlq.arn
    maxReceiveCount     = 3
  })

  tags = { Name = "${local.name_prefix}-order-events" }
}
