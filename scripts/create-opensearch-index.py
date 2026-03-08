#!/usr/bin/env python3
"""
Create the vector index in OpenSearch Serverless for Bedrock Knowledge Base.

Usage: python3 create-opensearch-index.py <collection_endpoint>

Uses opensearch-py with AWSV4SignerAuth — the AWS-recommended client for AOSS.
Retries on 403 to handle data access policy propagation delay.
"""

import json
import sys
import time

import boto3
from opensearchpy import OpenSearch, RequestsHttpConnection, AWSV4SignerAuth
from opensearchpy.exceptions import AuthorizationException, RequestError

INDEX_NAME = "bedrock-knowledge-base-default-index"
VECTOR_FIELD = "bedrock-knowledge-base-default-vector"
TEXT_FIELD = "AMAZON_BEDROCK_TEXT_CHUNK"
METADATA_FIELD = "AMAZON_BEDROCK_METADATA"

MAX_RETRIES = 12
RETRY_DELAY = 15  # seconds


def log(msg):
    print(msg, flush=True)


def create_client(endpoint, session):
    """Create an OpenSearch client with AOSS SigV4 auth."""
    host = endpoint.replace("https://", "").replace("http://", "").rstrip("/")
    region = session.region_name or "us-east-1"
    credentials = session.get_credentials()
    auth = AWSV4SignerAuth(credentials, region, "aoss")

    return OpenSearch(
        hosts=[{"host": host, "port": 443}],
        http_auth=auth,
        use_ssl=True,
        verify_certs=True,
        connection_class=RequestsHttpConnection,
        pool_maxsize=20,
        timeout=30,
    )


def main():
    if len(sys.argv) < 2:
        log("Usage: python3 create-opensearch-index.py <collection_endpoint>")
        sys.exit(1)

    endpoint = sys.argv[1].rstrip("/")
    if not endpoint.startswith("https://"):
        endpoint = f"https://{endpoint}"

    session = boto3.Session()

    # Print caller identity for debugging
    sts = boto3.client("sts")
    identity = sts.get_caller_identity()
    log(f"Caller identity: {identity['Arn']}")
    log(f"Region: {session.region_name or 'us-east-1'}")
    log(f"Endpoint: {endpoint}")

    index_body = {
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
    }

    for attempt in range(MAX_RETRIES):
        # Recreate client each attempt to refresh credentials/auth
        client = create_client(endpoint, session)

        try:
            if client.indices.exists(index=INDEX_NAME):
                log(f"Index '{INDEX_NAME}' already exists — skipping creation.")
                return

            response = client.indices.create(index=INDEX_NAME, body=index_body)
            log(f"Index '{INDEX_NAME}' created successfully: {json.dumps(response)}")
            return

        except AuthorizationException as e:
            if attempt < MAX_RETRIES - 1:
                log(f"Got 403 (attempt {attempt + 1}/{MAX_RETRIES}) — policy may still be propagating. Retrying in {RETRY_DELAY}s... Error: {e}")
                time.sleep(RETRY_DELAY)
                continue
            else:
                log(f"Still 403 after {MAX_RETRIES} attempts. Error: {e}")
                sys.exit(1)

        except RequestError as e:
            if "resource_already_exists_exception" in str(e):
                log(f"Index '{INDEX_NAME}' already exists (race condition) — OK.")
                return
            log(f"Error creating index: {e}")
            sys.exit(1)

        except Exception as e:
            log(f"Unexpected error: {e}")
            sys.exit(1)


if __name__ == "__main__":
    main()
