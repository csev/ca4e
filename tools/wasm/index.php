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

// Allow the grading web services to work
$_SESSION['GSRF'] = 10; 

?><!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Web Assembly Editor (WASM)</title>
    <link rel="stylesheet" href="styles.css">
    <link rel="stylesheet" href="../common/modal-styles.css">
</head>
<body>
    <div class="container">
        <center>
            <h1>Web Assembly Editor (WASM)</h1>
            <div id="toolbar">
                <button id="runWasm" class="btn btn-primary">Compile & Run WAT</button>
                <select id="storageDropdown" class="btn" style="background-color: #6c757d; color: white; border: 1px solid #6c757d; padding: 8px 12px; border-radius: 4px;">
                    <option value="">💾 Storage</option>
                    <option value="save">💾 Save</option>
                    <option value="load">📁 Load</option>
                    <option value="delete">🗑️ Delete</option>
                </select>
<?php if ($USER && $assn) : ?>
                <button id="assignmentBtn" class="btn btn-assignment">Assignment</button>
                <button id="clearEditor" class="btn">Clear</button>
<?php endif; ?>
<?php if ($USER && $USER->instructor) : ?>
                <a href="<?php echo addSession('instructor.php'); ?>" class="btn instructor-button" title="Instructor Panel">Instructor</a>
<?php endif; ?>
                <button id="asciiChart" class="btn btn-help" title="ASCII Chart">ASCII</button>
                <button id="helpBtn" class="btn btn-help" onclick="openDocumentation()">?</button>
            </div>
        
            <main>
                <div class="editor-section">
                    <h2>WAT Code Editor</h2>
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
        </center>
        
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

    <!-- ASCII Chart Modal -->
    <div id="asciiChartModal" class="assignment-modal hidden">
        <div id="asciiChartModalHeader" class="modal-header" title="Drag to move">
            <span>📊 ASCII Chart</span>
            <button class="close-btn" onclick="closeAsciiChartModal()" title="Close">×</button>
        </div>
        <div id="asciiChartModalContent" class="modal-content" style="padding: 10px; display: flex; justify-content: center; overflow-y: auto; height: calc(100% - 50px);">
            <div id="asciiChartContent">
                <!-- ASCII chart will be generated here -->
            </div>
        </div>
        <div id="asciiChartResizeHandle" style="position: absolute; bottom: 0; right: 0; width: 20px; height: 20px; cursor: nwse-resize; background: linear-gradient(135deg, transparent 0%, transparent 40%, #007bff 40%, #007bff 45%, transparent 45%, transparent 55%, #007bff 55%, #007bff 60%, transparent 60%);"></div>
    </div>
    
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
    <script src="../common/exercise-base.js"></script>
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

        // Function to open documentation
        function openDocumentation() {
            window.open('documentation.html', '_blank', 'width=900,height=700,scrollbars=yes,resizable=yes');
        }

        // Initialize the exercise and assignment modal when the page loads
        document.addEventListener('DOMContentLoaded', function() {
            // Create the appropriate exercise instance based on assignment
            if (assignmentType == 'HelloWorldExercise') {
                currentExercise = new HelloWorldExercise();
            } else if (assignmentType == 'PrintOut42Exercise') {
                currentExercise = new PrintOut42Exercise();
            } else if (assignmentType == 'RandomPhraseExercise') {
                currentExercise = new RandomPhraseExercise();
            } else if (assignmentType == 'LowercaseConversionExercise') {
                currentExercise = new LowercaseConversionExercise();
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

    <script>
        // ASCII Chart Modal functionality
        const asciiChartModal = document.getElementById('asciiChartModal');
        const asciiChartModalHeader = document.getElementById('asciiChartModalHeader');
        const asciiChartBtn = document.getElementById('asciiChart');

        // ASCII Chart functions
        function showAsciiChartModal() {
            if (!asciiChartModal) return;
            
            // Set modal to narrow width to fit table content
            asciiChartModal.style.width = '380px';
            asciiChartModal.style.height = '450px';
            asciiChartModal.style.minWidth = '300px';
            asciiChartModal.style.minHeight = '300px';
            asciiChartModal.style.overflow = 'hidden'; // Prevent modal from scrolling
            
            generateAsciiChart();
            asciiChartModal.classList.remove('hidden');
            centerAsciiChartModal();
        }

        function closeAsciiChartModal() {
            if (!asciiChartModal) return;
            asciiChartModal.classList.add('hidden');
        }

        function centerAsciiChartModal(force = false) {
            if (!asciiChartModal) return;
            // Set initial position if modal doesn't already have a position, or if forced (for resize)
            if (force || (!asciiChartModal.style.left && !asciiChartModal.style.top)) {
                // Use requestAnimationFrame to ensure modal is rendered before getting dimensions
                requestAnimationFrame(() => {
                    if (!asciiChartModal) return;
                    const rect = asciiChartModal.getBoundingClientRect();
                    const modalWidth = rect.width || asciiChartModal.offsetWidth || 500; // fallback to default width
                    const modalHeight = rect.height || asciiChartModal.offsetHeight || 400; // fallback to default height
                    
                    const left = (window.innerWidth - modalWidth) / 2;
                    const top = (window.innerHeight - modalHeight) / 2;
                    asciiChartModal.style.left = Math.max(0, left) + 'px';
                    asciiChartModal.style.top = Math.max(0, top) + 'px';
                });
            } else {
                // If modal already has a position, just ensure it stays within viewport bounds
                requestAnimationFrame(() => {
                    if (!asciiChartModal) return;
                    const rect = asciiChartModal.getBoundingClientRect();
                    const modalWidth = rect.width || asciiChartModal.offsetWidth || 500;
                    const modalHeight = rect.height || asciiChartModal.offsetHeight || 400;
                    const currentLeft = parseInt(asciiChartModal.style.left) || 0;
                    const currentTop = parseInt(asciiChartModal.style.top) || 0;
                    
                    // Keep modal within viewport bounds
                    const maxLeft = window.innerWidth - modalWidth;
                    const maxTop = window.innerHeight - modalHeight;
                    const newLeft = Math.max(0, Math.min(maxLeft, currentLeft));
                    const newTop = Math.max(0, Math.min(maxTop, currentTop));
                    
                    asciiChartModal.style.left = newLeft + 'px';
                    asciiChartModal.style.top = newTop + 'px';
                });
            }
        }

        function generateAsciiChart() {
            const content = document.getElementById('asciiChartContent');
            if (!content) return;
            
            let html = '<table style="border-collapse: collapse; font-family: monospace; font-size: 13px; white-space: nowrap; border: 1px solid #ddd;">';
            html += '<thead><tr style="background: #007bff; color: white;">';
            html += '<th style="padding: 6px 8px; text-align: left; border: 1px solid #0056b3;">Char</th>';
            html += '<th style="padding: 6px 8px; text-align: right; border: 1px solid #0056b3;">Dec</th>';
            html += '<th style="padding: 6px 8px; text-align: right; border: 1px solid #0056b3;">Hex</th>';
            html += '<th style="padding: 6px 8px; text-align: left; border: 1px solid #0056b3;">Binary</th>';
            html += '</tr></thead>';
            html += '<tbody>';
            
            // Printable ASCII characters (32-126)
            for (let i = 32; i <= 126; i++) {
                const char = String.fromCharCode(i);
                const hex = i.toString(16).toUpperCase().padStart(2, '0');
                const binary = i.toString(2).padStart(8, '0');
                
                // Special handling for space character
                const displayChar = char === ' ' ? 'SP' : char;
                const bgColor = i % 2 === 0 ? '#f9f9f9' : '#fff';
                
                html += `<tr style="background: ${bgColor};">`;
                html += `<td style="padding: 4px 8px; border: 1px solid #ddd; font-weight: bold;">${displayChar}</td>`;
                html += `<td style="padding: 4px 8px; border: 1px solid #ddd; text-align: right;">${i}</td>`;
                html += `<td style="padding: 4px 8px; border: 1px solid #ddd; text-align: right; color: #0066cc;">0x${hex}</td>`;
                html += `<td style="padding: 4px 8px; border: 1px solid #ddd; color: #cc6600;">${binary}</td>`;
                html += '</tr>';
            }
            
            html += '</tbody></table>';
            
            content.innerHTML = html;
        }

        // Event listeners
        if (asciiChartBtn) {
            asciiChartBtn.addEventListener('click', showAsciiChartModal);
        }

        // Handle window resize to keep ASCII chart modal positioned correctly
        let resizeTimeout;
        window.addEventListener('resize', () => {
            if (!asciiChartModal || asciiChartModal.classList.contains('hidden')) return;
            
            // Debounce resize events for better performance
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                centerAsciiChartModal(false); // Reposition without forcing center
            }, 150);
        });

        // Make ASCII chart modal draggable
        (function enableAsciiChartDrag() {
            if (!asciiChartModal || !asciiChartModalHeader) return;
            let dragging = false;
            let startClientX = 0, startClientY = 0;
            let startLeft = 0, startTop = 0;

            function onPointerDown(e) {
                dragging = true;
                asciiChartModalHeader.style.cursor = 'grabbing';
                if (e.touches) {
                    startClientX = e.touches[0].clientX;
                    startClientY = e.touches[0].clientY;
                } else {
                    startClientX = e.clientX;
                    startClientY = e.clientY;
                }
                startLeft = parseInt(asciiChartModal.style.left) || 0;
                startTop = parseInt(asciiChartModal.style.top) || 0;
                e.preventDefault();
                window.addEventListener('mousemove', onPointerMove);
                window.addEventListener('mouseup', onPointerUp);
                window.addEventListener('touchmove', onPointerMove, { passive: false });
                window.addEventListener('touchend', onPointerUp);
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
                const maxLeft = window.innerWidth - asciiChartModal.offsetWidth;
                const maxTop = window.innerHeight - asciiChartModal.offsetHeight;
                const newLeft = Math.max(0, Math.min(maxLeft, startLeft + dx));
                const newTop = Math.max(0, Math.min(maxTop, startTop + dy));
                asciiChartModal.style.left = newLeft + 'px';
                asciiChartModal.style.top = newTop + 'px';
            }

            function onPointerUp(e) {
                dragging = false;
                asciiChartModalHeader.style.cursor = 'grab';
                window.removeEventListener('mousemove', onPointerMove);
                window.removeEventListener('mouseup', onPointerUp);
                window.removeEventListener('touchmove', onPointerMove);
                window.removeEventListener('touchend', onPointerUp);
            }

            asciiChartModalHeader.addEventListener('mousedown', onPointerDown);
            asciiChartModalHeader.addEventListener('touchstart', onPointerDown, { passive: false });
        })();

        // Make ASCII Chart modal resizable
        (function enableAsciiChartResize() {
            const resizeHandle = document.getElementById('asciiChartResizeHandle');
            if (!asciiChartModal || !resizeHandle) return;
            let resizing = false;
            let startClientX = 0, startClientY = 0;
            let startWidth = 0, startHeight = 0;

            function onResizeDown(e) {
                resizing = true;
                startWidth = asciiChartModal.offsetWidth;
                startHeight = asciiChartModal.offsetHeight;
                if (e.touches) {
                    startClientX = e.touches[0].clientX;
                    startClientY = e.touches[0].clientY;
                } else {
                    startClientX = e.clientX;
                    startClientY = e.clientY;
                }
                window.addEventListener('mousemove', onResizeMove, { passive: false });
                window.addEventListener('mouseup', onResizeUp, { passive: false });
                window.addEventListener('touchmove', onResizeMove, { passive: false });
                window.addEventListener('touchend', onResizeUp, { passive: false });
                e.preventDefault();
                e.stopPropagation();
            }

            function onResizeMove(e) {
                if (!resizing) return;
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
                
                // Calculate new dimensions (minimum 300x300)
                const minWidth = 300;
                const minHeight = 300;
                const maxWidth = window.innerWidth - (parseInt(asciiChartModal.style.left) || 0);
                const maxHeight = window.innerHeight - (parseInt(asciiChartModal.style.top) || 0);
                
                const newWidth = Math.max(minWidth, Math.min(maxWidth, startWidth + dx));
                const newHeight = Math.max(minHeight, Math.min(maxHeight, startHeight + dy));
                
                asciiChartModal.style.width = newWidth + 'px';
                asciiChartModal.style.height = newHeight + 'px';
            }

            function onResizeUp(e) {
                resizing = false;
                window.removeEventListener('mousemove', onResizeMove);
                window.removeEventListener('mouseup', onResizeUp);
                window.removeEventListener('touchmove', onResizeMove);
                window.removeEventListener('touchend', onResizeUp);
            }

            resizeHandle.addEventListener('mousedown', onResizeDown);
            resizeHandle.addEventListener('touchstart', onResizeDown, { passive: false });
        })();
    </script>

</body>
</html> 
