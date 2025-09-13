/**
 * Common Grading Interface for CA4E Tools
 * Provides standardized grading UI components and functionality
 */

class GradingInterface {
    constructor() {
        this.currentStep = 0;
        this.isGrading = false;
        this.steps = [];
    }
    
    /**
     * Show grading section
     */
    showGradingSection() {
        const section = document.getElementById('gradingSection');
        if (section) section.style.display = 'block';
    }
    
    /**
     * Hide grading section
     */
    hideGradingSection() {
        const section = document.getElementById('gradingSection');
        if (section) section.style.display = 'none';
    }
    
    /**
     * Show start grading button
     */
    showStartGradingButton() {
        const section = document.getElementById('startGradingSection');
        if (section) section.style.display = 'block';
    }
    
    /**
     * Hide start grading button
     */
    hideStartGradingButton() {
        const section = document.getElementById('startGradingSection');
        if (section) section.style.display = 'none';
    }
    
    /**
     * Show instructions
     */
    showInstructions() {
        const instructions = document.getElementById('assignmentInstructions') || 
                           document.getElementById('assignmentInstructionsText');
        if (instructions) instructions.style.display = 'block';
    }
    
    /**
     * Hide instructions
     */
    hideInstructions() {
        const instructions = document.getElementById('assignmentInstructions') || 
                           document.getElementById('assignmentInstructionsText');
        if (instructions) instructions.style.display = 'none';
    }
    
    /**
     * Update grade button text and functionality
     */
    updateGradeButton(text = 'Next', onClick = null) {
        const button = document.getElementById('gradeBtn');
        if (button) {
            button.textContent = text;
            if (onClick) {
                button.onclick = onClick;
            }
        }
    }
    
    /**
     * Show next button
     */
    showNextButton() {
        this.updateGradeButton('Next', () => {
            if (window.nextStep) window.nextStep();
        });
    }
    
    /**
     * Show retry button
     */
    showRetryButton() {
        this.updateGradeButton('Retry', () => {
            if (window.startGrading) window.startGrading();
        });
    }
    
    /**
     * Show executing indicator
     */
    showExecutingIndicator() {
        const display = document.getElementById('stepDisplay');
        if (display) {
            display.innerHTML = `
                <div style="display: flex; align-items: center; gap: 10px; padding: 15px;">
                    <div class="spinner-gear">⚙️</div>
                    <span>Executing program...</span>
                </div>
            `;
        }
    }
    
    /**
     * Clear step display
     */
    clearStepDisplay() {
        const display = document.getElementById('stepDisplay');
        if (display) {
            display.innerHTML = '';
        }
    }
    
    /**
     * Display step result
     */
    displayStepResult(stepIndex, result) {
        const display = document.getElementById('stepDisplay');
        if (!display) return;
        
        const step = this.steps[stepIndex];
        if (!step) return;
        
        const statusIcon = result.passed ? '✅' : '❌';
        const statusClass = result.passed ? 'step-passed' : 'step-failed';
        
        display.innerHTML = `
            <div class="step-result ${statusClass}">
                <h4>${statusIcon} ${step.name}</h4>
                <p>${result.message}</p>
            </div>
        `;
    }
    
    /**
     * Display final results
     */
    displayFinalResults(allPassed, totalSteps, passedSteps) {
        const display = document.getElementById('stepDisplay');
        if (!display) return;
        
        const grade = allPassed ? 1.0 : (passedSteps / totalSteps);
        const percentage = Math.round(grade * 100);
        
        if (allPassed) {
            display.innerHTML = `
                <div class="final-result success">
                    <h3>🎉 Congratulations!</h3>
                    <p>You have successfully completed all steps of this assignment.</p>
                    <p><strong>Grade: ${percentage}%</strong></p>
                    <button onclick="submitGradeToLMS(${grade})" class="submit-grade-btn">
                        Submit Grade to LMS
                    </button>
                </div>
            `;
        } else {
            display.innerHTML = `
                <div class="final-result partial">
                    <h3>📊 Assignment Partially Complete</h3>
                    <p>You completed ${passedSteps} out of ${totalSteps} steps.</p>
                    <p><strong>Grade: ${percentage}%</strong></p>
                    <button onclick="submitGradeToLMS(${grade})" class="submit-grade-btn">
                        Submit Partial Grade to LMS
                    </button>
                    <button onclick="startGrading()" class="retry-btn">
                        Try Again
                    </button>
                </div>
            `;
        }
    }
    
    /**
     * Reset to beginning screen
     */
    resetToBeginningScreen() {
        this.showInstructions();
        this.hideGradingSection();
        this.showStartGradingButton();
        this.clearStepDisplay();
        this.currentStep = 0;
        this.isGrading = false;
    }
    
    /**
     * Start grading process
     */
    startGradingProcess(steps) {
        this.steps = steps.map(step => ({ ...step, status: "pending" }));
        this.currentStep = 0;
        this.isGrading = true;
        this.hideInstructions();
        this.showGradingSection();
        this.hideStartGradingButton();
        this.updateGradeButton('Start Grading', () => {
            if (window.startGrading) window.startGrading();
        });
    }
    
    /**
     * Add common CSS for grading interface
     */
    addGradingStyles() {
        if (document.getElementById('grading-interface-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'grading-interface-styles';
        style.textContent = `
            .spinner-gear {
                display: inline-block;
                animation: spin 2s linear infinite;
                font-size: 20px;
            }
            
            @keyframes spin {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
            }
            
            .step-result {
                padding: 15px;
                margin: 10px 0;
                border-radius: 8px;
                border: 2px solid;
            }
            
            .step-passed {
                background-color: #d4edda;
                border-color: #28a745;
                color: #155724;
            }
            
            .step-failed {
                background-color: #f8d7da;
                border-color: #dc3545;
                color: #721c24;
            }
            
            .final-result {
                padding: 20px;
                margin: 15px 0;
                border-radius: 8px;
                text-align: center;
            }
            
            .final-result.success {
                background-color: #d4edda;
                border: 2px solid #28a745;
                color: #155724;
            }
            
            .final-result.partial {
                background-color: #fff3cd;
                border: 2px solid #ffc107;
                color: #856404;
            }
            
            .submit-grade-btn {
                background-color: #28a745;
                color: white;
                padding: 10px 20px;
                border: none;
                border-radius: 5px;
                cursor: pointer;
                margin: 5px;
                font-size: 16px;
            }
            
            .submit-grade-btn:hover {
                background-color: #218838;
            }
            
            .retry-btn {
                background-color: #007bff;
                color: white;
                padding: 10px 20px;
                border: none;
                border-radius: 5px;
                cursor: pointer;
                margin: 5px;
                font-size: 16px;
            }
            
            .retry-btn:hover {
                background-color: #0056b3;
            }
        `;
        document.head.appendChild(style);
    }
}

// Create global instance
const gradingInterface = new GradingInterface();

// Auto-add styles when script loads
gradingInterface.addGradingStyles();

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { GradingInterface, gradingInterface };
}
