/**
 * Exercise Classes for CDC6504 CPU Emulator
 * 
 * This file contains the base Exercise class and specific exercise implementations
 * for grading CDC6504 assembly programs.
 */

/**
 * CDC6504-specific Exercise class that extends the common base
 * The base Exercise class is loaded from ../common/exercise-base.js
 */
class CDC6504Exercise extends Exercise {
    /**
     * Start the grading process with CDC6504-specific behavior
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
     * Reset the grading process with CDC6504-specific behavior
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
     * Complete the grading process with CDC6504-specific behavior
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
 * Students need to have a CDC6504 program that outputs the number 42
 * This version skips assembly and just runs the program to check output
 */
class HelloWorldExercise extends CDC6504Exercise {
    constructor() {
        const steps = [
            { name: "Program Execution", description: "Run program and check if it outputs 'Hello, World!'" }
        ];

        const instructions = `
            <h3>Hello, World!</h3>
            <p>Write a CDC6504 program that outputs "Hello, World!" or "Hello World!".</p>
        `;

        super("Hello World", "Output 'Hello, World!' using CDC6504", steps, instructions);
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
            emulator.errorMessage = null;
            emulator.cpu.a0 = 0;
            emulator.cpu.a1 = 0;
            emulator.cpu.a2 = 0;
            emulator.cpu.a3 = 0;
            emulator.cpu.x0 = 0;
            emulator.cpu.x1 = 0;
            emulator.cpu.x2 = 0;
            emulator.cpu.x3 = 0;

            // Start the program
            emulator.start();

            // Wait for program to complete (with timeout)
            const timeout = 5000; // 5 seconds
            const startTime = Date.now();
            
            while (Date.now() - startTime < timeout) {
                const status = emulator.getStatus();
                
                if (!status.running) {
                    // Program has stopped (regardless of how it stopped)
                    const output = emulator.output.trim();
                    
                    // Update the UI to show the output
                    if (typeof window.updateOutput === 'function') {
                        window.updateOutput();
                    }
                    
                    if (output.includes('Hello, World!') || output.includes('Hello World!')) {
                        return { passed: true, message: "✅ Program successfully outputs 'Hello, World!'!" };
                    } else {
                        return { passed: false, message: `Expected 'Hello, World!' or 'Hello World!' but got: "${output}"` };
                    }
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

class Print42Exercise extends CDC6504Exercise {
    constructor() {
        const steps = [
            { name: "Program Execution", description: "Run program and check if it halts with output '42'" }
        ];

        const instructions = `
            <h3>Print 42</h3>
            <p>Write a CDC6504 program that outputs the number 42.</p>
        `;

        super("Print 42", "Output the number 42 using CDC6504", steps, instructions);
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
            emulator.errorMessage = null;
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

            // Start the program directly
            emulator.start();

            // Wait for the program to complete (with timeout)
            const maxWaitTime = 5000; // 5 seconds
            const startTime = Date.now();
            
            while (Date.now() - startTime < maxWaitTime) {
                const status = emulator.getStatus();
                
                if (!status.running) {
                    // Program has stopped (regardless of how it stopped)
                    const output = status.output ? status.output.trim() : '';
                    
                    // Update the UI to show the output
                    if (typeof window.updateOutput === 'function') {
                        window.updateOutput();
                    }
                    
                    if (output.includes('42')) {
                        return { passed: true, message: "✅ Program executed successfully and output '42'!" };
                    } else {
                        return { passed: false, message: `Program stopped but output was '${output}', expected '42'.` };
                    }
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
 * Random Phrase Exercise
 * 
 * Students need to output a randomly selected phrase
 * The phrase is chosen at exercise creation time and displayed in instructions
 */
class RandomPhraseExercise extends CDC6504Exercise {
    constructor() {
        // List of phrases to randomly choose from
        const phrases = [
            'Hello, World!',
            'Hello World!',
            'Hi there!',
            'Good morning!',
            'Welcome!',
            'Greetings!',
            'Hello everyone!',
            'Hello friend!',
            'Hello student!',
            'Hello CA4E!',
            'Hello CDC6504!',
            'Hello assembly!',
            'Hello computer!',
            'Hello program!',
            'Hello code!'
        ];
        
        // Randomly select a phrase
        const randomIndex = Math.floor(Math.random() * phrases.length);
        this.targetPhrase = phrases[randomIndex];
        
        const steps = [
            { name: "Program Execution", description: `Run program and check if it outputs '${this.targetPhrase}'` }
        ];

        const instructions = `
            <h3>Output a Specific Phrase</h3>
            <p><strong>Your task:</strong> Write a CDC6504 program that outputs the following phrase:</p>
            <p style="font-size: 18px; font-weight: bold; color: #007bff; padding: 10px; background: #f0f0f0; border-radius: 4px; text-align: center;">
                "${this.targetPhrase}"
            </p>
            <p>The autograder will check that your program output contains this phrase. Your output can contain additional text before or after the phrase.</p>
        `;

        super("Random Phrase", `Output '${this.targetPhrase}' using CDC6504`, steps, instructions);
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
            emulator.errorMessage = null;
            emulator.cpu.a0 = 0;
            emulator.cpu.a1 = 0;
            emulator.cpu.a2 = 0;
            emulator.cpu.a3 = 0;
            emulator.cpu.x0 = 0;
            emulator.cpu.x1 = 0;
            emulator.cpu.x2 = 0;
            emulator.cpu.x3 = 0;

            // Start the program
            emulator.start();

            // Wait for program to complete (with timeout)
            const timeout = 5000; // 5 seconds
            const startTime = Date.now();
            
            while (Date.now() - startTime < timeout) {
                const status = emulator.getStatus();
                
                if (!status.running) {
                    // Program has stopped (regardless of how it stopped)
                    const output = emulator.output.trim();
                    
                    // Update the UI to show the output
                    if (typeof window.updateOutput === 'function') {
                        window.updateOutput();
                    }
                    
                    // Check if output contains the target phrase
                    if (output.includes(this.targetPhrase)) {
                        return { passed: true, message: `✅ Program output contains '${this.targetPhrase}'!` };
                    } else {
                        return { passed: false, message: `Expected output to contain '${this.targetPhrase}' but got: "${output}"` };
                    }
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
