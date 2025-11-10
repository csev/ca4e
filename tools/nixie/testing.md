# Nixie Challenge – Test Plan

This checklist covers manual tests for the Nixie Challenge tool.

## 1. Smoke Test
- [ ] Load `tools/nixie/index.php` without errors
- [ ] Verify that the selected assignment renders without console warnings
- [ ] Confirm console contains the hint: “Press CTRL-* to see easter egg documentation”

## 2. Base-10 ⇄ Base-2 Conversions (assignment: Base2Conversions)
- [ ] Tab buttons switch between the two exercises without destroying in-progress input
- [ ] `New Number` generates values between **1 and 7** (no auto-solved zero)
- [ ] Entering 0/1 in any bit box immediately updates feedback (no button press required)
- [ ] Correct bit pattern shows a green success message and leaves nixie lit
- [ ] Incorrect pattern highlights the expected binary string in red
- [ ] `New Number` clears bit boxes and feedback, focus returns to the rightmost box
- [ ] Each bit input accepts only 0 or 1 (invalid characters cleared)
- [ ] Typing `101` starting at the rightmost box auto-advances through the remaining boxes; typing from the left also works (`101` or `011` etc.)
- [ ] `New Pattern` generates binary combinations between 000 and 111
- [ ] Typing the correct decimal value lights the nixie instantly
- [ ] Empty input clears feedback and powers off the nixie
- [ ] Invalid characters or values outside 0–7 show validation messaging
- [ ] Score in the tab header increments on each correct challenge and caps at 10/10
- [ ] After a correct response, the related “New …” button shows a five-second countdown before auto-loading the next challenge

## 3. Binary Addition (assignment: BinaryAddition)
- [ ] `New Problem` generates two addends between 0 and 7 and resets inputs
- [ ] Each sum box accepts only `0` or `1` (other keys are cleared)
- [ ] Feedback stays blank until any sum bit is entered
- [ ] Entering the correct four-bit sum (carry + 3 bits) shows a green success message
- [ ] Incorrect sums display the correct answer in red
- [ ] Typing `1100` starting at the leftmost box auto-advances through the remaining boxes
- [ ] Typing `0011` starting at the rightmost box auto-advances to the left
- [ ] Verify carry behaviour by testing problems whose sum ≥ 8 (e.g., 111 + 001)
- [ ] After a correct answer, spinner appears and a new problem auto-loads after 5 seconds
- [ ] Score in the heading increments on correct answers and submits 1.0 to LMS at 10/10

## 4. Hex ⇄ Decimal Conversions (assignment: HexConversions)
- [ ] Tab buttons switch between Decimal → Hex and Hex → Decimal views without losing input
- [ ] `New Number` generates decimal values between 8 and 15 and clears the hex digit field
- [ ] Typing a valid hex digit updates feedback immediately
- [ ] Correct hex digit shows a green success message; incorrect digit shows the expected hex in red
- [ ] Invalid characters are cleared automatically
- [ ] `New Pattern` generates random hex digits (8–F)
- [ ] Entering the correct decimal value (8–15) produces green feedback; incorrect values show the expected decimal in red
- [ ] Score in the tab header increments on each correct response and caps at 10/10
- [ ] Both inputs auto-focus after pressing their respective “New …” buttons

## 5. Accessibility
- [ ] Screen reader announces feedback (`role="status"`)
- [ ] Canvas elements include descriptive `aria-label`
- [ ] All inputs and buttons reachable via keyboard (Tab / Shift+Tab)

## 6. Instructor Experience
- [ ] Instructor dashboard shows Settings, Student Data, and Launches links
- [ ] Settings dialog contains the “Pick the assignment” dropdown with the conversions assignment first
- [ ] Switching assignments updates the learner view after refresh

## 7. Easter Eggs
- [ ] In documentation view, `Ctrl + *` reveals the instructor easter egg section
- [ ] In the main tool, `Ctrl + *` (as an instructor) reveals documentation hint in console and integrates with gating easter eggs
- [ ] Verify that easter egg documentation remains hidden until shortcut is used

## 8. Cross-Browser
- [ ] Test in latest Chrome, Firefox, Safari
- [ ] Verify responsive layout on tablet-size viewport


