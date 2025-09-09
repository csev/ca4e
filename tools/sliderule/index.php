<?php

require_once "../config.php";

use \Tsugi\Core\LTIX;

// Initialize LTI if we received a launch.  If this was a non-LTI GET,
// then $USER will be null (i.e. anonymous)
$LTI = LTIX::session_start();

// Allow the grading web services to work
$_SESSION['GSRF'] = 10; 
?><!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Traditional Slide Rule</title>
    <link rel="stylesheet" href="styles.css">
    <style>
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

        .modal-content {
            transition: transform 0.1s ease;
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

        .assignment-button {
            transition: background-color 0.3s ease;
        }

        .assignment-button:hover {
            background-color: #45a049 !important;
        }
    </style>
</head>
<body>
    <div class="container">
        <header>
            <div class="header-content">
                <div class="title-section">
                    <h1>Traditional Slide Rule</h1>
                    <p>For multiplication and division</p>
                </div>
                <a href="../index.php" class="home-link" title="Go to Home">🏠</a>
            </div>
        </header>
        
        <div class="slide-rule-container">
            <div class="slide-rule" id="slideRule">
                <!-- Fixed scale (A scale) -->
                <div class="scale fixed-scale" id="fixedScale">
                    <div class="scale-label">A</div>
                    <div class="scale-value" id="dValue">1.0</div>
                    <div class="scale-markings" id="fixedMarkings"></div>
                </div>
                
                <!-- Sliding scale (B scale) -->
                <div class="scale sliding-scale" id="slidingScale">
                    <div class="scale-label">B</div>
                    <div class="scale-value" id="cValue">1.0</div>
                    <div class="scale-markings" id="slidingMarkings"></div>
                </div>
                
                <!-- L scale (logarithmic scale) -->
                <div class="scale l-scale" id="lScale">
                    <div class="scale-label">Log<sub>10</sub> (A)</div>
                    <div class="scale-value" id="lValue">0.0</div>
                    <div class="scale-markings" id="lMarkings"></div>
                </div>
                
                <!-- Hairline cursor -->
                <div class="hairline" id="hairline"></div>
            </div>
        </div>
        
        <div class="controls">
            <div class="control-group">
                <label for="hairlinePosition">Move Hairline:</label>
                <input type="range" id="hairlinePosition" min="0" max="100" value="50" step="0.1">
            </div>
            
            <div class="control-group">
                <label for="slidingOffset">Move B:</label>
                <input type="range" id="slidingOffset" min="-1000" max="1000" value="0">
            </div>
        </div>
        
        <div class="info-panel">
            <h2>How to Use</h2>
            <ul>
                <li>Move the hairline to the first number (i.e 2.5) on the A scale</li>
                <li>Slide the B scale to align 1 with the hairline</li>
                <li>Move the hairline to the second number (i.e 3.2) on the B scale</li>
                <li>Read the result on the A scale</li>
            </ul>
        </div>
    </div>

<?php if ($USER) : ?>
    <!-- Assignment Modal -->
    <div id="assignmentModal" class="modal">
        <div class="modal-content">
            <div class="modal-header">
                <h2>Assignment</h2>
                <span class="close">&times;</span>
            </div>
            <div class="modal-body">
            <div id="problemDisplay">
                <p id="problemText">
                    <!-- Problem will be loaded dynamically from the exercise class -->
                </p>
            </div>
            <div id="gradingSection" style="margin-top: 20px; display: none;">
                <div id="stepDisplay">
                    <p id="stepText">Ready to start a new slide rule multiplication exercise!</p>
                </div>
            </div>
            <div style="margin-top: 20px; display: flex; gap: 10px; justify-content: space-between;">
                <button id="nextBtn" onclick="nextStep()" style="background-color: #2196F3; color: white; padding: 8px 16px; border: none; border-radius: 4px; cursor: pointer; display: none;">New Problem</button>
                <button id="gradeBtn" onclick="startGrading()" style="background-color: #4CAF50; color: white; padding: 8px 16px; border: none; border-radius: 4px; cursor: pointer;">Submit Answer</button>
            </div>
            </div>
        </div>
    </div>
<?php endif; ?>
    
    <script src="script.js"></script>
    <script src="exercises.js"></script>
    <script>
        // Set the grade submission URL for the exercise
        const GRADE_SUBMIT_URL = '<?php echo addSession($CFG->wwwroot . '/api/grade-submit.php'); ?>';
        
        // Set user authentication status
        const USER_AUTHENTICATED = <?php echo $USER ? 'true' : 'false'; ?>;
        const USER_IS_INSTRUCTOR = <?php echo ($USER && $USER->instructor) ? 'true' : 'false'; ?>;
        const INSTRUCTOR_URL = '<?php echo addSession("instructor.php"); ?>';
    </script>
    <script>
<?php if ($USER) : ?>
        // Autograder functionality
        let currentExercise = null;

        // Modal functionality
        const assignmentModal = document.getElementById('assignmentModal');
        const assignmentButton = document.getElementById('assignmentButton');

        // Close modal functionality
        function closeModal(modal) {
            modal.style.display = 'none';
        }

        function closeAssignmentModal() {
            closeModal(assignmentModal);
        }

        // Show modal functionality
        window.showAssignmentModal = function() {
            // Reset the exercise to the beginning
            if (currentExercise) {
                currentExercise.startExercise();
                
                const problemElement = document.getElementById('problemText');
                if (problemElement) {
                    problemElement.innerHTML = currentExercise.getProblemDisplay();
                }
            }
            assignmentModal.style.display = 'block';
        }

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
        window.startGrading = function() {
            if (currentExercise) {
                currentExercise.startGrading();
            }
        }

        window.nextStep = function() {
            if (currentExercise) {
                currentExercise.nextStep();
            }
        }


        // Initialize the exercise when the page loads
        document.addEventListener('DOMContentLoaded', function() {
            // Create the slide rule multiplication exercise instance
            currentExercise = new SlideRuleMultiplicationExercise();
            
            // Load problem immediately
            if (currentExercise) {
                const problemElement = document.getElementById('problemText');
                
                if (problemElement) {
                    problemElement.innerHTML = currentExercise.getProblemDisplay();
                }
            }
        });
<?php endif; ?>
    </script>
</body>
</html> 

