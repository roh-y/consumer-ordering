locals {
  prefix = "${var.project_name}-${var.environment}"
}

# --- CloudWatch Log Groups (one per service) ---

resource "aws_cloudwatch_log_group" "ecs" {
  for_each = var.services

  name              = "/ecs/${local.prefix}-${each.key}"
  retention_in_days = var.log_retention_days
}

# --- CPU Alarms ---

resource "aws_cloudwatch_metric_alarm" "cpu_high" {
  for_each = var.services

  alarm_name          = "${local.prefix}-${each.key}-cpu-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/ECS"
  period              = 300
  statistic           = "Average"
  threshold           = 80
  alarm_description   = "CPU > 80% for ${each.key}"
  treat_missing_data  = "notBreaching"

  dimensions = {
    ClusterName = var.ecs_cluster_name
    ServiceName = "${local.prefix}-${each.key}"
  }

  alarm_actions = var.alarm_sns_topic_arn != "" ? [var.alarm_sns_topic_arn] : []
  ok_actions    = var.alarm_sns_topic_arn != "" ? [var.alarm_sns_topic_arn] : []
}

# --- Memory Alarms ---

resource "aws_cloudwatch_metric_alarm" "memory_high" {
  for_each = var.services

  alarm_name          = "${local.prefix}-${each.key}-memory-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "MemoryUtilization"
  namespace           = "AWS/ECS"
  period              = 300
  statistic           = "Average"
  threshold           = 85
  alarm_description   = "Memory > 85% for ${each.key}"
  treat_missing_data  = "notBreaching"

  dimensions = {
    ClusterName = var.ecs_cluster_name
    ServiceName = "${local.prefix}-${each.key}"
  }

  alarm_actions = var.alarm_sns_topic_arn != "" ? [var.alarm_sns_topic_arn] : []
  ok_actions    = var.alarm_sns_topic_arn != "" ? [var.alarm_sns_topic_arn] : []
}

# --- Dashboard ---

resource "aws_cloudwatch_dashboard" "ecs" {
  dashboard_name = "${local.prefix}-ecs"

  dashboard_body = jsonencode({
    widgets = flatten([
      for name, port in var.services : [
        {
          type   = "metric"
          x      = 0
          y      = index(keys(var.services), name) * 6
          width  = 12
          height = 6
          properties = {
            title   = "${name} CPU"
            metrics = [["AWS/ECS", "CPUUtilization", "ClusterName", var.ecs_cluster_name, "ServiceName", "${local.prefix}-${name}"]]
            period  = 300
            stat    = "Average"
            region  = data.aws_region.current.name
            view    = "timeSeries"
          }
        },
        {
          type   = "metric"
          x      = 12
          y      = index(keys(var.services), name) * 6
          width  = 12
          height = 6
          properties = {
            title   = "${name} Memory"
            metrics = [["AWS/ECS", "MemoryUtilization", "ClusterName", var.ecs_cluster_name, "ServiceName", "${local.prefix}-${name}"]]
            period  = 300
            stat    = "Average"
            region  = data.aws_region.current.name
            view    = "timeSeries"
          }
        }
      ]
    ])
  })
}

# --- SQS Queue Depth Widget (appended to dashboard if queue name provided) ---

resource "aws_cloudwatch_dashboard" "sqs" {
  count          = var.sqs_queue_name != "" ? 1 : 0
  dashboard_name = "${local.prefix}-sqs"

  dashboard_body = jsonencode({
    widgets = [
      {
        type   = "metric"
        x      = 0
        y      = 0
        width  = 12
        height = 6
        properties = {
          title   = "SQS Queue Depth"
          metrics = [["AWS/SQS", "ApproximateNumberOfMessagesVisible", "QueueName", var.sqs_queue_name]]
          period  = 300
          stat    = "Average"
          region  = data.aws_region.current.name
          view    = "timeSeries"
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 0
        width  = 12
        height = 6
        properties = {
          title = "SQS Messages Sent/Received"
          metrics = [
            ["AWS/SQS", "NumberOfMessagesSent", "QueueName", var.sqs_queue_name],
            ["AWS/SQS", "NumberOfMessagesReceived", "QueueName", var.sqs_queue_name]
          ]
          period = 300
          stat   = "Sum"
          region = data.aws_region.current.name
          view   = "timeSeries"
        }
      }
    ]
  })
}

data "aws_region" "current" {}
