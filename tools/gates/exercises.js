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
        } else if (stepIndex < this.steps.length - 1) {
            // Show Next button for intermediate steps that passed
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
        }
    }

    showNextButton() {
        const button = document.getElementById('gradeBtn');
        if (button) {
            button.textContent = 'Next';
            button.onclick = () => this.nextStep();
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
 * Half Adder Exercise
 * 
 * Students need to build a half adder circuit using XOR and AND gates
 * with inputs A and B, and outputs S (sum) and C (carry)
 */
class HalfAdderExercise extends Exercise {
    constructor() {
        const steps = [
            { name: "Check Component Labels", description: "Verify inputs A, B and outputs S, C are properly labeled" },
            { name: "Check Required Gates", description: "Verify XOR and AND gates are present" },
            { name: "Test A=0, B=0 → S=0, C=0", description: "Test truth table row 1" },
            { name: "Test A=0, B=1 → S=1, C=0", description: "Test truth table row 2" },
            { name: "Test A=1, B=0 → S=1, C=0", description: "Test truth table row 3" },
            { name: "Test A=1, B=1 → S=0, C=1", description: "Test truth table row 4" }
        ];

        const instructions = `
            <h3>Half Adder Circuit</h3>
            <p>Build a half adder circuit that adds two single bits and produces a sum and carry output.</p>
            
            <h4>Requirements:</h4>
            <ul>
                <li>Use exactly one XOR gate and one AND gate</li>
                <li>Create two input components labeled "A" and "B"</li>
                <li>Create two output components labeled "S" (sum) and "C" (carry)</li>
                <li>Connect the circuits to implement the half adder logic</li>
            </ul>
            
            <!--
            <h4>Half Adder Truth Table:</h4>
            <table style="border-collapse: collapse; margin: 10px 0;">
                <tr style="border: 1px solid #ccc; background: #f5f5f5;">
                    <th style="padding: 8px; border: 1px solid #ccc;">A</th>
                    <th style="padding: 8px; border: 1px solid #ccc;">B</th>
                    <th style="padding: 8px; border: 1px solid #ccc;">S (Sum)</th>
                    <th style="padding: 8px; border: 1px solid #ccc;">C (Carry)</th>
                </tr>
                <tr style="border: 1px solid #ccc;">
                    <td style="padding: 8px; border: 1px solid #ccc; text-align: center;">0</td>
                    <td style="padding: 8px; border: 1px solid #ccc; text-align: center;">0</td>
                    <td style="padding: 8px; border: 1px solid #ccc; text-align: center;">0</td>
                    <td style="padding: 8px; border: 1px solid #ccc; text-align: center;">0</td>
                </tr>
                <tr style="border: 1px solid #ccc;">
                    <td style="padding: 8px; border: 1px solid #ccc; text-align: center;">0</td>
                    <td style="padding: 8px; border: 1px solid #ccc; text-align: center;">1</td>
                    <td style="padding: 8px; border: 1px solid #ccc; text-align: center;">1</td>
                    <td style="padding: 8px; border: 1px solid #ccc; text-align: center;">0</td>
                </tr>
                <tr style="border: 1px solid #ccc;">
                    <td style="padding: 8px; border: 1px solid #ccc; text-align: center;">1</td>
                    <td style="padding: 8px; border: 1px solid #ccc; text-align: center;">0</td>
                    <td style="padding: 8px; border: 1px solid #ccc; text-align: center;">1</td>
                    <td style="padding: 8px; border: 1px solid #ccc; text-align: center;">0</td>
                </tr>
                <tr style="border: 1px solid #ccc;">
                    <td style="padding: 8px; border: 1px solid #ccc; text-align: center;">1</td>
                    <td style="padding: 8px; border: 1px solid #ccc; text-align: center;">1</td>
                    <td style="padding: 8px; border: 1px solid #ccc; text-align: center;">0</td>
                    <td style="padding: 8px; border: 1px solid #ccc; text-align: center;">1</td>
                </tr>
            </table>
            
            <h4>Circuit Logic:</h4>
            <ul>
                <li><strong>Sum (S):</strong> A XOR B (exclusive OR of inputs)</li>
                <li><strong>Carry (C):</strong> A AND B (logical AND of inputs)</li>
            </ul>
            
            <h4>Instructions:</h4>
            <ol>
                <li>Place two INPUT components and label them "A" and "B"</li>
                <li>Place two OUTPUT components and label them "S" and "C"</li>
                <li>Place one XOR gate for the sum output</li>
                <li>Place one AND gate for the carry output</li>
                <li>Connect A and B inputs to both the XOR and AND gates</li>
                <li>Connect XOR output to S and AND output to C</li>
                <li>Test your circuit with different input combinations</li>
                <li>When ready, press "Start Grading" to test your circuit</li>
            </ol>
            -->
        `;

        super("Half Adder", "Build a half adder circuit using XOR and AND gates", steps, instructions);
        
        // Track failed attempts for hint system
        this.failedAttempts = 0;
    }

    /**
     * Override startGrading to track attempts
     */
    startGrading() {
        // Don't count this as a new attempt if we're already in the middle of grading
        if (!this.isGrading) {
            this.failedAttempts++;
        }
        
        // Hide the start grading section and show the grading section
        const startGradingSection = document.getElementById('startGradingSection');
        if (startGradingSection) {
            startGradingSection.style.display = 'none';
        }
        
        const gradingSection = document.getElementById('gradingSection');
        if (gradingSection) {
            gradingSection.style.display = 'block';
        }
        
        super.startGrading();
    }

    /**
     * Override resetGrading to manage hint system
     */
    resetGrading() {
        super.resetGrading();
        this.hideHintButton();
        
        // Show the start grading section and hide the grading section
        const startGradingSection = document.getElementById('startGradingSection');
        if (startGradingSection) {
            startGradingSection.style.display = 'block';
        }
        
        const gradingSection = document.getElementById('gradingSection');
        if (gradingSection) {
            gradingSection.style.display = 'none';
        }
    }

    /**
     * Override executeStep to handle failures and show hints
     */
    executeStep(stepIndex) {
        const step = this.steps[stepIndex];
        const result = this.checkStep(stepIndex);
        
        step.status = result.passed ? "passed" : "failed";
        this.displayStepResult(stepIndex, result);
        
        if (!result.passed) {
            this.isGrading = false;
            this.showRetryButton();
            
            // Show hint button after 2 failed attempts
            if (this.failedAttempts >= 2) {
                this.showHintButton();
            }
        } else if (stepIndex < this.steps.length - 1) {
            // Show Next button for intermediate steps that passed
            this.showNextButton();
        }
    }

    /**
     * Show hint button
     */
    showHintButton() {
        const gradingSection = document.getElementById('gradingSection');
        if (gradingSection) {
            // Check if hint button already exists
            let hintBtn = document.getElementById('hintBtn');
            if (!hintBtn) {
                hintBtn = document.createElement('button');
                hintBtn.id = 'hintBtn';
                hintBtn.textContent = 'Hint';
                hintBtn.style.cssText = `
                    background-color: #17a2b8;
                    color: white;
                    border: none;
                    padding: 10px 20px;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 14px;
                    margin-left: 10px;
                `;
                hintBtn.onclick = () => this.showHintModal();
                gradingSection.appendChild(hintBtn);
            }
            hintBtn.style.display = 'inline-block';
        }
    }

    /**
     * Hide hint button
     */
    hideHintButton() {
        const hintBtn = document.getElementById('hintBtn');
        if (hintBtn) {
            hintBtn.style.display = 'none';
        }
    }

    /**
     * Show hint modal with detailed instructions
     */
    showHintModal() {
        // Get the assignment modal content
        const assignmentInstructions = document.getElementById('assignmentInstructions');
        const startGradingSection = document.getElementById('startGradingSection');
        const gradingSection = document.getElementById('gradingSection');
        
        if (assignmentInstructions) {
            // Replace the content with hint information
            assignmentInstructions.innerHTML = `
                <div style="text-align: center; margin-bottom: 20px;">
                    <h3>💡 Half Adder Hints</h3>
                </div>
                
                <h4>Half Adder Truth Table:</h4>
                <table style="border-collapse: collapse; margin: 10px 0; width: 100%;">
                    <tr style="border: 1px solid #ccc; background: #f5f5f5;">
                        <th style="padding: 8px; border: 1px solid #ccc;">A</th>
                        <th style="padding: 8px; border: 1px solid #ccc;">B</th>
                        <th style="padding: 8px; border: 1px solid #ccc;">S (Sum)</th>
                        <th style="padding: 8px; border: 1px solid #ccc;">C (Carry)</th>
                    </tr>
                    <tr style="border: 1px solid #ccc;">
                        <td style="padding: 8px; border: 1px solid #ccc; text-align: center;">0</td>
                        <td style="padding: 8px; border: 1px solid #ccc; text-align: center;">0</td>
                        <td style="padding: 8px; border: 1px solid #ccc; text-align: center;">0</td>
                        <td style="padding: 8px; border: 1px solid #ccc; text-align: center;">0</td>
                    </tr>
                    <tr style="border: 1px solid #ccc;">
                        <td style="padding: 8px; border: 1px solid #ccc; text-align: center;">0</td>
                        <td style="padding: 8px; border: 1px solid #ccc; text-align: center;">1</td>
                        <td style="padding: 8px; border: 1px solid #ccc; text-align: center;">1</td>
                        <td style="padding: 8px; border: 1px solid #ccc; text-align: center;">0</td>
                    </tr>
                    <tr style="border: 1px solid #ccc;">
                        <td style="padding: 8px; border: 1px solid #ccc; text-align: center;">1</td>
                        <td style="padding: 8px; border: 1px solid #ccc; text-align: center;">0</td>
                        <td style="padding: 8px; border: 1px solid #ccc; text-align: center;">1</td>
                        <td style="padding: 8px; border: 1px solid #ccc; text-align: center;">0</td>
                    </tr>
                    <tr style="border: 1px solid #ccc;">
                        <td style="padding: 8px; border: 1px solid #ccc; text-align: center;">1</td>
                        <td style="padding: 8px; border: 1px solid #ccc; text-align: center;">1</td>
                        <td style="padding: 8px; border: 1px solid #ccc; text-align: center;">0</td>
                        <td style="padding: 8px; border: 1px solid #ccc; text-align: center;">1</td>
                    </tr>
                </table>
                
                <h4>Circuit Logic:</h4>
                <ul>
                    <li><strong>Sum (S):</strong> A ⊕ B (XOR gate)</li>
                    <li><strong>Carry (C):</strong> A ∧ B (AND gate)</li>
                </ul>
                
                <h4>Step-by-Step Implementation:</h4>
                <ol>
                    <li>Place two INPUT components and label them "A" and "B"</li>
                    <li>Place two OUTPUT components and label them "S" and "C"</li>
                    <li>Place one XOR gate for the sum logic</li>
                    <li>Place one AND gate for the carry logic</li>
                    <li>Connect both inputs (A and B) to both gates</li>
                    <li>Connect the XOR gate output to the S output</li>
                    <li>Connect the AND gate output to the C output</li>
                </ol>
                
                <div style="margin-top: 20px; text-align: center;">
                    <button onclick="currentExercise.returnToInstructions()" 
                        style="background-color: #28a745; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer;">
                        Back to Instructions
                    </button>
                </div>
            `;
        }
        
        // Hide grading sections and show only the hint content
        if (startGradingSection) startGradingSection.style.display = 'none';
        if (gradingSection) gradingSection.style.display = 'none';
    }

    /**
     * Return to the initial instructions view
     */
    returnToInstructions() {
        // Reset the exercise state
        this.resetGrading();
        
        // Restore original instructions
        const assignmentInstructions = document.getElementById('assignmentInstructions');
        if (assignmentInstructions) {
            assignmentInstructions.innerHTML = this.instructions;
        }
        
        // Show the start grading section
        const startGradingSection = document.getElementById('startGradingSection');
        if (startGradingSection) {
            startGradingSection.style.display = 'block';
        }
    }

    checkStep(stepIndex) {
        switch (stepIndex) {
            case 0: // Check Component Labels
                return this.checkComponentLabels();
            case 1: // Check Required Gates
                return this.checkRequiredGates();
            case 2: // Test A=0, B=0 → S=0, C=0
                return this.testHalfAdder(false, false, false, false, "A=0, B=0 → S=0, C=0");
            case 3: // Test A=0, B=1 → S=1, C=0
                return this.testHalfAdder(false, true, true, false, "A=0, B=1 → S=1, C=0");
            case 4: // Test A=1, B=0 → S=1, C=0
                return this.testHalfAdder(true, false, true, false, "A=1, B=0 → S=1, C=0");
            case 5: // Test A=1, B=1 → S=0, C=1
                return this.testHalfAdder(true, true, false, true, "A=1, B=1 → S=0, C=1");
            default:
                return { passed: false, message: "Unknown step" };
        }
    }

    /**
     * Check if required input and output components are properly labeled
     */
    checkComponentLabels() {
        if (typeof window.circuitEditor === 'undefined') {
            return { passed: false, message: "Circuit editor not available." };
        }

        // Check for required inputs
        const requiredInputs = ['A', 'B'];
        const requiredOutputs = ['S', 'C'];
        
        const gates = window.circuitEditor.gates;
        const inputGates = gates.filter(gate => gate.type === 'INPUT');
        const outputGates = gates.filter(gate => gate.type === 'OUTPUT');

        // Check input count
        if (inputGates.length !== 2) {
            return { 
                passed: false, 
                message: `Expected exactly 2 INPUT components, found ${inputGates.length}. Please add INPUT components and label them "A" and "B".` 
            };
        }

        // Check output count
        if (outputGates.length !== 2) {
            return { 
                passed: false, 
                message: `Expected exactly 2 OUTPUT components, found ${outputGates.length}. Please add OUTPUT components and label them "S" and "C".` 
            };
        }

        // Check input labels
        const inputLabels = inputGates.map(gate => gate.label.toUpperCase());
        for (const requiredLabel of requiredInputs) {
            if (!inputLabels.includes(requiredLabel)) {
                return { 
                    passed: false, 
                    message: `Missing input labeled "${requiredLabel}". Found inputs: ${inputLabels.join(', ')}. Please use the Tag tool to label your inputs.` 
                };
            }
        }

        // Check output labels
        const outputLabels = outputGates.map(gate => gate.label.toUpperCase());
        for (const requiredLabel of requiredOutputs) {
            if (!outputLabels.includes(requiredLabel)) {
                return { 
                    passed: false, 
                    message: `Missing output labeled "${requiredLabel}". Found outputs: ${outputLabels.join(', ')}. Please use the Tag tool to label your outputs.` 
                };
            }
        }

        return { passed: true, message: "✅ All required components are properly labeled (inputs A, B and outputs S, C)." };
    }

    /**
     * Check if required XOR and AND gates are present
     */
    checkRequiredGates() {
        if (typeof window.circuitEditor === 'undefined') {
            return { passed: false, message: "Circuit editor not available." };
        }

        const gates = window.circuitEditor.gates;
        const xorGates = gates.filter(gate => gate.type === 'XOR');
        const andGates = gates.filter(gate => gate.type === 'AND');

        // Check for exactly one XOR gate
        if (xorGates.length === 0) {
            return { 
                passed: false, 
                message: "Missing XOR gate. A half adder requires exactly one XOR gate for the sum output." 
            };
        }
        if (xorGates.length > 1) {
            return { 
                passed: false, 
                message: `Found ${xorGates.length} XOR gates. A half adder requires exactly one XOR gate for the sum output.` 
            };
        }

        // Check for exactly one AND gate
        if (andGates.length === 0) {
            return { 
                passed: false, 
                message: "Missing AND gate. A half adder requires exactly one AND gate for the carry output." 
            };
        }
        if (andGates.length > 1) {
            return { 
                passed: false, 
                message: `Found ${andGates.length} AND gates. A half adder requires exactly one AND gate for the carry output.` 
            };
        }

        return { passed: true, message: "✅ Required gates found: 1 XOR gate and 1 AND gate." };
    }

    /**
     * Test the half adder circuit with specific input values
     * @param {boolean} inputA - Value for input A
     * @param {boolean} inputB - Value for input B  
     * @param {boolean} expectedS - Expected sum output
     * @param {boolean} expectedC - Expected carry output
     * @param {string} testDescription - Description for error messages
     */
    testHalfAdder(inputA, inputB, expectedS, expectedC, testDescription) {
        if (typeof window.circuitEditor === 'undefined') {
            return { passed: false, message: "Circuit editor not available." };
        }

        // Set the input values
        const setA = window.circuitEditor.setInputByLabel('A', inputA);
        const setB = window.circuitEditor.setInputByLabel('B', inputB);

        if (!setA) {
            return { passed: false, message: 'Could not find input labeled "A". Make sure you have an INPUT component labeled "A".' };
        }
        if (!setB) {
            return { passed: false, message: 'Could not find input labeled "B". Make sure you have an INPUT component labeled "B".' };
        }

        // Force immediate circuit update and wait for completion
        window.circuitEditor.circuit.update();
        
        // Debug logging
        console.log(`Testing half adder: ${testDescription}`);
        console.log(`Set A=${inputA}, B=${inputB}`);
        
        // Debug: Check if components exist and their connections
        const gates = window.circuitEditor.gates;
        const inputAGate = gates.find(g => g.type === 'INPUT' && g.label.toUpperCase() === 'A');
        const inputBGate = gates.find(g => g.type === 'INPUT' && g.label.toUpperCase() === 'B');
        const outputS = gates.find(g => g.type === 'OUTPUT' && g.label.toUpperCase() === 'S');
        const outputC = gates.find(g => g.type === 'OUTPUT' && g.label.toUpperCase() === 'C');
        const xorGate = gates.find(g => g.type === 'XOR');
        const andGate = gates.find(g => g.type === 'AND');
        
        console.log('Circuit components:');
        console.log('- Input A:', inputAGate ? `found, state=${inputAGate.state}` : 'NOT FOUND');
        console.log('- Input B:', inputBGate ? `found, state=${inputBGate.state}` : 'NOT FOUND');
        console.log('- XOR gate:', xorGate ? 'found' : 'NOT FOUND');
        console.log('- AND gate:', andGate ? 'found' : 'NOT FOUND');
        console.log('- Output S:', outputS ? `found, connected=${outputS.inputNodes[0]?.connected}` : 'NOT FOUND');
        console.log('- Output C:', outputC ? `found, connected=${outputC.inputNodes[0]?.connected}` : 'NOT FOUND');
        
        if (outputS && outputS.inputNodes[0]) {
            console.log('- Output S input node sourceValue:', outputS.inputNodes[0].sourceValue);
        }
        if (outputC && outputC.inputNodes[0]) {
            console.log('- Output C input node sourceValue:', outputC.inputNodes[0].sourceValue);
        }
        
        // Get the output values after circuit update
        const actualS = window.circuitEditor.getOutputByLabel('S');
        const actualC = window.circuitEditor.getOutputByLabel('C');
        
        console.log(`Got outputs: S=${actualS}, C=${actualC}`);

        if (actualS === undefined) {
            return { passed: false, message: 'Could not read output "S". Make sure you have an OUTPUT component labeled "S" and it is connected to the XOR gate.' };
        }
        if (actualC === undefined) {
            return { passed: false, message: 'Could not read output "C". Make sure you have an OUTPUT component labeled "C" and it is connected to the AND gate.' };
        }

        // Check if outputs match expected values
        if (actualS !== expectedS || actualC !== expectedC) {
            const actualSStr = actualS ? '1' : '0';
            const actualCStr = actualC ? '1' : '0';
            const expectedSStr = expectedS ? '1' : '0';
            const expectedCStr = expectedC ? '1' : '0';
            
            return { 
                passed: false, 
                message: `Test failed for ${testDescription}. Expected S=${expectedSStr}, C=${expectedCStr}, but got S=${actualSStr}, C=${actualCStr}. Check your circuit connections.` 
            };
        }

        const inputAStr = inputA ? '1' : '0';
        const inputBStr = inputB ? '1' : '0';
        const outputSStr = expectedS ? '1' : '0';
        const outputCStr = expectedC ? '1' : '0';
        
        return { 
            passed: true, 
            message: `✅ Test passed: A=${inputAStr}, B=${inputBStr} → S=${outputSStr}, C=${outputCStr}` 
        };
    }
}

/**
 * Full Adder Exercise
 * 
 * Students need to build a full adder circuit that adds three single bits (A, B, Cin)
 * and produces sum (S) and carry-out (Cout) outputs
 */
class FullAdderExercise extends Exercise {
    constructor() {
        const steps = [
            { name: "Check Component Labels", description: "Verify inputs A, B, Cin and outputs S, Cout are properly labeled" },
            { name: "Check Required Components", description: "Verify circuit has appropriate logic gates" },
            { name: "Test A=0, B=0, Cin=0 → S=0, Cout=0", description: "Test truth table row 1" },
            { name: "Test A=0, B=0, Cin=1 → S=1, Cout=0", description: "Test truth table row 2" },
            { name: "Test A=0, B=1, Cin=0 → S=1, Cout=0", description: "Test truth table row 3" },
            { name: "Test A=0, B=1, Cin=1 → S=0, Cout=1", description: "Test truth table row 4" },
            { name: "Test A=1, B=0, Cin=0 → S=1, Cout=0", description: "Test truth table row 5" },
            { name: "Test A=1, B=0, Cin=1 → S=0, Cout=1", description: "Test truth table row 6" },
            { name: "Test A=1, B=1, Cin=0 → S=0, Cout=1", description: "Test truth table row 7" },
            { name: "Test A=1, B=1, Cin=1 → S=1, Cout=1", description: "Test truth table row 8" }
        ];

        const instructions = `
            <h3>Full Adder Circuit</h3>
            <p>Build a full adder circuit that adds three single bits and produces a sum and carry output.</p>
            
            <h4>Requirements:</h4>
            <ul>
                <li>Create three input components labeled "A", "B", and "Cin" (carry-in)</li>
                <li>Create two output components labeled "S" (sum) and "Cout" (carry-out)</li>
                <li>Use appropriate logic gates to implement the full adder</li>
                <li>Connect the circuits to implement the full adder logic</li>
            </ul>
            
            <h4>Full Adder Logic:</h4>
            <ul>
                <li><strong>Sum (S):</strong> A ⊕ B ⊕ Cin (three-way XOR)</li>
                <li><strong>Carry-out (Cout):</strong> (A ∧ B) ∨ (Cin ∧ (A ⊕ B))</li>
            </ul>
            
            <h4>Implementation Options:</h4>
            <ul>
                <li><strong>Option 1:</strong> Use two half adders + OR gate</li>
                <li><strong>Option 2:</strong> Direct implementation with XOR, AND, and OR gates</li>
            </ul>
        `;

        super("Full Adder", "Build a full adder circuit with three inputs and two outputs", steps, instructions);
        
        // Track failed attempts for hint system
        this.failedAttempts = 0;
    }

    /**
     * Override startGrading to track attempts and manage UI
     */
    startGrading() {
        // Don't count this as a new attempt if we're already in the middle of grading
        if (!this.isGrading) {
            this.failedAttempts++;
        }
        
        // Hide the start grading section and show the grading section
        const startGradingSection = document.getElementById('startGradingSection');
        if (startGradingSection) {
            startGradingSection.style.display = 'none';
        }
        
        const gradingSection = document.getElementById('gradingSection');
        if (gradingSection) {
            gradingSection.style.display = 'block';
        }
        
        super.startGrading();
    }

    /**
     * Override resetGrading to manage hint system and UI
     */
    resetGrading() {
        super.resetGrading();
        this.hideHintButton();
        
        // Show the start grading section and hide the grading section
        const startGradingSection = document.getElementById('startGradingSection');
        if (startGradingSection) {
            startGradingSection.style.display = 'block';
        }
        
        const gradingSection = document.getElementById('gradingSection');
        if (gradingSection) {
            gradingSection.style.display = 'none';
        }
    }

    /**
     * Override executeStep to handle failures and show hints
     */
    executeStep(stepIndex) {
        const step = this.steps[stepIndex];
        const result = this.checkStep(stepIndex);
        
        step.status = result.passed ? "passed" : "failed";
        this.displayStepResult(stepIndex, result);
        
        if (!result.passed) {
            this.isGrading = false;
            this.showRetryButton();
            
            // Show hint button after 2 failed attempts
            if (this.failedAttempts >= 2) {
                this.showHintButton();
            }
        } else if (stepIndex < this.steps.length - 1) {
            // Show Next button for intermediate steps that passed
            this.showNextButton();
        }
    }

    /**
     * Show hint button
     */
    showHintButton() {
        const gradingSection = document.getElementById('gradingSection');
        if (gradingSection) {
            // Check if hint button already exists
            let hintBtn = document.getElementById('hintBtn');
            if (!hintBtn) {
                hintBtn = document.createElement('button');
                hintBtn.id = 'hintBtn';
                hintBtn.textContent = 'Need Help? Show Hints';
                hintBtn.style.cssText = `
                    background-color: #17a2b8;
                    color: white;
                    border: none;
                    padding: 10px 20px;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 14px;
                    margin-left: 10px;
                `;
                hintBtn.onclick = () => this.showHintModal();
                gradingSection.appendChild(hintBtn);
            }
            hintBtn.style.display = 'inline-block';
        }
    }

    /**
     * Hide hint button
     */
    hideHintButton() {
        const hintBtn = document.getElementById('hintBtn');
        if (hintBtn) {
            hintBtn.style.display = 'none';
        }
    }

    /**
     * Show hint in the same assignment modal
     */
    showHintModal() {
        // Get the assignment modal content
        const assignmentInstructions = document.getElementById('assignmentInstructions');
        const startGradingSection = document.getElementById('startGradingSection');
        const gradingSection = document.getElementById('gradingSection');
        
        if (assignmentInstructions) {
            // Replace the content with hint information
            assignmentInstructions.innerHTML = `
                <div style="text-align: center; margin-bottom: 20px;">
                    <h3>💡 Full Adder Hints</h3>
                </div>
                
                <h4>Full Adder Truth Table:</h4>
                <table style="border-collapse: collapse; margin: 10px 0; width: 100%;">
                    <tr style="border: 1px solid #ccc; background: #f5f5f5;">
                        <th style="padding: 8px; border: 1px solid #ccc;">A</th>
                        <th style="padding: 8px; border: 1px solid #ccc;">B</th>
                        <th style="padding: 8px; border: 1px solid #ccc;">Cin</th>
                        <th style="padding: 8px; border: 1px solid #ccc;">S (Sum)</th>
                        <th style="padding: 8px; border: 1px solid #ccc;">Cout (Carry)</th>
                    </tr>
                    <tr style="border: 1px solid #ccc;">
                        <td style="padding: 8px; border: 1px solid #ccc; text-align: center;">0</td>
                        <td style="padding: 8px; border: 1px solid #ccc; text-align: center;">0</td>
                        <td style="padding: 8px; border: 1px solid #ccc; text-align: center;">0</td>
                        <td style="padding: 8px; border: 1px solid #ccc; text-align: center;">0</td>
                        <td style="padding: 8px; border: 1px solid #ccc; text-align: center;">0</td>
                    </tr>
                    <tr style="border: 1px solid #ccc;">
                        <td style="padding: 8px; border: 1px solid #ccc; text-align: center;">0</td>
                        <td style="padding: 8px; border: 1px solid #ccc; text-align: center;">0</td>
                        <td style="padding: 8px; border: 1px solid #ccc; text-align: center;">1</td>
                        <td style="padding: 8px; border: 1px solid #ccc; text-align: center;">1</td>
                        <td style="padding: 8px; border: 1px solid #ccc; text-align: center;">0</td>
                    </tr>
                    <tr style="border: 1px solid #ccc;">
                        <td style="padding: 8px; border: 1px solid #ccc; text-align: center;">0</td>
                        <td style="padding: 8px; border: 1px solid #ccc; text-align: center;">1</td>
                        <td style="padding: 8px; border: 1px solid #ccc; text-align: center;">0</td>
                        <td style="padding: 8px; border: 1px solid #ccc; text-align: center;">1</td>
                        <td style="padding: 8px; border: 1px solid #ccc; text-align: center;">0</td>
                    </tr>
                    <tr style="border: 1px solid #ccc;">
                        <td style="padding: 8px; border: 1px solid #ccc; text-align: center;">0</td>
                        <td style="padding: 8px; border: 1px solid #ccc; text-align: center;">1</td>
                        <td style="padding: 8px; border: 1px solid #ccc; text-align: center;">1</td>
                        <td style="padding: 8px; border: 1px solid #ccc; text-align: center;">0</td>
                        <td style="padding: 8px; border: 1px solid #ccc; text-align: center;">1</td>
                    </tr>
                    <tr style="border: 1px solid #ccc;">
                        <td style="padding: 8px; border: 1px solid #ccc; text-align: center;">1</td>
                        <td style="padding: 8px; border: 1px solid #ccc; text-align: center;">0</td>
                        <td style="padding: 8px; border: 1px solid #ccc; text-align: center;">0</td>
                        <td style="padding: 8px; border: 1px solid #ccc; text-align: center;">1</td>
                        <td style="padding: 8px; border: 1px solid #ccc; text-align: center;">0</td>
                    </tr>
                    <tr style="border: 1px solid #ccc;">
                        <td style="padding: 8px; border: 1px solid #ccc; text-align: center;">1</td>
                        <td style="padding: 8px; border: 1px solid #ccc; text-align: center;">0</td>
                        <td style="padding: 8px; border: 1px solid #ccc; text-align: center;">1</td>
                        <td style="padding: 8px; border: 1px solid #ccc; text-align: center;">0</td>
                        <td style="padding: 8px; border: 1px solid #ccc; text-align: center;">1</td>
                    </tr>
                    <tr style="border: 1px solid #ccc;">
                        <td style="padding: 8px; border: 1px solid #ccc; text-align: center;">1</td>
                        <td style="padding: 8px; border: 1px solid #ccc; text-align: center;">1</td>
                        <td style="padding: 8px; border: 1px solid #ccc; text-align: center;">0</td>
                        <td style="padding: 8px; border: 1px solid #ccc; text-align: center;">0</td>
                        <td style="padding: 8px; border: 1px solid #ccc; text-align: center;">1</td>
                    </tr>
                    <tr style="border: 1px solid #ccc;">
                        <td style="padding: 8px; border: 1px solid #ccc; text-align: center;">1</td>
                        <td style="padding: 8px; border: 1px solid #ccc; text-align: center;">1</td>
                        <td style="padding: 8px; border: 1px solid #ccc; text-align: center;">1</td>
                        <td style="padding: 8px; border: 1px solid #ccc; text-align: center;">1</td>
                        <td style="padding: 8px; border: 1px solid #ccc; text-align: center;">1</td>
                    </tr>
                </table>
                
                <h4>Circuit Logic:</h4>
                <ul>
                    <li><strong>Sum (S):</strong> A ⊕ B ⊕ Cin (three-way XOR)</li>
                    <li><strong>Carry-out (Cout):</strong> (A ∧ B) ∨ (Cin ∧ (A ⊕ B))</li>
                </ul>
                
                <h4>Implementation Options:</h4>
                
                <h5>Option 1: Two Half Adders + OR Gate</h5>
                <ol>
                    <li>First half adder: A + B → intermediate sum and carry</li>
                    <li>Second half adder: intermediate sum + Cin → final sum</li>
                    <li>OR gate: combine both carry outputs → final carry-out</li>
                </ol>
                
                <h5>Option 2: Direct Gate Implementation</h5>
                <ol>
                    <li>Place three INPUT components: A, B, Cin</li>
                    <li>Place two OUTPUT components: S, Cout</li>
                    <li>Use XOR gates to create A ⊕ B ⊕ Cin for sum</li>
                    <li>Use AND and OR gates for carry logic</li>
                </ol>
                
                <div style="margin-top: 20px; text-align: center;">
                    <button onclick="currentExercise.returnToInstructions()" 
                        style="background-color: #28a745; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer;">
                        Back to Instructions
                    </button>
                </div>
            `;
        }
        
        // Hide grading sections and show only the hint content
        if (startGradingSection) startGradingSection.style.display = 'none';
        if (gradingSection) gradingSection.style.display = 'none';
    }

    /**
     * Return to the initial instructions view
     */
    returnToInstructions() {
        // Reset the exercise state
        this.resetGrading();
        
        // Restore original instructions
        const assignmentInstructions = document.getElementById('assignmentInstructions');
        if (assignmentInstructions) {
            assignmentInstructions.innerHTML = this.instructions;
        }
        
        // Show the start grading section
        const startGradingSection = document.getElementById('startGradingSection');
        if (startGradingSection) {
            startGradingSection.style.display = 'block';
        }
    }

    checkStep(stepIndex) {
        switch (stepIndex) {
            case 0: // Check Component Labels
                return this.checkComponentLabels();
            case 1: // Check Required Components
                return this.checkRequiredComponents();
            case 2: // Test A=0, B=0, Cin=0 → S=0, Cout=0
                return this.testFullAdder(false, false, false, false, false, "A=0, B=0, Cin=0 → S=0, Cout=0");
            case 3: // Test A=0, B=0, Cin=1 → S=1, Cout=0
                return this.testFullAdder(false, false, true, true, false, "A=0, B=0, Cin=1 → S=1, Cout=0");
            case 4: // Test A=0, B=1, Cin=0 → S=1, Cout=0
                return this.testFullAdder(false, true, false, true, false, "A=0, B=1, Cin=0 → S=1, Cout=0");
            case 5: // Test A=0, B=1, Cin=1 → S=0, Cout=1
                return this.testFullAdder(false, true, true, false, true, "A=0, B=1, Cin=1 → S=0, Cout=1");
            case 6: // Test A=1, B=0, Cin=0 → S=1, Cout=0
                return this.testFullAdder(true, false, false, true, false, "A=1, B=0, Cin=0 → S=1, Cout=0");
            case 7: // Test A=1, B=0, Cin=1 → S=0, Cout=1
                return this.testFullAdder(true, false, true, false, true, "A=1, B=0, Cin=1 → S=0, Cout=1");
            case 8: // Test A=1, B=1, Cin=0 → S=0, Cout=1
                return this.testFullAdder(true, true, false, false, true, "A=1, B=1, Cin=0 → S=0, Cout=1");
            case 9: // Test A=1, B=1, Cin=1 → S=1, Cout=1
                return this.testFullAdder(true, true, true, true, true, "A=1, B=1, Cin=1 → S=1, Cout=1");
            default:
                return { passed: false, message: "Unknown step" };
        }
    }

    /**
     * Check if required input and output components are properly labeled
     */
    checkComponentLabels() {
        if (typeof window.circuitEditor === 'undefined') {
            return { passed: false, message: "Circuit editor not available." };
        }

        // Check for required inputs and outputs
        const requiredInputs = ['A', 'B', 'CIN'];
        const requiredOutputs = ['S', 'COUT'];
        
        const gates = window.circuitEditor.gates;
        const inputGates = gates.filter(gate => gate.type === 'INPUT');
        const outputGates = gates.filter(gate => gate.type === 'OUTPUT');

        // Check input count
        if (inputGates.length !== 3) {
            return { 
                passed: false, 
                message: `Expected exactly 3 INPUT components, found ${inputGates.length}. Please add INPUT components and label them "A", "B", and "Cin".` 
            };
        }

        // Check output count
        if (outputGates.length !== 2) {
            return { 
                passed: false, 
                message: `Expected exactly 2 OUTPUT components, found ${outputGates.length}. Please add OUTPUT components and label them "S" and "Cout".` 
            };
        }

        // Check input labels (case insensitive)
        const inputLabels = inputGates.map(gate => gate.label.toUpperCase());
        for (const requiredLabel of requiredInputs) {
            if (!inputLabels.includes(requiredLabel)) {
                return { 
                    passed: false, 
                    message: `Missing input labeled "${requiredLabel}". Found inputs: ${inputLabels.join(', ')}. Please use the Tag tool to label your inputs.` 
                };
            }
        }

        // Check output labels (case insensitive)
        const outputLabels = outputGates.map(gate => gate.label.toUpperCase());
        for (const requiredLabel of requiredOutputs) {
            if (!outputLabels.includes(requiredLabel)) {
                return { 
                    passed: false, 
                    message: `Missing output labeled "${requiredLabel}". Found outputs: ${outputLabels.join(', ')}. Please use the Tag tool to label your outputs.` 
                };
            }
        }

        return { passed: true, message: "✅ All required components are properly labeled (inputs A, B, Cin and outputs S, Cout)." };
    }

    /**
     * Check if circuit has appropriate logic gates (flexible check)
     */
    checkRequiredComponents() {
        if (typeof window.circuitEditor === 'undefined') {
            return { passed: false, message: "Circuit editor not available." };
        }

        const gates = window.circuitEditor.gates;
        const logicGates = gates.filter(gate => 
            ['XOR', 'AND', 'OR', 'NAND', 'NOR', 'NOT'].includes(gate.type)
        );

        if (logicGates.length === 0) {
            return { 
                passed: false, 
                message: "No logic gates found. A full adder requires logic gates such as XOR, AND, and OR gates." 
            };
        }

        // Check for some basic gate types that would be needed
        const hasXOR = gates.some(gate => gate.type === 'XOR');
        const hasAND = gates.some(gate => gate.type === 'AND');
        const hasOR = gates.some(gate => gate.type === 'OR');

        if (!hasXOR) {
            return { 
                passed: false, 
                message: "Missing XOR gate(s). A full adder typically requires XOR gates for the sum logic." 
            };
        }

        if (!hasAND && !hasOR) {
            return { 
                passed: false, 
                message: "Missing carry logic gates. A full adder requires AND and/or OR gates for carry generation." 
            };
        }

        return { passed: true, message: "✅ Circuit contains appropriate logic gates for a full adder implementation." };
    }

    /**
     * Test the full adder circuit with specific input values
     * @param {boolean} inputA - Value for input A
     * @param {boolean} inputB - Value for input B  
     * @param {boolean} inputCin - Value for input Cin
     * @param {boolean} expectedS - Expected sum output
     * @param {boolean} expectedCout - Expected carry output
     * @param {string} testDescription - Description for error messages
     */
    testFullAdder(inputA, inputB, inputCin, expectedS, expectedCout, testDescription) {
        if (typeof window.circuitEditor === 'undefined') {
            return { passed: false, message: "Circuit editor not available." };
        }

        // Set the input values
        const setA = window.circuitEditor.setInputByLabel('A', inputA);
        const setB = window.circuitEditor.setInputByLabel('B', inputB);
        const setCin = window.circuitEditor.setInputByLabel('Cin', inputCin);

        if (!setA) {
            return { passed: false, message: 'Could not find input labeled "A". Make sure you have an INPUT component labeled "A".' };
        }
        if (!setB) {
            return { passed: false, message: 'Could not find input labeled "B". Make sure you have an INPUT component labeled "B".' };
        }
        if (!setCin) {
            return { passed: false, message: 'Could not find input labeled "Cin". Make sure you have an INPUT component labeled "Cin".' };
        }

        // Force immediate circuit update
        window.circuitEditor.circuit.update();
        
        // Debug logging
        console.log(`Testing full adder: ${testDescription}`);
        console.log(`Set A=${inputA}, B=${inputB}, Cin=${inputCin}`);
        
        // Get the output values
        const actualS = window.circuitEditor.getOutputByLabel('S');
        const actualCout = window.circuitEditor.getOutputByLabel('Cout');
        
        console.log(`Got outputs: S=${actualS}, Cout=${actualCout}`);

        if (actualS === undefined) {
            return { passed: false, message: 'Could not read output "S". Make sure you have an OUTPUT component labeled "S" and it is connected to the sum logic.' };
        }
        if (actualCout === undefined) {
            return { passed: false, message: 'Could not read output "Cout". Make sure you have an OUTPUT component labeled "Cout" and it is connected to the carry logic.' };
        }

        // Check if outputs match expected values
        if (actualS !== expectedS || actualCout !== expectedCout) {
            const actualSStr = actualS ? '1' : '0';
            const actualCoutStr = actualCout ? '1' : '0';
            const expectedSStr = expectedS ? '1' : '0';
            const expectedCoutStr = expectedCout ? '1' : '0';
            
            return { 
                passed: false, 
                message: `Test failed for ${testDescription}. Expected S=${expectedSStr}, Cout=${expectedCoutStr}, but got S=${actualSStr}, Cout=${actualCoutStr}. Check your circuit connections.` 
            };
        }

        const inputAStr = inputA ? '1' : '0';
        const inputBStr = inputB ? '1' : '0';
        const inputCinStr = inputCin ? '1' : '0';
        const outputSStr = expectedS ? '1' : '0';
        const outputCoutStr = expectedCout ? '1' : '0';
        
        return { 
            passed: true, 
            message: `✅ Test passed: A=${inputAStr}, B=${inputBStr}, Cin=${inputCinStr} → S=${outputSStr}, Cout=${outputCoutStr}` 
        };
    }
}

// Global variable to hold the current exercise instance
let currentExercise = null;
