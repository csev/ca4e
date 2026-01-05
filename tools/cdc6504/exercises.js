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
        } else if (stepIndex < this.steps.length - 1) {
            // Show Next button for intermediate steps
            this.showNextButton();
        }
    }

    /**
     * Continue to the next step (called by Next button)
     */
    async continueGrading() {
        if (this.currentStep < this.steps.length) {
            await this.executeStep(this.currentStep);
            this.currentStep++;
        }
        
        if (this.currentStep >= this.steps.length) {
            this.completeGrading();
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
        // List of fun random words to randomly choose from
        const phrases = [
            'Awesome!',
            'Fantastic!',
            'Brilliant!',
            'Excellent!',
            'Wonderful!',
            'Amazing!',
            'Incredible!',
            'Superb!',
            'Outstanding!',
            'Terrific!',
            'Magnificent!',
            'Spectacular!',
            'Phenomenal!',
            'Extraordinary!',
            'Marvelous!',
            'Stupendous!'
        ];
        
        // Randomly select a phrase (use local variable before super())
        const randomIndex = Math.floor(Math.random() * phrases.length);
        const targetPhrase = phrases[randomIndex];
        
        const steps = [
            { name: "Program Execution", description: `Run program and check if it outputs '${targetPhrase}'` }
        ];

        const instructions = `
            <h3>Output a Fun Word</h3>
            <p><strong>Your task:</strong> Using the Assembly editor, adapt the Hello World sample code to output the following word:</p>
            <p style="font-size: 18px; font-weight: bold; color: #007bff; padding: 10px; background: #f0f0f0; border-radius: 4px; text-align: center;">
                "${targetPhrase}"
            </p>
            <p>The autograder will check that your program output contains this word. Your output can contain additional text before or after the word.</p>
        `;

        super("Hello World", `Output '${targetPhrase}' using CDC6504`, steps, instructions);
        
        // Now assign to this.targetPhrase after super() has been called
        this.targetPhrase = targetPhrase;
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

class Print42Exercise extends CDC6504Exercise {
    constructor() {
        const steps = [
            { name: "Code Check", description: "Verify that your code does not use the DATA operation" },
            { name: "Program Execution", description: "Run program and check if it halts with output '42'" }
        ];

        const instructions = `
            <h3>Print 42</h3>
            <p>Write a CDC6504 program that outputs the number 42.</p>
            <p><strong>Important:</strong> You must not use the DATA operation in your assembly code. You need to store '42' into memory 42 using instructions.</p>
        `;

        super("Print 42", "Output the number 42 using CDC6504", steps, instructions);
    }

    checkStep(stepIndex) {
        switch (stepIndex) {
            case 0: // Code Check - No DATA operation
                return this.checkNoDataOperation();
            case 1: // Program Execution and Output Check
                return this.checkExecutionAndOutput();
            default:
                return { passed: false, message: "Unknown step" };
        }
    }

    checkNoDataOperation() {
        // Get the assembly code from the editor
        const assemblyInput = document.getElementById('assembly-input');
        if (!assemblyInput) {
            return { passed: false, message: "Cannot find assembly editor. Please refresh the page." };
        }

        const assemblyCode = assemblyInput.value.trim();
        
        if (!assemblyCode) {
            return { passed: false, message: "No assembly code found. Please enter your program in the assembly editor." };
        }

        // Check for DATA operation (case-insensitive)
        const codeUpper = assemblyCode.toUpperCase();
        if (codeUpper.includes('DATA')) {
            return { 
                passed: false, 
                message: "Your code contains a DATA operation. You must not use DATA - calculate or load the value 42 using instructions instead." 
            };
        }

        return { passed: true, message: "✅ Code does not use DATA operation." };
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
 * Lowercase Conversion Exercise
 * 
 * Students need to convert a mixed-case string to lowercase
 * The original string must remain in the DATA pseudo-op
 * The output must be lowercase
 * Must be solved with a loop, not by modifying the DATA pseudo-op
 */
class LowercaseConversionExercise extends CDC6504Exercise {
    constructor() {
        // Use local variables before super()
        const originalString = "Hello from WASM!";
        const expectedOutput = "hello from wasm!";
        
        const steps = [
            { name: "Original String Check", description: "Verify the original mixed-case string is still in your DATA pseudo-op" },
            { name: "DATA Pseudo-op Check", description: "Verify that you have not modified the DATA pseudo-op to solve the problem" },
            { name: "Program Execution", description: "Run program and check if it outputs the string in lowercase" }
        ];

        const instructions = `
            <h3>Convert String to Lowercase</h3>
            <p><strong>Your task:</strong> Adapt the upper case example code to convert its string to lower case.</p>
            <p style="font-size: 16px; font-weight: bold; color: #007bff; padding: 10px; background: #f0f0f0; border-radius: 4px;">
                Original string: "${originalString}"
            </p>
            <p style="font-size: 16px; font-weight: bold; color: #28a745; padding: 10px; background: #f0f0f0; border-radius: 4px;">
                Expected output: "${expectedOutput}"
            </p>
            <p><strong>Important:</strong> You must keep the original string "${originalString}" in your DATA pseudo-op and write a loop to convert each character to lowercase. Do not modify the DATA pseudo-op to solve the problem - it must be solved with a loop like the uppercase sample code!</p>
            <h4>Requirements:</h4>
            <ul>
                <li>Your code must contain the original string "${originalString}" in a DATA pseudo-op</li>
                <li>You must not modify the DATA pseudo-op to solve the problem</li>
                <li>You must use a loop to convert characters to lowercase</li>
                <li>Your program output must contain "${expectedOutput}" (all lowercase)</li>
            </ul>
            <h4>Hint:</h4>
            <p>You'll need to loop through each character and check if it's uppercase (ASCII 65-90). If so, add 32 to convert it to lowercase (ASCII 97-122).</p>
        `;

        super("Lowercase Conversion", "Convert string to lowercase using CDC6504", steps, instructions);
        
        // Now assign to this after super() has been called
        this.originalString = originalString;
        this.expectedOutput = expectedOutput;
    }

    checkStep(stepIndex) {
        switch (stepIndex) {
            case 0: // Original String Check
                return this.checkOriginalString();
            case 1: // DATA Pseudo-op Check
                return this.checkDataPseudoOp();
            case 2: // Program Execution and Output Check
                return this.checkExecutionAndOutput();
            default:
                return { passed: false, message: "Unknown step" };
        }
    }

    checkOriginalString() {
        // Get the assembly code from the editor
        const assemblyInput = document.getElementById('assembly-input');
        if (!assemblyInput) {
            return { passed: false, message: "Cannot find assembly editor. Please refresh the page." };
        }

        const assemblyCode = assemblyInput.value.trim();
        
        if (!assemblyCode) {
            return { passed: false, message: "No assembly code found. Please enter your program in the assembly editor." };
        }

        // Check if the original string is present (case-sensitive check)
        if (!assemblyCode.includes(this.originalString)) {
            return { 
                passed: false, 
                message: `Your code must contain the original string "${this.originalString}" in a DATA pseudo-op. Do not change the input string - write code to convert it to lowercase!` 
            };
        }

        return { passed: true, message: `✅ Original string "${this.originalString}" found in code.` };
    }

    checkDataPseudoOp() {
        // Get the assembly code from the editor
        const assemblyInput = document.getElementById('assembly-input');
        if (!assemblyInput) {
            return { passed: false, message: "Cannot find assembly editor. Please refresh the page." };
        }

        const assemblyCode = assemblyInput.value;
        
        // Check if DATA pseudo-op contains the original string (not the lowercase version)
        // Look for DATA followed by the original string
        const dataPattern = new RegExp(`DATA\\s+['"]${this.originalString.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"]`, 'i');
        
        if (!dataPattern.test(assemblyCode)) {
            // Check if they changed the DATA to have lowercase
            const lowercaseDataPattern = new RegExp(`DATA\\s+['"]${this.expectedOutput.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"]`, 'i');
            if (lowercaseDataPattern.test(assemblyCode)) {
                return {
                    passed: false,
                    message: "You have modified the DATA pseudo-op to contain the lowercase string. You must keep the original mixed-case string in DATA and use a loop to convert it to lowercase!"
                };
            }
            return {
                passed: false,
                message: `Your DATA pseudo-op must contain the original string "${this.originalString}". Do not modify the DATA pseudo-op - solve the problem with a loop!`
            };
        }

        return { passed: true, message: "✅ DATA pseudo-op contains the original string and has not been modified." };
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
                    
                    // Check if output contains the expected lowercase string
                    if (output.includes(this.expectedOutput)) {
                        return { passed: true, message: `✅ Program correctly outputs "${this.expectedOutput}"!` };
                    } else {
                        // Check if they have the original mixed-case string in output (which would be wrong)
                        if (output.includes(this.originalString)) {
                            return { 
                                passed: false, 
                                message: `Your output still contains the original mixed-case string "${this.originalString}". You need to convert it to lowercase "${this.expectedOutput}".` 
                            };
                        }
                        return { 
                            passed: false, 
                            message: `Expected output to contain "${this.expectedOutput}", but got: "${output}"` 
                        };
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
