/**
 * Common Exercise Base Class for CA4E Tools
 * 
 * Provides standardized exercise functionality across all tools including:
 * - Step management and grading flow
 * - UI state handling
 * - Grade submission
 * - Common button and modal management
 */
class Exercise {
    constructor(name, description, steps, instructions = '', options = {}) {
        this.name = name;
        this.description = description;
        this.steps = steps.map(step => ({ ...step, status: "pending" }));
        this.instructions = instructions;
        this.currentStep = 0;
        this.isGrading = false;
        
        // UI configuration - can be overridden by tools
        this.uiConfig = {
            gradingSectionId: options.gradingSectionId || 'gradingSection',
            startGradingSectionId: options.startGradingSectionId || 'startGradingSection',
            gradeButtonId: options.gradeButtonId || 'gradeBtn',
            stepDisplayId: options.stepDisplayId || 'stepDisplay',
            instructionsId: options.instructionsId || 'assignmentInstructions',
            ...options
        };
    }

    /**
     * Start the grading process
     */
    startGrading() {
        this.currentStep = 0;
        this.isGrading = true;
        this.hideInstructions();
        this.showGradingSection();
        this.hideStartGradingButton();
        this.updateGradeButton();
        this.nextStep();
    }

    /**
     * Reset the grading process
     */
    resetGrading() {
        this.currentStep = 0;
        this.isGrading = false;
        this.steps.forEach(step => {
            step.status = "pending";
        });
        this.showInstructions();
        this.hideGradingSection();
        this.showStartGradingButton();
        this.clearStepDisplay();
        this.resetGradeButton();
    }

    /**
     * Move to the next step in the grading process
     */
    async nextStep() {
        if (this.currentStep < this.steps.length) {
            await this.executeStep(this.currentStep);
            this.currentStep++;
        }
        
        if (this.currentStep >= this.steps.length) {
            this.completeGrading();
        }
    }
    
    continueGrading() {
        // Continue to next step (called by Next button)
        if (this.currentStep < this.steps.length) {
            this.executeStep(this.currentStep);
            this.currentStep++;
        }
        
        if (this.currentStep >= this.steps.length) {
            this.completeGrading();
        }
    }

    /**
     * Execute a specific grading step - to be overridden by subclasses
     */
    async executeStep(stepIndex) {
        const step = this.steps[stepIndex];
        const result = await this.checkStep(stepIndex);
        
        step.status = result.passed ? "passed" : "failed";
        this.displayStepResult(stepIndex, result);
        
        if (!result.passed) {
            this.isGrading = false;
            this.hideGradeButton();
        } else if (stepIndex < this.steps.length - 1) {
            // Show Next button for intermediate steps
            this.showNextButton();
        }
    }

    /**
     * Override this method in subclasses to implement specific step checking logic
     */
    checkStep(stepIndex) {
        return { passed: false, message: "Step checking not implemented" };
    }

    /**
     * Complete the grading process
     */
    completeGrading() {
        const allPassed = this.steps.every(step => step.status === "passed");
        if (allPassed) {
            this.showSuccess();
            this.submitGradeToLMS(1.0); // Perfect score
        }
    }

    /**
     * Submit grade to LMS - will be overridden by global function
     */
    submitGradeToLMS(grade) {
        console.log(`Grade ${grade} would be submitted to LMS`);
    }

    // UI Management Methods
    showGradingSection() {
        const section = document.getElementById(this.uiConfig.gradingSectionId);
        if (section) section.style.display = 'block';
    }

    hideGradingSection() {
        const section = document.getElementById(this.uiConfig.gradingSectionId);
        if (section) section.style.display = 'none';
    }

    showInstructions() {
        const instructions = document.getElementById(this.uiConfig.instructionsId);
        if (instructions) instructions.style.display = 'block';
    }

    hideInstructions() {
        const instructions = document.getElementById(this.uiConfig.instructionsId);
        if (instructions) instructions.style.display = 'none';
    }

    updateGradeButton() {
        const button = document.getElementById(this.uiConfig.gradeButtonId);
        if (button) {
            button.textContent = 'Start Grading';
            button.onclick = () => this.startGrading();
            button.style.display = 'inline-block'; // Make sure button is visible
        }
    }

    resetGradeButton() {
        const button = document.getElementById(this.uiConfig.gradeButtonId);
        if (button) {
            button.textContent = 'Start Grading';
            button.onclick = () => this.startGrading();
            button.style.display = 'inline-block'; // Make sure button is visible after reset
        }
    }

    hideGradeButton() {
        const button = document.getElementById(this.uiConfig.gradeButtonId);
        if (button) {
            button.style.display = 'none';
        }
    }

    showNextButton() {
        const button = document.getElementById(this.uiConfig.gradeButtonId);
        if (button) {
            button.textContent = 'Next';
            button.onclick = () => this.continueGrading();
            button.style.display = 'inline-block'; // Make sure button is visible
        }
    }

    hideStartGradingButton() {
        const section = document.getElementById(this.uiConfig.startGradingSectionId);
        if (section) section.style.display = 'none';
    }

    showStartGradingButton() {
        const section = document.getElementById(this.uiConfig.startGradingSectionId);
        if (section) section.style.display = 'block';
    }

    clearStepDisplay() {
        const display = document.getElementById(this.uiConfig.stepDisplayId);
        if (display) {
            display.innerHTML = '';
        }
    }

    displayStepResult(stepIndex, result) {
        const display = document.getElementById(this.uiConfig.stepDisplayId);
        if (display) {
            const step = this.steps[stepIndex];
            display.innerHTML = `
                <h4>Step ${stepIndex + 1}: ${step.name}</h4>
                <p class="${result.passed ? 'success' : 'error'}">${result.message}</p>
            `;
        }
    }

    showSuccess() {
        const display = document.getElementById(this.uiConfig.stepDisplayId);
        if (display) {
            display.innerHTML = `
                <h4>🎉 Exercise Complete!</h4>
                <p class="success">All steps passed successfully. Submitting grade...</p>
            `;
        }
    }

    showExecutingIndicator() {
        const display = document.getElementById(this.uiConfig.stepDisplayId);
        if (display) {
            display.innerHTML = `
                <div style="display: flex; align-items: center; gap: 10px; padding: 15px;">
                    <div class="spinner-gear">⚙️</div>
                    <span>Executing program...</span>
                </div>
            `;
        }
    }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Exercise };
}
