#!/usr/bin/env python3
"""
Create the vector index in OpenSearch Serverless for Bedrock Knowledge Base.

Usage: python3 create-opensearch-index.py <collection_endpoint>

The index name and field mappings match what Bedrock KB expects by default.
Uses SigV4 signing via boto3 — no extra packages needed.
"""

import json
import sys
import boto3
from botocore.auth import SigV4Auth
from botocore.awsrequest import AWSRequest
from urllib.request import urlopen, Request
from urllib.error import HTTPError

INDEX_NAME = "bedrock-knowledge-base-default-index"
VECTOR_FIELD = "bedrock-knowledge-base-default-vector"
TEXT_FIELD = "AMAZON_BEDROCK_TEXT_CHUNK"
METADATA_FIELD = "AMAZON_BEDROCK_METADATA"


def main():
    if len(sys.argv) < 2:
        print("Usage: python3 create-opensearch-index.py <collection_endpoint>")
        sys.exit(1)

    endpoint = sys.argv[1].rstrip("/")
    if not endpoint.startswith("https://"):
        endpoint = f"https://{endpoint}"

    url = f"{endpoint}/{INDEX_NAME}"

    # Check if index already exists
    session = boto3.Session()
    credentials = session.get_credentials().get_frozen_credentials()
    region = session.region_name or "us-east-1"

    try:
        head_request = AWSRequest(method="HEAD", url=url)
        SigV4Auth(credentials, "aoss", region).add_auth(head_request)
        req = Request(url, method="HEAD")
        for key, val in dict(head_request.headers).items():
            req.add_header(key, val)
        urlopen(req)
        print(f"Index '{INDEX_NAME}' already exists — skipping creation.")
        return
    except HTTPError as e:
        if e.code != 404:
            print(f"Unexpected error checking index: {e.code} {e.read().decode()}")
            sys.exit(1)
        print(f"Index '{INDEX_NAME}' not found — creating...")

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

    aws_request = AWSRequest(
        method="PUT",
        url=url,
        data=body,
        headers={"Content-Type": "application/json"},
    )
    SigV4Auth(credentials, "aoss", region).add_auth(aws_request)

    req = Request(url, data=body.encode(), method="PUT")
    for key, val in dict(aws_request.headers).items():
        req.add_header(key, val)

    try:
        response = urlopen(req)
        print(f"Index '{INDEX_NAME}' created successfully: {response.read().decode()}")
    except HTTPError as e:
        error_body = e.read().decode()
        if "resource_already_exists_exception" in error_body:
            print(f"Index '{INDEX_NAME}' already exists (race condition) — OK.")
        else:
            print(f"Error creating index: {e.code} {error_body}")
            sys.exit(1)


if __name__ == "__main__":
    main()
