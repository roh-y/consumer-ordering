#!/usr/bin/env python3
"""
Create the vector index in OpenSearch Serverless for Bedrock Knowledge Base.

Usage: python3 create-opensearch-index.py <collection_endpoint>

The index name and field mappings match what Bedrock KB expects by default.
Uses SigV4 signing via boto3 — no extra packages needed.
Retries on 403 to handle data access policy propagation delay.
"""

import json
import sys
import time
import boto3
from botocore.auth import SigV4Auth
from botocore.awsrequest import AWSRequest
from urllib.request import urlopen, Request
from urllib.error import HTTPError

INDEX_NAME = "bedrock-knowledge-base-default-index"
VECTOR_FIELD = "bedrock-knowledge-base-default-vector"
TEXT_FIELD = "AMAZON_BEDROCK_TEXT_CHUNK"
METADATA_FIELD = "AMAZON_BEDROCK_METADATA"

MAX_RETRIES = 10
RETRY_DELAY = 15  # seconds


def make_signed_request(method, url, credentials, region, body=None):
    """Make a SigV4-signed request to OpenSearch Serverless."""
    headers = {"Content-Type": "application/json"} if body else {}
    aws_request = AWSRequest(method=method, url=url, data=body, headers=headers)
    SigV4Auth(credentials, "aoss", region).add_auth(aws_request)

    req = Request(url, data=body.encode() if body else None, method=method)
    for key, val in dict(aws_request.headers).items():
        req.add_header(key, val)
    return urlopen(req)


def main():
    if len(sys.argv) < 2:
        print("Usage: python3 create-opensearch-index.py <collection_endpoint>")
        sys.exit(1)

    endpoint = sys.argv[1].rstrip("/")
    if not endpoint.startswith("https://"):
        endpoint = f"https://{endpoint}"

    url = f"{endpoint}/{INDEX_NAME}"

    session = boto3.Session()
    credentials = session.get_credentials().get_frozen_credentials()
    region = session.region_name or "us-east-1"

    # Check if index already exists (with retries for 403)
    for attempt in range(MAX_RETRIES):
        try:
            make_signed_request("HEAD", url, credentials, region)
            print(f"Index '{INDEX_NAME}' already exists — skipping creation.")
            return
        except HTTPError as e:
            if e.code == 404:
                print(f"Index '{INDEX_NAME}' not found — will create.")
                break
            elif e.code == 403:
                if attempt < MAX_RETRIES - 1:
                    print(f"Got 403 (attempt {attempt + 1}/{MAX_RETRIES}) — data access policy may still be propagating. Retrying in {RETRY_DELAY}s...")
                    time.sleep(RETRY_DELAY)
                    # Refresh credentials for new SigV4 signature
                    credentials = session.get_credentials().get_frozen_credentials()
                    continue
                else:
                    print(f"Still 403 after {MAX_RETRIES} attempts. Check data access policy.")
                    sys.exit(1)
            else:
                print(f"Unexpected error checking index: {e.code} {e.read().decode()}")
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
        try:
            response = make_signed_request("PUT", url, credentials, region, body)
            print(f"Index '{INDEX_NAME}' created successfully: {response.read().decode()}")
            return
        except HTTPError as e:
            error_body = e.read().decode()
            if "resource_already_exists_exception" in error_body:
                print(f"Index '{INDEX_NAME}' already exists (race condition) — OK.")
                return
            elif e.code == 403 and attempt < MAX_RETRIES - 1:
                print(f"Got 403 creating index (attempt {attempt + 1}/{MAX_RETRIES}). Retrying in {RETRY_DELAY}s...")
                time.sleep(RETRY_DELAY)
                credentials = session.get_credentials().get_frozen_credentials()
                continue
            else:
                print(f"Error creating index: {e.code} {error_body}")
                sys.exit(1)


if __name__ == "__main__":
    main()
