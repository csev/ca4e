/**
 * Exercise Classes for MISTIC VLSI Tool
 * 
 * This file contains the base Exercise class and specific exercise implementations
 * for grading VLSI circuit designs in the MISTIC tool.
 */

/**
 * MISTIC-specific Exercise class that extends the common base
 * The base Exercise class is loaded from ../common/exercise-base.js
 */
class MISTICExercise extends Exercise {

    /**
     * Start the grading process
     */
    startGrading() {
        this.currentStep = 0;
        this.isGrading = true;
        this.hideStartGradingSection();
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
        this.showStartGradingSection();
        this.showInstructions();
        this.resetGradeButton();
        this.resetStepDisplay();
    }

    /**
     * Execute the next grading step
     */
    nextStep() {
        if (this.currentStep >= this.steps.length) {
            this.handleAllStepsCompleted();
            return;
        }

        const step = this.steps[this.currentStep];
        const stepDisplay = document.getElementById('stepDisplay');
        
        try {
            const result = this.executeStep(this.currentStep);
            
            if (result.success) {
                stepDisplay.innerHTML = `<div class="step-result step-passed">
                    <strong>✓ ${step.name}</strong><br>
                    ${result.message || 'Step completed successfully'}
                </div>`;
                step.status = "passed";
                this.currentStep++;
                this.showNextButton();
            } else {
                stepDisplay.innerHTML = `<div class="step-result step-failed">
                    <strong>✗ ${step.name}</strong><br>
                    ${result.error}
                </div>`;
                step.status = "failed";
                this.hideGradeButton();
            }
        } catch (error) {
            console.error('Error executing step:', error);
            stepDisplay.innerHTML = `<div class="step-result step-failed">
                <strong>✗ ${step.name}</strong><br>
                ${error.message}
            </div>`;
            step.status = "failed";
            this.hideGradeButton();
        }
    }

    /**
     * Execute a specific step - to be overridden by subclasses
     * @param {number} stepIndex - The index of the step to execute
     * @returns {Object} - {success: boolean, error?: string}
     */
    executeStep(stepIndex) {
        throw new Error('executeStep must be implemented by subclasses');
    }

    /**
     * Handle completion of all steps
     */
    handleAllStepsCompleted() {
        const stepDisplay = document.getElementById('stepDisplay');
        stepDisplay.innerHTML = `<div class="final-result success">
            <strong>🎉 Excellent Work!</strong><br>
            All tests passed! Submitting grade...
        </div>`;
        
        // Submit grade to LMS if this is an LTI session
        if (typeof this.submitGradeToLMS === 'function') {
            this.submitGradeToLMS(1.0); // Perfect score for completing all steps
        }
        
        // Reset all probes to zero voltage after successful grade
        this.resetAllProbesToZero();
        // Modal will be closed after the grade submission alert is dismissed
    }

    /**
     * Submit grade to LMS - to be overridden by subclasses
     * @param {number} grade - The grade to submit (0.0 to 1.0)
     */
    submitGradeToLMS(grade) {
        console.log('Submitting grade to LMS:', grade);
        
        // This will be implemented by the specific exercise or the main application
        // The implementation depends on the LTI setup in index.php
    }

    /**
     * Reset all probes to zero voltage
     */
    resetAllProbesToZero() {
        // Reset all probe voltage types to '0' (neutral)
        if (typeof window.CircuitProbes !== 'undefined' && typeof window.CircuitProbes.resetAllProbes === 'function') {
            window.CircuitProbes.resetAllProbes();
        }
        
        // Recompute the circuit with all probes at zero
        if (typeof compute === 'function') {
            compute();
        }
        
        // Redraw to show the reset state
        if (typeof redrawAllTiles === 'function') {
            redrawAllTiles();
        }
        
        console.log('All probes reset to zero voltage');
    }

    /**
     * UI Helper Methods
     */
    showGradingSection() {
        const gradingSection = document.getElementById('gradingSection');
        if (gradingSection) {
            gradingSection.style.display = 'block';
        }
    }

    hideGradingSection() {
        const gradingSection = document.getElementById('gradingSection');
        if (gradingSection) {
            gradingSection.style.display = 'none';
        }
    }

    showInstructions() {
        const instructions = document.getElementById('assignmentInstructions');
        if (instructions) {
            instructions.style.display = 'block';
        }
    }

    hideInstructions() {
        const instructions = document.getElementById('assignmentInstructions');
        if (instructions) {
            instructions.style.display = 'none';
        }
    }

    updateGradeButton() {
        const gradeBtn = document.getElementById('gradeBtn');
        if (gradeBtn) {
            gradeBtn.textContent = 'Grade';
            gradeBtn.onclick = () => this.nextStep();
            gradeBtn.style.backgroundColor = '#28a745';
        }
    }

    resetGradeButton() {
        const gradeBtn = document.getElementById('gradeBtn');
        if (gradeBtn) {
            gradeBtn.textContent = 'Grade';
            gradeBtn.onclick = () => this.startGrading();
            gradeBtn.style.backgroundColor = '#4CAF50';
            gradeBtn.style.display = 'inline-block'; // Make sure button is visible after reset
        }
    }

    continueGrading() {
        // Continue to next step (called by Next button)
        if (this.currentStep < this.steps.length) {
            this.nextStep();
        } else {
            this.handleAllStepsCompleted();
        }
    }

    showNextButton() {
        const button = document.getElementById('gradeBtn');
        if (button) {
            button.textContent = 'Next';
            button.onclick = () => this.continueGrading();
            button.style.display = 'inline-block'; // Make sure button is visible
        }
    }

    hideGradeButton() {
        const button = document.getElementById('gradeBtn');
        if (button) {
            button.style.display = 'none';
        }
    }


    hideStartGradingSection() {
        const section = document.getElementById('startGradingSection');
        if (section) {
            section.style.display = 'none';
        }
    }

    showStartGradingSection() {
        const section = document.getElementById('startGradingSection');
        if (section) {
            section.style.display = 'block';
        }
    }

    resetStepDisplay() {
        const stepDisplay = document.getElementById('stepDisplay');
        if (stepDisplay) {
            stepDisplay.innerHTML = '<p>Ready to grade your VLSI layout!</p>';
        }
    }

    closeAssignmentModal() {
        if (typeof closeAssignmentModal === 'function') {
            closeAssignmentModal();
        }
    }

    /**
     * Utility method to test circuit with specific input/output values
     * @param {string} inputProbe - The input probe label (e.g., 'A')
     * @param {number} inputValue - The input value (-1 for GND, 1 for VCC)
     * @param {string} outputProbe - The output probe label (e.g., 'Q')
     * @param {number} expectedOutput - The expected output value (-1 for GND, 1 for VCC)
     * @returns {boolean} - Whether the test passed
     */
    testCircuit(inputProbe, inputValue, outputProbe, expectedOutput) {
        console.log(`Testing circuit with ${inputProbe}=${inputValue === -1 ? 'GND' : 'VCC'}, expecting ${outputProbe}=${expectedOutput === -1 ? 'GND' : 'VCC'}`);
        
        if (typeof window.CircuitProbes === 'undefined') {
            console.error('CircuitProbes not available');
            return false;
        }

        // Set the input probe to the input value
        window.CircuitProbes.setProbeValue(inputProbe, inputValue);
        
        // Recompute the circuit
        window.CircuitProbes.recompute();
        console.log('Circuit recomputed');
        
        // Force a complete redraw to show voltage propagation
        if (typeof redrawAllTiles === 'function') {
            redrawAllTiles();
            console.log('Canvas redrawn to show voltages');
        }
        
        // Get the output value
        const outputValue = window.CircuitProbes.getProbeValue(outputProbe);
        console.log(`Probe ${outputProbe} voltage: ${outputValue} (should be ${expectedOutput === -1 ? 'GND' : 'VCC'})`);
        
        return outputValue === expectedOutput;
    }

    /**
     * Check if required probes are present
     * @param {Array<string>} requiredProbes - Array of required probe labels
     * @returns {boolean} - Whether all required probes are present
     */
    checkProbes(requiredProbes) {
        if (typeof window.CircuitProbes === 'undefined') {
            console.error('CircuitProbes not available');
            return false;
        }

        const probeLabels = window.CircuitProbes.getProbeLabels();
        
        for (const requiredProbe of requiredProbes) {
            if (!probeLabels.includes(requiredProbe)) {
                return false;
            }
        }
        
        // Check that we have exactly the required number of probes
        return probeLabels.length === requiredProbes.length;
    }
}

/**
 * NOT Gate Exercise Class
 * 
 * Implements the specific grading logic for a NOT gate exercise.
 * Tests that the circuit correctly implements a NOT gate with:
 * - Input A and output Q probes
 * - A=GND → Q=VCC
 * - A=VCC → Q=GND
 */
class NotGateExercise extends MISTICExercise {
    constructor() {
        const steps = [
            { name: "Check for A and Q probes", status: "pending" },
            { name: "Test A=GND → Q=VCC", status: "pending" },
            { name: "Test A=VCC → Q=GND", status: "pending" }
        ];
        
        const instructions = `
            <div id="instructionsContent" style="text-align: left;">
                <strong>Assignment:</strong> Design a VLSI NOT gate layout.<br><br>
                <button onclick="showReferenceImage('images/not.png')" style="background-color: #4CAF50; color: white; border: none; padding: 8px 15px; border-radius: 4px; cursor: pointer; margin-bottom: 15px;">View Reference Image</button><br><br>
                <strong>Instructions:</strong><br>
                1. Place a probe with the label "A" on the input to your NOT gate<br>
                2. Place a probe with the label "Q" on the output of your NOT gate<br>
                3. Design a VLSI NOT gate layout using polysilicon, diffusion regions, and metal layers<br>
                4. Do not place a VCC or GND on the trace that has the probe<br>
                5. If you place a VCC or GND for testing, place the probes on the same square as the test points so the test points are cleared<br>
                6. When ready, press "Grade" to check your circuit.
            </div>
            <div id="imageContent" style="display: none; text-align: center; position: relative; padding: 20px; box-sizing: border-box;">
                <button onclick="showInstructions()" style="position: absolute; top: 10px; right: 10px; background: transparent; color: #333; border: none; width: 30px; height: 30px; cursor: pointer; font-size: 24px; line-height: 1; font-weight: bold; padding: 0; z-index: 10;">×</button>
                <img src="images/not.png" alt="A VLSI NOT gate layout showing the transistor structure" style="max-width: 100%; max-height: 350px; width: auto; height: auto; object-fit: contain; display: block; margin: 0 auto;">
            </div>
        `;
        
        super(
            "NOT Gate Exercise",
            "Design and test a NOT gate circuit with input A and output Q",
            steps,
            instructions
        );
    }

    /**
     * Execute a specific step for the NOT gate exercise
     * @param {number} stepIndex - The index of the step to execute
     * @returns {Object} - {success: boolean, error?: string}
     */
    executeStep(stepIndex) {
        switch (stepIndex) {
            case 0:
                // Step 1: Check for A and Q probes
                if (this.checkProbes(['A', 'Q'])) {
                    return { success: true };
                } else {
                    return { 
                        success: false, 
                        error: 'You need exactly one probe labeled "A" and one probe labeled "Q".' 
                    };
                }
                
            case 1:
                // Step 2: Test A=GND → Q=VCC
                if (this.testCircuit('A', -1, 'Q', 1)) {
                    return { success: true };
                } else {
                    return { 
                        success: false, 
                        error: 'When A=GND, the output should be VCC. Check your NOT gate implementation.' 
                    };
                }
                
            case 2:
                // Step 3: Test A=VCC → Q=GND
                if (this.testCircuit('A', 1, 'Q', -1)) {
                    return { success: true };
                } else {
                    return { 
                        success: false, 
                        error: 'When A=VCC, the output should be GND. Check your NOT gate implementation.' 
                    };
                }
                
            default:
                return { success: false, error: 'Unknown step' };
        }
    }
}

/**
 * NAND Gate Exercise Class
 * 
 * Implements the specific grading logic for a NAND gate exercise.
 * This is a placeholder for future implementation.
 */
class NandGateExercise extends MISTICExercise {
    constructor() {
        const steps = [
            { name: "Check for A, B and Q probes", status: "pending" },
            { name: "Test A=GND, B=GND → Q=VCC", status: "pending" },
            { name: "Test A=GND, B=VCC → Q=VCC", status: "pending" },
            { name: "Test A=VCC, B=GND → Q=VCC", status: "pending" },
            { name: "Test A=VCC, B=VCC → Q=GND", status: "pending" }
        ];
        
        const instructions = `
            <div id="instructionsContent" style="text-align: left;">
                <strong>Assignment:</strong> Design a VLSI NAND gate layout.<br><br>
                <button onclick="showReferenceImage('images/nand.png')" style="background-color: #4CAF50; color: white; border: none; padding: 8px 15px; border-radius: 4px; cursor: pointer; margin-bottom: 15px; margin-right: 10px;">View Reference Image</button>
                <button onclick="showTruthTable()" style="background-color: #2196F3; color: white; border: none; padding: 8px 15px; border-radius: 4px; cursor: pointer; margin-bottom: 15px;">View Truth Table</button><br><br>
                <strong>Instructions:</strong><br>
                1. Place probes with the labels "A" and "B" on the inputs to your NAND gate<br>
                2. Place a probe with the label "Q" on the output of your NAND gate<br>
                3. Design a VLSI NAND gate layout using polysilicon, diffusion regions, and metal layers<br>
                4. Do not place a VCC or GND on the trace that has the probe<br>
                5. If you place a VCC or GND for testing, place the probes on the same square as the test points so the test points are cleared<br>
                6. When ready, press "Grade" to check your circuit.
            </div>
            <div id="imageContent" style="display: none; text-align: center; position: relative; padding: 20px; box-sizing: border-box;">
                <button onclick="showInstructions()" style="position: absolute; top: 10px; right: 10px; background: transparent; color: #333; border: none; width: 30px; height: 30px; cursor: pointer; font-size: 24px; line-height: 1; font-weight: bold; padding: 0; z-index: 10;">×</button>
                <img src="images/nand.png" alt="A VLSI NAND gate layout showing the transistor structure" style="max-width: 100%; max-height: 350px; width: auto; height: auto; object-fit: contain; display: block; margin: 0 auto;">
            </div>
            <div id="truthTableContent" style="display: none; position: relative; padding: 20px; box-sizing: border-box;">
                <button onclick="showInstructions()" style="position: absolute; top: 10px; right: 10px; background: transparent; color: #333; border: none; width: 30px; height: 30px; cursor: pointer; font-size: 24px; line-height: 1; font-weight: bold; padding: 0; z-index: 10;">×</button>
                <h3 style="margin-top: 0;">NAND Gate Truth Table</h3>
                <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
                    <thead>
                        <tr style="background-color: #f0f0f0;">
                            <th style="border: 1px solid #ddd; padding: 10px; text-align: center;">A</th>
                            <th style="border: 1px solid #ddd; padding: 10px; text-align: center;">B</th>
                            <th style="border: 1px solid #ddd; padding: 10px; text-align: center;">Q (Output)</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td style="border: 1px solid #ddd; padding: 10px; text-align: center;">0 (GND)</td>
                            <td style="border: 1px solid #ddd; padding: 10px; text-align: center;">0 (GND)</td>
                            <td style="border: 1px solid #ddd; padding: 10px; text-align: center; background-color: #d4edda;">1 (VCC)</td>
                        </tr>
                        <tr>
                            <td style="border: 1px solid #ddd; padding: 10px; text-align: center;">0 (GND)</td>
                            <td style="border: 1px solid #ddd; padding: 10px; text-align: center;">1 (VCC)</td>
                            <td style="border: 1px solid #ddd; padding: 10px; text-align: center; background-color: #d4edda;">1 (VCC)</td>
                        </tr>
                        <tr>
                            <td style="border: 1px solid #ddd; padding: 10px; text-align: center;">1 (VCC)</td>
                            <td style="border: 1px solid #ddd; padding: 10px; text-align: center;">0 (GND)</td>
                            <td style="border: 1px solid #ddd; padding: 10px; text-align: center; background-color: #d4edda;">1 (VCC)</td>
                        </tr>
                        <tr>
                            <td style="border: 1px solid #ddd; padding: 10px; text-align: center;">1 (VCC)</td>
                            <td style="border: 1px solid #ddd; padding: 10px; text-align: center;">1 (VCC)</td>
                            <td style="border: 1px solid #ddd; padding: 10px; text-align: center; background-color: #f8d7da;">0 (GND)</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        `;
        
        super(
            "NAND Gate Exercise",
            "Design and test a NAND gate circuit with inputs A, B and output Q",
            steps,
            instructions
        );
    }

    /**
     * Execute a specific step for the NAND gate exercise
     * @param {number} stepIndex - The index of the step to execute
     * @returns {Object} - {success: boolean, error?: string}
     */
    executeStep(stepIndex) {
        // TODO: Implement NAND gate testing logic
        switch (stepIndex) {
            case 0:
                // Step 1: Check for A, B and Q probes
                if (this.checkProbes(['A', 'B', 'Q'])) {
                    return { success: true };
                } else {
                    return { 
                        success: false, 
                        error: 'You need exactly one probe labeled "A", one labeled "B", and one labeled "Q".' 
                    };
                }
                
            case 1:
                // Step 2: Test A=GND, B=GND → Q=VCC
                return this.testNandGate(-1, -1, 1, 'A=GND, B=GND → Q=VCC');
                
            case 2:
                // Step 3: Test A=GND, B=VCC → Q=VCC
                return this.testNandGate(-1, 1, 1, 'A=GND, B=VCC → Q=VCC');
                
            case 3:
                // Step 4: Test A=VCC, B=GND → Q=VCC
                return this.testNandGate(1, -1, 1, 'A=VCC, B=GND → Q=VCC');
                
            case 4:
                // Step 5: Test A=VCC, B=VCC → Q=GND
                return this.testNandGate(1, 1, -1, 'A=VCC, B=VCC → Q=GND');
                
            default:
                return { success: false, error: 'Unknown step' };
        }
    }

    /**
     * Test NAND gate with specific input values
     * @param {number} inputA - Input A value (-1 for GND, 1 for VCC)
     * @param {number} inputB - Input B value (-1 for GND, 1 for VCC)
     * @param {number} expectedOutput - Expected output value (-1 for GND, 1 for VCC)
     * @param {string} testDescription - Description of the test for error messages
     * @returns {Object} - {success: boolean, error?: string}
     */
    testNandGate(inputA, inputB, expectedOutput, testDescription) {
        console.log(`Testing NAND gate: ${testDescription}`);
        
        if (typeof window.CircuitProbes === 'undefined') {
            return { success: false, error: 'CircuitProbes not available' };
        }

        // Set both input probes
        window.CircuitProbes.setProbeValue('A', inputA);
        window.CircuitProbes.setProbeValue('B', inputB);
        
        // Recompute the circuit
        window.CircuitProbes.recompute();
        
        // Force a complete redraw to show voltage propagation
        if (typeof redrawAllTiles === 'function') {
            redrawAllTiles();
        }
        
        // Get the output value
        const outputValue = window.CircuitProbes.getProbeValue('Q');
        console.log(`NAND gate test result: ${testDescription} - Output: ${outputValue}, Expected: ${expectedOutput}`);
        
        if (outputValue === expectedOutput) {
            return { success: true };
        } else {
            return { 
                success: false, 
                error: `When ${testDescription}, the output should be ${expectedOutput === -1 ? 'GND' : 'VCC'}. Check your NAND gate implementation.` 
            };
        }
    }
}

/**
 * NOR Gate Exercise Class
 * 
 * Implements the specific grading logic for a NOR gate exercise.
 * Tests that the circuit correctly implements a NOR gate with:
 * - Input probes A, B and output probe Q
 * - A=GND, B=GND → Q=VCC
 * - A=GND, B=VCC → Q=GND
 * - A=VCC, B=GND → Q=GND
 * - A=VCC, B=VCC → Q=GND
 */
class NorGateExercise extends MISTICExercise {
    constructor() {
        const steps = [
            { name: "Check for A, B and Q probes", status: "pending" },
            { name: "Test A=GND, B=GND → Q=VCC", status: "pending" },
            { name: "Test A=GND, B=VCC → Q=GND", status: "pending" },
            { name: "Test A=VCC, B=GND → Q=GND", status: "pending" },
            { name: "Test A=VCC, B=VCC → Q=GND", status: "pending" }
        ];
        
        const instructions = `
            <div id="instructionsContent" style="text-align: left;">
                <strong>Assignment:</strong> Design a VLSI NOR gate layout.<br><br>
                <button onclick="showReferenceImage('images/nor.png')" style="background-color: #4CAF50; color: white; border: none; padding: 8px 15px; border-radius: 4px; cursor: pointer; margin-bottom: 15px; margin-right: 10px;">View Reference Image</button>
                <button onclick="showTruthTable()" style="background-color: #2196F3; color: white; border: none; padding: 8px 15px; border-radius: 4px; cursor: pointer; margin-bottom: 15px;">View Truth Table</button><br><br>
                <strong>Instructions:</strong><br>
                1. Place probes with the labels "A" and "B" on the inputs to your NOR gate<br>
                2. Place a probe with the label "Q" on the output of your NOR gate<br>
                3. Design a VLSI NOR gate layout using polysilicon, diffusion regions, and metal layers<br>
                4. Do not place a VCC or GND on the trace that has the probe<br>
                5. If you place a VCC or GND for testing, place the probes on the same square as the test points so the test points are cleared<br>
                6. When ready, press "Grade" to check your circuit.
            </div>
            <div id="imageContent" style="display: none; text-align: center; position: relative; padding: 20px; box-sizing: border-box;">
                <button onclick="showInstructions()" style="position: absolute; top: 10px; right: 10px; background: transparent; color: #333; border: none; width: 30px; height: 30px; cursor: pointer; font-size: 24px; line-height: 1; font-weight: bold; padding: 0; z-index: 10;">×</button>
                <img src="images/nor.png" alt="A VLSI NOR gate layout showing the transistor structure" style="max-width: 100%; max-height: 350px; width: auto; height: auto; object-fit: contain; display: block; margin: 0 auto;">
            </div>
            <div id="truthTableContent" style="display: none; position: relative; padding: 20px; box-sizing: border-box;">
                <button onclick="showInstructions()" style="position: absolute; top: 10px; right: 10px; background: transparent; color: #333; border: none; width: 30px; height: 30px; cursor: pointer; font-size: 24px; line-height: 1; font-weight: bold; padding: 0; z-index: 10;">×</button>
                <h3 style="margin-top: 0;">NOR Gate Truth Table</h3>
                <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
                    <thead>
                        <tr style="background-color: #f0f0f0;">
                            <th style="border: 1px solid #ddd; padding: 10px; text-align: center;">A</th>
                            <th style="border: 1px solid #ddd; padding: 10px; text-align: center;">B</th>
                            <th style="border: 1px solid #ddd; padding: 10px; text-align: center;">Q (Output)</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td style="border: 1px solid #ddd; padding: 10px; text-align: center;">0 (GND)</td>
                            <td style="border: 1px solid #ddd; padding: 10px; text-align: center;">0 (GND)</td>
                            <td style="border: 1px solid #ddd; padding: 10px; text-align: center; background-color: #d4edda;">1 (VCC)</td>
                        </tr>
                        <tr>
                            <td style="border: 1px solid #ddd; padding: 10px; text-align: center;">0 (GND)</td>
                            <td style="border: 1px solid #ddd; padding: 10px; text-align: center;">1 (VCC)</td>
                            <td style="border: 1px solid #ddd; padding: 10px; text-align: center; background-color: #f8d7da;">0 (GND)</td>
                        </tr>
                        <tr>
                            <td style="border: 1px solid #ddd; padding: 10px; text-align: center;">1 (VCC)</td>
                            <td style="border: 1px solid #ddd; padding: 10px; text-align: center;">0 (GND)</td>
                            <td style="border: 1px solid #ddd; padding: 10px; text-align: center; background-color: #f8d7da;">0 (GND)</td>
                        </tr>
                        <tr>
                            <td style="border: 1px solid #ddd; padding: 10px; text-align: center;">1 (VCC)</td>
                            <td style="border: 1px solid #ddd; padding: 10px; text-align: center;">1 (VCC)</td>
                            <td style="border: 1px solid #ddd; padding: 10px; text-align: center; background-color: #f8d7da;">0 (GND)</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        `;
        
        super(
            "NOR Gate Exercise",
            "Design and test a NOR gate circuit with inputs A, B and output Q",
            steps,
            instructions
        );
    }

    /**
     * Execute a specific step for the NOR gate exercise
     * @param {number} stepIndex - The index of the step to execute
     * @returns {Object} - {success: boolean, error?: string}
     */
    executeStep(stepIndex) {
        switch (stepIndex) {
            case 0:
                // Step 1: Check for A, B and Q probes
                if (this.checkProbes(['A', 'B', 'Q'])) {
                    return { success: true };
                } else {
                    return { 
                        success: false, 
                        error: 'You need exactly one probe labeled "A", one labeled "B", and one labeled "Q".' 
                    };
                }
                
            case 1:
                // Step 2: Test A=GND, B=GND → Q=VCC
                return this.testNorGate(-1, -1, 1, 'A=GND, B=GND → Q=VCC');
                
            case 2:
                // Step 3: Test A=GND, B=VCC → Q=GND
                return this.testNorGate(-1, 1, -1, 'A=GND, B=VCC → Q=GND');
                
            case 3:
                // Step 4: Test A=VCC, B=GND → Q=GND
                return this.testNorGate(1, -1, -1, 'A=VCC, B=GND → Q=GND');
                
            case 4:
                // Step 5: Test A=VCC, B=VCC → Q=GND
                return this.testNorGate(1, 1, -1, 'A=VCC, B=VCC → Q=GND');
                
            default:
                return { success: false, error: 'Unknown step' };
        }
    }

    /**
     * Test NOR gate with specific input values
     * @param {number} inputA - Input A value (-1 for GND, 1 for VCC)
     * @param {number} inputB - Input B value (-1 for GND, 1 for VCC)
     * @param {number} expectedOutput - Expected output value (-1 for GND, 1 for VCC)
     * @param {string} testDescription - Description of the test for error messages
     * @returns {Object} - {success: boolean, error?: string}
     */
    testNorGate(inputA, inputB, expectedOutput, testDescription) {
        console.log(`Testing NOR gate: ${testDescription}`);
        
        if (typeof window.CircuitProbes === 'undefined') {
            return { success: false, error: 'CircuitProbes not available' };
        }

        // Set both input probes
        window.CircuitProbes.setProbeValue('A', inputA);
        window.CircuitProbes.setProbeValue('B', inputB);
        
        // Recompute the circuit
        window.CircuitProbes.recompute();
        
        // Force a complete redraw to show voltage propagation
        if (typeof redrawAllTiles === 'function') {
            redrawAllTiles();
        }
        
        // Get the output value
        const outputValue = window.CircuitProbes.getProbeValue('Q');
        console.log(`NOR gate test result: ${testDescription} - Output: ${outputValue}, Expected: ${expectedOutput}`);
        
        if (outputValue === expectedOutput) {
            return { success: true };
        } else {
            return { 
                success: false, 
                error: `When ${testDescription}, the output should be ${expectedOutput === -1 ? 'GND' : 'VCC'}. Check your NOR gate implementation.` 
            };
        }
    }
}

/**
 * Exercise Factory
 * 
 * Creates exercise instances based on exercise type
 */
class ExerciseFactory {
    static createExercise(exerciseType) {
        switch (exerciseType.toLowerCase()) {
            case 'not':
            case 'notgate':
                return new NotGateExercise();
            case 'nand':
            case 'nandgate':
                return new NandGateExercise();
            case 'nor':
            case 'norgate':
                return new NorGateExercise();
            default:
                throw new Error(`Unknown exercise type: ${exerciseType}`);
        }
    }
}

// Export classes for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Exercise, NotGateExercise, NandGateExercise, NorGateExercise, ExerciseFactory };
}
