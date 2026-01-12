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

echo "Building PDF (XeLaTeX + makeindex) ..."

# 1) Generate LaTeX from Pandoc
pandoc \
  metadata.yaml \
  "${CHAPTERS[@]}" \
  --from markdown \
  --top-level-division=chapter \
  --template=templates/kdp-6x9.tex \
  --toc \
  --no-highlight \
  --resource-path=".:images:chapters" \
  -o build/ca4e.tex

# 2) First LaTeX pass (creates .idx)
xelatex -interaction=nonstopmode -halt-on-error -output-directory=build build/ca4e.tex

# 3) Build the index only if .idx exists
if [[ -f build/ca4e.idx ]]; then
  makeindex build/ca4e.idx
else
  echo "No index entries yet (build/ca4e.idx not created); skipping makeindex."
fi

# 4) Second LaTeX pass (pulls in .ind)
xelatex -interaction=nonstopmode -halt-on-error -output-directory=build build/ca4e.tex

# Optional 3rd pass to settle TOC/page refs (sometimes helpful)
xelatex -interaction=nonstopmode -halt-on-error -output-directory=build build/ca4e.tex


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
