# --- Internal Application Load Balancer ---

resource "aws_lb" "internal" {
  name               = "${local.prefix}-alb"
  internal           = true
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = var.private_subnet_ids
}

# --- Target Groups (one per service) ---

resource "aws_lb_target_group" "service" {
  for_each = var.services

  # Truncate to fit 32-char AWS limit
  name        = substr("${var.project_name}-${var.environment}-${each.key}", 0, 32)
  port        = each.value.port
  protocol    = "HTTP"
  vpc_id      = var.vpc_id
  target_type = "ip"

  health_check {
    enabled             = true
    path                = each.value.health_path
    port                = "traffic-port"
    protocol            = "HTTP"
    healthy_threshold   = 2
    unhealthy_threshold = 3
    timeout             = 10
    interval            = 30
    matcher             = "200"
  }

  deregistration_delay = 30
}

# --- Listener ---

resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.internal.arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type = "fixed-response"
    fixed_response {
      content_type = "application/json"
      message_body = "{\"error\":\"not found\"}"
      status_code  = "404"
    }
  }
}

# --- Path-Based Routing Rules ---

resource "aws_lb_listener_rule" "service" {
  for_each = var.services

  listener_arn = aws_lb_listener.http.arn

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.service[each.key].arn
  }

  condition {
    path_pattern {
      values = [
        each.key == "user-service" ? "/api/users*" :
        each.key == "plan-catalog-service" ? "/api/plans*" :
        each.key == "order-service" ? "/api/orders*" :
        "/api/${each.key}*"
      ]
    }
  }
}
