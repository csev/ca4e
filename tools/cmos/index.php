<?php

require_once "../config.php";
require_once "assignments.php";

use \Tsugi\Core\LTIX;
use \Tsugi\Core\Settings; 

// Initialize LTI if we received a launch.  If this was a non-LTI GET,
// then $USER will be null (i.e. anonymous)
$LTI = LTIX::session_start();

$_SESSION['GSRF'] = 10;

// See if we have an assignment confuigured, if not check for a custom variable
$assn = Settings::linkGet('exercise');
$custom = LTIX::ltiCustomGet('exercise'); 
    
if ( $assn && isset($assignments[$assn]) ) {
    // Configured
} else if ( strlen($custom) > 0 && isset($assignments[$custom]) ) {
    Settings::linkSet('exercise', $custom);
    $assn = $custom;
}   
?><!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CMOS Circuit Editor</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css">
    <style>
        body {
            margin: 0;
            padding: 20px;
            background-color: #f0f0f0;
            font-family: Arial, sans-serif;
            overflow: hidden;
        }

        .toolbar {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            background-color: #fff;
            padding: 10px 20px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
            z-index: 100;
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-wrap: wrap;
            gap: 10px;
        }

        .component-selector {
            display: flex;
            gap: 10px;
            align-items: center;
            flex-wrap: wrap;
        }

        .component-selector button {
            padding: 8px 15px;
            border: none;
            border-radius: 4px;
            background-color: #2196F3;
            color: white;
            cursor: pointer;
            transition: background-color 0.2s;
            font-weight: bold;
        }

        .component-selector button:hover {
            background-color: #1976D2;
        }

        .right-section {
            display: flex;
            align-items: center;
            gap: 10px;
        }

        #selectedTool {
            font-weight: bold;
            color: #333;
            margin-left: 10px;
        }

        #delete {
            background-color: #FF9800;
        }

        #delete:hover {
            background-color: #F57C00;
        }

        #clear {
            background-color: #f44336;
        }

        #circuitCanvas {
            margin-top: 60px;
            background-color: white;
            border: 1px solid #ccc;
            border-radius: 5px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        }

        .status-bar {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            background-color: #333;
            color: white;
            padding: 5px 20px;
            font-size: 12px;
            display: flex;
            justify-content: space-between;
        }

        /* Common toolbar button style */
        .toolbar-button {
            padding: 8px 15px;
            border: none;
            border-radius: 4px;
            background-color: #2196F3;
            color: white;
            cursor: pointer;
            transition: all 0.2s;
            font-weight: bold;
            margin-right: 10px;
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .toolbar-button:hover {
            background-color: #1976D2;
        }

        /* Mode buttons (fixed width for icons) */
        .mode-button {
            padding: 8px 15px;
            border: none;
            border-radius: 4px;
            background-color: #2196F3;
            color: white;
            cursor: pointer;
            transition: all 0.2s;
            font-weight: bold;
            margin-right: 10px;
            height: 40px;
            width: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .mode-button:hover {
            background-color: #1976D2;
        }

        .mode-button.active {
            background-color: #ff9800;
        }

        #deleteMode.active {
            background-color: #f44336;
        }

        /* Custom icon classes */
        .ca4e-icon {
            font-size: 20px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
        }

        .ca4e-move::before {
            content: "\f256"; /* Font Awesome hand pointer icon */
            font-family: "Font Awesome 6 Free";
            font-weight: 900;
        }

        .ca4e-delete::before {
            content: "\f2ed"; /* Font Awesome trash-alt icon */
            font-family: "Font Awesome 6 Free";
            font-weight: 900;
        }

        /* Add trash icon for clear all */
        .ca4e-clear::before {
            content: "\f2ed"; /* Font Awesome trash-alt icon */
            font-family: "Font Awesome 6 Free";
            font-weight: 900;
            font-size: 1.2em; /* Slightly larger than the icon */
        }

        .mode-button.active svg {
            color: #2196F3;
        }

        .ca4e-label::before {
            content: "\f02b"; /* Font Awesome tag icon */
            font-family: "Font Awesome 6 Free";
            font-weight: 900;
        }

        .ca4e-about::before {
            content: "\f05a"; /* Font Awesome info-circle icon */
            font-family: "Font Awesome 6 Free";
            font-weight: 900;
        }

        .modal {
            display: none;
            position: fixed;
            z-index: 1000;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0,0,0,0.4);
        }

        .modal-content {
            background-color: #fefefe;
            margin: 15% auto;
            padding: 0;
            border: 1px solid #888;
            width: 80%;
            max-width: 500px;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            position: relative;
        }

        .modal-header {
            background-color: #f0f0f0;
            padding: 15px 20px;
            border-bottom: 1px solid #ddd;
            border-radius: 8px 8px 0 0;
            cursor: move;
            user-select: none;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .modal-header h2 {
            margin: 0;
            color: #333;
            flex: 1;
        }

        .modal-body {
            padding: 20px;
        }

        .close {
            color: #aaa;
            font-size: 28px;
            font-weight: bold;
            cursor: pointer;
            line-height: 1;
            margin: 0;
            padding: 0;
            border: none;
            background: none;
        }

        .close:hover,
        .close:focus {
            color: black;
            text-decoration: none;
            cursor: pointer;
        }

        .modal-content h2 {
            margin-top: 0;
            color: #2196F3;
        }

        .modal-content ul {
            padding-left: 20px;
        }

        /* Update the media query for narrow screens */
        @media (max-width: 768px) {
            .toolbar {
                padding: 5px;
                gap: 5px;
            }

            .component-selector, .right-section {
                display: flex;
                flex-wrap: wrap;
                gap: 5px;
                width: auto; /* Remove 100% width */
            }

            .toolbar-button, .mode-button {
                padding: 6px 10px;
                font-size: 14px;
                height: 32px; /* Slightly smaller height */
                margin-right: 0; /* Remove margin, using gap instead */
            }

            .mode-button {
                width: 32px; /* Match height */
            }

            /* Adjust canvas margin for two rows instead of three */
            #circuitCanvas {
                margin-top: 85px; /* Reduced from 120px to account for two rows */
            }
        }

        .component-button {
            padding: 8px 15px;
            border: none;
            border-radius: 4px;
            background-color: #2196F3;
            color: white;
            cursor: pointer;
            transition: background-color 0.2s;
            font-weight: bold;
        }

        .component-button:hover {
            background-color: #1976D2;
        }

        .component-button.active {
            background-color: #ff9800 !important; /* Use !important to override hover state */
        }

        .component-button.active:hover {
            background-color: #f57c00 !important; /* Darker orange for hover on active state */
        }
    </style>
</head>
<body>
    <div class="toolbar">
        <div class="component-selector">
            <button data-component="SWITCH" class="toolbar-button component-button" title="Add a switch (high/low input)">Switch</button>
            <button data-component="PROBE" class="toolbar-button component-button" title="Add a probe to measure voltage">Probe</button>
            <button data-component="NMOS" class="toolbar-button component-button" title="Add an NMOS transistor">NMOS</button>
            <button data-component="PMOS" class="toolbar-button component-button" title="Add a PMOS transistor">PMOS</button>
        </div>
        <div class="right-section">
            <button id="moveMode" class="mode-button" title="Move components">
                <span class="ca4e-icon ca4e-move"></span>
            </button>
            <button id="deleteMode" class="mode-button" title="Delete components">
                <span class="ca4e-icon ca4e-delete"></span>
            </button>
            <button id="labelMode" class="mode-button" title="Label components">
                <span class="ca4e-icon ca4e-label"></span>
            </button>
            <button id="clear" class="toolbar-button">Clear All</button>
<?php if ($USER) : ?>
            <button id="assignmentButton" class="toolbar-button" style="background-color: #4CAF50;">Assignment</button>
<?php endif; ?>
<?php if ($USER && $USER->instructor) : ?>
            <a href="instructor.php" style="background-color: #28a745; color: white; font-size: 14px; padding: 8px 15px; border-radius: 6px; border: 1px solid #ccc; cursor: pointer; min-width: 60px; transition: all 0.2s ease; box-shadow: 0 2px 4px rgba(0,0,0,0.1); text-decoration: none; display: inline-block; margin: 2px;">Instructor</a>
<?php endif; ?>
            <button id="aboutButton" class="mode-button" title="About">
                <span class="ca4e-icon ca4e-about"></span>
            </button>
        </div>
    </div>

    <canvas id="circuitCanvas"></canvas>

    <div class="status-bar">
        <span id="coordinates">Position: 0, 0</span>
        <span id="voltage">Voltage: N/A</span>
    </div>

    <div id="aboutModal" class="modal">
        <div class="modal-content">
            <span class="close">&times;</span>
            <h2>About CMOS Circuit Editor</h2>
            <p>This is a web-based CMOS circuit editor for designing and simulating
                simple digital logic circuits.
                The underlying logic simulator has limitations.   It can design a two-transistor NOT gate 
                but does not have a complete logic simulator to handle more
                complex circuits like NAND, NOR, XOR, etc.
            </p>
        </div>
    </div>

<?php if ($USER) : ?>
    <!-- Assignment Modal -->
    <div id="assignmentModal" class="modal">
        <div class="modal-content">
            <div class="modal-header">
                <h2>CMOS Circuit Assignment</h2>
                <span class="close">&times;</span>
            </div>
            <div class="modal-body">
            <div id="assignmentInstructions">
                <p id="assignmentInstructionsText">
                    <!-- Instructions will be loaded dynamically from the exercise class -->
                </p>
            </div>
            <div id="gradingSection" style="margin-top: 20px; display: none;">
                <h3>Circuit Grading</h3>
                <div id="stepDisplay">
                    <p id="stepText">Ready to grade your circuit!</p>
                </div>
            </div>
            <div style="margin-top: 20px; display: flex; gap: 10px; justify-content: space-between;">
                <button id="nextBtn" onclick="nextStep()" style="background-color: #2196F3; color: white; padding: 8px 16px; border: none; border-radius: 4px; cursor: pointer; display: none;">Next</button>
                <button id="gradeBtn" onclick="startGrading()" style="background-color: #4CAF50; color: white; padding: 8px 16px; border: none; border-radius: 4px; cursor: pointer;">Grade</button>
            </div>
            </div>
        </div>
    </div>
<?php endif; ?>

    <script src="components.js"></script>
    <script src="circuit.js"></script>
    <script src="editor.js"></script>
    <script src="exercises.js"></script>
    <script>
        // Utility functions to read probe values
        function getProbeVoltage(label) {
            if (!window.circuitEditor) {
                console.error('Circuit editor not initialized');
                return null;
            }
            const voltage = window.circuitEditor.getProbeVoltageByLabel(label);
            if (voltage === null) {
                console.warn(`No probe found with label "${label}"`);
            }
            return voltage;
        }

        function getAllProbeLabels() {
            if (!window.circuitEditor) {
                console.error('Circuit editor not initialized');
                return [];
            }
            return window.circuitEditor.getAllProbeLabels();
        }

        // Example usage:
        // const voltage = getProbeVoltage('output1');
        // const allLabels = getAllProbeLabels();

        // Function to read probe voltage - call from browser console
        function getProbeVoltage(label) {
            return window.circuitEditor.getProbeVoltageByLabel(label);
        }

        // Example usage from browser console:
        // getProbeVoltage('output1')  // Returns voltage of probe labeled 'output1'

        // Functions to control switches - call from browser console
        function setSwitchHigh(label) {
            return window.circuitEditor.setSwitchHigh(label);
        }

        function setSwitchLow(label) {
            return window.circuitEditor.setSwitchLow(label);
        }

        // Example usage from browser console:
        // setSwitchHigh('input1')  // Sets switch labeled 'input1' to VCC (5V)
        // setSwitchLow('input1')   // Sets switch labeled 'input1' to GND (0V)

<?php if ($USER) : ?>
        // Autograder functionality
        let currentExercise = null;

        // Modal functionality
        const aboutModal = document.getElementById('aboutModal');
        const assignmentModal = document.getElementById('assignmentModal');
        const aboutButton = document.getElementById('aboutButton');
        const assignmentButton = document.getElementById('assignmentButton');

        // Close modal functionality
        function closeModal(modal) {
            modal.style.display = 'none';
        }

        function closeAssignmentModal() {
            closeModal(assignmentModal);
        }

        // Show modal functionality
        function showAboutModal() {
            aboutModal.style.display = 'block';
        }

        function showAssignmentModal() {
            // Load instructions from the current exercise
            if (currentExercise && currentExercise.instructions) {
                const instructionsElement = document.getElementById('assignmentInstructionsText');
                if (instructionsElement) {
                    instructionsElement.innerHTML = currentExercise.instructions;
                }
            }
            assignmentModal.style.display = 'block';
        }

        // Event listeners for modals
        aboutButton.addEventListener('click', showAboutModal);
        assignmentButton.addEventListener('click', showAssignmentModal);

        // Close modals when clicking the X
        document.querySelectorAll('.close').forEach(closeBtn => {
            closeBtn.addEventListener('click', function() {
                const modal = this.closest('.modal');
                closeModal(modal);
            });
        });

        // Close modals when clicking outside
        window.addEventListener('click', function(event) {
            if (event.target.classList.contains('modal')) {
                closeModal(event.target);
            }
        });

        // Make assignment modal draggable
        function makeModalDraggable(modal) {
            const modalContent = modal.querySelector('.modal-content');
            const modalHeader = modal.querySelector('.modal-header');
            
            let isDragging = false;
            let currentX;
            let currentY;
            let initialX;
            let initialY;
            let xOffset = 0;
            let yOffset = 0;

            modalHeader.addEventListener('mousedown', dragStart);
            document.addEventListener('mousemove', drag);
            document.addEventListener('mouseup', dragEnd);

            function dragStart(e) {
                initialX = e.clientX - xOffset;
                initialY = e.clientY - yOffset;

                if (e.target === modalHeader || modalHeader.contains(e.target)) {
                    isDragging = true;
                    modalContent.style.cursor = 'grabbing';
                }
            }

            function drag(e) {
                if (isDragging) {
                    e.preventDefault();
                    currentX = e.clientX - initialX;
                    currentY = e.clientY - initialY;

                    xOffset = currentX;
                    yOffset = currentY;

                    modalContent.style.transform = `translate(${currentX}px, ${currentY}px)`;
                }
            }

            function dragEnd(e) {
                initialX = currentX;
                initialY = currentY;
                isDragging = false;
                modalContent.style.cursor = 'move';
            }
        }

        // Initialize draggable functionality for assignment modal
        makeModalDraggable(assignmentModal);

        // Grading functions
        function startGrading() {
            if (currentExercise) {
                currentExercise.startGrading();
            }
        }

        function nextStep() {
            if (currentExercise) {
                currentExercise.nextStep();
            }
        }

        function resetAllSwitches() {
            if (currentExercise) {
                currentExercise.resetAllSwitches();
            }
        }

        function resetToBeginningScreen() {
            if (currentExercise) {
                currentExercise.resetGrading();
            }
        }

        function resetGrading() {
            if (currentExercise) {
                currentExercise.resetGrading();
            }
        }

        // LTI Grade Submission Function
        function submitGradeToLMS(grade) {
            console.log('Submitting grade to LMS:', grade);
            
            // Check if we're in an LTI session (user is authenticated)
            console.log('User is authenticated via LTI, proceeding with grade submission...');
            
            // Submit the grade via AJAX using form data (as expected by the endpoint)
            const formData = new FormData();
            formData.append('grade', grade);
            formData.append('code', 'CMOS_NOT_GATE_COMPLETED'); // Add a code identifier for the assignment
            
            console.log('Sending grade=' + grade);
            
            fetch('<?php echo addSession($CFG->wwwroot . '/api/grade-submit.php'); ?>', {
                method: 'POST',
                body: formData
            })
            .then(response => {
                console.log('Response received:', response);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                console.log('Grade response received...');
                console.log(data);
                
                if (data.status === 'success') {
                    console.log('Grade submitted successfully:', data);
                    // Show success message to user
                    const stepText = document.getElementById('stepText');
                    if (stepText) {
                        stepText.innerHTML = `<span style="color: green;">✓ Assignment completed! Grade ${grade} submitted to LMS.</span>`;
                    }
                    // Show alert to user
                    alert(`🎉 Congratulations! Your grade of 1.0 has been successfully submitted to the LMS.`);
                } else {
                    console.error('Grade submission failed:', data);
                    // Show error message to user
                    const stepText = document.getElementById('stepText');
                    if (stepText) {
                        stepText.innerHTML = `<span style="color: orange;">⚠ Assignment completed, but grade submission failed: ${data.detail}</span>`;
                    }
                    // Show error alert to user
                    alert(`⚠️ Grade submission failed: ${data.detail}\n\nYour assignment was completed successfully, but the grade could not be sent to the LMS. Please contact your instructor.`);
                }
            })
            .catch(error => {
                console.error('Error submitting grade:', error);
                // Show error message to user
                const stepText = document.getElementById('stepText');
                if (stepText) {
                    stepText.innerHTML = `<span style="color: orange;">⚠ Assignment completed, but grade submission failed: ${error.message}</span>`;
                }
                // Show error alert to user
                alert(`⚠️ Grade submission error: ${error.message}\n\nYour assignment was completed successfully, but there was a technical error sending the grade to the LMS. Please contact your instructor.`);
            });
        }

        // Initialize the exercise when the page loads
        document.addEventListener('DOMContentLoaded', function() {
            // Create the CMOS NOT gate exercise instance
           if ( '<?php echo $assn; ?>' == 'CmosNorGateExercise') {
                currentExercise = new CmosNorGateExercise();
            } else {
                currentExercise = new CmosNotGateExercise();
            }
            
            // Override the exercise's submitGradeToLMS method to use the global function
            if (currentExercise) {
                currentExercise.submitGradeToLMS = submitGradeToLMS;
            }
        });

        // Easter egg: Auto-draw CMOS NOT gate
        function drawCmosNotGate() {
            console.log('🎯 Drawing CMOS NOT gate easter egg!');
            
            if (!window.circuitEditor) {
                console.error('Circuit editor not available');
                return;
            }
            
            // Create CMOS NOT gate components
            // Position them in a logical layout
            
            // Input switch (A) - positioned on the left
            const inputSwitch = new Switch(100, 200);
            inputSwitch.label = "A";
            window.circuitEditor.circuit.addComponent(inputSwitch);
            
            // PMOS transistor (pull-up network) - positioned in upper area
            const pmosTransistor = new PMOS(200, 150);
            window.circuitEditor.circuit.addComponent(pmosTransistor);
            
            // NMOS transistor (pull-down network) - positioned in lower area  
            const nmosTransistor = new NMOS(200, 250);
            window.circuitEditor.circuit.addComponent(nmosTransistor);
            
            // Output probe (Q) - positioned on the right
            const outputProbe = new Probe(300, 200);
            outputProbe.label = "Q";
            window.circuitEditor.circuit.addComponent(outputProbe);
            
            // Create wires to connect the CMOS NOT gate
            // 1. Switch output → PMOS gate (input signal)
            const wire1 = new Wire(
                inputSwitch, 
                { x: inputSwitch.outputs[0].x, y: inputSwitch.outputs[0].y },
                pmosTransistor,
                { x: pmosTransistor.inputs[0].x, y: pmosTransistor.inputs[0].y }
            );
            window.circuitEditor.circuit.addWire(wire1);
            
            // 2. Switch output → NMOS gate (input signal)
            const wire2 = new Wire(
                inputSwitch,
                { x: inputSwitch.outputs[0].x, y: inputSwitch.outputs[0].y },
                nmosTransistor,
                { x: nmosTransistor.inputs[0].x, y: nmosTransistor.inputs[0].y }
            );
            window.circuitEditor.circuit.addWire(wire2);
            
            // 3. VDD → PMOS source (pull-up) - PMOS source is the top terminal
            const wire3 = new Wire(
                window.circuitEditor.vddBar,
                { x: window.circuitEditor.vddBar.outputs[0].x, y: window.circuitEditor.vddBar.outputs[0].y, relativePosition: 0.5 },
                pmosTransistor,
                { x: pmosTransistor.inputs[1].x, y: pmosTransistor.inputs[1].y }
            );
            window.circuitEditor.circuit.addWire(wire3);
            
            // 4. PMOS drain → NMOS drain (output node) - PMOS drain is the bottom terminal
            const wire4 = new Wire(
                pmosTransistor,
                { x: pmosTransistor.inputs[2].x, y: pmosTransistor.inputs[2].y },
                nmosTransistor,
                { x: nmosTransistor.inputs[1].x, y: nmosTransistor.inputs[1].y }
            );
            window.circuitEditor.circuit.addWire(wire4);
            
            // 5. NMOS source → GND (pull-down)
            const wire5 = new Wire(
                nmosTransistor,
                { x: nmosTransistor.inputs[2].x, y: nmosTransistor.inputs[2].y },
                window.circuitEditor.gndBar,
                { x: window.circuitEditor.gndBar.inputs[0].x, y: window.circuitEditor.gndBar.inputs[0].y, relativePosition: 0.5 }
            );
            window.circuitEditor.circuit.addWire(wire5);
            
            // 6. Output node → Probe input - connect to PMOS drain (bottom terminal)
            const wire6 = new Wire(
                pmosTransistor,
                { x: pmosTransistor.inputs[2].x, y: pmosTransistor.inputs[2].y },
                outputProbe,
                { x: outputProbe.inputs[0].x, y: outputProbe.inputs[0].y }
            );
            window.circuitEditor.circuit.addWire(wire6);
            
            // Redraw the circuit to show the new components and wires
            window.circuitEditor.draw();
            
            console.log('✨ CMOS NOT gate magically appeared!');
        }

        // Function to draw a complete CMOS NOR gate
        function drawCmosNorGate() {
            console.log('🎯 Creating CMOS NOR gate...');
            
            // Clear any existing components (but keep VDD/GND bars)
            // Note: We don't call clear() to preserve the power rails
            
            // 1. Create input switches (A and B)
            const switchA = new Switch(200, 200);
            switchA.label = "A";
            const switchB = new Switch(200, 450);
            switchB.label = "B";
            window.circuitEditor.circuit.addComponent(switchA);
            window.circuitEditor.circuit.addComponent(switchB);
            
            // 2. Create PMOS transistors (pull-up network - series)
            const pmos1 = new PMOS(350, 120); // Top PMOS
            const pmos2 = new PMOS(350, 220); // Bottom PMOS
            window.circuitEditor.circuit.addComponent(pmos1);
            window.circuitEditor.circuit.addComponent(pmos2);
            
            // 3. Create NMOS transistors (pull-down network - parallel)
            const nmos1 = new NMOS(350, 320); // Top NMOS
            const nmos2 = new NMOS(450, 320); // Bottom NMOS
            window.circuitEditor.circuit.addComponent(nmos1);
            window.circuitEditor.circuit.addComponent(nmos2);
            
            // 4. Create output probe
            const outputProbe = new Probe(500, 200);
            outputProbe.label = "Q";
            window.circuitEditor.circuit.addComponent(outputProbe);
            
            // 5. Create all the wires for a proper CMOS NOR gate
            
            // Input A → PMOS1 gate and NMOS1 gate
            const wire1 = new Wire(
                switchA,
                { x: switchA.outputs[0].x, y: switchA.outputs[0].y },
                pmos1,
                { x: pmos1.inputs[0].x, y: pmos1.inputs[0].y }
            );
            window.circuitEditor.circuit.addWire(wire1);
            
            const wire2 = new Wire(
                switchA,
                { x: switchA.outputs[0].x, y: switchA.outputs[0].y },
                nmos1,
                { x: nmos1.inputs[0].x, y: nmos1.inputs[0].y }
            );
            window.circuitEditor.circuit.addWire(wire2);
            
            // Input B → PMOS2 gate and NMOS2 gate
            const wire3 = new Wire(
                switchB,
                { x: switchB.outputs[0].x, y: switchB.outputs[0].y },
                pmos2,
                { x: pmos2.inputs[0].x, y: pmos2.inputs[0].y }
            );
            window.circuitEditor.circuit.addWire(wire3);
            
            const wire4 = new Wire(
                switchB,
                { x: switchB.outputs[0].x, y: switchB.outputs[0].y },
                nmos2,
                { x: nmos2.inputs[0].x, y: nmos2.inputs[0].y }
            );
            window.circuitEditor.circuit.addWire(wire4);
            
            // VDD → PMOS1 source (series pull-up)
            const wire5 = new Wire(
                window.circuitEditor.vddBar,
                { x: window.circuitEditor.vddBar.outputs[2].x, y: window.circuitEditor.vddBar.outputs[0].y, relativePosition: 0.5 },
                pmos1,
                { x: pmos1.inputs[1].x, y: pmos1.inputs[1].y }
            );
            window.circuitEditor.circuit.addWire(wire5);
            
            // PMOS1 drain → PMOS2 source (series connection)
            const wire6 = new Wire(
                pmos1,
                { x: pmos1.inputs[2].x, y: pmos1.inputs[2].y },
                pmos2,
                { x: pmos2.inputs[1].x, y: pmos2.inputs[1].y }
            );
            window.circuitEditor.circuit.addWire(wire6);
            
            // PMOS2 drain → NMOS drains (output node connection)
            const wire7 = new Wire(
                pmos2,
                { x: pmos2.inputs[2].x, y: pmos2.inputs[2].y },
                nmos1,
                { x: nmos1.inputs[1].x, y: nmos1.inputs[1].y }
            );
            window.circuitEditor.circuit.addWire(wire7);
            
            // NMOS1 and NMOS2 drains → Output node (parallel connection)
            const wire8 = new Wire(
                nmos1,
                { x: nmos1.inputs[1].x, y: nmos1.inputs[1].y },
                nmos2,
                { x: nmos2.inputs[1].x, y: nmos2.inputs[1].y }
            );
            window.circuitEditor.circuit.addWire(wire8);
            
            // Output node → Probe input (connect to PMOS2 drain - bottom of series)
            const wire11 = new Wire(
                pmos2,
                { x: pmos2.inputs[2].x, y: pmos2.inputs[2].y },
                outputProbe,
                { x: outputProbe.inputs[0].x, y: outputProbe.inputs[0].y }
            );
            window.circuitEditor.circuit.addWire(wire11);
            
            // NMOS1 and NMOS2 sources → GND (parallel pull-down)
            const wire9 = new Wire(
                nmos1,
                { x: nmos1.inputs[2].x, y: nmos1.inputs[2].y },
                window.circuitEditor.gndBar,
                { x: window.circuitEditor.gndBar.inputs[2].x, y: window.circuitEditor.gndBar.inputs[0].y, relativePosition: 0.3 }
            );
            window.circuitEditor.circuit.addWire(wire9);
            
            const wire10 = new Wire(
                nmos2,
                { x: nmos2.inputs[2].x, y: nmos2.inputs[2].y },
                window.circuitEditor.gndBar,
                { x: window.circuitEditor.gndBar.inputs[2].x, y: window.circuitEditor.gndBar.inputs[0].y, relativePosition: 0.7 }
            );
            window.circuitEditor.circuit.addWire(wire10);
            
            // Redraw the circuit to show the new components and wires
            window.circuitEditor.draw();
            
            console.log('✨ CMOS NOR gate magically appeared!');
        }

        // Test function to verify the Easter egg is working
        window.testCmosEasterEgg = function() {
            if (typeof drawCmosNotGate === 'function') {
                drawCmosNotGate();
            }
            if (typeof drawCmosNorGate === 'function') {
                drawCmosNorGate();
            }
        };
        
        document.addEventListener('keydown', (e) => {
            // Test for Ctrl + * (Hitchhiker's Guide reference - 42!)
            if (e.ctrlKey && e.key === '*') {
                console.log('🎯 CMOS Easter egg triggered! Ctrl + * detected! (Hitchhiker\'s Guide reference!)');
                unlockCmosNotGate();
            }
            // Test for Ctrl + | (NOR gate)
            if (e.ctrlKey && e.key === '|') {
                console.log('🎯 CMOS NOR Easter egg triggered! Ctrl + | detected!');
                unlockCmosNorGate();
            }
        });
        
        function unlockCmosNotGate() {
            // Only allow for instructors
            <?php if ($USER && $USER->instructor) : ?>
            // Draw the CMOS NOT gate
            if (typeof drawCmosNotGate === 'function') {
                drawCmosNotGate();
            }
            <?php else : ?>
            // Students can't unlock it
            console.log('❌ CMOS NOT gate Easter egg attempted by non-instructor');
            <?php endif; ?>
        }
        
        function unlockCmosNorGate() {
            // Only allow for instructors
            <?php if ($USER && $USER->instructor) : ?>
            // Draw the CMOS NOR gate
            if (typeof drawCmosNorGate === 'function') {
                drawCmosNorGate();
            }
            <?php else : ?>
            // Students can't unlock it
            console.log('❌ CMOS NOR gate Easter egg attempted by non-instructor');
            <?php endif; ?>
        }
<?php endif; ?>
    </script>
</body>
</html> 
