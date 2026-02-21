# CA4E Accessibility Report

This document summarizes the accessibility audit and improvements made to the Computer Architecture for Everybody (CA4E) project. The audit covered the main site, HTML book content, and tools—excluding the `mod/` and `tsugi/` folders.

## Summary of Fixes Applied

### Main Pages (index.php, explore.php)

- **Typos corrected**: "digitial" → "digital", "inspried" → "inspired", "bettwe" → "better"
- **Semantic landmarks**: Replaced content `<div id="container">` with `<main id="container">` for proper document structure
- **Links opening in new tab**: Added `rel="noopener noreferrer"` to all `target="_blank"` links for security and added `<span class="sr-only">(opens in new tab)</span>` for screen reader users
- **Carousel**: Removed redundant sr-only text (aria-label on controls is sufficient)

### Privacy & Service Pages

- **Typo**: "supress" → "suppress"

### Quick Reference (ref/index.php)

- **Document**: Added `lang="en"`, `charset="UTF-8"`, and `<title>` element
- **HTML structure**: Fixed invalid `echo("<ul>")` to `echo("</ul>")` to properly close the list
- **Expandable sections**: Added `role="button"`, `tabindex="0"`, `aria-expanded`, `aria-label`, and `role="group"` to tree view for keyboard and screen reader support
- **Keyboard**: Added Enter/Space key handlers for expanding sections
- **External links**: Added `rel="noopener noreferrer"` to `target="_blank"` links

### Common Modal System (tools/common/)

- **Dialog role**: Assignment modals now use `role="dialog"`, `aria-modal="true"`, and `aria-labelledby` when registered with `isDialog: true`
- **Focus management**: Focus moves to the first focusable element when a modal opens and returns to the trigger when it closes
- **Escape key**: Modal closes on Escape (already present)
- **sr-only utility**: Added `.sr-only` class to modal-styles.css for screen-reader-only content

### Digital Logic Builder (tools/gates/)

- **Form labels**: Added `aria-label` to `gateSelector`, `storageDropdown`, `commandsSelector`, and `commandInput`
- **Label elements**: Added `<label for="gateSelector">` and `<label for="commandInput">` with sr-only class

## What Was Already Good

- **HTML book content**: All images have descriptive `alt` text; figures use `figcaption` with `aria-hidden="true"` to avoid duplicate announcements where alt matches caption
- **Chapter navigation**: `<nav aria-label="Chapter navigation">` on all chapter pages
- **Truth Table tool**: Good use of `aria-live`, `aria-describedby`, table captions, and `role="img"` with `aria-label` on gate diagrams
- **Build menu**: User avatar has `alt` and `title` attributes
- **Carousel**: Has `role="region"` and `aria-label="Featured photos"`; images have descriptive alt text

## Recommendations for Future Work

### High Priority

1. **Form labels across tools**: Add `aria-label` or associated `<label>` to selects and inputs in CMOS, CDC6504, Mistic, WASM, ASCII, and other tools
2. **Focus trap in modals**: Implement a full focus trap so Tab cycles only within the modal while it is open
3. **Confirmation modals**: Apply `role="dialog"` and focus management to the gates "Delete All" confirmation and similar dialogs

### Medium Priority

4. **target="_blank" in documentation**: Add `rel="noopener noreferrer"` and "(opens in new tab)" where needed in tools/documentation.html files
5. **Canvas-based tools**: Provide text alternatives or keyboard-accessible alternatives for canvas interactions (circuit builders, gates, etc.)
6. **Color contrast**: Verify contrast ratios meet WCAG AA (4.5:1 for normal text, 3:1 for large text)
7. **Heading hierarchy**: Ensure pages use a logical h1→h2→h3 order

### Lower Priority

8. **Skip link**: Add a "Skip to main content" link at the top of pages for keyboard users
9. **Reduced motion**: Consider respecting `prefers-reduced-motion` for carousel and animations
10. **Language**: Ensure `lang="en"` (or appropriate value) on all HTML documents

## Testing Recommendations

- Run automated checks with [axe DevTools](https://www.deque.com/axe/devtools/) or [WAVE](https://wave.webaim.org/)
- Test with keyboard only (Tab, Enter, Space, Escape)
- Test with NVDA, JAWS, or VoiceOver
- Verify focus order and visible focus indicators
