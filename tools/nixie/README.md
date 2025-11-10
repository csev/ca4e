# Nixie Challenge

The Nixie Challenge is a Tsugi tool that helps learners strengthen their number-system intuition. The launch currently includes three assignments: glowing nixie conversions between base-10 and base-2, a seven-segment hex ⇄ decimal conversion drill, and a text-based binary addition activity.

## Features

- Base-10 ⇄ Base-2 conversions with per-bit inputs (4s, 2s, 1s) and instant feedback.
- Hex ⇄ Decimal conversions rendered on a red-on-white seven-segment display.
- Binary addition practice (3-bit + 3-bit) with one input per sum bit, including the final carry.
- Instructor dashboard (Settings → “Pick the assignment”) plus Student Data and Launches views.
- Keyboard-accessible controls, ARIA feedback announcements, and a documentation easter egg that mirrors the tool shortcuts.

## File Overview

- `index.php` – Tsugi entry point, assignment routing, and UI markup.
- `nixie.js` – Exercise logic (conversions, hex practice, binary addition) and canvas renderers.
- `styles.css` – Neon-inspired styling shared across assignments.
- `documentation.html` – Tool overview and instructor notes.
- `testing.md` – Manual testing checklist.
- `register.php` / `tsugi.php` – Tsugi integration metadata.
- `assignments.php` – Assignment definitions for the instructor dropdown.
- `instructor.php`, `grades.php`, `grade-detail.php` – Instructor dashboard and student data views.

## Future Ideas

- Add automated grading integration for LMS grade passback.
- Expand to additional binary/hex skills (subtraction, two’s complement, etc.).
- Record learner progress or streaks for gamification.


