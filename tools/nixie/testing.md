# Nixie Challenge – Test Plan

This checklist covers manual tests for the Nixie Challenge tool.

## 1. Smoke Test
- [ ] Load `tools/nixie/index.php` without errors
- [ ] Verify both nixie displays render and show a random value/pattern
- [ ] Confirm console contains the hint: “Press CTRL-* to see easter egg documentation”

## 2. Base-10 ➜ Base-2 Exercise
- [ ] `New Number` generates values between 0 and 7 (no repeats required)
- [ ] Toggling bits updates the internal value (use `Check Answer`)
- [ ] Correct binary combination shows a green success message
- [ ] Incorrect combination provides the expected binary string and shows red message
- [ ] `New Number` clears checkboxes and feedback
- [ ] Keyboard space toggles checkboxes when focused

## 3. Base-2 ➜ Base-10 Exercise
- [ ] `New Pattern` generates binary combinations between 000 and 111
- [ ] Entering the correct decimal value shows green feedback and lights the nixie
- [ ] Incorrect values show the expected decimal result and keep nixie off
- [ ] Empty input triggers validation message
- [ ] Values outside 0–7 show validation message
- [ ] `New Pattern` resets input, feedback, and nixie display

## 4. Accessibility
- [ ] Screen reader announces feedback (role="status")
- [ ] Canvas elements include descriptive `aria-label`
- [ ] Form fields and buttons reachable via keyboard

## 5. Easter Eggs
- [ ] In documentation view, `Ctrl + *` reveals the instructor easter egg section
- [ ] In the main tool, `Ctrl + *` (as an instructor) reveals documentation hint in console and integrates with gating easter eggs
- [ ] Verify that easter egg documentation remains hidden until shortcut is used

## 6. Cross-Browser
- [ ] Test in latest Chrome, Firefox, Safari
- [ ] Verify responsive layout on tablet-size viewport


