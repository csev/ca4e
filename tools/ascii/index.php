<?php

require_once "../config.php";
require_once "assignments.php";

use \Tsugi\Core\LTIX;
use \Tsugi\Core\Settings;

// Initialize LTI if we received a launch.  If this was a non-LTI GET,
// then $USER will be null (i.e. anonymous)
$LTI = LTIX::session_start();

$_SESSION['GSRF'] = 10;

// See if we have an assignment configured, if not check for a custom variable
$assn = Settings::linkGetCustom('exercise');

// Make sure it is a valid assignment
if ( $assn && ! isset($assignments[$assn]) ) $assn = null;
?><!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ASCII Character Chart</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 5px;
            background-color: #f5f5f5;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
        }
        
        .header {
            background: white;
            padding: 8px 12px;
            border-radius: 4px;
            margin-bottom: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .header h1 {
            margin: 0;
            color: #333;
            font-size: 20px;
        }
        
        .header-buttons {
            display: flex;
            gap: 10px;
        }
        
        button {
            background-color: #007bff;
            color: white;
            border: none;
            padding: 6px 12px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 13px;
        }
        
        button:hover {
            background-color: #0056b3;
        }

        .assignment-btn {
            background-color: #fff0e6 !important;
            color: #333 !important;
            border: 1px solid #ddd !important;
        }

        .assignment-btn:hover {
            background-color: #ffe4cc !important;
            color: #333 !important;
        }

        .instructor-button {
            background-color: #28a745;
            color: white;
            text-decoration: none;
            padding: 8px 12px;
            border-radius: 4px;
            border: none;
            cursor: pointer;
            font-size: 14px;
            display: inline-block;
        }

        .instructor-button:hover {
            background-color: #218838;
            text-decoration: none;
            color: white;
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
            max-width: 90vw;
            max-height: 80vh;
            overflow-y: auto;
        }

        .assignment-modal.hidden {
            display: none;
        }

        .modal-header {
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

        .modal-header:active {
            cursor: grabbing;
        }

        .close-btn {
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

        .close-btn:hover {
            background: rgba(255,255,255,0.2);
            border-radius: 50%;
        }

        .modal-content {
            padding: 20px;
        }

        .modal-content h3 {
            margin-top: 0;
            color: #007bff;
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
        
        .spinner-gear {
            display: inline-block;
            animation: spin 2s linear infinite;
            font-size: 20px;
        }
        
        @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }

        /* ASCII Chart Styles */
        .ascii-chart-container {
            background: white;
            padding: 10px;
            border-radius: 4px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .ascii-chart-container h2 {
            margin: 0 0 8px 0;
            font-size: 18px;
        }

        .ascii-chart-grid {
            display: grid;
            gap: 4px;
            font-family: monospace;
            font-size: 12px;
            margin: 0;
        }

        .ascii-cell {
            border: 1px solid #ccc;
            padding: 4px 2px;
            text-align: center;
            border-radius: 2px;
        }

        .ascii-cell:nth-child(even) {
            background: #f9f9f9;
        }

        .ascii-char {
            font-weight: bold;
            font-size: 14px;
            margin-bottom: 2px;
        }

        .ascii-decimal {
            color: #666;
            font-size: 11px;
        }

        .ascii-hex {
            color: #0066cc;
            font-size: 11px;
        }

        .ascii-binary {
            color: #cc6600;
            font-size: 10px;
        }

        /* Exercise Styles */
        .exercise-container {
            background: white;
            padding: 20px;
            border-radius: 6px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            margin-top: 15px;
        }

        .question {
            margin: 15px 0;
            padding: 15px;
            background: #f8f9fa;
            border-radius: 4px;
        }

        .question-text {
            font-size: 16px;
            font-weight: bold;
            margin-bottom: 10px;
        }

        .answer-input {
            padding: 8px;
            font-size: 16px;
            border: 2px solid #ced4da;
            border-radius: 4px;
            width: 100px;
        }

        .answer-input:focus {
            outline: none;
            border-color: #007bff;
        }

        .answer-feedback {
            margin-top: 8px;
            font-weight: bold;
        }

        .answer-feedback.correct {
            color: #28a745;
        }

        .answer-feedback.incorrect {
            color: #dc3545;
        }

        .score-display {
            font-size: 18px;
            font-weight: bold;
            color: #007bff;
            margin: 15px 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>ASCII Character Chart</h1>
            <div class="header-buttons">
<?php if ($USER && $assn) : ?>
                <button id="assignmentBtn" class="assignment-btn">Assignment</button>
<?php endif; ?>
<?php if ($USER && $USER->instructor) : ?>
                <a href="<?php echo addSession('instructor.php'); ?>" class="instructor-button" title="Instructor Panel">Instructor</a>
<?php endif; ?>
            </div>
        </div>

        <div class="ascii-chart-container">
            <div id="asciiChartContent">
                <!-- ASCII chart will be generated here -->
            </div>
        </div>
    </div>

<?php if ($USER && $assn) : ?>
    <!-- Assignment Modal -->
    <div id="assignmentModal" class="assignment-modal hidden">
        <div id="assignmentModalHeader" class="modal-header" title="Drag to move">
            <span>📋 Assignment</span>
            <button class="close-btn" onclick="closeAssignmentModal()" title="Close" aria-label="Close">×</button>
        </div>
        <div class="modal-content">
            <p id="assignmentInstructions">
                <!-- Instructions will be loaded dynamically from the exercise class -->
            </p>
            <div id="gradingSection" style="margin-top: 20px; display: none;">
                <div id="stepDisplay"></div>
                <button id="gradeBtn" onclick="startGrading()">Start Grading</button>
            </div>
            <div id="startGradingSection" style="margin-top: 20px;">
                <button id="startGradeBtn" onclick="startGrading()">Start Grading</button>
            </div>
        </div>
    </div>
<?php endif; ?>

    <script src="../common/exercise-base.js"></script>
    <script src="exercises.js"></script>
    <script>
        // Generate ASCII chart on page load
        function generateAsciiChart() {
            const content = document.getElementById('asciiChartContent');
            if (!content) return;
            
            // Calculate responsive number of columns based on window width
            const windowWidth = window.innerWidth;
            const availableWidth = Math.min(windowWidth - 60, 1200); // Account for padding and max width (reduced from 80)
            const minCellWidth = 70; // Minimum width per cell (reduced from 100)
            const maxColumns = Math.max(3, Math.floor(availableWidth / minCellWidth));
            const columns = Math.min(maxColumns, 10); // Cap at 10 columns (increased from 8) for more compact display
            
            let html = '<h2>ASCII Character Chart</h2>';
            
            // Printable ASCII characters (32-126) with responsive grid
            html += `<div class="ascii-chart-grid" style="grid-template-columns: repeat(${columns}, 1fr);">`;
            
            for (let i = 32; i <= 126; i++) {
                const char = String.fromCharCode(i);
                const hex = i.toString(16).toUpperCase().padStart(2, '0');
                const binary = i.toString(2).padStart(8, '0');
                
                // Special handling for common characters
                let displayChar = char;
                if (char === ' ') displayChar = 'SP';
                else if (char === '\t') displayChar = 'TAB';
                else if (char === '\n') displayChar = 'LF';
                else if (char === '\r') displayChar = 'CR';
                
                html += `<div class="ascii-cell">
                    <div class="ascii-char">${displayChar}</div>
                    <div class="ascii-decimal">${i}</div>
                    <div class="ascii-hex">0x${hex}</div>
                    <div class="ascii-binary">${binary}</div>
                </div>`;
            }
            
            html += '</div>';
            
            content.innerHTML = html;
        }

        // Handle window resize to regenerate chart with responsive grid
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                generateAsciiChart();
            }, 150);
        });

        // Assignment modal elements
        const assignmentModal = document.getElementById('assignmentModal');
        const assignmentModalHeader = document.getElementById('assignmentModalHeader');
        const assignmentBtn = document.getElementById('assignmentBtn');
        let modalUserMoved = false;

        // Assignment modal functions
        function showAssignmentModal() {
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
            }
            
            assignmentModal.classList.remove('hidden');
            centerAssignmentModal();
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
                const modalW = assignmentModal.offsetWidth;
                const modalH = assignmentModal.offsetHeight;
                const left = Math.max(0, Math.floor((window.innerWidth - modalW) * 0.7));
                const top = Math.max(20, Math.floor(window.innerHeight * 0.1));
                assignmentModal.style.left = left + 'px';
                assignmentModal.style.top = top + 'px';
            }
        }

        // Assignment button click handler (only if button exists)
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
            formData.append('code', 'ASCII_EXERCISE_COMPLETED');
            
            console.log('Sending grade=' + grade);
            
            fetch('<?php echo addSession($CFG->wwwroot . '/api/grade-submit.php'); ?>', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                console.log('Grade submission response:', data);
                if (data.status === 'success') {
                    alert('🎉 Excellent work! Your assignment has been completed successfully and your grade has been submitted to the LMS.');
                    // Close the assignment modal automatically
                    if (assignmentModal) {
                        assignmentModal.classList.add('hidden');
                    }
                } else {
                    console.error('Grade submission failed:', data);
                    alert(`⚠️ Grade submission failed: ${data.detail}\n\nYour assignment was completed successfully, but the grade could not be sent to the LMS. Please contact your instructor.`);
                }
            })
            .catch(error => {
                console.error('Grade submission error:', error);
                alert(`⚠️ Grade submission error: ${error.message}\n\nYour assignment was completed successfully, but there was a technical error sending the grade to the LMS. Please contact your instructor.`);
            });
        }

        // Global variable for current exercise
        let currentExercise = null;

        // Initialize the exercise when the page loads
        document.addEventListener('DOMContentLoaded', function() {
            // Generate ASCII chart
            generateAsciiChart();
            
            // Create the appropriate exercise instance based on assignment
            if ( '<?php echo $assn; ?>' == 'AsciiLookupExercise') {
                currentExercise = new AsciiLookupExercise();
            }
            
            // Override the exercise's submitGradeToLMS method to use the global function
            if (currentExercise) {
                currentExercise.submitGradeToLMS = submitGradeToLMS;
            }
            
            // Make currentExercise globally accessible
            window.currentExercise = currentExercise;
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

</body>
</html>

