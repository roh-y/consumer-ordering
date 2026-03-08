"""Unit tests for the action group Lambda handler."""

import json
import os
import unittest
from unittest.mock import patch, MagicMock

# Set env vars before importing handler
os.environ["ORDERS_TABLE_NAME"] = "test-orders"
os.environ["USERS_TABLE_NAME"] = "test-users"
os.environ["PLANS_TABLE_NAME"] = "test-plans"


class TestActionGroupHandler(unittest.TestCase):
    """Tests for action group Lambda handler routing and response format."""

    @patch("handler.dynamodb")
    def test_get_order_status_found(self, mock_dynamodb):
        from handler import handler

        mock_table = MagicMock()
        mock_dynamodb.Table.return_value = mock_table
        mock_table.query.return_value = {
            "Items": [
                {
                    "orderId": "order-123",
                    "userId": "user-456",
                    "planId": "plan-1",
                    "planName": "Basic",
                    "status": "ACTIVE",
                    "pricePerMonth": 29.99,
                    "createdAt": "2024-01-01",
                    "updatedAt": "2024-01-01",
                }
            ]
        }

        event = {
            "apiPath": "/getOrderStatus",
            "httpMethod": "GET",
            "actionGroup": "CustomerActions",
            "parameters": [{"name": "orderId", "value": "order-123"}],
        }

        result = handler(event, {})

        self.assertEqual(result["messageVersion"], "1.0")
        body = json.loads(
            result["response"]["responseBody"]["application/json"]["body"]
        )
        self.assertEqual(body["orderId"], "order-123")
        self.assertEqual(body["status"], "ACTIVE")

    @patch("handler.dynamodb")
    def test_get_order_status_not_found(self, mock_dynamodb):
        from handler import handler

        mock_table = MagicMock()
        mock_dynamodb.Table.return_value = mock_table
        mock_table.query.return_value = {"Items": []}

        event = {
            "apiPath": "/getOrderStatus",
            "httpMethod": "GET",
            "actionGroup": "CustomerActions",
            "parameters": [{"name": "orderId", "value": "nonexistent"}],
        }

        result = handler(event, {})
        body = json.loads(
            result["response"]["responseBody"]["application/json"]["body"]
        )
        self.assertIn("No order found", body["message"])

    @patch("handler.dynamodb")
    def test_get_orders_by_user(self, mock_dynamodb):
        from handler import handler

        mock_table = MagicMock()
        mock_dynamodb.Table.return_value = mock_table
        mock_table.query.return_value = {
            "Items": [
                {
                    "orderId": "order-1",
                    "planId": "plan-1",
                    "planName": "Basic",
                    "status": "ACTIVE",
                    "pricePerMonth": 29.99,
                    "createdAt": "2024-01-01",
                },
                {
                    "orderId": "order-2",
                    "planId": "plan-2",
                    "planName": "Standard",
                    "status": "CANCELLED",
                    "pricePerMonth": 49.99,
                    "createdAt": "2024-02-01",
                },
            ]
        }

        event = {
            "apiPath": "/getOrdersByUser",
            "httpMethod": "GET",
            "actionGroup": "CustomerActions",
            "parameters": [{"name": "userId", "value": "user-456"}],
        }

        result = handler(event, {})
        body = json.loads(
            result["response"]["responseBody"]["application/json"]["body"]
        )
        self.assertEqual(body["orderCount"], 2)
        self.assertEqual(len(body["orders"]), 2)

    @patch("handler.dynamodb")
    def test_list_plans(self, mock_dynamodb):
        from handler import handler

        mock_table = MagicMock()
        mock_dynamodb.Table.return_value = mock_table
        mock_table.scan.return_value = {
            "Items": [
                {
                    "planId": "plan-1",
                    "name": "Basic",
                    "pricePerMonth": 29.99,
                    "dataGB": 5,
                    "features": ["Unlimited calls"],
                }
            ]
        }

        event = {
            "apiPath": "/listPlans",
            "httpMethod": "GET",
            "actionGroup": "CustomerActions",
            "parameters": [],
        }

        result = handler(event, {})
        body = json.loads(
            result["response"]["responseBody"]["application/json"]["body"]
        )
        self.assertEqual(body["planCount"], 1)
        self.assertEqual(body["plans"][0]["name"], "Basic")

    @patch("handler.dynamodb")
    def test_unknown_action(self, mock_dynamodb):
        from handler import handler

        event = {
            "apiPath": "/unknownAction",
            "httpMethod": "GET",
            "actionGroup": "CustomerActions",
            "parameters": [],
        }

        result = handler(event, {})
        body = json.loads(
            result["response"]["responseBody"]["application/json"]["body"]
        )
        self.assertIn("Unknown action", body["error"])


if __name__ == "__main__":
    unittest.main()
