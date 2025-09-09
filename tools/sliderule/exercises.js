// Slide Rule Multiplication Exercise
class SlideRuleMultiplicationExercise {
    constructor() {
        this.currentProblem = null;
        this.gradingStep = 0;
        this.maxSteps = 3;
        this.tolerance = 0.2;
        this.stepNames = [
            "Setup", 
            "Step 1: Align B scale", 
            "Step 2: Position hairline", 
            "Step 3: Read result"
        ];
        this.instructions = `
            <h3>How to Use the Slide Rule for Multiplication</h3>
            <ol>
                <li>Move the hairline to the first number (A) on the A scale</li>
                <li>Slide the B scale to align 1 with the hairline</li>
                <li>Move the hairline to the second number (B) on the B scale</li>
                <li>Read the result on the A scale</li>
            <p><strong>Note:</strong> All values are rounded to one decimal place for this exercise.</p>
        `;
        
        // Generate the problem immediately when the exercise is created
        this.generateProblem();
        
        // Update the assignment button text
        this.updateAssignmentButton();
    }

    // Generate a random multiplication problem
    generateProblem() {
        // Generate operand A: random float between 1.0 and 4.0, rounded to 1 decimal
        const operandA = Math.round((Math.random() * 3 + 1) * 10) / 10;
        
        // Generate product: random float between 7.5 and 9.5, rounded to 1 decimal
        const product = Math.round((Math.random() * 2 + 7.5) * 10) / 10;
        
        // Calculate operand B: product / operandA, rounded to 1 decimal
        const operandB = Math.round((product / operandA) * 10) / 10;
        
        // Recalculate product to ensure precision
        const actualProduct = Math.round((operandA * operandB) * 10) / 10;
        
        this.currentProblem = {
            operandA: operandA,
            operandB: operandB,
            product: actualProduct
        };
        
        return this.currentProblem;
    }

    // Update the assignment button text with the current problem
    updateAssignmentButton() {
        const assignmentButton = document.getElementById('assignmentButton');
        if (assignmentButton && this.currentProblem) {
            assignmentButton.textContent = `Assignment: ${this.currentProblem.operandA} × ${this.currentProblem.operandB}`;
        }
    }

    // Start the exercise
    startExercise() {
        console.log('startExercise called - resetting to beginning');
        this.gradingStep = 0;
        
        const stepText = document.getElementById('stepText');
        if (stepText) {
            stepText.innerHTML = '';
        }
        
        // Make sure the problem instructions are visible when starting fresh
        const problemElement = document.getElementById('problemText');
        if (problemElement) {
            problemElement.style.display = 'block';
        }
        
        // Show the grading section
        const gradingSection = document.getElementById('gradingSection');
        if (gradingSection) {
            gradingSection.style.display = 'block';
        }
        
        // Show submit button
        const gradeBtn = document.getElementById('gradeBtn');
        if (gradeBtn) {
            gradeBtn.textContent = 'Grade';
            gradeBtn.style.display = 'inline-block';
        }
        
        // Hide next button initially
        const nextBtn = document.getElementById('nextBtn');
        if (nextBtn) {
            nextBtn.style.display = 'none';
        }
    }

    // Start grading process
    startGrading() {
        console.log('startGrading called, gradingStep:', this.gradingStep);
        
        if (!this.currentProblem) {
            this.generateProblem();
        }
        
        // Hide the initial instructions
        const problemElement = document.getElementById('problemText');
        if (problemElement) {
            problemElement.style.display = 'none';
        }
        
        this.gradingStep = 1;
        this.gradeCurrentStep();
    }

    // Grade the current step
    gradeCurrentStep() {
        console.log('gradeCurrentStep called, step:', this.gradingStep);
        
        if (!this.currentProblem) {
            console.log('No current problem');
            return;
        }
        
        const stepText = document.getElementById('stepText');
        if (!stepText) {
            console.log('stepText element not found');
            return;
        }
        
        const problem = this.currentProblem;
        const gradeBtn = document.getElementById('gradeBtn');
        const nextBtn = document.getElementById('nextBtn');
        let feedback = ''; // Declare feedback variable at the beginning
        
        if (this.gradingStep === 1) {
            // Step 1: Check that 1.0 on B scale is aligned with operand A on A scale
            const bScaleOnePosition = this.getBScaleOnePosition();
            const expectedAPosition = this.getAScalePosition(problem.operandA);
            const alignmentCorrect = Math.abs(bScaleOnePosition - expectedAPosition) <= this.tolerance;
            
            feedback = '';
            
            if (alignmentCorrect) {
                feedback += `
                    <div style="background: #d4edda; padding: 15px; border-radius: 8px; margin: 10px 0; border: 1px solid #c3e6cb;">
                        <h4 style="color: #155724; margin: 0 0 10px 0;">✅ Step 1 Passed!</h4>
                        <p style="margin: 5px 0;">Excellent! The B scale is correctly aligned.</p>
                        <p style="margin: 10px 0 0 0; font-weight: bold; color: #155724;">Click "Next Step" to continue to Step 2.</p>
                    </div>
                `;
                
                if (gradeBtn) gradeBtn.style.display = 'none';
                if (nextBtn) {
                    nextBtn.textContent = 'Next Step';
                    nextBtn.style.display = 'inline-block';
                }
            } else {
                feedback += `
                    <div style="background: #f8d7da; padding: 15px; border-radius: 8px; margin: 10px 0; border: 1px solid #f5c6cb;">
                        <h4 style="color: #721c24; margin: 0 0 10px 0;">❌ Step 1 Failed</h4>
                        <p style="margin: 5px 0;">The alignment is not close enough. Please adjust:</p>
                        <ol style="margin: 5px 0 5px 20px;">
                            <li>Move the hairline to ${problem.operandA} on the A scale</li>
                            <li>Slide the B scale so that 1.0 on B aligns with the hairline</li>
                        </ol>
                        <p style="margin: 10px 0 0 0; font-style: italic; color: #721c24;">Close this dialog to adjust the slide rule, then reopen to check your work.</p>
                    </div>
                `;
                
                if (gradeBtn) gradeBtn.style.display = 'none';
                if (nextBtn) nextBtn.style.display = 'none';
            }
            
        } else if (this.gradingStep === 2) {
            // Step 2: Check that hairline is positioned at operand B on B scale
            const hairlineValue = this.getCurrentBValue();
            const hairlineCorrect = Math.abs(hairlineValue - problem.operandB) <= this.tolerance;
            
            feedback = '';
            
            if (hairlineCorrect) {
                feedback += `
                    <div style="background: #d4edda; padding: 15px; border-radius: 8px; margin: 10px 0; border: 1px solid #c3e6cb;">
                        <h4 style="color: #155724; margin: 0 0 10px 0;">✅ Step 2 Passed!</h4>
                        <p style="margin: 5px 0;">Perfect! The hairline is correctly positioned.</p>
                        <p style="margin: 10px 0 0 0; font-weight: bold; color: #155724;">Click "Next Step" to read the final result.</p>
                    </div>
                `;
                
                if (gradeBtn) gradeBtn.style.display = 'none';
                if (nextBtn) {
                    nextBtn.textContent = 'Next Step';
                    nextBtn.style.display = 'inline-block';
                }
            } else {
                feedback += `
                    <div style="background: #f8d7da; padding: 15px; border-radius: 8px; margin: 10px 0; border: 1px solid #f5c6cb;">
                        <h4 style="color: #721c24; margin: 0 0 10px 0;">❌ Step 2 Failed</h4>
                        <p style="margin: 5px 0;">The hairline position needs adjustment.</p>
                        <p style="margin: 5px 0;"><strong>Instructions:</strong> Move the hairline to ${problem.operandB} on the B scale.</p>
                        <p style="margin: 10px 0 0 0; font-style: italic; color: #721c24;">Close this dialog to adjust the slide rule, then reopen to check your work.</p>
                    </div>
                `;
                
                if (gradeBtn) gradeBtn.style.display = 'none';
                if (nextBtn) nextBtn.style.display = 'none';
            }
            
        } else if (this.gradingStep === 3) {
            // Step 3: Check final result reading on A scale
            const currentProduct = this.getCurrentProductValue();
            const productCorrect = Math.abs(currentProduct - problem.product) <= this.tolerance;
            
            feedback =  '';
            
            if (productCorrect) {
                feedback += `
                    <div style="background: #d4edda; padding: 15px; border-radius: 8px; margin: 10px 0; border: 1px solid #c3e6cb;">
                        <h4 style="color: #155724; margin: 0 0 10px 0;">🎉 Step 3 Passed! Assignment Complete!</h4>
                        <p style="margin: 5px 0;">Outstanding! You have successfully completed the slide rule multiplication:</p>
                        <p style="margin: 10px 0; text-align: center; font-size: 18px; font-weight: bold; color: #155724;">
                            ${problem.operandA} × ${problem.operandB} = ${problem.product}
                        </p>
                        <div style="background: #d1ecf1; padding: 10px; border-radius: 5px; margin: 10px 0; border: 1px solid #bee5eb;">
                            <p style="margin: 0; color: #0c5460; font-weight: bold; text-align: center;">
                                ✅ Grade: 100% - Submitting to LMS...
                            </p>
                        </div>
                    </div>
                `;
                
                // Submit grade to LMS
                this.submitGradeToLMS(1.0);
                
                if (gradeBtn) gradeBtn.style.display = 'none';
                if (nextBtn) {
                    nextBtn.textContent = 'Try Again';
                    nextBtn.style.display = 'inline-block';
                }
            } else {
                feedback += `
                    <div style="background: #f8d7da; padding: 15px; border-radius: 8px; margin: 10px 0; border: 1px solid #f5c6cb;">
                        <h4 style="color: #721c24; margin: 0 0 10px 0;">❌ Step 3 Failed</h4>
                        <p style="margin: 5px 0;">The final result reading needs to be more accurate.</p>
                        <p style="margin: 5px 0;"><strong>Instructions:</strong> Make sure the hairline is correctly positioned and read the value on the A scale.</p>
                        <p style="margin: 10px 0 0 0; font-style: italic; color: #721c24;">Close this dialog to adjust the slide rule, then reopen to check your work.</p>
                    </div>
                `;
                
                if (gradeBtn) gradeBtn.style.display = 'none';
                if (nextBtn) nextBtn.style.display = 'none';
            }
        } else {
            // Default case for unexpected step values
            feedback = `
                <div style="background: #f8d7da; padding: 15px; border-radius: 8px; margin: 10px 0; border: 1px solid #f5c6cb;">
                    <h4 style="color: #721c24; margin: 0 0 10px 0;">❌ Error</h4>
                    <p style="margin: 5px 0;">Unexpected step value: ${this.gradingStep}</p>
                    <p style="margin: 5px 0;">Please restart the exercise.</p>
                </div>
            `;
        }
        
        stepText.innerHTML = feedback;
    }

    // Get current A scale value from slide rule
    getCurrentAValue() {
        if (!window.slideRule) return 0;
        
        const hairlinePosition = parseFloat(window.slideRule.hairlinePosition.value);
        const value = window.slideRule.positionToLog(hairlinePosition);
        return Math.round(value * 10) / 10;
    }

    // Get current B scale value from slide rule
    getCurrentBValue() {
        if (!window.slideRule) return 0;
        
        const hairlinePosition = parseFloat(window.slideRule.hairlinePosition.value);
        const cOffset = parseFloat(window.slideRule.slidingOffset.value);
        const cPosition = hairlinePosition - (cOffset / 10);
        const value = window.slideRule.positionToLog(cPosition);
        return Math.round(value * 10) / 10;
    }

    // Get current product value from slide rule
    getCurrentProductValue() {
        if (!window.slideRule) return 0;
        
        const hairlinePosition = parseFloat(window.slideRule.hairlinePosition.value);
        const value = window.slideRule.positionToLog(hairlinePosition);
        return Math.round(value * 10) / 10;
    }

    // Get the position of 1.0 on the B scale (accounting for slide offset)
    getBScaleOnePosition() {
        if (!window.slideRule) {
            console.log('window.slideRule not found');
            return 0;
        }
        
        const onePositionOnB = window.slideRule.logToPosition(1.0); // Position of 1.0 on B scale
        const cOffset = parseFloat(window.slideRule.slidingOffset.value);
        const adjustedPosition = onePositionOnB + (cOffset / 10); // Adjust for slide offset
        const result = window.slideRule.positionToLog(adjustedPosition);
        
        console.log('getBScaleOnePosition:', {
            onePositionOnB,
            cOffset,
            adjustedPosition,
            result
        });
        
        return result;
    }

    // Get the position of a value on the A scale
    getAScalePosition(value) {
        return value; // A scale values are direct
    }

    // Submit grade to LMS
    submitGradeToLMS(grade) {
        console.log('Submitting grade to LMS:', grade);
        
        // Check if we're in an LTI session (user is authenticated)
        console.log('User is authenticated via LTI, proceeding with grade submission...');
        
        // Submit the grade via AJAX using form data (as expected by the endpoint)
        const formData = new FormData();
        formData.append('grade', grade);
        formData.append('code', 'SLIDERULE_MULTIPLICATION_COMPLETED');
        
        console.log('Sending grade=' + grade);
        
        fetch(GRADE_SUBMIT_URL, {
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
                    const currentContent = stepText.innerHTML;
                    stepText.innerHTML = currentContent.replace(
                        '✅ Grade: 100% - Submitting to LMS...',
                        `<span style="color: #28a745;">🎉 Grade: 100% - Successfully submitted to LMS!</span>`
                    );
                }
            } else {
                console.error('Grade submission failed:', data);
                // Show error message to user
                const stepText = document.getElementById('stepText');
                if (stepText) {
                    const currentContent = stepText.innerHTML;
                    stepText.innerHTML = currentContent.replace(
                        '✅ Grade: 100% - Submitting to LMS...',
                        `<span style="color: #dc3545;">⚠ Grade: 100% - LMS submission failed</span>`
                    );
                    
                    stepText.innerHTML += `
                        <div style="background: #f8d7da; padding: 15px; border-radius: 8px; margin-top: 10px; border: 1px solid #f5c6cb;">
                            <h5 style="margin: 0 0 10px 0; color: #721c24;">⚠ Grade Submission Issue</h5>
                            <p style="margin: 5px 0; color: #721c24;">
                                <strong>Your assignment was completed successfully!</strong> However, there was a technical issue submitting your grade to the LMS.
                            </p>
                            <p style="margin: 5px 0; color: #721c24;">
                                <strong>Error:</strong> ${data.detail}
                            </p>
                            <p style="margin: 10px 0 0 0; color: #721c24; font-size: 14px;">
                                Please contact your instructor to manually record your grade.
                            </p>
                        </div>
                    `;
                }
            }
        })
        .catch(error => {
            console.error('Error submitting grade:', error);
            // Show error message to user
            const stepText = document.getElementById('stepText');
            if (stepText) {
                const currentContent = stepText.innerHTML;
                stepText.innerHTML = currentContent.replace(
                    '✅ Grade: 100% - Submitting to LMS...',
                    `<span style="color: #dc3545;">⚠ Grade: 100% - Network error</span>`
                );
                
                stepText.innerHTML += `
                    <div style="background: #f8d7da; padding: 15px; border-radius: 8px; margin-top: 10px; border: 1px solid #f5c6cb;">
                        <h5 style="margin: 0 0 10px 0; color: #721c24;">⚠ Network Error</h5>
                        <p style="margin: 5px 0; color: #721c24;">
                            <strong>Your assignment was completed successfully!</strong> However, there was a network error while submitting your grade.
                        </p>
                        <p style="margin: 5px 0; color: #721c24;">
                            <strong>Error:</strong> ${error.message}
                        </p>
                        <p style="margin: 10px 0 0 0; color: #721c24; font-size: 14px;">
                            Please check your internet connection and contact your instructor if the problem persists.
                        </p>
                    </div>
                `;
            }
        });
    }

    // Get the current problem display
    getProblemDisplay() {
        if (!this.currentProblem) return '';
        
        return `
            <div style="background: #e8f4fd; padding: 15px; border-radius: 8px; margin: 10px 0;">
                <p><strong>A=${this.currentProblem.operandA}, B=${this.currentProblem.operandB}</strong></p>
                <p>Once you have set up the slide rule to compute A × B, click "Grade" to check your work.</p>
            </div>
        `;
    }

    // Next step or new problem
    nextStep() {
        if (this.gradingStep === 0) {
            this.startExercise();
        } else if (this.gradingStep < this.maxSteps) {
            // Advance to next step
            this.gradingStep++;
            this.gradeCurrentStep();
        } else {
            // Reset to start with same problem (don't generate new operands)
            this.startExercise();
        }
    }

    // Reset grading
    resetGrading() {
        this.gradingStep = 0;
        this.generateProblem(); // Generate a new problem
        
        const stepText = document.getElementById('stepText');
        if (stepText) {
            stepText.innerHTML = 'Ready to start a new slide rule multiplication exercise!';
        }
        
        const gradingSection = document.getElementById('gradingSection');
        if (gradingSection) {
            gradingSection.style.display = 'none';
        }
        
        const gradeBtn = document.getElementById('gradeBtn');
        const nextBtn = document.getElementById('nextBtn');
        
        if (gradeBtn) {
            gradeBtn.textContent = 'Grade';
            gradeBtn.style.display = 'inline-block';
        }
        if (nextBtn) {
            nextBtn.style.display = 'none';
        }
        
        // Update the problem display
        const problemElement = document.getElementById('problemText');
        if (problemElement) {
            problemElement.innerHTML = this.getProblemDisplay();
        }
        
        // Update the assignment button
        this.updateAssignmentButton();
    }
}
