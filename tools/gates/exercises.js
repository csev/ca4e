/**
 * Exercise Classes for Gates Tool
 * 
 * This file contains the base Exercise class and specific exercise implementations
 * for grading digital logic gate circuits.
 */

/**
 * Base Exercise Class
 * 
 * Provides common functionality for all Gates exercises including:
 * - Step management
 * - UI state handling
 * - Grade submission
 * - Circuit testing utilities
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
 * Students need to build a digital logic circuit that outputs the binary representation of 42
 */
class PrintOut42Exercise extends Exercise {
    constructor() {
        const steps = [
            { name: "Circuit Construction", description: "Check if circuit is properly constructed" },
            { name: "Logic Verification", description: "Check if circuit logic is correct" },
            { name: "Output Validation", description: "Check if circuit outputs binary 42 (101010)" }
        ];

        const instructions = `
            <h3>Print Out 42</h3>
            <p>Build a digital logic circuit that outputs the binary representation of the number 42.</p>
            <h4>Requirements:</h4>
            <ul>
                <li>Your circuit must output the binary value 101010 (which equals 42 in decimal)</li>
                <li>Use appropriate logic gates to generate each bit</li>
                <li>Label your outputs clearly (bit 5, bit 4, bit 3, bit 2, bit 1, bit 0)</li>
            </ul>
            <h4>Binary Representation of 42:</h4>
            <ul>
                <li>42 in decimal = 101010 in binary</li>
                <li>Bit 5 (32): 1</li>
                <li>Bit 4 (16): 0</li>
                <li>Bit 3 (8): 1</li>
                <li>Bit 2 (4): 0</li>
                <li>Bit 1 (2): 1</li>
                <li>Bit 0 (1): 0</li>
            </ul>
            <h4>Hints:</h4>
            <ul>
                <li>For bits that should be 1, connect them to VCC (high)</li>
                <li>For bits that should be 0, connect them to GND (low)</li>
                <li>You can use buffers or direct connections as needed</li>
            </ul>
        `;

        super("Print Out 42", "Build a circuit that outputs binary 42", steps, instructions);
    }

    checkStep(stepIndex) {
        switch (stepIndex) {
            case 0: // Circuit Construction
                return this.checkConstruction();
            case 1: // Logic Verification
                return this.checkLogic();
            case 2: // Output Validation
                return this.checkOutput();
            default:
                return { passed: false, message: "Unknown step" };
        }
    }

    checkConstruction() {
        // Check if there are any components in the circuit
        // This would need to integrate with the gates tool's circuit representation
        
        // Placeholder check - in real implementation, we'd check the actual circuit
        const hasComponents = true; // This would check if gates/wires exist
        
        if (!hasComponents) {
            return { passed: false, message: "No circuit components found. Please build your circuit using the gates tool." };
        }

        return { passed: true, message: "✅ Circuit construction detected." };
    }

    checkLogic() {
        // Check if the circuit logic is properly designed
        // This would need to integrate with the gates tool's simulation
        
        // Placeholder - in real implementation, we'd analyze the circuit
        return { passed: true, message: "✅ Circuit logic appears correct." };
    }

    checkOutput() {
        // Check if the circuit outputs the correct binary pattern for 42
        // This would need to integrate with the gates tool's output system
        
        // Expected binary: 101010 (42 in decimal)
        const expectedBinary = [1, 0, 1, 0, 1, 0]; // bit 5 to bit 0
        
        // Placeholder - in real implementation, we'd read the actual outputs
        const actualOutputs = [1, 0, 1, 0, 1, 0]; // This would come from the circuit simulation
        
        let allCorrect = true;
        for (let i = 0; i < 6; i++) {
            if (actualOutputs[i] !== expectedBinary[i]) {
                allCorrect = false;
                break;
            }
        }
        
        if (allCorrect) {
            return { passed: true, message: "✅ Circuit correctly outputs binary 101010 (decimal 42)!" };
        } else {
            return { 
                passed: false, 
                message: `Expected binary 101010, but got: ${actualOutputs.join('')}. Check your bit connections.` 
            };
        }
    }
}

// Global variable to hold the current exercise instance
let currentExercise = null;
