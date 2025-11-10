# Nixie Challenge

The Nixie Challenge is a lightweight Tsugi tool that helps learners practice converting numbers between base-10 and base-2. The interface features a glowing nixie tube display inspired by the digital logic “Gates” tool.

## Features

- Base-10 → Base-2 exercise with interactive bit toggles (4s, 2s, 1s).
- Base-2 → Base-10 exercise that accepts decimal input and lights the nixie on success.
- Simplified nixie tube rendering powered by the Canvas 2D API.
- Keyboard-accessible controls and ARIA feedback announcements.
- Hidden documentation easter egg that mirrors the tool’s own instructor shortcuts.

## File Overview

- `index.php` – Tsugi entry point and UI markup.
- `nixie.js` – Exercise logic and nixie tube renderer.
- `styles.css` – Neon-inspired styling.
- `documentation.html` – Tool overview and instructor notes.
- `testing.md` – Manual testing checklist.
- `register.php` / `tsugi.php` – Tsugi integration metadata.

## Future Ideas

- Add assignment integration with automated grading.
- Expand exercises to cover 4-bit (0–15) conversions.
- Record learner progress or streaks for gamification.


