#!/usr/bin/env bash
# build-html3.sh
#
# Build one HTML file per chapter with prev/next navigation + an index.html,
# in the spirit of https://www.py4e.com/html3/
#
# Assumes:
#   - chapters are in ./chapters/ch*.md (lexical order = book order)
#   - metadata.yaml exists (title/author/etc)
#   - optional CSS at ./styles/book.css
#
# Output:
#   ./html3/index.html
#   ./html3/ch01-....html, ./html3/ch02-....html, ...
#
# Usage:
#   ./build-html3.sh
#
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"

# ---- Config ----
OUTDIR="${OUTDIR:-../html}"
CHAPTER_GLOB="${CHAPTER_GLOB:-chapters/ch*.md}"
CSS_FILE="${CSS_FILE:-styles/book.css}"
METADATA_FILE="${METADATA_FILE:-metadata.yaml}"
TITLE_FALLBACK="${TITLE_FALLBACK:-Computer Architecture for Everybody}"

mkdir -p "$OUTDIR"

if ! command -v pandoc >/dev/null 2>&1; then
  echo "ERROR: pandoc not found. Install with: brew install pandoc"
  exit 1
fi

# Collect chapters
shopt -s nullglob
CHAPTERS=( $CHAPTER_GLOB )
shopt -u nullglob

if (( ${#CHAPTERS[@]} == 0 )); then
  echo "ERROR: no chapters found matching: $CHAPTER_GLOB"
  exit 1
fi

# Ensure metadata exists or continue without it
PANDOC_META_ARGS=()
BOOK_TITLE="$TITLE_FALLBACK"
if [[ -f "$METADATA_FILE" ]]; then
  PANDOC_META_ARGS+=( "$METADATA_FILE" )
  # best-effort extract title from metadata.yaml
  BOOK_TITLE="$(python3 - <<'PY'
import re, sys, pathlib
p = pathlib.Path("metadata.yaml")
txt = p.read_text(encoding="utf-8") if p.exists() else ""
m = re.search(r'^\s*title:\s*["\']?(.*?)["\']?\s*$', txt, re.M)
print(m.group(1) if m else "Computer Architecture for Everybody")
PY
)"
fi

# CSS handling (external link, like py4e html3)
CSS_ARGS=()
if [[ -f "$CSS_FILE" ]]; then
  CSS_ARGS+=( --css "$CSS_FILE" )
fi

# Small helper: make a safe output filename for a chapter md file
# e.g., chapters/ch01-origins.md -> ch01-origins.html
out_name_for() {
  local md="$1"
  local base
  base="$(basename "$md")"
  echo "${base%.md}.html"
}

# Extract first H1 title from markdown file, fallback to filename
title_for() {
  local md="$1"
  python3 - <<'PY' "$md"
import re, sys, pathlib
p = pathlib.Path(sys.argv[1])
txt = p.read_text(encoding="utf-8")
# Look for first markdown H1: "# Title"
m = re.search(r'^\s*#\s+(.+?)\s*$', txt, re.M)
if m:
    print(m.group(1).strip())
else:
    # fallback: filename
    print(p.stem.replace('-', ' ').strip())
PY
}

# Build a nav header/footer snippet (raw HTML inserted into markdown)
nav_block() {
  local prev_href="$1"
  local next_href="$2"
  # simple, readable nav. Style comes from CSS (or browser defaults)
  cat <<HTML
<nav class="ca4e-nav" aria-label="Chapter navigation">
  <a class="ca4e-home" href="index.html">Contents</a>
  <span class="ca4e-spacer"></span>
  ${prev_href:+<a class="ca4e-prev" href="${prev_href}">← Previous</a>}
  ${next_href:+<a class="ca4e-next" href="${next_href}">Next →</a>}
</nav>
HTML
}

# Write a temp template that includes basic navigation styling hooks.
# (If you already have your own pandoc template, swap it in.)
TEMPLATE="$OUTDIR/.pandoc-html3-template.html"
cat > "$TEMPLATE" <<'HTML'
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>$if(title-prefix)$$title-prefix$ — $endif$$pagetitle$</title>
$for(css)$
  <link rel="stylesheet" href="$css$" />
$endfor$
  <style>
    /* Minimal defaults if no CSS is provided */
    body { max-width: 50em; margin: 2rem auto; padding: 0 1rem; line-height: 1.55; }
    .ca4e-nav { display: flex; gap: 1rem; align-items: center; margin: 1.25rem 0; padding: .75rem 0; border-top: 1px solid #ddd; border-bottom: 1px solid #ddd; }
    .ca4e-spacer { flex: 1; }
    .ca4e-nav a { text-decoration: none; }
  </style>
</head>
<body>
$body$
</body>
</html>
HTML

echo "Building per-chapter HTML into: $OUTDIR/"
echo "Chapters:"
for md in "${CHAPTERS[@]}"; do echo "  - $md"; done

# Build index.html content
INDEX_MD="$OUTDIR/.index.md"
{
  echo "# $BOOK_TITLE"
  echo
  echo "## Table of Contents"
  echo
  i=0
  for md in "${CHAPTERS[@]}"; do
    ((i+=1))
    t="$(title_for "$md")"
    out="$(out_name_for "$md")"
    printf "%d. [%s](%s)\n" "$i" "$t" "$out"
  done
  echo
} > "$INDEX_MD"

# Render index.html
pandoc \
  "${PANDOC_META_ARGS[@]}" \
  "$INDEX_MD" \
  --from markdown \
  --standalone \
  --template "$TEMPLATE" \
  --metadata title-prefix="$BOOK_TITLE" \
  "${CSS_ARGS[@]}" \
  -o "$OUTDIR/index.html"

# Build each chapter with prev/next links
for idx in "${!CHAPTERS[@]}"; do
  md="${CHAPTERS[$idx]}"
  out_html="$OUTDIR/$(out_name_for "$md")"

  prev_html=""
  next_html=""
  if (( idx > 0 )); then
    prev_html="$(out_name_for "${CHAPTERS[$((idx-1))]}")"
  fi
  if (( idx < ${#CHAPTERS[@]} - 1 )); then
    next_html="$(out_name_for "${CHAPTERS[$((idx+1))]}")"
  fi

  # Create a temporary stitched markdown that includes nav at top and bottom
  tmp="$OUTDIR/.tmp-$(basename "$md")"
  {
    nav_block "$prev_html" "$next_html"
    echo
    cat "$md"
    echo
    nav_block "$prev_html" "$next_html"
    echo
  } > "$tmp"

  chap_title="$(title_for "$md")"

  pandoc \
    "${PANDOC_META_ARGS[@]}" \
    "$tmp" \
    --from markdown \
    --standalone \
    --template "$TEMPLATE" \
    --metadata title-prefix="$BOOK_TITLE" \
    --metadata pagetitle="$chap_title" \
    "${CSS_ARGS[@]}" \
    -o "$out_html"

  rm -f "$tmp"
  echo "  wrote $out_html"
done

# Cleanup temp files
rm -f "$INDEX_MD" "$TEMPLATE"

echo
echo "Done."
echo "Open: $OUTDIR/index.html"

