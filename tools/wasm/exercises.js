/**
 * Exercise Classes for WASM Playground
 * 
 * This file contains the base Exercise class and specific exercise implementations
 * for grading WebAssembly programs.
 */

/**
 * Base Exercise Class
 * 
 * Provides common functionality for all WASM exercises including:
 * - Step management
 * - UI state handling
 * - Grade submission
 * - WASM execution utilities
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
            // Show hint button if available (only for exercises that have them)
            if (typeof this.showHints === 'function') {
                this.showHintButton();
            }
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
            button.style.backgroundColor = '#dc3545'; // Red color for retry
        }
    }

    showHintButton() {
        const stepDisplay = document.getElementById('stepDisplay');
        if (stepDisplay && !document.getElementById('hintButton')) {
            const hintButtonHtml = `
                <div style="margin-top: 15px; text-align: center;">
                    <button id="hintButton" onclick="currentExercise.showHints()" 
                            style="background-color: #ffc107; color: #212529; border: 1px solid #ffc107; 
                                   padding: 8px 16px; border-radius: 4px; cursor: pointer;">
                        💡 Show Hints
                    </button>
                </div>
            `;
            stepDisplay.innerHTML += hintButtonHtml;
        }
    }
    
    showNextButton() {
        const button = document.getElementById('gradeBtn');
        if (button) {
            button.textContent = 'Next';
            button.onclick = () => this.continueGrading();
        }
    }

    hideStartGradingButton() {
        const section = document.getElementById('startGradingSection');
        if (section) section.style.display = 'none';
    }

    showStartGradingButton() {
        const section = document.getElementById('startGradingSection');
        if (section) section.style.display = 'block';
    }

    clearStepDisplay() {
        const display = document.getElementById('stepDisplay');
        if (display) {
            display.innerHTML = '';
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
 * Hello World Exercise
 * 
 * Students need to write a WebAssembly program that outputs "Hello, World!"
 */
class HelloWorldExercise extends Exercise {
    constructor() {
        const steps = [
            { name: "WAT Compilation", description: "Check if WAT code compiles to WASM without errors" },
            { name: "WASM Execution", description: "Check if WASM module runs successfully" },
            { name: "Output Verification", description: "Check if program outputs 'Hello, World!'" }
        ];

        const instructions = `
            <h3>Hello, World!</h3>
            <p>Write a WebAssembly Text (WAT) program that outputs "Hello, World!".</p>
            <!--
            <h4>Requirements:</h4>
            <ul>
                <li>Your WAT code must compile to WASM without errors</li>
                <li>Your WASM module must execute successfully</li>
                <li>Your program must output "Hello, World!"</li>
            </ul>
            <h4>Instructions:</h4>
            <ul>
                <li>You can load the sample Hello World program using the "Load Sample" button</li>
                <li>Click "Compile & Run WAT" to execute your program</li>
                <li>When ready, click "Start Grading" to test your program</li>
            </ul>
            <h4>Expected Output:</h4>
            <pre>Output

Hello, World!</pre>
            -->
        `;

        super("Hello World", "Output 'Hello, World!' using WebAssembly", steps, instructions);
    }

    continueGrading() {
        // Special handling for step 1 (execution) - automatically run the WASM
        if (this.currentStep === 1) {
            // Trigger the "Compile & Run WAT" button
            const runButton = document.getElementById('runWasm');
            if (runButton) {
                runButton.click();
                // Wait a moment for execution to complete, then continue
                setTimeout(() => {
                    super.continueGrading();
                }, 1000);
            } else {
                super.continueGrading();
            }
        } else {
            super.continueGrading();
        }
    }

    checkStep(stepIndex) {
        switch (stepIndex) {
            case 0: // WAT Compilation
                return this.checkCompilation();
            case 1: // WASM Execution
                return this.checkExecution();
            case 2: // Output Verification
                return this.checkOutput();
            default:
                return { passed: false, message: "Unknown step" };
        }
    }

    checkCompilation() {
        // Check for errors in the error output
        const errorOutput = document.getElementById('errorOutput');
        if (errorOutput && !errorOutput.classList.contains('hidden') && errorOutput.textContent.trim()) {
            return { passed: false, message: `Compilation failed: ${errorOutput.textContent}` };
        }

        // Check if there's any output (indicating compilation occurred)
        const output = document.getElementById('output');
        if (!output) {
            return { passed: false, message: "Cannot find output display." };
        }

        const outputText = output.textContent || output.innerText;
        if (outputText.includes('Output will appear here') || outputText.trim() === '') {
            return { passed: false, message: "No compilation detected. Click 'Compile & Run WAT' to compile your program." };
        }

        return { passed: true, message: "✅ WAT code compiled successfully." };
    }

    checkExecution() {
        // Check if WASM module executed successfully
        const output = document.getElementById('output');
        if (!output) {
            return { passed: false, message: "Cannot find output display." };
        }

        // Check if there's any output (indicating execution occurred)
        const outputText = output.textContent || output.innerText;
        if (outputText.includes('Output will appear here') || outputText.trim() === '') {
            return { passed: false, message: "No output detected. Click 'Compile & Run WAT' to execute your program." };
        }

        return { passed: true, message: "✅ WASM module executed successfully." };
    }

    checkOutput() {
        // Check if program outputs "Hello, World!"
        const output = document.getElementById('output');
        if (!output) {
            return { passed: false, message: "Cannot find output display." };
        }

        const outputText = output.textContent || output.innerText;
        if (outputText.includes('Hello, World!')) {
            return { passed: true, message: "✅ Program correctly outputs 'Hello, World!'!" };
        } else {
            return { passed: false, message: `Expected output 'Hello, World!', but got: ${outputText}` };
        }
    }
}

/**
 * Print Out 42 Exercise
 * 
 * Students need to write a WebAssembly program that outputs the number 42
 */
class PrintOut42Exercise extends Exercise {
    constructor() {
        const steps = [
            { name: "WAT Compilation", description: "Check if WAT code compiles to WASM without errors" },
            { name: "WASM Execution", description: "Check if WASM module runs successfully" },
            { name: "Output Verification", description: "Check if program outputs '42'" }
        ];

        const instructions = `
            <h3>Print Out 42</h3>
            <p>Write a WebAssembly Text (WAT) program that outputs the number 42.</p>
            <h4>Requirements:</h4>
            <ul>
                <li>Your WAT code must compile to WASM without errors</li>
                <li>Your WASM module must execute successfully</li>
                <li>Your program must output the number 42</li>
            </ul>
            <h4>Example structure:</h4>
            <pre>
(module
  (func $get42 (result i32)
    i32.const 42
  )
  (export "get42" (func $get42))
)
            </pre>
        `;

        super("Print Out 42", "Output the number 42 using WebAssembly", steps, instructions);
    }

    checkStep(stepIndex) {
        switch (stepIndex) {
            case 0: // WAT Compilation
                return this.checkCompilation();
            case 1: // WASM Execution
                return this.checkExecution();
            case 2: // Output Verification
                return this.checkOutput();
            default:
                return { passed: false, message: "Unknown step" };
        }
    }

    checkCompilation() {
        // Check if the WAT code compiled successfully
        const wasmEditor = document.getElementById('wasmEditor');
        if (!wasmEditor || !wasmEditor.value.trim()) {
            return { passed: false, message: "No WAT code found. Please enter your program in the editor." };
        }

        // Basic check for required WAT structure
        const code = wasmEditor.value.toLowerCase();
        if (!code.includes('(module')) {
            return { passed: false, message: "WAT code must be wrapped in a (module ...) block." };
        }

        // Check for errors in the error output
        const errorOutput = document.getElementById('errorOutput');
        if (errorOutput && !errorOutput.classList.contains('hidden') && errorOutput.textContent.trim()) {
            return { passed: false, message: `Compilation failed: ${errorOutput.textContent}` };
        }

        return { passed: true, message: "✅ WAT code compiled successfully to WASM." };
    }

    checkExecution() {
        // Check if WASM module executed successfully
        const output = document.getElementById('output');
        if (!output) {
            return { passed: false, message: "Cannot find output display." };
        }

        // Check if there's any output (indicating execution occurred)
        const outputText = output.textContent || output.innerText;
        if (outputText.includes('Output will appear here') || outputText.trim() === '') {
            return { passed: false, message: "No output detected. Click 'Compile & Run WAT' to execute your program." };
        }

        return { passed: true, message: "✅ WASM module executed successfully." };
    }

    checkOutput() {
        // Check if program outputs 42
        const output = document.getElementById('output');
        if (!output) {
            return { passed: false, message: "Cannot find output display." };
        }

        const outputText = output.textContent || output.innerText;
        if (outputText.includes('42')) {
            return { passed: true, message: "✅ Program correctly outputs 42!" };
        } else {
            return { passed: false, message: `Expected output '42', but got: ${outputText}` };
        }
    }

    showHints() {
        // Remove the hint button first
        const hintButton = document.getElementById('hintButton');
        if (hintButton) {
            hintButton.parentElement.remove();
        }

        const hintsHtml = `
            <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 4px; margin-top: 15px;">
                <h4>💡 Hints:</h4>
                <ul>
                    <li>Use the <code>i32.const</code> instruction to load the value 42</li>
                    <li>Export a function that returns the value</li>
                    <li>The output will be displayed when your function is called</li>
                </ul>
                <h4>Example structure:</h4>
                <pre>(module
  (func $get42 (result i32)
    i32.const 42
  )
  (export "get42" (func $get42))
)</pre>
            </div>
        `;
        
        const stepDisplay = document.getElementById('stepDisplay');
        if (stepDisplay) {
            stepDisplay.innerHTML += hintsHtml;
        }
    }
}

// Global variable to hold the current exercise instance (declared in index.php)
