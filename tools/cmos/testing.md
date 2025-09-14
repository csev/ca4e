# CMOS Tool Testing Plan

## Overview
This document outlines comprehensive testing procedures for the CMOS tool, including UI validation, error detection, assignment functionality, and easter egg testing.

## Test Environment Setup
1. Access the tool via LTI launch at the /tools URL or direct URL
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
- **Ctrl + \*** : Creates CMOS NOT gate circuit (Hitchhiker's Guide reference - 42!)
- **Ctrl + |** : Creates CMOS NOR gate circuit

#### Test Steps for CMOS NOT Gate (CmosNotGateExercise):

1. **Setup**
   - Configure `CmosNotGateExercise` assignment
   - Open assignment modal
   - Start grading process

2. **Easter Egg Activation**
   - Press `Ctrl + *` (instructor only)
   - Verify console message: "🎯 CMOS Easter egg triggered! Ctrl + * detected!"
   - Verify circuit automatically appears with:
     - PMOS transistor (top)
     - NMOS transistor (bottom)
     - Input connection
     - Output connection
     - VDD and GND connections
     - All necessary wires

3. **Grading with Easter Egg**
   - With easter egg circuit in place, continue grading
   - Verify all grading steps pass
   - Verify grade submission works
   - Verify success message appears

4. **Non-Instructor Test**
   - Test as student user (non-instructor)
   - Press `Ctrl + *`
   - Verify easter egg does NOT activate
   - Verify console message: "❌ CMOS NOT gate Easter egg attempted by non-instructor"

#### Test Steps for CMOS NOR Gate (CmosNorGateExercise):

1. **Setup**
   - Configure `CmosNorGateExercise` assignment
   - Open assignment modal
   - Start grading process

2. **Easter Egg Activation**
   - Press `Ctrl + |`
   - Verify console message: "🎯 CMOS NOR Easter egg triggered! Ctrl + | detected!"
   - Verify circuit automatically appears with:
     - Two PMOS transistors in parallel (top)
     - Two NMOS transistors in series (bottom)
     - Input connections (A and B)
     - Output connection
     - VDD and GND connections
     - All necessary wires

3. **Grading with Easter Egg**
   - With easter egg circuit in place, continue grading
   - Verify all grading steps pass
   - Verify grade submission works

### 4. Manual Circuit Building Testing
**Purpose**: Verify normal circuit building functionality works correctly.

#### Test Steps:
1. **Component Placement**
   - Place PMOS and NMOS transistors
   - Place input and output components
   - Place VDD and GND components
   - Verify components appear correctly

2. **Wire Connections**
   - Connect components with wires
   - Verify wire routing works
   - Verify connections are valid

3. **Circuit Simulation**
   - Test circuit with different input values
   - Verify output behavior matches expected logic
   - Verify simulation runs without errors

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
   - Verify error messages are helpful
   - Verify grading can be restarted after fixes

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

### CMOS NOT Gate Expected Circuit:
```
VDD
 |
PMOS (top)
 |
Input ----+---- Output
 |
NMOS (bottom)
 |
GND
```

### CMOS NOR Gate Expected Circuit:
```
VDD
 |
PMOS1    PMOS2
 |        |
Input A --+-- Input B
 |        |
NMOS1 ----+---- NMOS2
 |        |
GND       GND
```

## Success Criteria
- All easter eggs work correctly for instructors
- Easter eggs are properly restricted from students
- Assignment functionality works with and without assignments
- Error handling is robust and user-friendly
- No buttons appear on error dialogs
- Tool works across all supported browsers
- Mobile experience is functional

## Known Issues and Limitations
- Easter eggs require instructor privileges
- Some mobile keyboards may not support all easter egg key combinations
- Circuit complexity may affect performance on older devices

## Test Execution Checklist
- [ ] Empty assignment testing
- [ ] Assignment UI testing
- [ ] CMOS NOT gate easter egg (Ctrl + *)
- [ ] CMOS NOR gate easter egg (Ctrl + |)
- [ ] Manual circuit building
- [ ] Error handling
- [ ] Cross-browser testing
- [ ] Mobile testing
- [ ] Grade submission verification
- [ ] Console error checking
