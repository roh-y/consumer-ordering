#!/usr/bin/env python3
"""
Create the vector index in OpenSearch Serverless for Bedrock Knowledge Base.

Usage: python3 create-opensearch-index.py <collection_endpoint>

The index name and field mappings match what Bedrock KB expects by default.
Uses the `requests` library with SigV4 signing via boto3.
Retries on 403 to handle data access policy propagation delay.
"""

import json
import sys
import time

import boto3
import requests
from botocore.auth import SigV4Auth
from botocore.awsrequest import AWSRequest

INDEX_NAME = "bedrock-knowledge-base-default-index"
VECTOR_FIELD = "bedrock-knowledge-base-default-vector"
TEXT_FIELD = "AMAZON_BEDROCK_TEXT_CHUNK"
METADATA_FIELD = "AMAZON_BEDROCK_METADATA"

MAX_RETRIES = 12
RETRY_DELAY = 15  # seconds


def log(msg):
    """Print with immediate flush for real-time output in CI."""
    print(msg, flush=True)


def make_signed_request(method, url, credentials, region, body=None):
    """Make a SigV4-signed request to OpenSearch Serverless."""
    headers = {"Content-Type": "application/json"} if body else {}

    # Sign the request
    aws_request = AWSRequest(method=method, url=url, data=body, headers=headers)
    SigV4Auth(credentials, "aoss", region).add_auth(aws_request)

    # Send via requests library (handles headers and body correctly)
    response = requests.request(
        method=method,
        url=url,
        headers=dict(aws_request.headers),
        data=body,
        timeout=30,
    )
    return response


def main():
    if len(sys.argv) < 2:
        log("Usage: python3 create-opensearch-index.py <collection_endpoint>")
        sys.exit(1)

    endpoint = sys.argv[1].rstrip("/")
    if not endpoint.startswith("https://"):
        endpoint = f"https://{endpoint}"

    url = f"{endpoint}/{INDEX_NAME}"

    session = boto3.Session()
    credentials = session.get_credentials().get_frozen_credentials()
    region = session.region_name or "us-east-1"

    # Print caller identity for debugging
    sts = boto3.client("sts")
    identity = sts.get_caller_identity()
    log(f"Caller identity: {identity['Arn']}")
    log(f"Region: {region}")
    log(f"Target URL: {url}")

    # Check if index already exists (with retries for 403)
    for attempt in range(MAX_RETRIES):
        response = make_signed_request("HEAD", url, credentials, region)
        if response.status_code == 200:
            log(f"Index '{INDEX_NAME}' already exists — skipping creation.")
            return
        elif response.status_code == 404:
            log(f"Index '{INDEX_NAME}' not found — will create.")
            break
        elif response.status_code == 403:
            if attempt < MAX_RETRIES - 1:
                log(f"Got 403 on HEAD (attempt {attempt + 1}/{MAX_RETRIES}) — policy may still be propagating. Retrying in {RETRY_DELAY}s...")
                time.sleep(RETRY_DELAY)
                credentials = session.get_credentials().get_frozen_credentials()
                continue
            else:
                log(f"Still 403 after {MAX_RETRIES} attempts. Response: {response.text}")
                sys.exit(1)
        else:
            log(f"Unexpected error checking index: {response.status_code} {response.text}")
            sys.exit(1)

    # Create the index with vector search mappings
    body = json.dumps({
        "settings": {
            "index": {
                "knn": True,
                "knn.algo_param.ef_search": 512,
            }
        },
        "mappings": {
            "properties": {
                VECTOR_FIELD: {
                    "type": "knn_vector",
                    "dimension": 1024,
                    "method": {
                        "engine": "faiss",
                        "space_type": "l2",
                        "name": "hnsw",
                        "parameters": {
                            "ef_construction": 512,
                            "m": 16,
                        },
                    },
                },
                TEXT_FIELD: {
                    "type": "text",
                    "index": True,
                },
                METADATA_FIELD: {
                    "type": "text",
                    "index": False,
                },
            }
        },
    })

    for attempt in range(MAX_RETRIES):
        response = make_signed_request("PUT", url, credentials, region, body)
        if response.status_code in (200, 201):
            log(f"Index '{INDEX_NAME}' created successfully: {response.text}")
            return
        elif "resource_already_exists_exception" in response.text:
            log(f"Index '{INDEX_NAME}' already exists (race condition) — OK.")
            return
        elif response.status_code == 403 and attempt < MAX_RETRIES - 1:
            log(f"Got 403 creating index (attempt {attempt + 1}/{MAX_RETRIES}). Retrying in {RETRY_DELAY}s... Response: {response.text}")
            time.sleep(RETRY_DELAY)
            credentials = session.get_credentials().get_frozen_credentials()
            continue
        else:
            log(f"Error creating index: {response.status_code} {response.text}")
            sys.exit(1)


if __name__ == "__main__":
    main()
