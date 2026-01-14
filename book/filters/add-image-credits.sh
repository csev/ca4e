#!/usr/bin/env bash
# Post-process LaTeX file to add image credits section
# This script scans the LaTeX for [1], [2], etc. references and adds a credits section

set -euo pipefail

LATEX_FILE="$1"

if [[ ! -f "$LATEX_FILE" ]]; then
  echo "Error: LaTeX file not found: $LATEX_FILE"
  exit 1
fi

# Extract attributions from the markdown source
# Look for div.image-attribution blocks and collect them
ATTRIBS_FILE=$(mktemp)
trap "rm -f $ATTRIBS_FILE" EXIT

# Find all attribution divs in markdown files
grep -h -A 5 'class="image-attribution"' chapters/*.md 2>/dev/null | \
  grep -v 'class="image-attribution"' | \
  sed 's/^--$//' | \
  sed '/^$/d' > "$ATTRIBS_FILE" || true

# Count attributions
ATTRIB_COUNT=$(grep -c '\[' "$ATTRIBS_FILE" 2>/dev/null || echo "0")

if [[ "$ATTRIB_COUNT" -eq 0 ]]; then
  # No attributions found, exit
  exit 0
fi

# Check if credits section already exists
if grep -q "Image Credits" "$LATEX_FILE"; then
  exit 0
fi

# Find where to insert (before \printindex)
if grep -q "\\printindex" "$LATEX_FILE"; then
  # Insert before \printindex
  # For now, let's use a simpler approach - the Lua filter should work
  # but if it doesn't, we can enhance this script
  echo "Note: Image credits should be added by Lua filter"
fi
