# Gates Tool Testing Plan

## Overview
This document outlines comprehensive testing procedures for the Gates tool, including UI validation, error detection, assignment functionality, and easter egg testing.

## Test Environment Setup
1. Access the tool via LTI launch at the /tools URL or direct URL at /tools/toolname
2. Ensure you have instructor privileges for easter egg testing
3. Have multiple browser tabs/windows ready for different test scenarios

## Test Categories

### 1. Empty Assignment Testing
**Purpose**: Verify proper error handling and UI behavior when no assignment is configured.

#### Test Steps:
1. **Access tool without assignment configured**
   - Launch tool with no `exercise` LTI custom variable
   - Verify assignment button is NOT visible
   - Verify no assignment modal appears
   - Verify tool functions normally for general use

2. **Direct URL access without LTI**
   - Access tool directly (anonymous user)
   - Verify no assignment-related UI elements appear
   - Verify tool is fully functional for general use

#### Expected Results:
- No assignment button visible
- No assignment modal accessible
- Tool works normally for circuit building
- No error messages or broken functionality

### 2. Assignment UI Testing
**Purpose**: Verify assignment modal and grading interface work correctly.

#### Test Steps:
1. **Assignment Button Visibility**
   - Configure assignment via LTI custom variable
   - Verify assignment button appears in header
   - Click assignment button to open modal

2. **Assignment Modal Functionality**
   - Verify modal opens and displays instructions
   - Verify modal is draggable (grab header and move)
   - Verify close button (×) works
   - Verify clicking outside modal closes it
   - Verify modal centers properly on screen

3. **Grading Interface**
   - Click "Start Grading" button
   - Verify grading section appears
   - Verify step-by-step grading process
   - Verify no buttons appear on error dialogs
   - Verify success completion and grade submission

#### Expected Results:
- Assignment button visible only when assignment configured
- Modal opens/closes properly with all interactions
- Grading interface functions correctly
- No buttons on error dialogs (except hints if available)

### 3. Easter Egg Testing
**Purpose**: Test the automated circuit creation easter eggs for both assignments.

#### Available Easter Eggs:
- **Ctrl + \*** : Creates Half Adder circuit (Half adder reference!)
- **Ctrl + +** : Creates Full Adder circuit (Full adder reference - ironic!)

#### Test Steps for Half Adder (HalfAdderExercise):

1. **Setup**
   - Configure `HalfAdderExercise` assignment
   - Open assignment modal
   - Start grading process

2. **Easter Egg Activation**
   - Press `Ctrl + *`
   - Verify console message: "🎯 Easter egg triggered! Ctrl + * detected! (Half adder reference!)"
   - Verify circuit automatically appears with:
     - Input A and Input B components
     - XOR gate for SUM output
     - AND gate for CARRY output
     - Output S and C components
     - All necessary wire connections

3. **Grading with Easter Egg**
   - With easter egg circuit in place, continue grading
   - Verify all grading steps pass:
     - Component placement verification
     - Wire connection verification
     - Logic functionality verification
   - Verify grade submission works
   - Verify success message appears

4. **Non-Instructor Test**
   - Test as student user (non-instructor)
   - Press `Ctrl + *`
   - Verify easter egg does NOT activate
   - Verify console message: "❌ Half adder Easter egg attempted by anonymous user"

#### Test Steps for Full Adder (FullAdderExercise):

1. **Setup**
   - Configure `FullAdderExercise` assignment
   - Open assignment modal
   - Start grading process

2. **Easter Egg Activation**
   - Press `Ctrl + +`
   - Verify console message: "🎯 Easter egg triggered! Ctrl + + detected! (Full adder reference - ironic!)"
   - Verify circuit automatically appears with:
     - Input A, B, and Cin components
     - Two XOR gates (for A⊕B and final SUM)
     - Two AND gates (for carry logic)
     - One OR gate (for final carry)
     - Output S and Cout components
     - All necessary wire connections

3. **Grading with Easter Egg**
   - With easter egg circuit in place, continue grading
   - Verify all grading steps pass:
     - Component placement verification
     - Wire connection verification
     - Logic functionality verification
   - Verify grade submission works

### 4. Manual Circuit Building Testing
**Purpose**: Verify normal circuit building functionality works correctly.

#### Test Steps:
1. **Component Placement**
   - Place various logic gates (AND, OR, XOR, NOT, NAND, NOR)
   - Place input and output components
   - Verify components appear correctly
   - Verify component labels and connections

2. **Wire Connections**
   - Connect components with wires
   - Verify wire routing works
   - Verify connections are valid
   - Test multiple input connections

3. **Circuit Simulation**
   - Test circuit with different input combinations
   - Verify output behavior matches expected logic
   - Verify simulation runs without errors
   - Test truth table functionality

### 5. Error Handling Testing
**Purpose**: Verify proper error handling and user feedback.

#### Test Steps:
1. **Invalid Circuit Testing**
   - Build incomplete circuits
   - Start grading with missing components
   - Verify appropriate error messages
   - Verify no buttons appear on error dialogs

2. **Grading Error Scenarios**
   - Test with wrong component types
   - Test with incorrect connections
   - Test with missing outputs
   - Verify error messages are helpful
   - Verify grading can be restarted after fixes

3. **Logic Error Testing**
   - Build circuits with incorrect logic
   - Test with wrong gate types
   - Verify grading catches logic errors
   - Verify helpful error messages

### 6. Cross-Browser Testing
**Purpose**: Verify tool works across different browsers.

#### Test Browsers:
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

#### Test Steps:
1. Run all above tests in each browser
2. Verify easter eggs work in all browsers
3. Verify UI elements render correctly
4. Verify no JavaScript errors in console

### 7. Mobile/Responsive Testing
**Purpose**: Verify tool works on mobile devices.

#### Test Steps:
1. Test on mobile device or browser dev tools mobile view
2. Verify touch interactions work
3. Verify modal is usable on small screens
4. Verify easter eggs work (if keyboard accessible)

## Test Data and Examples

### Half Adder Expected Circuit:
```
Input A ----+---- XOR ---- Output S (SUM)
            |
Input B ----+---- AND ---- Output C (CARRY)
```

### Full Adder Expected Circuit:
```
Input A ----+---- XOR1 ----+---- XOR2 ---- Output S (SUM)
            |              |
Input B ----+              |
                           |
Input Cin -----------------+

Input A ----+---- AND1 ----+
            |              |
Input B ----+              +---- OR ---- Output Cout (CARRY)
                           |
Input Cin ----+---- AND2 ----+
              |
XOR1 output --+
```

## Success Criteria
- All easter eggs work correctly for instructors
- Easter eggs are properly restricted from students
- Assignment functionality works with and without assignments
- Error handling is robust and user-friendly
- No buttons appear on error dialogs
- Tool works across all supported browsers
- Mobile experience is functional
- Logic simulation works correctly

## Known Issues and Limitations
- Easter eggs require instructor privileges
- Some mobile keyboards may not support all easter egg key combinations
- Complex circuits may affect performance on older devices

## Test Execution Checklist
- [ ] Empty assignment testing
- [ ] Assignment UI testing
- [ ] Half Adder easter egg (Ctrl + *)
- [ ] Full Adder easter egg (Ctrl + +)
- [ ] Manual circuit building
- [ ] Logic simulation testing
- [ ] Error handling
- [ ] Cross-browser testing
- [ ] Mobile testing
- [ ] Grade submission verification
- [ ] Console error checking
