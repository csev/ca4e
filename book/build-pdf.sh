#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"

# Check if --index parameter is provided
BUILD_INDEX=false
if [[ "${1:-}" == "--index" ]]; then
  BUILD_INDEX=true
fi

mkdir -p build

# Collect chapters in lexical order (ch01, ch02, ...)
CHAPTERS=(chapters/*.md)

if ! command -v pandoc >/dev/null 2>&1; then
  echo "ERROR: pandoc not found. Install with: brew install pandoc"
  exit 1
fi

if [[ "$BUILD_INDEX" == "true" ]]; then
  echo "Building PDF with index (XeLaTeX + makeindex) ..."
else
  echo "Building PDF (quick single-pass, no index) ..."
fi

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

if [[ "$BUILD_INDEX" == "true" ]]; then
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
else
  # Quick single-pass build (no index)
  xelatex -interaction=nonstopmode -halt-on-error -output-directory=build build/ca4e.tex
fi

echo "PDF build complete: build/ca4e.pdf"
