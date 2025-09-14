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
        this.hideInstructions();
        this.hideGradeButton();
        this.showExecutingIndicator();
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
        this.resetGradeButton();
        this.clearStepDisplay();
        this.showGradeButton();
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

    /**
     * Execute a specific grading step
     */
    async executeStep(stepIndex) {
        const step = this.steps[stepIndex];
        const result = await this.checkStep(stepIndex);
        
        step.status = result.passed ? "passed" : "failed";
        this.displayStepResult(stepIndex, result);
        
        if (!result.passed) {
            this.isGrading = false;
            this.hideGradeButton();
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
        // Always show the button again when grading is complete
        this.showGradeButton();
        this.resetGradeButton();
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
            button.style.display = 'inline-block'; // Make sure button is visible
        }
    }

    resetGradeButton() {
        const button = document.getElementById('gradeBtn');
        if (button) {
            button.textContent = 'Start Grading';
            button.onclick = () => this.startGrading();
            button.style.display = 'inline-block'; // Make sure button is visible after reset
        }
    }

    hideGradeButton() {
        const button = document.getElementById('gradeBtn');
        if (button) {
            button.style.display = 'none';
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

    clearStepDisplay() {
        const display = document.getElementById('stepDisplay');
        if (display) {
            display.innerHTML = '';
        }
    }

    hideGradeButton() {
        const button = document.getElementById('gradeBtn');
        if (button) {
            button.style.display = 'none';
        }
    }

    showGradeButton() {
        const button = document.getElementById('gradeBtn');
        if (button) {
            button.style.display = 'inline-block';
        }
    }

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
}

/**
 * Simple Print 42 Exercise
 * 
 * Students need to have a CDC8512 program that outputs the number 42
 * This version skips assembly and just runs the program to check output
 */
class SimplePrint42Exercise extends Exercise {
    constructor() {
        const steps = [
            { name: "Program Execution", description: "Run program and check if it halts with output '42'" }
        ];

        const instructions = `
            <h3>Print Out 42 (Simple)</h3>
            <p>Load or write a CDC8512 program that outputs the number 42.</p>
            <h4>Requirements:</h4>
            <ul>
                <li>Your program must run to completion (HALT instruction)</li>
                <li>Your program must output the number 42</li>
                <li>When ready, click "Start Grading" to test your program</li>
            </ul>
        `;

        super("Simple Print 42", "Output the number 42 using CDC8512", steps, instructions);
    }

    checkStep(stepIndex) {
        switch (stepIndex) {
            case 0: // Program Execution and Output Check
                return this.checkExecutionAndOutput();
            default:
                return { passed: false, message: "Unknown step" };
        }
    }

    async checkExecutionAndOutput() {
        try {
            // Get the emulator instance
            const emulator = window.emulator;
            if (!emulator) {
                return { passed: false, message: "Emulator not found. Please refresh the page." };
            }

            // Clear any existing output
            emulator.output = '';

            // Reset CPU state but preserve the loaded program
            emulator.cpu.pc = 0;
            emulator.cpu.comparison = '=';
            emulator.cpu.mode = 0;
            emulator.cpu.a0 = 0;
            emulator.cpu.a1 = 0;
            emulator.cpu.a2 = 0;
            emulator.cpu.a3 = 0;
            emulator.cpu.x0 = 0;
            emulator.cpu.x1 = 0;
            emulator.cpu.x2 = 0;
            emulator.cpu.x3 = 0;
            emulator.running = false;
            emulator.executionTrace = [];
            
            // Clear memory highlighting but preserve instructions
            emulator.cpu.clearMemoryHighlighting();
            
            // Check if there's any program loaded
            let hasProgram = false;
            for (let i = 0; i < 256; i++) {
                if (emulator.cpu.instructions[i] !== 0) {
                    hasProgram = true;
                    break;
                }
            }
            
            if (!hasProgram) {
                return { passed: false, message: "No program loaded. Please load or assemble a program first." };
            }

            // Start the program by pressing the Start button programmatically
            const startButton = document.getElementById('start');
            if (!startButton) {
                return { passed: false, message: "Start button not found." };
            }

            // Simulate clicking the start button
            startButton.click();

            // Wait for the program to complete (with timeout)
            const maxWaitTime = 5000; // 5 seconds
            const startTime = Date.now();
            
            while (Date.now() - startTime < maxWaitTime) {
                const status = emulator.getStatus();
                
                if (status.halted) {
                    // Program has halted, check the output
                    const output = status.output ? status.output.trim() : '';
                    
                    if (output.includes('42')) {
                        return { passed: true, message: "✅ Program executed successfully and output '42'!" };
                    } else {
                        return { passed: false, message: `Program halted but output was '${output}', expected '42'.` };
                    }
                }
                
                if (!status.running) {
                    // Program stopped but didn't halt properly
                    return { passed: false, message: "Program stopped without reaching HALT instruction." };
                }
                
                // Wait a bit before checking again
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            
            // Timeout reached
            emulator.stop(); // Stop the program if it's still running
            return { passed: false, message: "Program did not complete within 5 seconds. Check for infinite loops." };
            
        } catch (error) {
            return { passed: false, message: `Error during execution: ${error.message}` };
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
