#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"

mkdir -p build

# Collect chapters in lexical order (ch01, ch02, ...)
CHAPTERS=(chapters/*.md)

if ! command -v pandoc >/dev/null 2>&1; then
  echo "ERROR: pandoc not found. Install with: brew install pandoc"
  exit 1
fi

echo "Building PDF (XeLaTeX) ..."
pandoc \
  metadata.yaml \
  "${CHAPTERS[@]}" \
  --from markdown \
  --template=templates/kdp-6x9.tex \
  --pdf-engine=xelatex \
  --toc \
  --no-highlight \
  --resource-path=".:images:chapters" \
  -o build/ca4e.pdf

echo "Building standalone HTML ..."
pandoc \
  metadata.yaml \
  "${CHAPTERS[@]}" \
  --from markdown \
  --standalone \
  --toc \
  --css styles/book.css \
  --no-highlight \
  --resource-path=".:images:chapters" \
  -o build/ca4e.html

echo "Building EPUB (optional) ..."
pandoc \
  metadata.yaml \
  "${CHAPTERS[@]}" \
  --from markdown \
  --toc \
  --no-highlight \
  --resource-path=".:images:chapters" \
  -o build/ca4e.epub

echo "Done."
echo "Outputs:"
echo "  build/ca4e.pdf"
echo "  build/ca4e.html"
echo "  build/ca4e.epub"
