<?php

require_once "../config.php";
require_once "assignments.php";

use \Tsugi\Core\LTIX;
use \Tsugi\Core\Settings;

// Initialize LTI if we received a launch.  If this was a non-LTI GET,
// then $USER will be null (i.e. anonymous)
$LTI = LTIX::session_start();

// See if we have an assignment configured, if not check for a custom variable
$assn = Settings::linkGetCustom('exercise');
// Make sure it is a valid assignment
if ( $assn && ! isset($assignments[$assn]) ) $assn = null;

?><!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Digital Circuit Editor</title>
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
        }

        .gate-selector {
            display: flex;
            gap: 10px;
        }

        .gate-selector select {
            padding: 8px 15px;
            border: 2px solid #4CAF50;
            border-radius: 4px;
            background-color: white;
            color: #333;
            cursor: pointer;
            transition: border-color 0.2s;
            font-weight: bold;
            font-size: 14px;
            min-width: 150px;
            transition: border-color 0.2s, box-shadow 0.2s;
        }

        .gate-selector select:hover {
            border-color: #45a049;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .gate-selector select:focus {
            outline: none;
            border-color: #45a049;
            box-shadow: 0 0 0 3px rgba(76, 175, 80, 0.2);
        }

        .center-section {
            display: flex;
            align-items: center;
            gap: 20px;
        }

        .commands-selector {
            display: flex;
            gap: 10px;
        }

        .commands-selector select {
            padding: 8px 15px;
            border: 2px solid #2196F3;
            border-radius: 4px;
            background-color: white;
            color: #333;
            cursor: pointer;
            font-weight: bold;
            font-size: 14px;
            min-width: 120px;
            transition: border-color 0.2s, box-shadow 0.2s;
        }

        .commands-selector select:hover {
            border-color: #1976D2;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .commands-selector select:focus {
            outline: none;
            border-color: #1976D2;
            box-shadow: 0 0 0 3px rgba(33, 150, 243, 0.2);
        }

        .right-section {
            display: flex;
            align-items: center;
            gap: 20px;
        }

        /* Command line interface styles */
        .command-line {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            background-color: #2c3e50;
            color: white;
            padding: 15px 20px;
            border-top: 2px solid #3498db;
            z-index: 1000;
        }

        .command-line input {
            width: 100%;
            background-color: #34495e;
            color: #ecf0f1;
            border: 1px solid #7f8c8d;
            padding: 10px 15px;
            border-radius: 4px;
            font-family: 'Courier New', monospace;
            font-size: 14px;
            margin-bottom: 8px;
        }

        .command-line input:focus {
            outline: none;
            border-color: #3498db;
            box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
        }

        .command-line input::placeholder {
            color: #95a5a6;
        }

        .status {
            font-size: 12px;
            color: #bdc3c7;
            font-family: 'Courier New', monospace;
        }

        /* Adjust canvas height to make room for command line */
        #circuitCanvas {
            margin-top: 60px;
            margin-bottom: 100px;
            background-color: white;
            border: 1px solid #ccc;
            border-radius: 5px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        }

        #selectedTool {
            font-weight: bold;
            color: #333;
        }

        .icon-button {
            font-size: 20px;
            padding: 8px 12px;
            line-height: 1;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        #delete {
            background-color: #FF9800;
            min-width: 40px;
            min-height: 40px;
        }

        #delete:hover {
            background-color: #F57C00;
        }

        #delete.active {
            background-color: #f44336;
        }

        #delete.active:hover {
            background-color: #d32f2f;
        }

        #clear {
            background-color: #f44336;
        }

        #delete, #clear {
            padding: 8px 15px;
            border: none;
            border-radius: 4px;
            color: white;
            cursor: pointer;
            transition: background-color 0.2s;
            font-weight: bold;
        }

        #clear:hover {
            background-color: #D32F2F;
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

        .tooltip {
            position: absolute;
            background-color: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 5px 10px;
            border-radius: 4px;
            font-size: 12px;
            pointer-events: none;
            display: none;
        }

        .validation-message {
            position: fixed;
            top: 70px;
            left: 50%;
            transform: translateX(-50%);
            padding: 10px 20px;
            border-radius: 5px;
            font-size: 14px;
            transition: opacity 0.3s;
            z-index: 1000;
            pointer-events: none;
        }

        .validation-message.error {
            background-color: #f44336;
            color: white;
        }

        .validation-message.info {
            background-color: #2196F3;
            color: white;
        }

        /* Add modal styles */
        .modal {
            display: none;
            position: fixed;
            z-index: 1000;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0,0,0,0.5);
        }

        .modal-content {
            background-color: #fefefe;
            margin: 15% auto;
            padding: 20px;
            border: 1px solid #888;
            width: 300px;
            border-radius: 5px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }

        .modal-content h3 {
            margin-top: 0;
            color: #333;
        }

        .modal-content p {
            margin: 15px 0;
            color: #666;
        }

        .modal-buttons {
            display: flex;
            justify-content: flex-end;
            gap: 10px;
        }

        .modal-buttons button {
            padding: 8px 16px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-weight: bold;
            transition: background-color 0.2s;
        }

        #confirmDeleteAll {
            background-color: #f44336;
            color: white;
        }

        #confirmDeleteAll:hover {
            background-color: #d32f2f;
        }

        #cancelDeleteAll {
            background-color: #9e9e9e;
            color: white;
        }

        #cancelDeleteAll:hover {
            background-color: #757575;
        }

        .mode-button {
            padding: 8px 15px;
            border: none;
            border-radius: 4px;
            background-color: #2196F3;
            color: white;
            cursor: pointer;
            transition: background-color 0.2s;
            font-weight: bold;
            display: flex;
            align-items: center;
            gap: 5px;
            height: 40px;
        }

        .mode-button.active {
            background-color: #1976D2;
        }

        .mode-button:hover {
            background-color: #1976D2;
        }

        /* Ensure consistent button heights */
        .right-section button {
            height: 40px;
        }

        .help-button {
            background-color: #2c3e50;
            color: white;
            border: none;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            font-size: 18px;
            cursor: pointer;
            transition: background-color 0.2s, transform 0.2s;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
        }

        .help-button:hover {
            background-color: #34495e;
            transform: scale(1.1);
        }

        .instructor-button {
            background-color: #28a745;
            color: white;
            text-decoration: none;
            padding: 8px 15px;
            border-radius: 6px;
            border: 1px solid #ccc;
            cursor: pointer;
            min-width: 60px;
            transition: all 0.2s ease;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            font-size: 14px;
            display: inline-block;
            margin-right: 10px;
            height: 40px;
            line-height: 24px;
            box-sizing: border-box;
        }

        .instructor-button:hover {
            background-color: #218838;
            transform: translateY(-1px);
            box-shadow: 0 4px 8px rgba(0,0,0,0.15);
            text-decoration: none;
            color: white;
        }

        .instructor-button:active {
            transform: translateY(1px);
            box-shadow: 0 1px 2px rgba(0,0,0,0.1);
        }

        .instructor-button:visited {
            color: white;
        }

        .assignment-btn {
            background-color: #fff0e6 !important;
            color: #333 !important;
            border: 1px solid #ddd !important;
            padding: 8px 15px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
            transition: all 0.2s ease;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .assignment-btn:hover {
            background-color: #ffe4cc !important;
            color: #333 !important;
            transform: translateY(-1px);
            box-shadow: 0 4px 8px rgba(0,0,0,0.15);
        }

        .assignment-btn:active {
            transform: translateY(1px);
            box-shadow: 0 1px 2px rgba(0,0,0,0.1);
        }

        /* Assignment Modal Styles */
        .assignment-modal {
            position: fixed;
            background: white;
            border: 2px solid #007bff;
            border-radius: 8px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
            z-index: 1000;
            width: 500px;
            max-height: 80vh;
            overflow-y: auto;
        }

        .assignment-modal.hidden {
            display: none;
        }

        .assignment-modal .modal-header {
            background: #007bff;
            color: white;
            padding: 12px 16px;
            border-radius: 6px 6px 0 0;
            cursor: grab;
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-weight: bold;
        }

        .assignment-modal .modal-header:active {
            cursor: grabbing;
        }

        .assignment-modal .close-btn {
            background: none;
            border: none;
            color: white;
            font-size: 20px;
            cursor: pointer;
            padding: 0;
            width: 24px;
            height: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .assignment-modal .close-btn:hover {
            background: rgba(255,255,255,0.2);
            border-radius: 50%;
        }

        .assignment-modal .modal-content {
            padding: 20px;
        }

        .assignment-modal .modal-content h3 {
            margin-top: 0;
            color: #007bff;
        }

        .assignment-modal .modal-content h4 {
            color: #333;
            margin-top: 15px;
            margin-bottom: 8px;
        }

        .assignment-modal .modal-content ul {
            margin: 8px 0;
            padding-left: 20px;
        }

        .assignment-modal .modal-content li {
            margin: 4px 0;
        }

        .assignment-modal .modal-content pre {
            background: #f8f9fa;
            border: 1px solid #dee2e6;
            border-radius: 4px;
            padding: 12px;
            font-family: 'Courier New', monospace;
            font-size: 14px;
            overflow-x: auto;
        }

        #gradeBtn {
            background-color: #28a745;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
            margin-top: 10px;
        }

        #gradeBtn:hover {
            background-color: #218838;
        }

        #stepDisplay {
            margin: 15px 0;
            padding: 10px;
            border-radius: 4px;
            background: #f8f9fa;
        }

        #stepDisplay .success {
            color: #28a745;
            font-weight: bold;
        }

        #stepDisplay .error {
            color: #dc3545;
            font-weight: bold;
        }
    </style>
</head>
<body>
    <div class="toolbar">
        <div class="gate-selector">
            <select id="gateSelector">
                <option value="">Select Component</option>
                <option value="INPUT">Input</option>
                <option value="OUTPUT">Output</option>
                <option value="AND">AND</option>
                <option value="OR">OR</option>
                <option value="NOT">NOT</option>
                <option value="NAND">NAND</option>
                <option value="NOR">NOR</option>
                <option value="XOR">XOR</option>
                <option value="FULL_ADDER">Full Adder</option>
                <option value="NIXIE_DISPLAY">Nixie Display</option>
                <option value="CLOCK_PULSE">Clock</option>
                <option value="SR_FLIP_FLOP">SR Flip-Flop</option>
                <option value="JK_FLIP_FLOP">JK Flip-Flop</option>
                <option value="ONE_BIT_LATCH">1-Bit Latch</option>
                <option value="THREE_BIT_LATCH">3-Bit Latch</option>
                <option value="THREE_BIT_ADDER">3-Bit Adder</option>
            </select>
        </div>
        <div class="center-section">
            <button id="tagMode" class="mode-button">🏷️ Tag</button>
            <button id="delete" class="icon-button">🗑️</button>
        </div>
        <div class="commands-selector">
            <select id="commandsSelector">
                <option value="">Select Command</option>
                <option value="waypointsToggle">👁️ Toggle Waypoints</option>
                <option value="clear">🧹 Clear All</option>
                <option value="screenReaderToggle">🔊 Toggle Screen Reader</option>
            </select>
        </div>
        <div class="right-section">
<?php if ($USER) : ?>
            <button id="assignmentBtn" class="assignment-btn" title="Open Assignment">Assignment</button>
<?php endif; ?>
<?php if ($USER && $USER->instructor) : ?>
            <a href="<?php echo addSession('instructor.php'); ?>" class="instructor-button" title="Instructor Panel">Instructor</a>
<?php endif; ?>
            <button id="helpButton" class="help-button" title="Open Help">?</button>
        </div>
    </div>

    <canvas id="circuitCanvas"></canvas>

    <div class="status-bar">
        <span id="coordinates">Position: 0, 0</span>
    </div>

    <div class="tooltip" id="tooltip"></div>

    <!-- Command line interface -->
    <div class="command-line">
        <input type="text" id="commandInput" placeholder="Type commands here... (e.g., 'place input a', 'place and', 'delete input a', 'connect a output to gate1 input-1')">
        <div class="status" id="status">Ready. Type 'help' for available commands.</div>
    </div>

    <!-- Add confirmation modal -->
    <div id="confirmModal" class="modal" style="display: none;">
        <div class="modal-content">
            <h3>Delete All Gates?</h3>
            <p>Are you sure you want to delete all gates? This action cannot be undone.</p>
            <div class="modal-buttons">
                <button id="confirmDeleteAll">Yes, Delete All</button>
                <button id="cancelDeleteAll">Cancel</button>
            </div>
        </div>
    </div>

    <!-- Load the gate definitions first -->
    <script src="gates.js"></script>
    <!-- Then load the main editor code -->
    <script src="main.js"></script>
    <!-- Then load the circuit.js script -->
    <script src="circuit.js"></script>

    <script>
        // Add mouse coordinate tracking
        const coordinates = document.getElementById('coordinates');
        const canvas = document.getElementById('circuitCanvas');
        const confirmModal = document.getElementById('confirmModal');
        const confirmDeleteAll = document.getElementById('confirmDeleteAll');
        const cancelDeleteAll = document.getElementById('cancelDeleteAll');
        const gateSelector = document.getElementById('gateSelector');

        // Handle confirmation
        confirmDeleteAll.addEventListener('click', () => {
            confirmModal.style.display = 'none';
            // Get the editor instance and call clear directly
            const editor = window.circuitEditor;
            if (editor) {
                editor.clear();
            }
        });

        // Handle cancellation
        cancelDeleteAll.addEventListener('click', () => {
            confirmModal.style.display = 'none';
        });

        // Close modal when clicking outside
        window.addEventListener('click', (e) => {
            if (e.target === confirmModal) {
                confirmModal.style.display = 'none';
            }
        });

        canvas.addEventListener('mousemove', (e) => {
            const rect = canvas.getBoundingClientRect();
            const x = Math.round(e.clientX - rect.left);
            const y = Math.round(e.clientY - rect.top);
            coordinates.textContent = `Position: ${x}, ${y}`;
        });

        // Update selected tool display
        gateSelector.addEventListener('change', (e) => {
            // selectedTool.textContent = `Selected: ${e.target.value}`; // This line is removed
        });

        // Add tooltips for buttons
        document.querySelectorAll('[title]').forEach(element => {
            const tooltip = document.getElementById('tooltip');
            
            element.addEventListener('mouseover', (e) => {
                tooltip.style.display = 'block';
                tooltip.style.left = e.pageX + 10 + 'px';
                tooltip.style.top = e.pageY + 10 + 'px';
                tooltip.textContent = element.getAttribute('title');
            });

            element.addEventListener('mouseout', () => {
                tooltip.style.display = 'none';
            });
        });
    </script>

<?php if ($USER) : ?>
    <!-- Assignment Modal -->
    <div id="assignmentModal" class="assignment-modal hidden">
        <div id="assignmentModalHeader" class="modal-header" title="Drag to move">
            <span>📋 Assignment</span>
            <button class="close-btn" onclick="closeAssignmentModal()" title="Close">×</button>
        </div>
        <div class="modal-content">
            <p id="assignmentInstructions">
                <!-- Instructions will be loaded dynamically from the exercise class -->
            </p>
            <div id="gradingSection" style="margin-top: 20px; display: none;">
                <h3>Circuit Grading</h3>
                <div id="stepDisplay"></div>
                <button id="gradeBtn" onclick="startGrading()">Start Grading</button>
            </div>
        </div>
    </div>

    <script src="exercises.js"></script>
    <script>
        // Assignment modal elements
        const assignmentModal = document.getElementById('assignmentModal');
        const assignmentModalHeader = document.getElementById('assignmentModalHeader');
        const assignmentBtn = document.getElementById('assignmentBtn');
        let modalUserMoved = false; // if user drags, we keep their position

        // Assignment modal functions
        function showAssignmentModal() {
            console.log('showAssignmentModal called');
            console.log('currentExercise:', currentExercise);
            console.log('assignmentModal:', assignmentModal);
            
            // Reset the grading state to ensure fresh start
            if (currentExercise) {
                currentExercise.resetGrading();
            }
            
            // Always reset to initial dialog state
            resetModalToInitialState();
            
            // Load instructions from the current exercise
            if (currentExercise && currentExercise.instructions) {
                const instructionsElement = document.getElementById('assignmentInstructions');
                if (instructionsElement) {
                    instructionsElement.innerHTML = currentExercise.instructions;
                }
                
                // Show the grading section when we have an exercise
                const gradingSection = document.getElementById('gradingSection');
                if (gradingSection) {
                    gradingSection.style.display = 'block';
                }
            } else {
                // Show default message if no exercise is configured
                const instructionsElement = document.getElementById('assignmentInstructions');
                if (instructionsElement) {
                    instructionsElement.innerHTML = `
                        <h3>No Assignment Configured</h3>
                        <p>The instructor has not yet configured an assignment for this tool.</p>
                        <p>Please contact your instructor or try again later.</p>
                    `;
                }
                
                // Hide the grading section when no exercise is configured
                const gradingSection = document.getElementById('gradingSection');
                if (gradingSection) {
                    gradingSection.style.display = 'none';
                }
            }
            
            if (assignmentModal) {
                assignmentModal.classList.remove('hidden');
                centerAssignmentModal();
            } else {
                console.error('Assignment modal not found!');
            }
        }

        function closeAssignmentModal() {
            // Reset the grading state when closing
            if (currentExercise) {
                currentExercise.resetGrading();
            }
            
            // Hide the modal
            assignmentModal.classList.add('hidden');
        }

        function centerAssignmentModal() {
            // Only set initial position if modal doesn't already have a position
            if (!assignmentModal.style.left && !assignmentModal.style.top) {
                console.log('centerAssignmentModal');
                const modalW = assignmentModal.offsetWidth;
                const modalH = assignmentModal.offsetHeight;
                // Position modal nudged to the right, near the top of viewport
                const left = Math.max(0, Math.floor((window.innerWidth - modalW) * 0.7)); // 70% from left edge
                const top = Math.max(20, Math.floor(window.innerHeight * 0.1)); // 10% from top, minimum 20px
                assignmentModal.style.left = left + 'px';
                assignmentModal.style.top = top + 'px';
            }
        }

        // Assignment button click handler
        if (assignmentBtn) {
            assignmentBtn.addEventListener('click', showAssignmentModal);
        }

        // Grading functions
        function startGrading() {
            if (currentExercise) {
                currentExercise.startGrading();
            }
        }

        // Grade submission function
        function submitGradeToLMS(grade) {
            const formData = new FormData();
            formData.append('grade', grade);
            formData.append('code', 'GATES_EXERCISE_COMPLETED');
            
            console.log('Sending grade=' + grade);
            
            fetch('<?php echo addSession($CFG->wwwroot . '/api/grade-submit.php'); ?>', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                console.log('Grade submission response:', data);
                if (data.status === 'success') {
                    // Show success message
                    alert('🎉 Excellent work! Your assignment has been completed successfully and your grade has been submitted to the LMS.');
                } else {
                    console.error('Grade submission failed:', data);
                    // Show error alert to user
                    alert(`⚠️ Grade submission failed: ${data.detail}\n\nYour assignment was completed successfully, but the grade could not be sent to the LMS. Please contact your instructor.`);
                }
            })
            .catch(error => {
                console.error('Grade submission error:', error);
                // Show error alert to user
                alert(`⚠️ Grade submission error: ${error.message}\n\nYour assignment was completed successfully, but there was a technical error sending the grade to the LMS. Please contact your instructor.`);
            });
        }

        // Initialize the exercise when the page loads
        document.addEventListener('DOMContentLoaded', function() {
            console.log('DOMContentLoaded - initializing exercise');
            console.log('Assignment value:', '<?php echo $assn; ?>');
            
            // Create the appropriate exercise instance based on assignment
            if ( '<?php echo $assn; ?>' == 'HalfAdderExercise') {
                console.log('Creating HalfAdderExercise');
                currentExercise = new HalfAdderExercise();
            } else {
                console.log('No matching exercise found for assignment:', '<?php echo $assn; ?>');
            }
            
            // Override the exercise's submitGradeToLMS method to use the global function
            if (currentExercise) {
                currentExercise.submitGradeToLMS = submitGradeToLMS;
                console.log('Exercise initialized successfully:', currentExercise);
            } else {
                console.log('No exercise was created - currentExercise is null');
            }
        });

        // Make modal draggable
        (function enableAssignmentDrag() {
            if (!assignmentModal || !assignmentModalHeader) return;
            let dragging = false;
            let startClientX = 0, startClientY = 0;
            let startLeft = 0, startTop = 0;

            function onPointerDown(e) {
                dragging = true;
                modalUserMoved = true;
                // For position: fixed, use viewport coordinates directly
                startLeft = parseInt(assignmentModal.style.left) || 0;
                startTop = parseInt(assignmentModal.style.top) || 0;
                if (e.touches) {
                    startClientX = e.touches[0].clientX;
                    startClientY = e.touches[0].clientY;
                } else {
                    startClientX = e.clientX;
                    startClientY = e.clientY;
                }
                assignmentModalHeader.style.cursor = 'grabbing';
                window.addEventListener('mousemove', onPointerMove, { passive: false });
                window.addEventListener('mouseup', onPointerUp, { passive: false });
                window.addEventListener('touchmove', onPointerMove, { passive: false });
                window.addEventListener('touchend', onPointerUp, { passive: false });
                e.preventDefault();
            }

            function onPointerMove(e) {
                if (!dragging) return;
                let currentClientX, currentClientY;
                if (e.touches) {
                    currentClientX = e.touches[0].clientX;
                    currentClientY = e.touches[0].clientY;
                } else {
                    currentClientX = e.clientX;
                    currentClientY = e.clientY;
                }
                const dx = currentClientX - startClientX;
                const dy = currentClientY - startClientY;
                // Remove canvas container constraints - allow modal to move freely on screen
                const maxLeft = window.innerWidth - assignmentModal.offsetWidth;
                const maxTop = window.innerHeight - assignmentModal.offsetHeight;
                const newLeft = Math.max(0, Math.min(maxLeft, startLeft + dx));
                const newTop = Math.max(0, Math.min(maxTop, startTop + dy));
                assignmentModal.style.left = newLeft + 'px';
                assignmentModal.style.top = newTop + 'px';
            }

            function onPointerUp(e) {
                dragging = false;
                assignmentModalHeader.style.cursor = 'grab';
                window.removeEventListener('mousemove', onPointerMove);
                window.removeEventListener('mouseup', onPointerUp);
                window.removeEventListener('touchmove', onPointerMove);
                window.removeEventListener('touchend', onPointerUp);
            }

            assignmentModalHeader.addEventListener('mousedown', onPointerDown);
            assignmentModalHeader.addEventListener('touchstart', onPointerDown, { passive: false });
        })();

        // Reset assignment modal to initial state
        function resetModalToInitialState() {
            // Hide any hint modal that might be open
            const hintModal = document.getElementById('hintModal');
            if (hintModal) {
                hintModal.classList.add('hidden');
            }
            
            // Hide hint button if it exists
            const hintBtn = document.getElementById('hintBtn');
            if (hintBtn) {
                hintBtn.style.display = 'none';
            }
            
            // Clear step display
            const stepDisplay = document.getElementById('stepDisplay');
            if (stepDisplay) {
                stepDisplay.innerHTML = '';
            }
            
            // Reset grade button to initial state
            const gradeBtn = document.getElementById('gradeBtn');
            if (gradeBtn) {
                gradeBtn.textContent = 'Start Grading';
                gradeBtn.onclick = () => startGrading();
                gradeBtn.style.backgroundColor = '#28a745'; // Green
            }
            
            // Show instructions section
            const instructionsElement = document.getElementById('assignmentInstructions');
            if (instructionsElement) {
                instructionsElement.style.display = 'block';
            }
        }

        // Easter egg: Ctrl + * to draw a half adder circuit
        function drawHalfAdder() {
            // Clear the circuit first
            if (window.circuitEditor) {
                window.circuitEditor.gates = [];
                window.circuitEditor.wires = [];
                window.circuitEditor.render();
                
                // Execute the commands to build a half adder circuit with compact layout
                const commands = [
                    'place input A at (100, 100)',
                    'place input B at (100, 200)', 
                    'place xor SUM_GATE at (200, 100)',
                    'place and CARRY_GATE at (200, 200)',
                    'place output S at (300, 100)',
                    'place output C at (300, 200)'
                ];
                
                // Execute each command with a small delay to see the construction
                commands.forEach((cmd, index) => {
                    setTimeout(() => {
                        const result = window.circuitEditor.executeCommand(cmd);
                        console.log(`Easter egg command: ${cmd} -> ${result}`);
                        
                        // After placing all components, connect them
                        if (index === commands.length - 1) {
                            setTimeout(() => {
                                // Connect the circuits to form the half adder
                                const connections = [
                                    'connect A output to SUM_GATE input-1',
                                    'connect B output to SUM_GATE input-2',
                                    'connect A output to CARRY_GATE input-1', 
                                    'connect B output to CARRY_GATE input-2',
                                    'connect SUM_GATE output to S input',
                                    'connect CARRY_GATE output to C input'
                                ];
                                
                                connections.forEach((conn, connIndex) => {
                                    setTimeout(() => {
                                        const result = window.circuitEditor.executeCommand(conn);
                                        console.log(`Easter egg connection: ${conn} -> ${result}`);
                                    }, connIndex * 200);
                                });
                            }, 500);
                        }
                    }, index * 300);
                });
                
                // Show a message
                setTimeout(() => {
                    const status = document.getElementById('status');
                    if (status) {
                        status.textContent = '🎉 Easter egg: Half adder circuit created! (Ctrl + *)';
                    }
                }, (commands.length * 300) + 2000);
            }
        }
        
        function unlockHalfAdder() {
            // Only allow for instructors (and students for this educational tool)
            <?php if ($USER) : ?>
                console.log('🎯 Half adder Easter egg triggered! Drawing circuit...');
                drawHalfAdder();
            <?php else : ?>
                console.log('❌ Half adder Easter egg attempted by anonymous user');
            <?php endif; ?>
        }
        
        // Easter egg event listener
        document.addEventListener('keydown', (e) => {
            // Test for Ctrl + * (half adder reference!)
            if (e.ctrlKey && e.key === '*') {
                console.log('🎯 Easter egg triggered! Ctrl + * detected! (Half adder reference!)');
                unlockHalfAdder();
                e.preventDefault(); // Prevent any default browser behavior
            }
        });
    </script>
<?php endif; ?>

</body>
</html> 
