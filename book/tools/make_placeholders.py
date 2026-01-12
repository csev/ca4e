#!/usr/bin/env python3
"""
make_placeholders.py

Scan chapters for Markdown image refs and create missing image files under images/.

Usage:
  python3 tools/make_placeholders.py

Notes:
- Requires Pillow: pip3 install pillow
- Creates 1600x1000 placeholders by default (good for print + web).
"""

from __future__ import annotations

import os
import re
import sys
from pathlib import Path

# --- Config ---
ROOT = Path(__file__).resolve().parents[1]  # repo root if script is tools/...
CHAPTERS_DIR = ROOT / "chapters"
IMAGES_DIR = ROOT / "images"
DEFAULT_SIZE = (1600, 1000)  # width, height

# Markdown image pattern: ![alt](images/path.png "optional title")
IMG_RE = re.compile(
    r"!\[(?P<alt>[^\]]*)\]\((?P<path>images/[^)\s]+)(?:\s+\"[^\"]*\")?\)"
)

def ensure_pillow():
    try:
        from PIL import Image, ImageDraw, ImageFont  # noqa: F401
    except Exception as e:
        print("ERROR: This script requires Pillow.")
        print("Install with: pip3 install pillow")
        raise

def load_font(size: int):
    """Try a few common fonts; fall back to default."""
    from PIL import ImageFont

    candidates = [
        "/System/Library/Fonts/SFNS.ttf",  # macOS (sometimes blocked)
        "/System/Library/Fonts/Supplemental/Arial.ttf",
        "/System/Library/Fonts/Supplemental/Helvetica.ttf",
        "/Library/Fonts/Arial.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",  # linux
        "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
    ]
    for p in candidates:
        try:
            if Path(p).exists():
                return ImageFont.truetype(p, size=size)
        except Exception:
            pass
    return ImageFont.load_default()

def make_placeholder(img_path: Path, alt: str, size=DEFAULT_SIZE):
    from PIL import Image, ImageDraw

    img_path.parent.mkdir(parents=True, exist_ok=True)

    w, h = size
    im = Image.new("RGB", (w, h), (245, 247, 249))
    draw = ImageDraw.Draw(im)

    # Border
    draw.rectangle([20, 20, w - 20, h - 20], outline=(160, 160, 160), width=4)

    # Title text
    rel = img_path.as_posix()
    label = f"PLACEHOLDER IMAGE\n\n{rel}"
    if alt.strip():
        label += f"\n\nAlt text:\n{alt.strip()}"

    # Fonts
    font_title = load_font(56)
    font_body = load_font(34)

    # Centered multiline text
    # Split: big heading + rest
    lines = label.splitlines()
    # First line bold-ish
    y = 120
    x_pad = 80

    # Draw heading
    draw.text((x_pad, y), lines[0], fill=(30, 30, 30), font=font_title)
    y += 90

    # Draw remaining lines
    for ln in lines[1:]:
        if ln == "":
            y += 28
            continue
        # wrap long lines crudely
        chunks = []
        cur = ln
        max_chars = 60
        while len(cur) > max_chars:
            cut = cur.rfind(" ", 0, max_chars)
            if cut < 0:
                cut = max_chars
            chunks.append(cur[:cut].strip())
            cur = cur[cut:].strip()
        chunks.append(cur)

        for c in chunks:
            draw.text((x_pad, y), c, fill=(60, 60, 60), font=font_body)
            y += 44

    # “X” diagonals to make it obviously placeholder
    draw.line([40, 40, w - 40, h - 40], fill=(200, 200, 200), width=6)
    draw.line([w - 40, 40, 40, h - 40], fill=(200, 200, 200), width=6)

    # Save by extension
    ext = img_path.suffix.lower()
    if ext in [".jpg", ".jpeg"]:
        im.save(img_path, quality=92)
    else:
        im.save(img_path)

def main():
    ensure_pillow()

    if not CHAPTERS_DIR.exists():
        print(f"ERROR: {CHAPTERS_DIR} not found. Run from the repo that has chapters/ and images/.")
        return 2

    IMAGES_DIR.mkdir(parents=True, exist_ok=True)

    md_files = sorted(CHAPTERS_DIR.glob("ch*.md"))
    if not md_files:
        print(f"ERROR: No chapter markdown files found in {CHAPTERS_DIR}")
        return 2

    found = []
    for md in md_files:
        text = md.read_text(encoding="utf-8")
        for m in IMG_RE.finditer(text):
            alt = m.group("alt") or ""
            rel_path = m.group("path")
            found.append((md, alt, rel_path))

    if not found:
        print("No image references found in chapters.")
        return 0

    created = 0
    skipped = 0

    for md, alt, rel_path in found:
        out_path = ROOT / rel_path
        # Only create common raster images
        if out_path.suffix.lower() not in [".png", ".jpg", ".jpeg"]:
            continue
        if out_path.exists():
            skipped += 1
            continue
        make_placeholder(out_path, alt)
        created += 1
        print(f"Created: {out_path.relative_to(ROOT)}   (from {md.name})")

    print()
    print(f"Done. Created {created} placeholders, skipped {skipped} existing images.")
    return 0

if __name__ == "__main__":
    raise SystemExit(main())

