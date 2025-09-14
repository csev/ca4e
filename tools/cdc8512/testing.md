# CDC8512 Tool Testing Plan

## Overview
This document outlines comprehensive testing procedures for the CDC8512 CPU Emulator tool, including UI validation, error detection, assignment functionality, and ASCII chart testing.

## Test Environment Setup
1. Access the tool via LTI launch at the /tools URL or direct URL at /tools/toolname
2. Have multiple browser tabs/windows ready for different test scenarios
3. Note: CDC8512 tool does not have easter eggs, so testing focuses on manual programming

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
- Tool works normally for CPU emulation
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
   - Verify modal closes automatically after successful grade submission

#### Expected Results:
- Assignment button visible only when assignment configured
- Modal opens/closes properly with all interactions
- Grading interface functions correctly
- No buttons on error dialogs (except hints if available)
- Modal closes automatically on successful completion

### 3. ASCII Chart Testing
**Purpose**: Test the ASCII chart modal functionality.

#### Test Steps:
1. **ASCII Button Visibility**
   - Verify ASCII button appears in header for all users
   - Click ASCII button to open modal

2. **ASCII Modal Functionality**
   - Verify modal opens and displays ASCII chart
   - Verify modal is draggable (grab header and move)
   - Verify close button (×) works
   - Verify clicking outside modal closes it
   - Verify modal centers properly on screen

3. **ASCII Chart Content**
   - Verify chart shows characters 0-127
   - Verify each character displays:
     - Character representation
     - Decimal value
     - Hexadecimal value
     - Binary value
   - Verify card format with proper styling
   - Verify larger text sizes for readability
   - Verify no "Common Examples" section
   - Verify 6-column grid layout

#### Expected Results:
- ASCII button visible to all users
- Modal opens/closes properly
- Chart displays all ASCII characters with correct values
- Card format is clean and readable
- Text is appropriately sized

### 4. Assignment Testing
**Purpose**: Test both available assignments with manual programming.

#### Test Steps for Hello World (HelloWorldExercise):

1. **Setup**
   - Configure `HelloWorldExercise` assignment
   - Open assignment modal
   - Verify instructions: "Write a CDC8512 program that outputs 'Hello, World!' or 'Hello World!'."
   - Start grading process

2. **Manual Programming**
   - Write CDC8512 assembly program to output "Hello, World!"
   - Use proper instruction set:
     - SET instructions for immediate values
     - ASCII character support with quotes
     - PS instruction for string output
     - HALT instruction to stop execution
   - Example program:
     ```
     SET X2, 'H'
     SET A2, 0
     SET X2, 'e'
     INC A2
     SET X2, 'l'
     INC A2
     SET X2, 'l'
     INC A2
     SET X2, 'o'
     INC A2
     SET X2, ','
     INC A2
     SET X2, ' '
     INC A2
     SET X2, 'W'
     INC A2
     SET X2, 'o'
     INC A2
     SET X2, 'r'
     INC A2
     SET X2, 'l'
     INC A2
     SET X2, 'd'
     INC A2
     SET X2, '!'
     INC A2
     PS
     HALT
     ```

3. **Grading with Manual Program**
   - Run the program in the emulator
   - Continue grading process
   - Verify all grading steps pass:
     - Compilation check
     - Execution check
     - Output verification (accepts both "Hello, World!" and "Hello World!")
   - Verify grade submission works
   - Verify success message appears
   - Verify modal closes automatically

#### Test Steps for Print 42 (Print42Exercise):

1. **Setup**
   - Configure `Print42Exercise` assignment
   - Open assignment modal
   - Verify instructions: "Write a CDC8512 program that outputs the number 42."
   - Start grading process

2. **Manual Programming**
   - Write CDC8512 assembly program to output "42"
   - Use proper instruction set:
     - SET instructions for immediate values
     - ASCII character support for digits
     - PS instruction for string output
     - HALT instruction to stop execution
   - Example program:
     ```
     SET X2, '4'
     SET A2, 0
     SET X2, '2'
     INC A2
     PS
     HALT
     ```

3. **Grading with Manual Program**
   - Run the program in the emulator
   - Continue grading process
   - Verify all grading steps pass:
     - Compilation check
     - Execution check
     - Output verification (checks for "42")
   - Verify grade submission works
   - Verify success message appears

### 5. CPU Emulator Testing
**Purpose**: Verify the CDC8512 CPU emulator functions correctly.

#### Test Steps:
1. **Basic Emulator Functionality**
   - Test program loading and execution
   - Verify register display updates
   - Verify memory display updates
   - Test step-by-step execution
   - Test run/stop controls

2. **Instruction Set Testing**
   - Test all instruction types:
     - Special instructions (HALT, PS)
     - Single register instructions (ZERO, CMPZ, INC, DEC)
     - Immediate instructions (SET, CMP, ADD, SUB)
     - Load/Store operations
   - Verify proper register encoding
   - Test ASCII character support

3. **Memory Operations**
   - Test load operations (A0/A1 → X0/X1)
   - Test store operations (A2/A3 → X2/X3)
   - Verify memory addressing
   - Test string operations

4. **Error Handling**
   - Test invalid instructions
   - Test memory access errors
   - Verify proper error messages
   - Test program execution limits

### 6. Error Handling Testing
**Purpose**: Verify proper error handling and user feedback.

#### Test Steps:
1. **Invalid Program Testing**
   - Write programs with syntax errors
   - Start grading with invalid code
   - Verify appropriate error messages
   - Verify no buttons appear on error dialogs

2. **Grading Error Scenarios**
   - Test with wrong output
   - Test with incomplete programs
   - Test with programs that don't halt
   - Verify error messages are helpful
   - Verify grading can be restarted after fixes

3. **Emulator Error Testing**
   - Test invalid memory access
   - Test infinite loops
   - Verify error detection and reporting

### 7. Cross-Browser Testing
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
4. Test emulator functionality in all browsers

### 8. Mobile/Responsive Testing
**Purpose**: Verify tool works on mobile devices.

#### Test Steps:
1. Test on mobile device or browser dev tools mobile view
2. Verify touch interactions work
3. Verify modal is usable on small screens
4. Test emulator controls on mobile
5. Verify ASCII chart is readable on mobile

## Test Data and Examples

### Hello World Program:
```
SET X2, 'H'    ; Set X2 to ASCII 'H' (72)
SET A2, 0      ; Address 0
SET X2, 'e'    ; Set X2 to ASCII 'e' (101)
INC A2         ; Address 1
SET X2, 'l'    ; Set X2 to ASCII 'l' (108)
INC A2         ; Address 2
SET X2, 'l'    ; Set X2 to ASCII 'l' (108)
INC A2         ; Address 3
SET X2, 'o'    ; Set X2 to ASCII 'o' (111)
INC A2         ; Address 4
SET X2, ','    ; Set X2 to ASCII ',' (44)
INC A2         ; Address 5
SET X2, ' '    ; Set X2 to ASCII ' ' (32)
INC A2         ; Address 6
SET X2, 'W'    ; Set X2 to ASCII 'W' (87)
INC A2         ; Address 7
SET X2, 'o'    ; Set X2 to ASCII 'o' (111)
INC A2         ; Address 8
SET X2, 'r'    ; Set X2 to ASCII 'r' (114)
INC A2         ; Address 9
SET X2, 'l'    ; Set X2 to ASCII 'l' (108)
INC A2         ; Address 10
SET X2, 'd'    ; Set X2 to ASCII 'd' (100)
INC A2         ; Address 11
SET X2, '!'    ; Set X2 to ASCII '!' (33)
INC A2         ; Address 12
PS              ; Print string
HALT            ; Stop execution
```

### Print 42 Program:
```
SET X2, '4'    ; Set X2 to ASCII '4' (52)
SET A2, 0      ; Address 0
SET X2, '2'    ; Set X2 to ASCII '2' (50)
INC A2         ; Address 1
PS              ; Print string
HALT            ; Stop execution
```

## Success Criteria
- Assignment functionality works with and without assignments
- Error handling is robust and user-friendly
- No buttons appear on error dialogs
- Tool works across all supported browsers
- Mobile experience is functional
- CPU emulator works correctly
- ASCII chart displays properly
- Both assignments can be completed manually
- Grade submission works correctly
- Modal closes automatically on success

## Known Issues and Limitations
- No easter eggs available (manual programming required)
- Complex programs may affect performance on older devices
- Mobile keyboard may be challenging for assembly programming

## Test Execution Checklist
- [ ] Empty assignment testing
- [ ] Assignment UI testing
- [ ] ASCII chart testing
- [ ] Hello World assignment (manual)
- [ ] Print 42 assignment (manual)
- [ ] CPU emulator functionality
- [ ] Instruction set testing
- [ ] Memory operations testing
- [ ] Error handling
- [ ] Cross-browser testing
- [ ] Mobile testing
- [ ] Grade submission verification
- [ ] Console error checking
