# WASM Tool Testing Plan

## Overview
This document outlines comprehensive testing procedures for the WASM (WebAssembly) tool, including UI validation, error detection, assignment functionality, and WASM compilation/execution testing.

## Test Environment Setup
1. Access the tool via LTI launch at the /tools URL or direct URL
2. Have multiple browser tabs/windows ready for different test scenarios
3. Note: WASM tool does not have easter eggs, so testing focuses on manual WASM programming

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
- Tool works normally for WASM development
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

### 3. Assignment Testing
**Purpose**: Test both available assignments with manual WASM programming.

#### Test Steps for Hello World (HelloWorldExercise):

1. **Setup**
   - Configure `HelloWorldExercise` assignment
   - Open assignment modal
   - Verify instructions: "Write a WebAssembly program that outputs 'Hello, World!'."
   - Start grading process

2. **Manual WASM Programming**
   - Write WASM program to output "Hello, World!"
   - Use proper WASM syntax:
     - Function definitions
     - Memory operations
     - String handling
     - Export statements
   - Example program:
     ```wat
     (module
       (memory 1)
       (export "memory" (memory 0))
       
       (func $main
         (i32.store8 (i32.const 0) (i32.const 72))   ; 'H'
         (i32.store8 (i32.const 1) (i32.const 101))  ; 'e'
         (i32.store8 (i32.const 2) (i32.const 108))  ; 'l'
         (i32.store8 (i32.const 3) (i32.const 108))  ; 'l'
         (i32.store8 (i32.const 4) (i32.const 111))  ; 'o'
         (i32.store8 (i32.const 5) (i32.const 44))   ; ','
         (i32.store8 (i32.const 6) (i32.const 32))   ; ' '
         (i32.store8 (i32.const 7) (i32.const 87))   ; 'W'
         (i32.store8 (i32.const 8) (i32.const 111))  ; 'o'
         (i32.store8 (i32.const 9) (i32.const 114))  ; 'r'
         (i32.store8 (i32.const 10) (i32.const 108)) ; 'l'
         (i32.store8 (i32.const 11) (i32.const 100)) ; 'd'
         (i32.store8 (i32.const 12) (i32.const 33))  ; '!'
       )
       (export "main" (func $main))
     )
     ```

3. **Grading with Manual Program**
   - Compile the WASM program
   - Run the program in the emulator
   - Continue grading process
   - Verify all grading steps pass:
     - Compilation check
     - Execution check
     - Output verification (checks for "Hello, World!")
   - Verify grade submission works
   - Verify success message appears

#### Test Steps for Print 42 (PrintOut42Exercise):

1. **Setup**
   - Configure `PrintOut42Exercise` assignment
   - Open assignment modal
   - Verify instructions: "Write a WebAssembly program that outputs the number 42."
   - Start grading process

2. **Manual WASM Programming**
   - Write WASM program to output "42"
   - Use proper WASM syntax:
     - Function definitions
     - Memory operations
     - Number handling
     - Export statements
   - Example program:
     ```wat
     (module
       (memory 1)
       (export "memory" (memory 0))
       
       (func $main
         (i32.store8 (i32.const 0) (i32.const 52))   ; '4'
         (i32.store8 (i32.const 1) (i32.const 50))   ; '2'
       )
       (export "main" (func $main))
     )
     ```

3. **Grading with Manual Program**
   - Compile the WASM program
   - Run the program in the emulator
   - Continue grading process
   - Verify all grading steps pass:
     - Compilation check
     - Execution check
     - Output verification (checks for "42")
   - Verify grade submission works
   - Verify success message appears

### 4. WASM Editor Testing
**Purpose**: Verify the WASM editor and compilation functionality works correctly.

#### Test Steps:
1. **Editor Functionality**
   - Test code editing and syntax highlighting
   - Test keyboard shortcuts (Ctrl+Enter to run)
   - Test clear editor functionality
   - Test example selector
   - Test WASM hex display

2. **Compilation Testing**
   - Test valid WASM programs compile successfully
   - Test invalid WASM programs show proper errors
   - Test compilation error messages are helpful
   - Test compilation progress indicators

3. **Execution Testing**
   - Test compiled WASM programs execute correctly
   - Test memory operations work properly
   - Test function exports work correctly
   - Test execution error handling

4. **Modal Functionality**
   - Test WASM hex modal opens/closes properly
   - Test modal content displays correctly
   - Test modal interactions work properly

### 5. Error Handling Testing
**Purpose**: Verify proper error handling and user feedback.

#### Test Steps:
1. **Invalid WASM Testing**
   - Write programs with syntax errors
   - Start grading with invalid code
   - Verify appropriate error messages
   - Verify no buttons appear on error dialogs

2. **Grading Error Scenarios**
   - Test with wrong output
   - Test with incomplete programs
   - Test with programs that don't compile
   - Verify error messages are helpful
   - Verify grading can be restarted after fixes

3. **Compilation Error Testing**
   - Test invalid WASM syntax
   - Test missing exports
   - Test memory errors
   - Verify error detection and reporting

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
4. Test WASM compilation in all browsers
5. Verify WebAssembly support in all browsers

### 7. Mobile/Responsive Testing
**Purpose**: Verify tool works on mobile devices.

#### Test Steps:
1. Test on mobile device or browser dev tools mobile view
2. Verify touch interactions work
3. Verify modal is usable on small screens
4. Test code editing on mobile
5. Verify WASM compilation works on mobile

## Test Data and Examples

### Hello World WASM Program:
```wat
(module
  (memory 1)
  (export "memory" (memory 0))
  
  (func $main
    (i32.store8 (i32.const 0) (i32.const 72))   ; 'H'
    (i32.store8 (i32.const 1) (i32.const 101))  ; 'e'
    (i32.store8 (i32.const 2) (i32.const 108))  ; 'l'
    (i32.store8 (i32.const 3) (i32.const 108))  ; 'l'
    (i32.store8 (i32.const 4) (i32.const 111))  ; 'o'
    (i32.store8 (i32.const 5) (i32.const 44))   ; ','
    (i32.store8 (i32.const 6) (i32.const 32))   ; ' '
    (i32.store8 (i32.const 7) (i32.const 87))   ; 'W'
    (i32.store8 (i32.const 8) (i32.const 111))  ; 'o'
    (i32.store8 (i32.const 9) (i32.const 114))  ; 'r'
    (i32.store8 (i32.const 10) (i32.const 108)) ; 'l'
    (i32.store8 (i32.const 11) (i32.const 100)) ; 'd'
    (i32.store8 (i32.const 12) (i32.const 33))  ; '!'
  )
  (export "main" (func $main))
)
```

### Print 42 WASM Program:
```wat
(module
  (memory 1)
  (export "memory" (memory 0))
  
  (func $main
    (i32.store8 (i32.const 0) (i32.const 52))   ; '4'
    (i32.store8 (i32.const 1) (i32.const 50))   ; '2'
  )
  (export "main" (func $main))
)
```

## Success Criteria
- Assignment functionality works with and without assignments
- Error handling is robust and user-friendly
- No buttons appear on error dialogs
- Tool works across all supported browsers
- Mobile experience is functional
- WASM compilation works correctly
- WASM execution works correctly
- Both assignments can be completed manually
- Grade submission works correctly
- Editor functionality works properly

## Known Issues and Limitations
- No easter eggs available (manual programming required)
- Complex WASM programs may affect performance on older devices
- Mobile keyboard may be challenging for WASM programming
- WebAssembly support varies by browser version

## Test Execution Checklist
- [ ] Empty assignment testing
- [ ] Assignment UI testing
- [ ] Hello World assignment (manual)
- [ ] Print 42 assignment (manual)
- [ ] WASM editor functionality
- [ ] Compilation testing
- [ ] Execution testing
- [ ] Modal functionality
- [ ] Error handling
- [ ] Cross-browser testing
- [ ] Mobile testing
- [ ] Grade submission verification
- [ ] Console error checking
