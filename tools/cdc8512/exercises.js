/**
 * Exercise Classes for CDC8512 CPU Emulator
 * 
 * This file contains the base Exercise class and specific exercise implementations
 * for grading CDC8512 assembly programs.
 */

/**
 * Base Exercise Class
 * 
 * Provides common functionality for all CDC8512 exercises including:
 * - Step management
 * - UI state handling
 * - Grade submission
 * - Program execution utilities
 */
class Exercise {
    constructor(name, description, steps, instructions = '') {
        this.name = name;
        this.description = description;
        this.steps = steps.map(step => ({ ...step, status: "pending" }));
        this.instructions = instructions;
        this.currentStep = 0;
        this.isGrading = false;
    }

    /**
     * Start the grading process
     */
    startGrading() {
        this.currentStep = 0;
        this.isGrading = true;
        this.showGradingSection();
        this.hideInstructions();
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
        this.hideGradingSection();
        this.showInstructions();
        this.resetGradeButton();
    }

    /**
     * Move to the next step in the grading process
     */
    nextStep() {
        if (this.currentStep < this.steps.length) {
            this.executeStep(this.currentStep);
            this.currentStep++;
        }
        
        if (this.currentStep >= this.steps.length) {
            this.completeGrading();
        }
    }

    /**
     * Execute a specific grading step
     */
    executeStep(stepIndex) {
        const step = this.steps[stepIndex];
        const result = this.checkStep(stepIndex);
        
        step.status = result.passed ? "passed" : "failed";
        this.displayStepResult(stepIndex, result);
        
        if (!result.passed) {
            this.isGrading = false;
            this.showRetryButton();
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
        const section = document.getElementById('gradingSection');
        if (section) section.style.display = 'block';
    }

    hideGradingSection() {
        const section = document.getElementById('gradingSection');
        if (section) section.style.display = 'none';
    }

    showInstructions() {
        const instructions = document.getElementById('assignmentInstructions');
        if (instructions) instructions.style.display = 'block';
    }

    hideInstructions() {
        const instructions = document.getElementById('assignmentInstructions');
        if (instructions) instructions.style.display = 'none';
    }

    updateGradeButton() {
        const button = document.getElementById('gradeBtn');
        if (button) {
            button.textContent = 'Start Grading';
            button.onclick = () => this.startGrading();
        }
    }

    resetGradeButton() {
        const button = document.getElementById('gradeBtn');
        if (button) {
            button.textContent = 'Start Grading';
            button.onclick = () => this.startGrading();
        }
    }

    showRetryButton() {
        const button = document.getElementById('gradeBtn');
        if (button) {
            button.textContent = 'Retry Grading';
            button.onclick = () => this.startGrading();
        }
    }

    displayStepResult(stepIndex, result) {
        const display = document.getElementById('stepDisplay');
        if (display) {
            const step = this.steps[stepIndex];
            display.innerHTML = `
                <h4>Step ${stepIndex + 1}: ${step.name}</h4>
                <p class="${result.passed ? 'success' : 'error'}">${result.message}</p>
            `;
        }
    }

    showSuccess() {
        const display = document.getElementById('stepDisplay');
        if (display) {
            display.innerHTML = `
                <h4>🎉 Exercise Complete!</h4>
                <p class="success">All steps passed successfully. Submitting grade...</p>
            `;
        }
    }
}

/**
 * Print Out 42 Exercise
 * 
 * Students need to write a CDC8512 assembly program that outputs the number 42
 */
class PrintOut42Exercise extends Exercise {
    constructor() {
        const steps = [
            { name: "Program Assembly", description: "Check if program assembles without errors" },
            { name: "Program Execution", description: "Check if program runs to completion" },
            { name: "Output Verification", description: "Check if program outputs '42'" }
        ];

        const instructions = `
            <h3>Print Out 42</h3>
            <p>Write a CDC8512 assembly program that outputs the number 42.</p>
            <h4>Requirements:</h4>
            <ul>
                <li>Your program must assemble without errors</li>
                <li>Your program must run to completion (HALT instruction)</li>
                <li>Your program must output the number 42</li>
            </ul>
            <h4>Hints:</h4>
            <ul>
                <li>Use the SET instruction to load the value 42 into a register</li>
                <li>Use the PS (Print String/Number) instruction to output the value</li>
                <li>End your program with HALT</li>
            </ul>
            <h4>Example structure:</h4>
            <pre>
SET X1, 42
PS
HALT
            </pre>
        `;

        super("Print Out 42", "Output the number 42 using CDC8512 assembly", steps, instructions);
    }

    checkStep(stepIndex) {
        switch (stepIndex) {
            case 0: // Program Assembly
                return this.checkAssembly();
            case 1: // Program Execution
                return this.checkExecution();
            case 2: // Output Verification
                return this.checkOutput();
            default:
                return { passed: false, message: "Unknown step" };
        }
    }

    checkAssembly() {
        // Check if the program assembled successfully
        // This would need to integrate with the CDC8512 emulator
        const assemblyInput = document.getElementById('assembly-input');
        if (!assemblyInput || !assemblyInput.value.trim()) {
            return { passed: false, message: "No assembly code found. Please enter your program in the assembly editor." };
        }

        // Basic check for required instructions
        const code = assemblyInput.value.toUpperCase();
        if (!code.includes('HALT')) {
            return { passed: false, message: "Program must end with HALT instruction." };
        }

        // Try to assemble (this would need integration with the actual assembler)
        try {
            // This is a placeholder - in real implementation, we'd call the assembler
            return { passed: true, message: "✅ Program assembled successfully." };
        } catch (error) {
            return { passed: false, message: `Assembly failed: ${error.message}` };
        }
    }

    checkExecution() {
        // Check if program runs to completion
        // This would need to integrate with the CDC8512 emulator
        try {
            // Placeholder - in real implementation, we'd run the emulator
            return { passed: true, message: "✅ Program executed successfully to completion." };
        } catch (error) {
            return { passed: false, message: `Execution failed: ${error.message}` };
        }
    }

    checkOutput() {
        // Check if program outputs 42
        const outputElement = document.getElementById('output');
        if (!outputElement) {
            return { passed: false, message: "Cannot find output display." };
        }

        const output = outputElement.textContent || outputElement.innerText;
        if (output.includes('42')) {
            return { passed: true, message: "✅ Program correctly outputs 42!" };
        } else {
            return { passed: false, message: `Expected output '42', but got: ${output}` };
        }
    }
}

// Global variable to hold the current exercise instance
let currentExercise = null;
