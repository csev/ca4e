# Logic Truth Table Challenge

The Logic Truth Table Challenge is an LTI tool built on Tsugi that helps students practise the canonical logic gates (NOT, AND, OR, XOR, NAND, NOR). Each round shows a gate schematic alongside a partially blank truth table. Students fill in the missing outputs to earn points; reaching 10 correct tables pushes a perfect grade (1.0) back to the LMS.

## Getting Started

1. Deploy the tool folder (`tools/logic`) alongside other Tsugi tools.
2. Register it with your Tsugi instance (e.g., via the admin console or by adding it to the tool directories).
3. Add the tool to your LMS using the Tsugi launch URL.

## Features

- High-contrast, large-format interface tuned for low-vision accessibility.
- Auto-advance countdown (optional) with manual control.
- Keyboard-friendly inputs (0/1 only, arrow navigation).
- Score tracking up to 10 points with LMS grade submission on completion.
- Instructor dashboard with assignment picker (currently a single “All Gates” set), student grades, and launch analytics.

## File Overview

- `index.php` – Launch page that assembles the UI and wires Tsugi variables.
- `logic.js` – Gate definitions, gameplay logic, scoring, auto-advance, and grade submission.
- `styles.css` – Styling and accessibility treatments.
- `assignments.php` – Assignment map exposed to the instructor dashboard.
- `instructor.php` – Reuses the shared Tsugi instructor shell.
- `grades.php` / `grade-detail.php` – Links into Tsugi’s gradebook UI.
- `grade-submit.php` – Lightweight endpoint calling `LTIX::gradeSend`.
- `documentation.html` – Expanded documentation for instructors and developers.
- `testing.md` – Manual QA checklist.

## LMS Grade Behaviour

The tool records a point for every fully correct truth table. When the learner reaches 10 points:

- `grade-submit.php` posts a score of `1.0` using `LTIX::gradeSend`.
- An alert confirms that the grade has been submitted successfully.
- Learners can keep practicing; additional completions do not resubmit the grade.

## Accessibility

- Inputs accept only the characters 0 and 1 and expose validation via `aria-invalid`.
- Feedback is delivered through an `aria-live="polite"` region.
- Reduced-motion users avoid countdown animations thanks to a CSS media query.
- Controls feature generous hit targets, readable type, and high contrast.

## Development Notes

- Gate schematics are rendered as inline SVG for crisp scaling across devices.
- All random gate selection avoids immediate repeats to keep practice varied.
- Auto-advance is driven by a five-second countdown; unchecking the toggle cancels the timer.

## Testing

Run through the checklist in `testing.md` after any change. Ensure the grade submission endpoint is reachable from your Tsugi deployment before production use.


