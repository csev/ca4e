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
    <link rel="stylesheet" href="../common/modal-styles.css">
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
                    <select id="storageDropdown" class="btn" style="background-color: #6c757d; color: white; border: 1px solid #6c757d; padding: 8px 12px; border-radius: 4px;">
                        <option value="">💾 Storage</option>
                        <option value="save">💾 Save</option>
                        <option value="load">📁 Load</option>
                        <option value="delete">🗑️ Delete</option>
                    </select>
<?php if ($USER && $assn) : ?>
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

<?php if ($USER && $assn) : ?>
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
                <button id="gradeBtn" onclick="startGrading()">Grade</button>
            </div>
            <div id="startGradingSection" style="margin-top: 20px;">
                <button id="startGradeBtn" onclick="startGrading()">Start Grading</button>
            </div>
        </div>
    </div>
<?php endif; ?>
    
    <script src="../common/save-restore.js"></script>
    <script src="../common/modal-manager.js"></script>
    <script src="../common/grading-interface.js"></script>
    <script src="../common/tool-utilities.js"></script>
    <script type="module">
        import { WasmEditor } from './script-esm.js';
        document.addEventListener('DOMContentLoaded', () => {
            new WasmEditor();
        });
    </script>

<?php if ($USER && $assn) : ?>
    <script src="exercises.js"></script>
    <script>
        let currentExercise = null;
        const gradeSubmitUrl = '<?php echo addSession($CFG->wwwroot . '/api/grade-submit.php'); ?>';
        const isInstructor = <?php echo $USER && $USER->instructor ? 'true' : 'false'; ?>;
        const assignmentType = '<?php echo $assn; ?>';

        // LTI Grade Submission Function
        window.submitGradeToLMS = function(grade) {
            console.log('Submitting grade to LMS:', grade);
            
            // Check if we're in an LTI session (user is authenticated)
            <?php if ($USER) : ?>
            console.log('User is authenticated via LTI, proceeding with grade submission...');
            
            // Submit the grade via AJAX using form data (as expected by the endpoint)
            const formData = new FormData();
            formData.append('grade', grade);
            formData.append('code', 'WASM_EXERCISE_COMPLETED'); // Add a code identifier for the assignment
            
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
                    alert(`🎉 Congratulations! Your grade of 1.0 has been successfully submitted to the LMS.`);
                } else {
                    console.error('Grade submission failed:', data);
                    // Show error alert to user
                    alert(`⚠️ Grade submission failed: ${data.detail}\n\nYour assignment was completed successfully, but the grade could not be sent to the LMS. Please contact your instructor.`);
                }
                
                // Close the assignment modal after showing the alert
                if (typeof assignmentModalManager !== 'undefined' && assignmentModalManager.hide) {
                    assignmentModalManager.hide();
                }
            })
            .catch(error => {
                console.error('Error submitting grade:', error);
                // Show error alert to user
                alert(`⚠️ Grade submission error: ${error.message}\n\nYour assignment was completed successfully, but there was a technical error sending the grade to the LMS. Please contact your instructor.`);
                
                // Close the assignment modal after showing the alert
                if (typeof assignmentModalManager !== 'undefined' && assignmentModalManager.hide) {
                    assignmentModalManager.hide();
                }
            });
            <?php else : ?>
            // User is not authenticated (anonymous access), just log it
            console.log('Anonymous user - grade not submitted to LMS:', grade);
            <?php endif; ?>
        };

        // Global function for HTML onclick handlers
        function closeAssignmentModal() {
            if (typeof assignmentModalManager !== 'undefined' && assignmentModalManager.hide) {
                assignmentModalManager.hide();
            }
        }

        // Initialize the exercise and assignment modal when the page loads
        document.addEventListener('DOMContentLoaded', function() {
            // Create the appropriate exercise instance based on assignment
            if (assignmentType == 'HelloWorldExercise') {
                currentExercise = new HelloWorldExercise();
            } else if (assignmentType == 'PrintOut42Exercise') {
                currentExercise = new PrintOut42Exercise();
            }
            
            // Override the exercise's submitGradeToLMS method to use the common function
            if (currentExercise) {
                currentExercise.submitGradeToLMS = window.submitGradeToLMS;
            }
            
            // Initialize assignment modal using common utilities
            assignmentModalManager.initialize({
                modalId: 'assignmentModal',
                buttonId: 'assignmentBtn',
                exerciseInstance: currentExercise,
                gradeSubmitUrl: gradeSubmitUrl,
                isInstructor: isInstructor,
                assignmentType: assignmentType
            });
        });
    </script>
<?php endif; ?>

</body>
</html> 
