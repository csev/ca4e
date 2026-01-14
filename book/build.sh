#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"

# Build PDF with index first
if [[ -f "$ROOT/build-pdf.sh" ]]; then
  echo "Building PDF with index..."
  "$ROOT/build-pdf.sh" --index
else
  echo "ERROR: build-pdf.sh not found"
  exit 1
fi

# Build EPUB (will skip PDF rebuild if PDF already exists)
if [[ -f "$ROOT/build-epub.sh" ]]; then
  "$ROOT/build-epub.sh"
else
  echo "ERROR: build-epub.sh not found"
  exit 1
fi

echo "Done."
echo "Outputs:"
echo "  build/ca4e.pdf"
echo "  build/ca4e.epub"
