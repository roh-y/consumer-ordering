# ===========================================================
# Bedrock Agent with FAISS-based Knowledge Base Search
# ===========================================================

locals {
  prefix = "${var.project_name}-${var.environment}"
}

data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

# --- IAM Role for Agent ---

resource "aws_iam_role" "agent" {
  name = "${local.prefix}-bedrock-agent-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect    = "Allow"
        Principal = { Service = "bedrock.amazonaws.com" }
        Action    = "sts:AssumeRole"
        Condition = {
          StringEquals = {
            "aws:SourceAccount" = data.aws_caller_identity.current.account_id
          }
        }
      }
    ]
  })

  tags = { Name = "${local.prefix}-bedrock-agent-role" }
}

resource "aws_iam_role_policy" "agent" {
  name = "${local.prefix}-bedrock-agent-policy"
  role = aws_iam_role.agent.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid      = "InvokeModel"
        Effect   = "Allow"
        Action   = "bedrock:InvokeModel"
        Resource = "arn:aws:bedrock:${data.aws_region.current.name}::foundation-model/amazon.nova-lite-v1:0"
      }
    ]
  })
}

# --- Bedrock Agent ---

resource "aws_bedrockagent_agent" "support" {
  agent_name                  = "${local.prefix}-support-agent"
  agent_resource_role_arn     = aws_iam_role.agent.arn
  foundation_model            = "amazon.nova-lite-v1:0"
  idle_session_ttl_in_seconds = 600

  instruction = <<-EOT
    You are a friendly and helpful customer support agent for a wireless phone plan company.
    Your primary responsibilities are:

    1. **Answer questions about wireless plans**: Use the searchKnowledgeBase action to look up
       accurate information about plan features, pricing, data limits, and comparisons. Always
       search the knowledge base first before answering plan-related questions. Reference specific
       plan names and prices from the search results.

    2. **Check order status**: When a customer asks about their orders, use the getOrdersByUser
       action with their userId (available in session attributes) to retrieve their orders.
       For a specific order, use getOrderStatus with the orderId.

    3. **Recommend plans**: Based on the customer's described needs (data usage, budget,
       features wanted), use searchKnowledgeBase to look up plan details, then recommend
       the most appropriate plan. Explain why it's a good fit and mention alternatives.

    4. **Handle general support**: For billing questions, cancellation policies, and
       account-related queries, ALWAYS use searchKnowledgeBase to look up the answer first.

    5. **Check current plan**: When a customer asks about their current plan, use the
       getCurrentPlan action with their userId from session attributes to retrieve their
       active plan details including name, price, data allowance, and features.

    6. **Change plan**: When a customer wants to change their plan:
       - First, show their current plan using getCurrentPlan.
       - Then list available alternatives using listPlans.
       - ALWAYS confirm with the customer before executing the change.
       - Once confirmed, use changePlan with the userId and newPlanId.
       - After success, inform the customer that a confirmation email has been sent.

    Guidelines:
    - CRITICAL: The customer's userId is ALWAYS provided in the prompt session attributes
      (the $prompt_session_attributes$ variable). You MUST use this userId for ALL actions.
      NEVER ask the customer for their userId — you already have it. Just use it directly.
    - IMPORTANT: When a customer asks about plans, pricing, features, policies, billing,
      cancellation, FAQs, or any general question, ALWAYS use the searchKnowledgeBase action
      FIRST to retrieve accurate information. Never answer from memory alone.
    - Be concise but thorough. Use bullet points for comparisons.
    - Always mention specific prices and data limits — don't be vague.
    - If a customer asks about their orders, proactively look up their information
      using the userId from session attributes.
    - If you don't have enough information to answer, say so honestly and suggest
      the customer contact human support.
    - Never make up plan details — only use information from the knowledge base search results.
    - Keep responses focused and under 200 words unless a detailed comparison is requested.
  EOT

  tags = { Name = "${local.prefix}-support-agent" }
}

# --- Action Group: Customer Actions (DynamoDB queries) ---

resource "aws_bedrockagent_agent_action_group" "customer_actions" {
  agent_id          = aws_bedrockagent_agent.support.agent_id
  agent_version     = "DRAFT"
  action_group_name = "CustomerActions"
  description       = "Actions to look up customer orders, profile, available plans, and manage plan changes"

  action_group_executor {
    lambda = var.action_group_lambda_arn
  }

  api_schema {
    payload = jsonencode({
      openapi = "3.0.0"
      info = {
        title   = "Customer Actions API"
        version = "1.0.0"
      }
      paths = {
        "/getOrderStatus" = {
          get = {
            summary     = "Get the status of a specific order"
            description = "Retrieves details for a specific order by its order ID"
            operationId = "getOrderStatus"
            parameters = [
              {
                name        = "orderId"
                in          = "query"
                required    = true
                description = "The unique identifier of the order"
                schema      = { type = "string" }
              }
            ]
            responses = {
              "200" = {
                description = "Order details"
                content = {
                  "application/json" = {
                    schema = {
                      type = "object"
                      properties = {
                        orderId       = { type = "string" }
                        status        = { type = "string" }
                        planName      = { type = "string" }
                        pricePerMonth = { type = "string" }
                        createdAt     = { type = "string" }
                      }
                    }
                  }
                }
              }
            }
          }
        }
        "/getOrdersByUser" = {
          get = {
            summary     = "Get all orders for a user"
            description = "Retrieves all orders placed by a specific user. Use the userId from session attributes."
            operationId = "getOrdersByUser"
            parameters = [
              {
                name        = "userId"
                in          = "query"
                required    = true
                description = "The user ID (Cognito sub) of the customer"
                schema      = { type = "string" }
              }
            ]
            responses = {
              "200" = {
                description = "List of user orders"
                content = {
                  "application/json" = {
                    schema = {
                      type = "object"
                      properties = {
                        orderCount = { type = "integer" }
                        orders = {
                          type = "array"
                          items = {
                            type = "object"
                            properties = {
                              orderId   = { type = "string" }
                              planName  = { type = "string" }
                              status    = { type = "string" }
                              createdAt = { type = "string" }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
        "/getUserProfile" = {
          get = {
            summary     = "Get user profile information"
            description = "Retrieves the profile of a specific user including their current plan"
            operationId = "getUserProfile"
            parameters = [
              {
                name        = "userId"
                in          = "query"
                required    = true
                description = "The user ID (Cognito sub) of the customer"
                schema      = { type = "string" }
              }
            ]
            responses = {
              "200" = {
                description = "User profile details"
                content = {
                  "application/json" = {
                    schema = {
                      type = "object"
                      properties = {
                        userId    = { type = "string" }
                        email     = { type = "string" }
                        firstName = { type = "string" }
                        planId    = { type = "string" }
                      }
                    }
                  }
                }
              }
            }
          }
        }
        "/listPlans" = {
          get = {
            summary     = "List all available wireless plans"
            description = "Returns all wireless plans with pricing and features"
            operationId = "listPlans"
            responses = {
              "200" = {
                description = "List of available plans"
                content = {
                  "application/json" = {
                    schema = {
                      type = "object"
                      properties = {
                        planCount = { type = "integer" }
                        plans = {
                          type = "array"
                          items = {
                            type = "object"
                            properties = {
                              planId        = { type = "string" }
                              name          = { type = "string" }
                              pricePerMonth = { type = "string" }
                              dataGB        = { type = "string" }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
        "/getCurrentPlan" = {
          get = {
            summary     = "Get the current plan for a user"
            description = "Retrieves the user's active plan details including name, price, data allowance, and features"
            operationId = "getCurrentPlan"
            parameters = [
              {
                name        = "userId"
                in          = "query"
                required    = true
                description = "The user ID (Cognito sub) of the customer"
                schema      = { type = "string" }
              }
            ]
            responses = {
              "200" = {
                description = "Current plan details"
                content = {
                  "application/json" = {
                    schema = {
                      type = "object"
                      properties = {
                        userId        = { type = "string" }
                        planId        = { type = "string" }
                        planName      = { type = "string" }
                        pricePerMonth = { type = "string" }
                        dataGB        = { type = "string" }
                        features = {
                          type  = "array"
                          items = { type = "string" }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
        "/changePlan" = {
          post = {
            summary     = "Change a user's wireless plan"
            description = "Changes the user's plan by cancelling active orders, creating a new order, and sending a confirmation email. Always confirm with the user before calling this action."
            operationId = "changePlan"
            requestBody = {
              required = true
              content = {
                "application/json" = {
                  schema = {
                    type     = "object"
                    required = ["userId", "newPlanId"]
                    properties = {
                      userId = {
                        type        = "string"
                        description = "The user ID (Cognito sub) of the customer"
                      }
                      newPlanId = {
                        type        = "string"
                        description = "The plan ID of the new plan to switch to"
                      }
                    }
                  }
                }
              }
            }
            responses = {
              "200" = {
                description = "Plan change result"
                content = {
                  "application/json" = {
                    schema = {
                      type = "object"
                      properties = {
                        message       = { type = "string" }
                        orderId       = { type = "string" }
                        planId        = { type = "string" }
                        planName      = { type = "string" }
                        pricePerMonth = { type = "string" }
                        emailSent     = { type = "boolean" }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    })
  }
}

# --- Action Group: Knowledge Base Search (FAISS-based) ---

resource "aws_bedrockagent_agent_action_group" "kb_search" {
  agent_id          = aws_bedrockagent_agent.support.agent_id
  agent_version     = "DRAFT"
  action_group_name = "KnowledgeBaseSearch"
  description       = "Search the knowledge base for information about wireless plans, policies, FAQs, and comparisons"

  action_group_executor {
    lambda = var.kb_search_lambda_arn
  }

  api_schema {
    payload = jsonencode({
      openapi = "3.0.0"
      info = {
        title   = "Knowledge Base Search API"
        version = "1.0.0"
      }
      paths = {
        "/searchKnowledgeBase" = {
          get = {
            summary     = "Search the knowledge base for relevant information"
            description = "Searches plan details, FAQs, policies, and comparisons. Use this whenever a customer asks about plans, pricing, features, billing, cancellation, or any general question."
            operationId = "searchKnowledgeBase"
            parameters = [
              {
                name        = "query"
                in          = "query"
                required    = true
                description = "The search query describing what information to look up"
                schema      = { type = "string" }
              }
            ]
            responses = {
              "200" = {
                description = "Search results with relevant text passages"
                content = {
                  "application/json" = {
                    schema = {
                      type = "object"
                      properties = {
                        query = { type = "string" }
                        resultCount = { type = "integer" }
                        results = {
                          type = "array"
                          items = {
                            type = "object"
                            properties = {
                              text   = { type = "string" }
                              source = { type = "string" }
                              score  = { type = "number" }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    })
  }
}

# --- Agent Alias (required for runtime invocation) ---

resource "aws_bedrockagent_agent_alias" "live" {
  agent_id         = aws_bedrockagent_agent.support.agent_id
  agent_alias_name = "live"

  # Force alias update when agent config changes (publishes new version)
  description = substr("v${sha256("${aws_bedrockagent_agent.support.instruction}${aws_bedrockagent_agent_action_group.customer_actions.description}${aws_bedrockagent_agent_action_group.kb_search.description}")}", 0, 200)

  depends_on = [
    aws_bedrockagent_agent_action_group.customer_actions,
    aws_bedrockagent_agent_action_group.kb_search,
  ]

  tags = { Name = "${local.prefix}-agent-live" }
}
