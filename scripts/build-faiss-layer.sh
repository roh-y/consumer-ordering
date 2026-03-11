#!/usr/bin/env bash
# Build a Lambda layer zip with faiss-cpu and numpy for python3.12 x86_64.
# Requires Docker to be running.
#
# Usage: ./scripts/build-faiss-layer.sh
# Output: infrastructure/modules/lambda/files/faiss-layer.zip

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
OUTPUT_DIR="$PROJECT_ROOT/infrastructure/modules/lambda/files"

mkdir -p "$OUTPUT_DIR"

echo "==> Building FAISS Lambda layer for python3.12 x86_64..."

docker run --rm --platform linux/amd64 \
  --entrypoint bash \
  -v "$OUTPUT_DIR:/output" \
  public.ecr.aws/lambda/python:3.12 \
  -c "
    pip install -q faiss-cpu numpy -t /tmp/python &&
    cd /tmp &&
    zip -qr /output/faiss-layer.zip python
  "

echo "==> Layer built: $OUTPUT_DIR/faiss-layer.zip ($(du -h "$OUTPUT_DIR/faiss-layer.zip" | cut -f1))"
