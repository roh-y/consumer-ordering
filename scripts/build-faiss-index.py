"""
Build a FAISS vector index from knowledge base markdown documents.

Reads all markdown files from services/recommendation-service/knowledge-base/,
chunks them by markdown sections, embeds each chunk using Amazon Titan Text
Embeddings V2 via Bedrock, and saves a FAISS index + metadata JSON.

Output files are written to services/recommendation-service/lambda/kb_search/index_data/
and bundled with the Lambda deployment package.

Usage:
    pip install faiss-cpu numpy boto3
    python scripts/build-faiss-index.py
"""

import json
import os
import sys

import boto3
import faiss
import numpy as np

EMBEDDING_MODEL_ID = "amazon.titan-embed-text-v2:0"
EMBEDDING_DIMENSION = 1024
KB_DOCS_DIR = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    "services", "recommendation-service", "knowledge-base",
)
OUTPUT_DIR = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    "services", "recommendation-service", "lambda", "kb_search", "index_data",
)


def find_markdown_files(root_dir):
    """Recursively find all .md files under root_dir."""
    md_files = []
    for dirpath, _, filenames in os.walk(root_dir):
        for f in sorted(filenames):
            if f.endswith(".md"):
                md_files.append(os.path.join(dirpath, f))
    return md_files


def chunk_markdown(text, source):
    """Split markdown text into chunks by ## headers. Returns list of {text, source}."""
    chunks = []
    current_chunk = []
    current_header = ""

    for line in text.split("\n"):
        if line.startswith("## "):
            # Save previous chunk if it has content
            if current_chunk:
                chunk_text = "\n".join(current_chunk).strip()
                if chunk_text:
                    chunks.append({"text": chunk_text, "source": source, "section": current_header})
            current_header = line.strip("# ").strip()
            current_chunk = [line]
        else:
            current_chunk.append(line)

    # Save last chunk
    if current_chunk:
        chunk_text = "\n".join(current_chunk).strip()
        if chunk_text:
            chunks.append({"text": chunk_text, "source": source, "section": current_header})

    # If no ## headers found, treat the whole document as one chunk
    if not chunks:
        chunks.append({"text": text.strip(), "source": source, "section": ""})

    return chunks


def embed_text(bedrock_client, text):
    """Embed a single text string using Titan Text Embeddings V2."""
    response = bedrock_client.invoke_model(
        modelId=EMBEDDING_MODEL_ID,
        contentType="application/json",
        accept="application/json",
        body=json.dumps({"inputText": text}),
    )
    result = json.loads(response["body"].read())
    return result["embedding"]


def main():
    print(f"==> Reading KB docs from {KB_DOCS_DIR}")
    md_files = find_markdown_files(KB_DOCS_DIR)
    if not md_files:
        print("ERROR: No markdown files found!")
        sys.exit(1)

    print(f"    Found {len(md_files)} files")

    # Chunk all documents
    all_chunks = []
    for filepath in md_files:
        relative_path = os.path.relpath(filepath, KB_DOCS_DIR)
        with open(filepath, "r") as f:
            text = f.read()
        chunks = chunk_markdown(text, relative_path)
        all_chunks.extend(chunks)
        print(f"    {relative_path}: {len(chunks)} chunks")

    print(f"==> Total chunks: {len(all_chunks)}")

    # Embed all chunks
    print("==> Embedding chunks with Titan Text Embeddings V2...")
    bedrock = boto3.client("bedrock-runtime")
    embeddings = []
    for i, chunk in enumerate(all_chunks):
        embedding = embed_text(bedrock, chunk["text"])
        embeddings.append(embedding)
        if (i + 1) % 10 == 0 or (i + 1) == len(all_chunks):
            print(f"    Embedded {i + 1}/{len(all_chunks)}")

    # Build FAISS index
    print("==> Building FAISS index...")
    vectors = np.array(embeddings, dtype=np.float32)
    # Normalize vectors for cosine similarity (inner product on normalized = cosine)
    faiss.normalize_L2(vectors)
    index = faiss.IndexFlatIP(EMBEDDING_DIMENSION)
    index.add(vectors)

    # Save index and metadata
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    index_path = os.path.join(OUTPUT_DIR, "faiss_index.bin")
    metadata_path = os.path.join(OUTPUT_DIR, "chunks_metadata.json")

    faiss.write_index(index, index_path)

    metadata = [{"text": c["text"], "source": c["source"], "section": c["section"]} for c in all_chunks]
    with open(metadata_path, "w") as f:
        json.dump(metadata, f, indent=2)

    print(f"==> Saved FAISS index to {index_path} ({os.path.getsize(index_path)} bytes)")
    print(f"==> Saved metadata to {metadata_path} ({len(metadata)} chunks)")
    print("==> Done!")


if __name__ == "__main__":
    main()
