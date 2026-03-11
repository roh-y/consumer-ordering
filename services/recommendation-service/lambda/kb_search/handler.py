"""
Knowledge Base Search Lambda — FAISS-based vector search for Bedrock Agent.

Loads a pre-built FAISS index and metadata from the deployment package,
embeds the user's query at runtime using Titan Text Embeddings V2,
and returns the top-k most relevant document chunks.

Called by the Bedrock Agent as an action group when it needs KB information.
"""

import json
import os

import boto3
import faiss
import numpy as np

EMBEDDING_MODEL_ID = "amazon.titan-embed-text-v2:0"
TOP_K = 5

# Load index and metadata on cold start (from deployment package)
_index_dir = os.path.join(os.path.dirname(__file__), "index_data")
_index = faiss.read_index(os.path.join(_index_dir, "faiss_index.bin"))

with open(os.path.join(_index_dir, "chunks_metadata.json"), "r") as _f:
    _metadata = json.load(_f)

_bedrock = boto3.client("bedrock-runtime")


def _embed_query(text):
    """Embed a query string using Titan Text Embeddings V2."""
    response = _bedrock.invoke_model(
        modelId=EMBEDDING_MODEL_ID,
        contentType="application/json",
        accept="application/json",
        body=json.dumps({"inputText": text}),
    )
    result = json.loads(response["body"].read())
    return result["embedding"]


def _search(query, top_k=TOP_K):
    """Search the FAISS index and return top-k results with scores."""
    embedding = _embed_query(query)
    vector = np.array([embedding], dtype=np.float32)
    faiss.normalize_L2(vector)

    scores, indices = _index.search(vector, top_k)

    results = []
    for score, idx in zip(scores[0], indices[0]):
        if idx < 0 or idx >= len(_metadata):
            continue
        chunk = _metadata[idx]
        results.append({
            "text": chunk["text"],
            "source": chunk["source"],
            "section": chunk.get("section", ""),
            "score": float(score),
        })

    return results


def handler(event, context):
    """Bedrock Agent action group handler for searchKnowledgeBase."""
    api_path = event.get("apiPath", "")
    http_method = event.get("httpMethod", "GET")
    parameters = event.get("parameters", [])

    params = {p["name"]: p["value"] for p in parameters} if parameters else {}

    try:
        if api_path == "/searchKnowledgeBase":
            query = params.get("query", "")
            if not query:
                result = {"error": "query parameter is required"}
            else:
                results = _search(query)
                result = {"query": query, "resultCount": len(results), "results": results}
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
