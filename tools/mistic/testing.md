# MISTIC Tool Testing Plan

## Overview
This document outlines comprehensive testing procedures for the MISTIC VLSI Layout tool, including UI validation, error detection, assignment functionality, and easter egg testing.

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
- Tool works normally for VLSI layout design
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
**Purpose**: Test the automated circuit creation easter egg for NOT gate assignment.

#### Available Easter Eggs:
- **Ctrl + \*** : Creates NOT gate circuit (Hitchhiker's Guide reference - 42!)

#### Test Steps for NOT Gate (NotGateExercise):

1. **Setup**
   - Configure `NotGateExercise` assignment
   - Open assignment modal
   - Start grading process

2. **Easter Egg Activation**
   - Press `Ctrl + *`
   - Verify console message: "🎯 Easter egg triggered! Ctrl + * detected! (Hitchhiker's Guide reference!)"
   - Verify circuit automatically appears with:
     - N+ diffusion regions
     - P+ diffusion regions
     - Polysilicon gate
     - Contact vias
     - Metal connections
     - VCC and GND connections
     - All necessary layers for a functional NOT gate

3. **Grading with Easter Egg**
   - With easter egg circuit in place, continue grading
   - Verify all grading steps pass:
     - Layer placement verification
     - Connection verification
     - Logic functionality verification
   - Verify grade submission works
   - Verify success message appears

4. **Non-Instructor Test**
   - Test as student user (non-instructor)
   - Press `Ctrl + *`
   - Verify easter egg does NOT activate
   - Verify console message: "❌ Not gate Easter egg attempted by non-instructor"

#### Test Steps for NAND Gate (NandGateExercise):

1. **Setup**
   - Configure `NandGateExercise` assignment
   - Open assignment modal
   - Start grading process

2. **Manual Circuit Building**
   - Build NAND gate using available layers
   - Use proper transistor layout
   - Connect all necessary components
   - Verify circuit functions correctly

3. **Grading**
   - Continue grading process
   - Verify all grading steps pass
   - Verify grade submission works

#### Test Steps for NOR Gate (NorGateExercise):

1. **Setup**
   - Configure `NorGateExercise` assignment
   - Open assignment modal
   - Start grading process

2. **Manual Circuit Building**
   - Build NOR gate using available layers
   - Use proper transistor layout
   - Connect all necessary components
   - Verify circuit functions correctly

3. **Grading**
   - Continue grading process
   - Verify all grading steps pass
   - Verify grade submission works

### 4. Manual Circuit Building Testing
**Purpose**: Verify normal VLSI layout functionality works correctly.

#### Test Steps:
1. **Layer Drawing**
   - Test all 7 layers: Polysilicon, N+ Diffusion, P+ Diffusion, Contact/Via, Metal, VCC, GND
   - Test single-click placement for VCC, GND, contacts, probes
   - Test drag drawing for continuous layers
   - Verify layer colors and visual representation

2. **Drawing Commands**
   - Test command line interface
   - Use `draw <layer> at (x,y)` for single points
   - Use `draw <layer> from (x,y) to (x,y)` for rectangles
   - Test layer aliases (n+, p+, via)
   - Verify command history with arrow keys

3. **Probe Functionality**
   - Place probes with custom labels
   - Test JavaScript API access
   - Verify voltage reading and setting
   - Test probe participation in simulation

4. **Circuit Simulation**
   - Test voltage propagation
   - Verify transistor behavior (N+ and P+ gating)
   - Test short detection
   - Verify visual feedback (+ and - symbols)

### 5. Error Handling Testing
**Purpose**: Verify proper error handling and user feedback.

#### Test Steps:
1. **Invalid Circuit Testing**
   - Build incomplete circuits
   - Start grading with missing components
   - Verify appropriate error messages
   - Verify no buttons appear on error dialogs

2. **Grading Error Scenarios**
   - Test with wrong layer types
   - Test with incorrect connections
   - Test with missing power/ground
   - Verify error messages are helpful
   - Verify grading can be restarted after fixes

3. **Simulation Error Testing**
   - Create circuits with shorts
   - Test invalid probe operations
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
2. Verify easter eggs work in all browsers
3. Verify UI elements render correctly
4. Verify no JavaScript errors in console
5. Test touch interactions on mobile browsers

### 7. Mobile/Responsive Testing
**Purpose**: Verify tool works on mobile devices.

#### Test Steps:
1. Test on mobile device or browser dev tools mobile view
2. Verify touch interactions work
3. Verify modal is usable on small screens
4. Verify easter eggs work (if keyboard accessible)
5. Test zoom and pan functionality
6. Verify layer preview works on mobile

### 8. Advanced Features Testing
**Purpose**: Test advanced VLSI layout features.

#### Test Steps:
1. **Layer Stack Preview**
   - Test layer preview functionality
   - Verify cross-sectional view
   - Test via visualization

2. **Read Circuit Feature**
   - Use "Read Circuit" button
   - Verify draw command generation
   - Test speech synthesis (if available)

3. **JavaScript API Testing**
   - Test CircuitProbes object
   - Verify probe value reading/setting
   - Test circuit recomputation

## Test Data and Examples

### NOT Gate Expected Layout:
```
VCC (Gray)
 |
Metal (Blue) ----+---- Output
 |
Contact (Black)
 |
P+ (Orange) ----+---- N+ (Green)
 |
Polysilicon (Red) - Gate
 |
GND (Gray)
```

### NAND Gate Expected Layout:
```
VCC (Gray)
 |
Metal (Blue) ----+---- Output
 |
Contact (Black)
 |
P+ (Orange) ----+---- N+ (Green)
 |              |
P+ (Orange) ----+---- N+ (Green)
 |
Polysilicon (Red) - Gates A & B
 |
GND (Gray)
```

## Success Criteria
- Easter egg works correctly for instructors only
- Assignment functionality works with and without assignments
- Error handling is robust and user-friendly
- No buttons appear on error dialogs
- Tool works across all supported browsers
- Mobile experience is functional
- VLSI simulation works correctly
- All 7 layers function properly
- Command line interface works
- Probe system functions correctly

## Known Issues and Limitations
- Easter egg requires instructor privileges
- Some mobile keyboards may not support easter egg key combinations
- Complex layouts may affect performance on older devices
- Touch drawing may be less precise than mouse

## Test Execution Checklist
- [ ] Empty assignment testing
- [ ] Assignment UI testing
- [ ] NOT gate easter egg (Ctrl + *)
- [ ] NAND gate manual building
- [ ] NOR gate manual building
- [ ] All 7 layers testing
- [ ] Drawing commands testing
- [ ] Probe functionality testing
- [ ] Circuit simulation testing
- [ ] Error handling
- [ ] Cross-browser testing
- [ ] Mobile testing
- [ ] Grade submission verification
- [ ] Console error checking
