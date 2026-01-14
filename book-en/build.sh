#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"

# Clean up temporary LaTeX files from previous builds
echo "Cleaning temporary files..."
mkdir -p build
rm -f build/ca4e.aux build/ca4e.idx build/ca4e.ind build/ca4e.ilg build/ca4e.log build/ca4e.out build/ca4e.toc build/ca4e.tex

# Build EPUB
if [[ -f "$ROOT/build-epub.sh" ]]; then
  echo "Building EPUB..."
  "$ROOT/build-epub.sh"
else
  echo "ERROR: build-epub.sh not found"
  exit 1
fi

# Build HTML
if [[ -f "$ROOT/build-html.sh" ]]; then
  echo "Building HTML..."
  "$ROOT/build-html.sh"
else
  echo "ERROR: build-html.sh not found"
  exit 1
fi

# Build PDF with index
if [[ -f "$ROOT/build-pdf.sh" ]]; then
  echo "Building PDF with index..."
  "$ROOT/build-pdf.sh" --index
else
  echo "ERROR: build-pdf.sh not found"
  exit 1
fi

echo "Done."
echo "Outputs:"
echo "  build/ca4e.pdf"
echo "  build/ca4e.epub"
echo "  ../html/"