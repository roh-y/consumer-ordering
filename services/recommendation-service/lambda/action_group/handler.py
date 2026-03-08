"""
Bedrock Agent Action Group Lambda — handles customer actions.

Routes by apiPath to query DynamoDB for order status, user profiles, and plan listings.
Returns responses in the Bedrock Agent action group response format.
"""

import json
import os
import boto3
from boto3.dynamodb.conditions import Key

dynamodb = boto3.resource("dynamodb")

ORDERS_TABLE = os.environ["ORDERS_TABLE_NAME"]
USERS_TABLE = os.environ["USERS_TABLE_NAME"]
PLANS_TABLE = os.environ["PLANS_TABLE_NAME"]


def handler(event, context):
    print(f"Event: {json.dumps(event)}")

    api_path = event.get("apiPath", "")
    http_method = event.get("httpMethod", "GET")
    parameters = event.get("parameters", [])
    request_body = event.get("requestBody", {})

    # Build a dict of param name -> value for easy access
    params = {p["name"]: p["value"] for p in parameters} if parameters else {}

    try:
        if api_path == "/getOrderStatus" and http_method == "GET":
            result = get_order_status(params)
        elif api_path == "/getOrdersByUser" and http_method == "GET":
            result = get_orders_by_user(params)
        elif api_path == "/getUserProfile" and http_method == "GET":
            result = get_user_profile(params)
        elif api_path == "/listPlans" and http_method == "GET":
            result = list_plans()
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
