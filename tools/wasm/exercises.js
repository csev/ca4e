/**
 * Exercise Classes for WASM Playground
 * 
 * This file contains the base Exercise class and specific exercise implementations
 * for grading WebAssembly programs.
 */

/**
 * WASM-specific Exercise class that extends the common base
 * The base Exercise class is loaded from ../common/exercise-base.js
 */
class WASMExercise extends Exercise {
    /**
     * Execute a specific grading step with WASM-specific behavior
     */
    executeStep(stepIndex) {
        const step = this.steps[stepIndex];
        const result = this.checkStep(stepIndex);
        
        step.status = result.passed ? "passed" : "failed";
        this.displayStepResult(stepIndex, result);
        
        if (!result.passed) {
            this.isGrading = false;
            this.hideGradeButton();
            // Show hint button if available (only for exercises that have them)
            if (typeof this.showHints === 'function') {
                this.showHintButton();
            }
        } else if (stepIndex < this.steps.length - 1) {
            // Show Next button for intermediate steps
            this.showNextButton();
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
}

/**
 * Hello World Exercise
 * 
 * Students need to write a WebAssembly program that outputs "Hello, World!"
 */
class HelloWorldExercise extends WASMExercise {
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
 * HIDDEN: Commented out but not removed
 */
/*
class PrintOut42Exercise extends WASMExercise {
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
*/

/**
 * Random Phrase Exercise
 * 
 * Students need to output a randomly selected phrase
 * The phrase is chosen at exercise creation time and displayed in instructions
 */
class RandomPhraseExercise extends WASMExercise {
    constructor() {
        // List of phrases to randomly choose from (all longer than "Hello World!")
        const phrases = [
            'Hello there, friend!',
            'Good morning, everyone!',
            'Welcome to WebAssembly!',
            'Greetings from WASM!',
            'Hello everyone, welcome!',
            'Hello friend, how are you?',
            'Hello student, keep learning!',
            'Hello CA4E, great course!',
            'Hello WASM, you are awesome!',
            'Hello WebAssembly, nice to meet you!',
            'Hello assembly language!',
            'Hello computer science!',
            'Hello programming world!',
            'Hello code, let\'s build something!',
            'Hello from the WASM playground!',
            'Hello and welcome to CA4E!'
        ];
        
        // Randomly select a phrase (use local variable before super())
        const randomIndex = Math.floor(Math.random() * phrases.length);
        const targetPhrase = phrases[randomIndex];
        
        const steps = [
            { name: "WAT Compilation", description: "Check if WAT code compiles to WASM without errors" },
            { name: "WASM Execution", description: "Check if WASM module runs successfully" },
            { name: "Output Verification", description: `Check if program outputs '${targetPhrase}'` }
        ];

        const instructions = `
            <h3>Output a Specific Phrase</h3>
            <p><strong>Your task:</strong> Adapt the Hello World sample code to output the following phrase:</p>
            <p style="font-size: 18px; font-weight: bold; color: #007bff; padding: 10px; background: #f0f0f0; border-radius: 4px; text-align: center;">
                "${targetPhrase}"
            </p>
            <p>The autograder will check that your program output contains this phrase. Your output can contain additional text before or after the phrase.</p>
            <h4>Requirements:</h4>
            <ul>
                <li>Your WAT code must compile to WASM without errors</li>
                <li>Your WASM module must execute successfully</li>
                <li>Your program output must contain "${targetPhrase}"</li>
            </ul>
        `;

        super("Random Phrase", `Output '${targetPhrase}' using WebAssembly`, steps, instructions);
        
        // Now assign to this.targetPhrase after super() has been called
        this.targetPhrase = targetPhrase;
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
        // Check if program output contains the target phrase
        const output = document.getElementById('output');
        if (!output) {
            return { passed: false, message: "Cannot find output display." };
        }

        const outputText = output.textContent || output.innerText;
        if (outputText.includes(this.targetPhrase)) {
            return { passed: true, message: `✅ Program output contains '${this.targetPhrase}'!` };
        } else {
            return { passed: false, message: `Expected output to contain '${this.targetPhrase}', but got: ${outputText}` };
        }
    }
}

/**
 * Lowercase Conversion Exercise
 * 
 * Students need to convert a mixed-case string to lowercase
 * The original string "Hello from my friend WASM!" must remain in the code
 * The output must be "hello from my friend wasm!" (all lowercase)
 */
class LowercaseConversionExercise extends WASMExercise {
    constructor() {
        // Use local variables before super()
        const originalString = "Hello from WASM!";
        const expectedOutput = "hello from wasm!";
        
        const steps = [
            { name: "Original String Check", description: "Verify the original mixed-case string is still in your code" },
            { name: "WAT Compilation", description: "Check if WAT code compiles to WASM without errors" },
            { name: "WASM Execution", description: "Check if WASM module runs successfully" },
            { name: "Lowercase Output Verification", description: "Check if program outputs the string in lowercase" }
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
            <p><strong>Important:</strong> You must keep the original string "${originalString}" in your code and write a loop to convert each character to lowercase. Do not simply change the input string!</p>
            <h4>Requirements:</h4>
            <ul>
                <li>Your code must contain the original string "${originalString}"</li>
                <li>Your WAT code must compile to WASM without errors</li>
                <li>Your WASM module must execute successfully</li>
                <li>Your program output must contain "${expectedOutput}" (all lowercase)</li>
            </ul>
            <h4>Hint:</h4>
            <p>You'll need to loop through each character and check if it's uppercase (ASCII 65-90). If so, add 32 to convert it to lowercase (ASCII 97-122).</p>
        `;

        super("Lowercase Conversion", "Convert string to lowercase using WebAssembly", steps, instructions);
        
        // Now assign to this after super() has been called
        this.originalString = originalString;
        this.expectedOutput = expectedOutput;
    }

    continueGrading() {
        // Special handling for step 2 (execution) - automatically run the WASM
        if (this.currentStep === 2) {
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
            case 0: // Original String Check
                return this.checkOriginalString();
            case 1: // WAT Compilation
                return this.checkCompilation();
            case 2: // WASM Execution
                return this.checkExecution();
            case 3: // Lowercase Output Verification
                return this.checkLowercaseOutput();
            default:
                return { passed: false, message: "Unknown step" };
        }
    }

    checkOriginalString() {
        // Check if the original mixed-case string is still in the code
        const wasmEditor = document.getElementById('wasmEditor');
        if (!wasmEditor || !wasmEditor.value.trim()) {
            return { passed: false, message: "No WAT code found. Please enter your program in the editor." };
        }

        const code = wasmEditor.value;
        
        // Check if the original string is present (case-sensitive check)
        if (!code.includes(this.originalString)) {
            return { 
                passed: false, 
                message: `Your code must contain the original string "${this.originalString}". Do not change the input string - write code to convert it to lowercase!` 
            };
        }

        return { passed: true, message: `✅ Original string "${this.originalString}" found in code.` };
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

    checkLowercaseOutput() {
        // Check if program output contains the lowercase version
        const output = document.getElementById('output');
        if (!output) {
            return { passed: false, message: "Cannot find output display." };
        }

        const outputText = output.textContent || output.innerText;
        
        // Check if output contains the expected lowercase string
        if (outputText.includes(this.expectedOutput)) {
            return { passed: true, message: `✅ Program correctly outputs "${this.expectedOutput}"!` };
        } else {
            // Check if they have the original mixed-case string in output (which would be wrong)
            if (outputText.includes(this.originalString)) {
                return { 
                    passed: false, 
                    message: `Your output still contains the original mixed-case string "${this.originalString}". You need to convert it to lowercase "${this.expectedOutput}".` 
                };
            }
            return { 
                passed: false, 
                message: `Expected output to contain "${this.expectedOutput}", but got: ${outputText}` 
            };
        }
    }
}

// Global variable to hold the current exercise instance (declared in index.php)
