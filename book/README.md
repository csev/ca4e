# CA4E Book Build (Pandoc + XeLaTeX)

## Quick start (macOS)

1. Install pandoc if needed:
   - `brew install pandoc`

2. Build everything:
   - `./build.sh`

Outputs appear in `build/`:
- `ca4e.pdf` (print-ready starter)
- `ca4e.html` (standalone HTML)
- `ca4e.epub` (optional)

## Add chapters

Drop new chapters into `chapters/` as `ch03-*.md`, `ch04-*.md`, etc.
The build script includes them automatically in filename order.

## Images

Put images in `images/` and reference them like:

`![caption](images/ch02-cmos-not-gate.png)`

Pandoc will embed them into PDF/HTML/EPUB.

## Trim size & margins

The PDF template is in `templates/kdp-6x9.tex`.
Tweak geometry there if you change trim size or want different margins.

## Fonts (important)

The PDF template defaults to macOS system fonts (`Times New Roman`, `Helvetica`, `Menlo`) so it works out of the box.
If you want TeX Gyre or JetBrains Mono, install those fonts (or full MacTeX) and update `templates/kdp-6x9.tex`.
