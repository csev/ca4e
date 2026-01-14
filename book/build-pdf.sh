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
  --lua-filter=filters/image-attributions.lua \
  --resource-path=".:images:chapters" \
  -o build/ca4e.tex

# No need to process inline references - they're suppressed in the Lua filter

# 1b) Post-process LaTeX to add image credits section
# Extract attributions from markdown and add credits before \printindex
if grep -q 'class="image-attribution"' chapters/*.md 2>/dev/null && ! grep -q "\\chapter{Image Credits}" build/ca4e.tex; then
  # Build credits section by extracting attributions from markdown
  CREDITS_TMP=$(mktemp)
  echo "\\appendix" >> "$CREDITS_TMP"
  echo "\\chapter{Image Credits}" >> "$CREDITS_TMP"
  echo "\\begin{itemize}" >> "$CREDITS_TMP"
  
  # First, build a map of figure numbers by finding figures in LaTeX and matching to attributions
  # Process each markdown file and track chapter + figure numbers
  CHAP_NUM=0
  for md_file in chapters/*.md; do
    CHAP_NUM=$((CHAP_NUM + 1))
    FIG_NUM=0
    
    # Count images (figures) in this chapter before each attribution
    IN_DIV=false
    while IFS= read -r line; do
      # Count images (markdown image syntax)
      if [[ "$line" =~ ^!\[.*\]\(images/ ]]; then
        FIG_NUM=$((FIG_NUM + 1))
      fi
      # When we find an attribution, use current figure number
      if [[ "$line" =~ class=\"image-attribution\" ]]; then
        IN_DIV=true
        continue
      fi
      if [[ "$IN_DIV" == true ]] && [[ -n "$line" ]] && [[ ! "$line" =~ ^\</div ]]; then
        # Use figure number in format chapter.figure (e.g., 1.1, 1.2, 7.5)
        FIG_REF="${CHAP_NUM}.${FIG_NUM}"
        
        # Clean up the attribution text: remove HTML tags, convert markdown links to LaTeX \href
        CLEANED=$(echo "$line" | \
          sed 's/<[^>]*>//g' | \
          perl -pe 's/\[([^\]]+)\]\(([^)]+)\)/\\href{$2}{$1}/g' | \
          sed 's/^[[:space:]]*//' | \
          sed 's/[[:space:]]*$//')
        # Escape special LaTeX characters in \href URLs only
        CLEANED=$(echo "$CLEANED" | perl -pe 's/\\href\{([^}]+)\}/\\href{'$(echo '\1' | sed 's/_/\\_/g' | sed 's/#/\\#/g' | sed 's/%/\\%/g')'}/g')
        echo "\\item[Figure $FIG_REF] $CLEANED" >> "$CREDITS_TMP"
        IN_DIV=false
      fi
      if [[ "$line" =~ ^\</div ]]; then
        IN_DIV=false
      fi
    done < "$md_file"
  done
  
  echo "\\end{itemize}" >> "$CREDITS_TMP"
  
  # Insert credits before \printindex
  if grep -q "\\printindex" build/ca4e.tex && [[ -s "$CREDITS_TMP" ]]; then
    # Use awk with proper escaping - read credits from file
    awk -v credits_file="$CREDITS_TMP" '
      /\\printindex/ {
        while ((getline line < credits_file) > 0) {
          print line
        }
        close(credits_file)
        print
        next
      }
      { print }
    ' build/ca4e.tex > build/ca4e.tex.tmp && mv build/ca4e.tex.tmp build/ca4e.tex
  else
    echo "Skipping credits: printindex=$(grep -c '\\printindex' build/ca4e.tex), file_size=$(wc -c < "$CREDITS_TMP"), attrib_count=$ATTRIB_NUM"
  fi
  
  rm -f "$CREDITS_TMP"
fi

# Ensure images directory is accessible from build/ directory
# XeLaTeX runs with -output-directory=build, so it needs images/ in build/
if [[ ! -e build/images ]]; then
  ln -s ../images build/images 2>/dev/null || cp -r images build/images
fi

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
