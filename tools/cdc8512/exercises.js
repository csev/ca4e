/**
 * Exercise Classes for CDC8512 CPU Emulator
 * 
 * This file contains the base Exercise class and specific exercise implementations
 * for grading CDC8512 assembly programs.
 */

/**
 * CDC8512-specific Exercise class that extends the common base
 * The base Exercise class is loaded from ../common/exercise-base.js
 */
class CDC8512Exercise extends Exercise {
    /**
     * Start the grading process with CDC8512-specific behavior
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
     * Reset the grading process with CDC8512-specific behavior
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
     * Execute a specific grading step with async support
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
     * Complete the grading process with CDC8512-specific behavior
     */
    completeGrading() {
        const allPassed = this.steps.every(step => step.status === "passed");
        if (allPassed) {
            this.showSuccess();
            this.submitGradeToLMS(1.0); // Perfect score
            // Only show the button again when grading is successful
            this.showGradeButton();
            this.resetGradeButton();
        }
        // If not all passed, don't show any buttons (they should already be hidden)
    }

    showGradeButton() {
        const button = document.getElementById('gradeBtn');
        if (button) {
            button.style.display = 'inline-block';
        }
    }
}

/**
 * Simple Print 42 Exercise
 * 
 * Students need to have a CDC8512 program that outputs the number 42
 * This version skips assembly and just runs the program to check output
 */
class Print42Exercise extends CDC8512Exercise {
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

// Global variable to hold the current exercise instance
let currentExercise = null;
