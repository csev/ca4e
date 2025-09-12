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
    <title>WASM Editor - ES Module Example</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <div class="container">
        <header>
            <div class="header-content">
                <div class="title-section">
                    <h1>WASM Playground</h1>
                    <p>A teaching tool for learning WebAssembly Text (WAT) format - ES Module Version</p>
                </div>
                <div class="header-links">
<?php if ($USER && $USER->instructor) : ?>
                    <a href="<?php echo addSession('instructor.php'); ?>" class="instructor-button" title="Instructor Panel">Instructor</a>
<?php endif; ?>
                    <a href="../index.php" class="home-link" title="Go to Home">🏠</a>
                </div>
            </div>
        </header>
        
        <main>
            <div class="editor-section">
                <h2>WAT Code Editor</h2>
                <div class="editor-controls">
                    <button id="clearEditor" class="btn">Clear</button>
                    <button id="runWasm" class="btn btn-primary">Compile & Run WAT</button>
                    <button id="saveCode" class="btn" style="background-color: #28a745; color: white;">💾 Save</button>
                    <button id="loadCode" class="btn" style="background-color: #007bff; color: white;">📁 Load</button>
                    <button id="deleteCode" class="btn" style="background-color: #dc3545; color: white;">🗑️ Delete</button>
                    <button id="manageCode" class="btn" style="background-color: #6c757d; color: white;">📋 Manage</button>
<?php if ($USER) : ?>
                    <button id="assignmentBtn" class="btn btn-assignment">Assignment</button>
<?php endif; ?>
                </div>
                <textarea id="wasmEditor" placeholder="Enter your WAT (WebAssembly Text) code here..."></textarea>
            </div>
            
            <div class="output-section">
                <div class="output-header">
                    <h2>Output</h2>
                    <button id="showWasm" class="btn btn-secondary hidden">Show WASM</button>
                </div>
                <div id="output" class="output-area">
                    <p class="placeholder">Output will appear here when you run your WASM code...</p>
                </div>
                <div id="wasmOutput" class="wasm-output-area hidden">
                    <h3>Console Output:</h3>
                    <pre id="consoleOutput"></pre>
                    <h3>Function Result:</h3>
                    <pre id="functionResult"></pre>
                </div>
                <div id="errorOutput" class="error-area hidden"></div>
            </div>
        </main>
        
        <!-- WASM Hex Modal -->
        <div id="wasmModal" class="modal hidden">
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Compiled WASM Binary (Hex)</h3>
                    <span class="close">&times;</span>
                </div>
                <div class="modal-body">
                    <div class="hex-info">
                        <p><strong>Size:</strong> <span id="wasmSize">0</span> bytes</p>
                        <p><strong>Magic Number:</strong> <span id="wasmMagic">00 61 73 6d</span> (WASM)</p>
                    </div>
                    <div class="hex-container">
                        <pre id="wasmHex"></pre>
                    </div>
                </div>
            </div>
        </div>
    </div>

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
                <h3>WASM Grading</h3>
                <div id="stepDisplay"></div>
                <button id="gradeBtn" onclick="startGrading()">Start Grading</button>
            </div>
            <div id="startGradingSection" style="margin-top: 20px;">
                <button id="startGradeBtn" onclick="startGrading()">Start Grading</button>
            </div>
        </div>
    </div>
<?php endif; ?>
    
    <script src="../common/save-restore.js"></script>
    <script type="module">
        import { WasmEditor } from './script-esm.js';
        document.addEventListener('DOMContentLoaded', () => {
            new WasmEditor();
        });
    </script>

<?php if ($USER) : ?>
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
            
            // Load instructions from the current exercise
            if (currentExercise && currentExercise.instructions) {
                const instructionsElement = document.getElementById('assignmentInstructions');
                if (instructionsElement) {
                    instructionsElement.innerHTML = currentExercise.instructions;
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
            formData.append('code', 'WASM_EXERCISE_COMPLETED');
            
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
            if ( '<?php echo $assn; ?>' == 'HelloWorldExercise') {
                console.log('Creating HelloWorldExercise');
                currentExercise = new HelloWorldExercise();
            } else if ( '<?php echo $assn; ?>' == 'PrintOut42Exercise') {
                console.log('Creating PrintOut42Exercise');
                currentExercise = new PrintOut42Exercise();
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
    </script>
<?php endif; ?>

</body>
</html> 
