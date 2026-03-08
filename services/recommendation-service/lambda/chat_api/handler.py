"""
Chat API Lambda — receives POST /api/agent/chat from API Gateway,
invokes the Bedrock Agent, and streams back the response.
"""

import json
import os
import uuid
import base64
import boto3

bedrock_agent_runtime = boto3.client("bedrock-agent-runtime")

AGENT_ID = os.environ["BEDROCK_AGENT_ID"]
AGENT_ALIAS_ID = os.environ["BEDROCK_AGENT_ALIAS_ID"]

# CORS headers for all responses
CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Authorization,Content-Type",
    "Access-Control-Allow-Methods": "POST,OPTIONS",
    "Content-Type": "application/json",
}


def handler(event, context):
    print(f"Event: {json.dumps(event)}")

    # Handle preflight
    http_method = event.get("requestContext", {}).get("http", {}).get("method", "")
    if http_method == "OPTIONS":
        return {"statusCode": 200, "headers": CORS_HEADERS, "body": ""}

    try:
        # Parse request body
        body = event.get("body", "{}")
        if event.get("isBase64Encoded"):
            body = base64.b64decode(body).decode("utf-8")
        body = json.loads(body) if isinstance(body, str) else body

        message = body.get("message", "").strip()
        session_id = body.get("sessionId") or str(uuid.uuid4())

        if not message:
            return {
                "statusCode": 400,
                "headers": CORS_HEADERS,
                "body": json.dumps({"error": "message is required"}),
            }

        # Extract userId from JWT claims (API Gateway JWT authorizer puts them in requestContext)
        claims = (
            event.get("requestContext", {})
            .get("authorizer", {})
            .get("jwt", {})
            .get("claims", {})
        )
        user_id = claims.get("sub", "anonymous")

        # Build session attributes so the agent knows the current user
        # promptSessionAttributes are visible to the model in its prompt
        # sessionAttributes are passed through to action group Lambdas
        session_state = {
            "sessionAttributes": {
                "userId": user_id,
            },
            "promptSessionAttributes": {
                "userId": user_id,
            },
        }

        # Invoke Bedrock Agent
        response = bedrock_agent_runtime.invoke_agent(
            agentId=AGENT_ID,
            agentAliasId=AGENT_ALIAS_ID,
            sessionId=session_id,
            inputText=message,
            sessionState=session_state,
        )

        # Read the streaming response
        completion = ""
        for event_stream in response.get("completion", []):
            chunk = event_stream.get("chunk", {})
            if "bytes" in chunk:
                completion += chunk["bytes"].decode("utf-8")

        return {
            "statusCode": 200,
            "headers": CORS_HEADERS,
            "body": json.dumps(
                {
                    "message": completion,
                    "sessionId": session_id,
                }
            ),
        }

    except Exception as e:
        print(f"Error: {str(e)}")
        return {
            "statusCode": 500,
            "headers": CORS_HEADERS,
            "body": json.dumps({"error": "An error occurred processing your request."}),
        }
