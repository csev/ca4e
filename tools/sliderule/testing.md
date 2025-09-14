# Sliderule Tool Testing Plan

## Overview
This document outlines comprehensive testing procedures for the Sliderule tool, including UI validation, error detection, assignment functionality, and slide rule operation testing.

## Test Environment Setup
1. Access the tool via LTI launch at the /tools URL or direct URL at /tools/toolname
2. Have multiple browser tabs/windows ready for different test scenarios
3. Note: Sliderule tool does not have easter eggs, so testing focuses on manual slide rule operation

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
- Tool works normally for slide rule calculations
- No error messages or broken functionality

### 2. Assignment UI Testing
**Purpose**: Verify assignment modal and grading interface work correctly.

#### Test Steps:
1. **Assignment Button Visibility**
   - Configure assignment via LTI custom variable
   - Verify assignment button appears in header
   - Click assignment button to open modal

2. **Assignment Modal Functionality**
   - Verify modal opens and displays problem
   - Verify modal is draggable (grab header and move)
   - Verify close button (×) works
   - Verify clicking outside modal closes it
   - Verify modal centers properly on screen

3. **Grading Interface**
   - Click "Submit Answer" button
   - Verify grading section appears
   - Verify step-by-step grading process
   - Verify no buttons appear on error dialogs
   - Verify success completion and grade submission

#### Expected Results:
- Assignment button visible only when assignment configured
- Modal opens/closes properly with all interactions
- Grading interface functions correctly
- No buttons on error dialogs (except hints if available)

### 3. Assignment Testing
**Purpose**: Test the slide rule multiplication exercise with manual operation.

#### Test Steps for Slide Rule Multiplication (SlideRuleMultiplicationExercise):

1. **Setup**
   - Configure `SlideRuleMultiplicationExercise` assignment
   - Open assignment modal
   - Verify problem is displayed (e.g., "Calculate 2.3 × 3.7")
   - Verify instructions are shown

2. **Manual Slide Rule Operation**
   - Follow the step-by-step process:
     - **Step 1**: Move hairline to first number (2.3) on A scale
     - **Step 2**: Slide B scale to align 1 with the hairline
     - **Step 3**: Move hairline to second number (3.7) on B scale
     - **Step 4**: Read result on A scale
   - Verify each step is completed correctly
   - Verify result is within tolerance (0.2)

3. **Grading with Manual Operation**
   - Click "Submit Answer" button
   - Continue grading process
   - Verify all grading steps pass:
     - Setup verification
     - Step 1: B scale alignment verification
     - Step 2: Hairline position verification
     - Step 3: Result reading verification
   - Verify grade submission works
   - Verify success message appears

4. **New Problem Generation**
   - After successful completion, verify "New Problem" button appears
   - Click "New Problem" to generate new multiplication problem
   - Verify new problem is different from previous
   - Verify new problem is within valid range (1.0 to 4.0)

### 4. Slide Rule Functionality Testing
**Purpose**: Verify the slide rule operates correctly for general use.

#### Test Steps:
1. **Basic Slide Rule Operation**
   - Test hairline movement
   - Test B scale sliding
   - Test reading values on A and B scales
   - Verify scale alignment works correctly

2. **Multiplication Testing**
   - Test various multiplication problems manually
   - Verify results are approximately correct
   - Test edge cases (numbers near 1, 10, etc.)
   - Test decimal precision

3. **UI Controls Testing**
   - Test reset button functionality
   - Test hairline positioning
   - Test scale movement
   - Verify visual feedback works correctly

4. **Responsive Design Testing**
   - Test on different screen sizes
   - Verify slide rule scales appropriately
   - Test touch interactions on mobile
   - Verify controls are accessible

### 5. Error Handling Testing
**Purpose**: Verify proper error handling and user feedback.

#### Test Steps:
1. **Invalid Input Testing**
   - Test with incorrect slide rule positioning
   - Start grading with wrong setup
   - Verify appropriate error messages
   - Verify no buttons appear on error dialogs

2. **Grading Error Scenarios**
   - Test with wrong scale alignment
   - Test with incorrect hairline position
   - Test with wrong result reading
   - Verify error messages are helpful
   - Verify grading can be restarted after fixes

3. **Tolerance Testing**
   - Test with results just outside tolerance
   - Test with results just within tolerance
   - Verify tolerance handling works correctly

### 6. Cross-Browser Testing
**Purpose**: Verify tool works across different browsers.

#### Test Browsers:
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

#### Test Steps:
1. Run all above tests in each browser
2. Verify UI elements render correctly
3. Verify no JavaScript errors in console
4. Test slide rule interactions in all browsers
5. Verify modal functionality in all browsers

### 7. Mobile/Responsive Testing
**Purpose**: Verify tool works on mobile devices.

#### Test Steps:
1. Test on mobile device or browser dev tools mobile view
2. Verify touch interactions work
3. Verify modal is usable on small screens
4. Test slide rule operation on mobile
5. Verify hairline and scale movement work on touch

## Test Data and Examples

### Sample Multiplication Problems:
- 2.3 × 3.7 = 8.51 (within tolerance)
- 1.5 × 2.8 = 4.2 (within tolerance)
- 3.2 × 1.9 = 6.08 (within tolerance)
- 1.1 × 4.0 = 4.4 (within tolerance)

### Slide Rule Operation Steps:
1. **Setup**: Position slide rule for multiplication
2. **Step 1**: Move hairline to first number on A scale
3. **Step 2**: Slide B scale to align 1 with hairline
4. **Step 3**: Move hairline to second number on B scale
5. **Step 4**: Read result on A scale

### Expected Results:
- Problems generate random operands between 1.0 and 4.0
- Results are rounded to one decimal place
- Tolerance is ±0.2 for grading
- New problems generate after successful completion

## Success Criteria
- Assignment functionality works with and without assignments
- Error handling is robust and user-friendly
- No buttons appear on error dialogs
- Tool works across all supported browsers
- Mobile experience is functional
- Slide rule operates correctly
- Multiplication calculations work properly
- Grading system functions correctly
- New problem generation works
- Modal functionality works properly

## Known Issues and Limitations
- No easter eggs available (manual operation required)
- Slide rule precision is limited by visual reading
- Touch interactions may be less precise than mouse
- Results depend on user's ability to read scales accurately

## Test Execution Checklist
- [ ] Empty assignment testing
- [ ] Assignment UI testing
- [ ] Slide rule multiplication assignment (manual)
- [ ] Basic slide rule operation
- [ ] Multiplication testing
- [ ] UI controls testing
- [ ] Error handling
- [ ] Cross-browser testing
- [ ] Mobile testing
- [ ] Grade submission verification
- [ ] Console error checking
- [ ] New problem generation testing
