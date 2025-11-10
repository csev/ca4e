# Nixie Challenge

The Nixie Challenge is a Tsugi tool that helps learners strengthen their number-system intuition. The launch currently includes two assignments: glowing nixie conversions between base-10 and base-2, and a text-based binary addition drill.

## Features

- Base-10 ⇄ Base-2 conversions with interactive bit toggles (4s, 2s, 1s) and instant feedback.
- Binary addition practice (3-bit + 3-bit) with one input per sum bit, including the final carry.
- Simplified nixie tube rendering powered by the Canvas 2D API.
- Instructor dashboard (Settings → “Pick the assignment”) plus Student Data and Launches views.
- Keyboard-accessible controls, ARIA feedback announcements, and a documentation easter egg that mirrors the tool shortcuts.

## File Overview

- `index.php` – Tsugi entry point, assignment routing, and UI markup.
- `nixie.js` – Exercise logic (conversions + binary addition) and nixie renderer.
- `styles.css` – Neon-inspired styling shared across assignments.
- `documentation.html` – Tool overview and instructor notes.
- `testing.md` – Manual testing checklist.
- `register.php` / `tsugi.php` – Tsugi integration metadata.
- `assignments.php` – Assignment definitions for the instructor dropdown.
- `instructor.php`, `grades.php`, `grade-detail.php` – Instructor dashboard and student data views.

## Future Ideas

- Add automated grading integration for LMS grade passback.
- Expand to additional binary skills (subtraction, two’s complement, etc.).
- Record learner progress or streaks for gamification.


