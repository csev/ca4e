#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"

# Build PDF first only if it doesn't already exist (skip if called from build.sh)
if [[ ! -f "$ROOT/build/ca4e.pdf" ]]; then
  if [[ -f "$ROOT/build-pdf.sh" ]]; then
    echo "Building PDF first..."
    "$ROOT/build-pdf.sh"
  else
    echo "WARNING: build-pdf.sh not found, skipping PDF build"
  fi
else
  echo "PDF already exists, skipping PDF build"
fi

mkdir -p build

# Collect chapters in lexical order (ch01, ch02, ...)
CHAPTERS=(chapters/*.md)

if ! command -v pandoc >/dev/null 2>&1; then
  echo "ERROR: pandoc not found. Install with: brew install pandoc"
  exit 1
fi

echo "Building EPUB ..."

pandoc \
  metadata.yaml \
  "${CHAPTERS[@]}" \
  --from markdown \
  --toc \
  --no-highlight \
  --resource-path=".:images:chapters" \
  -o build/ca4e.epub

echo "EPUB build complete: build/ca4e.epub"
