"""
Bedrock Agent Action Group Lambda — handles customer actions.

Routes by apiPath to query DynamoDB for order status, user profiles, and plan listings.
Returns responses in the Bedrock Agent action group response format.
"""

import json
import os
import uuid
from datetime import datetime, timezone

import boto3
from boto3.dynamodb.conditions import Key

dynamodb = boto3.resource("dynamodb")
sqs = boto3.client("sqs")

ORDERS_TABLE = os.environ["ORDERS_TABLE_NAME"]
USERS_TABLE = os.environ["USERS_TABLE_NAME"]
PLANS_TABLE = os.environ["PLANS_TABLE_NAME"]
SQS_ORDER_EVENTS_QUEUE_URL = os.environ.get("SQS_ORDER_EVENTS_QUEUE_URL", "")


def handler(event, context):
    print(f"Event: {json.dumps(event)}")

    api_path = event.get("apiPath", "")
    http_method = event.get("httpMethod", "GET")
    parameters = event.get("parameters", [])
    request_body = event.get("requestBody", {})

    # Build a dict of param name -> value for easy access
    params = {p["name"]: p["value"] for p in parameters} if parameters else {}

    # Fallback: inject userId from session attributes if not in params
    session_attrs = event.get("sessionAttributes", {})
    if "userId" not in params and "userId" in session_attrs:
        params["userId"] = session_attrs["userId"]

    try:
        if api_path == "/getOrderStatus" and http_method == "GET":
            result = get_order_status(params)
        elif api_path == "/getOrdersByUser" and http_method == "GET":
            result = get_orders_by_user(params)
        elif api_path == "/getUserProfile" and http_method == "GET":
            result = get_user_profile(params)
        elif api_path == "/listPlans" and http_method == "GET":
            result = list_plans()
        elif api_path == "/getCurrentPlan" and http_method == "GET":
            result = get_current_plan(params)
        elif api_path == "/changePlan" and http_method == "POST":
            body_params = _extract_body_params(request_body)
            if "userId" not in body_params and "userId" in session_attrs:
                body_params["userId"] = session_attrs["userId"]
            result = change_plan(body_params)
        else:
            result = {"error": f"Unknown action: {http_method} {api_path}"}

        response_body = {"application/json": {"body": json.dumps(result)}}

    except Exception as e:
        print(f"Error: {str(e)}")
        response_body = {
            "application/json": {"body": json.dumps({"error": str(e)})}
        }

    return {
        "messageVersion": "1.0",
        "response": {
            "actionGroup": event.get("actionGroup", ""),
            "apiPath": api_path,
            "httpMethod": http_method,
            "httpStatusCode": 200,
            "responseBody": response_body,
        },
    }


def get_order_status(params):
    """Get a specific order by orderId."""
    order_id = params.get("orderId")
    if not order_id:
        return {"error": "orderId is required"}

    table = dynamodb.Table(ORDERS_TABLE)
    # Orders table has orderId as hash key and userId as range key.
    # Query by orderId to find the order regardless of userId.
    response = table.query(KeyConditionExpression=Key("orderId").eq(order_id))

    items = response.get("Items", [])
    if not items:
        return {"message": f"No order found with ID {order_id}"}

    order = items[0]
    return {
        "orderId": order.get("orderId"),
        "userId": order.get("userId"),
        "planId": order.get("planId"),
        "planName": order.get("planName", "N/A"),
        "status": order.get("status"),
        "pricePerMonth": str(order.get("pricePerMonth", "N/A")),
        "createdAt": order.get("createdAt", "N/A"),
        "updatedAt": order.get("updatedAt", "N/A"),
    }


def get_orders_by_user(params):
    """Get all orders for a given userId using the GSI."""
    user_id = params.get("userId")
    if not user_id:
        return {"error": "userId is required"}

    table = dynamodb.Table(ORDERS_TABLE)
    response = table.query(
        IndexName="userId-index",
        KeyConditionExpression=Key("userId").eq(user_id),
    )

    items = response.get("Items", [])
    if not items:
        return {"message": f"No orders found for user {user_id}", "orders": []}

    orders = []
    for item in items:
        orders.append(
            {
                "orderId": item.get("orderId"),
                "planId": item.get("planId"),
                "planName": item.get("planName", "N/A"),
                "status": item.get("status"),
                "pricePerMonth": str(item.get("pricePerMonth", "N/A")),
                "createdAt": item.get("createdAt", "N/A"),
            }
        )

    return {"userId": user_id, "orderCount": len(orders), "orders": orders}


def get_user_profile(params):
    """Get user profile by userId."""
    user_id = params.get("userId")
    if not user_id:
        return {"error": "userId is required"}

    table = dynamodb.Table(USERS_TABLE)
    response = table.get_item(Key={"userId": user_id})

    item = response.get("Item")
    if not item:
        return {"message": f"No user found with ID {user_id}"}

    return {
        "userId": item.get("userId"),
        "email": item.get("email"),
        "firstName": item.get("firstName", "N/A"),
        "lastName": item.get("lastName", "N/A"),
        "planId": item.get("planId", "None"),
        "createdAt": item.get("createdAt", "N/A"),
    }


def list_plans():
    """List all available wireless plans."""
    table = dynamodb.Table(PLANS_TABLE)
    response = table.scan()

    items = response.get("Items", [])
    plans = []
    for item in items:
        plans.append(
            {
                "planId": item.get("planId"),
                "name": item.get("name"),
                "description": item.get("description", ""),
                "pricePerMonth": str(item.get("pricePerMonth", "N/A")),
                "dataGB": str(item.get("dataGB", "N/A")),
                "features": item.get("features", []),
            }
        )

    return {"planCount": len(plans), "plans": plans}


def get_current_plan(params):
    """Get the current plan for a user."""
    user_id = params.get("userId")
    if not user_id:
        return {"error": "userId is required"}

    users_table = dynamodb.Table(USERS_TABLE)
    user_resp = users_table.get_item(Key={"userId": user_id})
    user = user_resp.get("Item")
    if not user:
        return {"message": f"No user found with ID {user_id}"}

    plan_id = user.get("planId")
    if not plan_id:
        return {"message": "You do not have an active plan.", "userId": user_id}

    plans_table = dynamodb.Table(PLANS_TABLE)
    plan_resp = plans_table.get_item(Key={"planId": plan_id})
    plan = plan_resp.get("Item")
    if not plan:
        return {"message": f"Plan {plan_id} not found in catalog.", "userId": user_id, "planId": plan_id}

    return {
        "userId": user_id,
        "planId": plan_id,
        "planName": plan.get("name"),
        "pricePerMonth": str(plan.get("pricePerMonth", "N/A")),
        "dataGB": str(plan.get("dataGB", "N/A")),
        "features": plan.get("features", []),
    }


def change_plan(params):
    """Change a user's plan: cancel active orders, create new order, update user, send SQS event."""
    user_id = params.get("userId")
    new_plan_id = params.get("newPlanId")
    if not user_id or not new_plan_id:
        return {"error": "userId and newPlanId are required"}

    # Validate the new plan exists
    plans_table = dynamodb.Table(PLANS_TABLE)
    plan_resp = plans_table.get_item(Key={"planId": new_plan_id})
    new_plan = plan_resp.get("Item")
    if not new_plan:
        return {"error": f"Plan {new_plan_id} does not exist"}

    # Check user exists and isn't already on this plan
    users_table = dynamodb.Table(USERS_TABLE)
    user_resp = users_table.get_item(Key={"userId": user_id})
    user = user_resp.get("Item")
    if not user:
        return {"error": f"User {user_id} not found"}

    if user.get("planId") == new_plan_id:
        return {"message": f"You are already on the {new_plan.get('name')} plan."}

    now = datetime.now(timezone.utc).isoformat()
    orders_table = dynamodb.Table(ORDERS_TABLE)

    # Cancel active orders for this user
    active_orders = orders_table.query(
        IndexName="userId-index",
        KeyConditionExpression=Key("userId").eq(user_id),
    )
    for order in active_orders.get("Items", []):
        if order.get("status") == "ACTIVE":
            orders_table.update_item(
                Key={"orderId": order["orderId"], "userId": user_id},
                UpdateExpression="SET #s = :s, updatedAt = :u",
                ExpressionAttributeNames={"#s": "status"},
                ExpressionAttributeValues={":s": "CANCELLED", ":u": now},
            )

    # Create new order
    new_order_id = str(uuid.uuid4())
    plan_name = new_plan.get("name", "")
    price_per_month = float(new_plan.get("pricePerMonth", 0))

    orders_table.put_item(
        Item={
            "orderId": new_order_id,
            "userId": user_id,
            "planId": new_plan_id,
            "planName": plan_name,
            "pricePerMonth": new_plan.get("pricePerMonth", 0),
            "status": "ACTIVE",
            "createdAt": now,
            "updatedAt": now,
        }
    )

    # Update user's planId
    users_table.update_item(
        Key={"userId": user_id},
        UpdateExpression="SET planId = :p, updatedAt = :u",
        ExpressionAttributeValues={":p": new_plan_id, ":u": now},
    )

    # Publish PLAN_CHANGED event to SQS
    user_email = user.get("email", "")
    if SQS_ORDER_EVENTS_QUEUE_URL:
        sqs.send_message(
            QueueUrl=SQS_ORDER_EVENTS_QUEUE_URL,
            MessageBody=json.dumps({
                "eventType": "PLAN_CHANGED",
                "orderId": new_order_id,
                "userId": user_id,
                "planId": new_plan_id,
                "planName": plan_name,
                "pricePerMonth": price_per_month,
                "userEmail": user_email,
            }),
        )

    return {
        "message": f"Successfully changed to the {plan_name} plan.",
        "orderId": new_order_id,
        "planId": new_plan_id,
        "planName": plan_name,
        "pricePerMonth": str(price_per_month),
        "emailSent": bool(SQS_ORDER_EVENTS_QUEUE_URL and user_email),
    }


def _extract_body_params(request_body):
    """Extract parameters from POST request body."""
    try:
        content = request_body.get("content", {})
        json_content = content.get("application/json", {})
        properties = json_content.get("properties", [])
        return {p["name"]: p["value"] for p in properties} if properties else {}
    except (KeyError, TypeError):
        return {}
