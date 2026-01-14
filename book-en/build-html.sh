#!/usr/bin/env bash
# build-html3.sh
# Build one HTML file per chapter + index.html with prev/next navigation.

set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"

OUTDIR="${OUTDIR:-../html}"
CHAPTER_GLOB="${CHAPTER_GLOB:-chapters/ch*.md}"
CSS_FILE="${CSS_FILE:-styles/book.css}"
METADATA_FILE="${METADATA_FILE:-metadata.yaml}"
TITLE_FALLBACK="${TITLE_FALLBACK:-Computer Architecture for Everybody}"

mkdir -p "$OUTDIR"

# Copy or link images directory to output directory so HTML can reference them
if [[ ! -e "$OUTDIR/images" ]]; then
  # Try relative symlink first, fall back to absolute symlink or copy
  OUTDIR_ABS="$(cd "$OUTDIR" && pwd)"
  IMAGES_ABS="$ROOT/images"
  rel_path=$(python3 -c "import os.path; print(os.path.relpath('$IMAGES_ABS', '$OUTDIR_ABS'))" 2>/dev/null)
  if [[ -n "$rel_path" ]]; then
    ln -s "$rel_path" "$OUTDIR/images" 2>/dev/null || ln -s "$IMAGES_ABS" "$OUTDIR/images" 2>/dev/null || cp -r "$ROOT/images" "$OUTDIR/images"
  else
    ln -s "$IMAGES_ABS" "$OUTDIR/images" 2>/dev/null || cp -r "$ROOT/images" "$OUTDIR/images"
  fi
fi

# Copy CSS file directly to output directory
if [[ -f "$CSS_FILE" ]]; then
  cp "$CSS_FILE" "$OUTDIR/book.css"
fi

if ! command -v pandoc >/dev/null 2>&1; then
  echo "ERROR: pandoc not found. Install with: brew install pandoc"
  exit 1
fi

# Collect chapters in lexical order
shopt -s nullglob
CHAPTERS=( $CHAPTER_GLOB )
shopt -u nullglob

if (( ${#CHAPTERS[@]} == 0 )); then
  echo "ERROR: no chapters found matching: $CHAPTER_GLOB"
  exit 1
fi

# Pull book title from metadata.yaml if present (simple parse), else fallback
BOOK_TITLE="$TITLE_FALLBACK"
if [[ -f "$METADATA_FILE" ]]; then
  # first matching "title:" line, strip leading "title:" and optional quotes
  t="$(grep -E '^[[:space:]]*title:' "$METADATA_FILE" | head -n 1 | sed -E 's/^[[:space:]]*title:[[:space:]]*//; s/^["'\''](.*)["'\'']$/\1/')"
  if [[ -n "${t:-}" ]]; then
    BOOK_TITLE="$t"
  fi
fi

CSS_ARGS=()
if [[ -f "$CSS_FILE" ]]; then
  CSS_ARGS+=( --css "book.css" )
fi

out_name_for() {
  local md="$1"
  local base
  base="$(basename "$md")"
  echo "${base%.md}.html"
}

title_for() {
  local md="$1"
  # First Markdown H1 (“# ...”) or fallback to filename stem
  local h1
  h1="$(grep -m 1 -E '^[[:space:]]*# ' "$md" | sed -E 's/^[[:space:]]*#[[:space:]]+//')"
  if [[ -n "${h1:-}" ]]; then
    echo "$h1"
  else
    basename "$md" .md | tr '-' ' '
  fi
}

nav_block() {
  local prev_href="$1"
  local next_href="$2"

  echo '<nav class="ca4e-nav" aria-label="Chapter navigation">'
  echo '  <a class="ca4e-home" href="index.html">Contents</a>'
  echo '  <span class="ca4e-spacer"></span>'
  if [[ -n "$prev_href" ]]; then
    echo "  <a class=\"ca4e-prev\" href=\"$prev_href\">← Previous</a>"
  fi
  if [[ -n "$next_href" ]]; then
    echo "  <a class=\"ca4e-next\" href=\"$next_href\">Next →</a>"
  fi
  echo '</nav>'
}

# Minimal template (keeps look consistent; you can replace later)
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
    body { max-width: 50em; margin: 2rem auto; padding: 0 1rem; line-height: 1.55; }
    .ca4e-nav { display:flex; gap:1rem; align-items:center; margin: 1.25rem 0; padding:.75rem 0; border-top:1px solid #ddd; border-bottom:1px solid #ddd; }
    .ca4e-spacer { flex: 1; }
    .ca4e-nav a { text-decoration:none; }
    img { max-height: 200px; width: auto; height: auto; display: block; margin: 0 auto; }
    figure { margin: 1.5em 0; }
    figcaption { text-align: center; font-style: italic; margin-top: 0.5em; }
    .image-attribution { font-size: 0.85em; color: #666; margin-top: 0.5em; margin-bottom: 1em; text-align: center; font-style: italic; }
    .image-attribution a { color: #0066cc; }
  </style>
  <script>
    document.addEventListener('DOMContentLoaded', function() {
      var chapterNum = '$chapter-number$';
      
      // Only number if chapterNum is not empty (index page has empty string)
      // On index page: chapterNum will be empty string ""
      // On chapter pages: chapterNum will be "1", "2", etc.
      var isValid = chapterNum && chapterNum.trim() !== '';
      
      if (isValid) {
        var sectionNum = 0;
        var figureNum = 0;
        
        // Number h2 sections
        var h2s = document.querySelectorAll('h2');
        h2s.forEach(function(h2) {
          sectionNum++;
          var text = h2.textContent;
          h2.textContent = chapterNum + '.' + sectionNum + ' ' + text;
        });
        
        // Number figures
        var figures = document.querySelectorAll('figure');
        figures.forEach(function(fig) {
          figureNum++;
          var caption = fig.querySelector('figcaption');
          if (caption) {
            var text = caption.textContent;
            caption.innerHTML = '<strong>Figure ' + chapterNum + '.' + figureNum + ':</strong> ' + text;
          }
        });
      }
    });
  </script>
</head>
<body>
$body$
</body>
</html>
HTML

echo "Building per-chapter HTML into: $OUTDIR/"
echo "Book title: $BOOK_TITLE"
echo "Chapters:"
for md in "${CHAPTERS[@]}"; do echo "  - $md"; done

# Build index markdown
INDEX_MD="$OUTDIR/.index.md"
{
  echo "# $BOOK_TITLE"
  echo
  echo "## Table of Contents"
  echo
  i=0
  for md in "${CHAPTERS[@]}"; do
    i=$((i+1))
    t="$(title_for "$md")"
    out="$(out_name_for "$md")"
    printf "%d. [%s](%s)\n" "$i" "$t" "$out"
  done
  echo
} > "$INDEX_MD"

# Render index.html
pandoc \
  ${METADATA_FILE:+$METADATA_FILE} \
  "$INDEX_MD" \
  --from markdown \
  --standalone \
  --template "$TEMPLATE" \
  --metadata title-prefix="$BOOK_TITLE" \
  --resource-path=".:images:chapters" \
  "${CSS_ARGS[@]}" \
  -o "$OUTDIR/index.html"

# Render each chapter
for ((idx=0; idx<${#CHAPTERS[@]}; idx++)); do
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
  
  # Extract chapter number from filename (e.g., ch01-origins.md -> 1)
  chap_num=$((idx + 1))

  pandoc \
    ${METADATA_FILE:+$METADATA_FILE} \
    "$tmp" \
    --from markdown \
    --standalone \
    --template "$TEMPLATE" \
    --metadata title-prefix="$BOOK_TITLE" \
    --metadata pagetitle="$chap_title" \
    --metadata chapter-number="$chap_num" \
    --lua-filter=filters/image-attributions.lua \
    --resource-path=".:images:chapters" \
    "${CSS_ARGS[@]}" \
    -o "$out_html"

  rm -f "$tmp"
  echo "  wrote $out_html"
done

rm -f "$INDEX_MD" "$TEMPLATE"
echo "Done. Open: $OUTDIR/index.html"

