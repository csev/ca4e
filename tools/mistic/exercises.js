/**
 * Exercise Classes for MISTIC VLSI Tool
 * 
 * This file contains the base Exercise class and specific exercise implementations
 * for grading VLSI circuit designs in the MISTIC tool.
 */

/**
 * Base Exercise Class
 * 
 * Provides common functionality for all VLSI exercises including:
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
        this.resetStepText();
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
        const stepText = document.getElementById('stepText');
        
        try {
            const result = this.executeStep(this.currentStep);
            
            if (result.success) {
                stepText.innerHTML = `<span style="color: green;">✓ ${step.name}</span>`;
                step.status = "passed";
                this.currentStep++;
                this.showNextButton();
            } else {
                stepText.innerHTML = `<span style="color: red;">✗ ${step.name}</span><br>
                    <small>Error: ${result.error}</small>`;
                step.status = "failed";
            }
        } catch (error) {
            console.error('Error executing step:', error);
            stepText.innerHTML = `<span style="color: red;">✗ ${step.name}</span><br>
                <small>Error: ${error.message}</small>`;
            step.status = "failed";
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
        const stepText = document.getElementById('stepText');
        stepText.innerHTML = '<span style="color: green;">✓ All tests passed! Submitting grade...</span>';
        
        // Submit grade to LMS if this is an LTI session
        if (typeof this.submitGradeToLMS === 'function') {
            this.submitGradeToLMS(1.0); // Perfect score for completing all steps
        }
        
        // Reset all probes to zero voltage after successful grade
        this.resetAllProbesToZero();
        // Close the assignment dialog
        this.closeAssignmentModal();
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
        if (typeof window.CircuitProbes !== 'undefined') {
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
            gradeBtn.textContent = 'Reset';
            gradeBtn.onclick = () => this.resetGrading();
            gradeBtn.style.backgroundColor = '#FF9800';
        }
    }

    resetGradeButton() {
        const gradeBtn = document.getElementById('gradeBtn');
        if (gradeBtn) {
            gradeBtn.textContent = 'Grade';
            gradeBtn.onclick = () => this.startGrading();
            gradeBtn.style.backgroundColor = '#4CAF50';
        }
    }

    showNextButton() {
        const nextBtn = document.getElementById('nextBtn');
        if (nextBtn) {
            nextBtn.style.display = 'inline-block';
        }
    }

    resetStepText() {
        const stepText = document.getElementById('stepText');
        if (stepText) {
            stepText.innerHTML = 'Ready to grade your circuit!';
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
class NotGateExercise extends Exercise {
    constructor() {
        const steps = [
            { name: "Check for A and Q probes", status: "pending" },
            { name: "Test A=GND → Q=VCC", status: "pending" },
            { name: "Test A=VCC → Q=GND", status: "pending" }
        ];
        
        const instructions = `In this assignment you will lay out a NOT gate. 
            Place a probe with the label "A" on the input to your NOT gate. Place a probe with the label 
            "Q" on the output of your NOT gate.
            Do not place a VCC or GND on the trace that has the probe.
            If you place a VCC or GND for testing place the probes on the same 
            square as the test points so the test points are cleared. Then press "Grade" to check your circuit.`;
        
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
class NandGateExercise extends Exercise {
    constructor() {
        const steps = [
            { name: "Check for A, B and Q probes", status: "pending" },
            { name: "Test A=GND, B=GND → Q=VCC", status: "pending" },
            { name: "Test A=GND, B=VCC → Q=VCC", status: "pending" },
            { name: "Test A=VCC, B=GND → Q=VCC", status: "pending" },
            { name: "Test A=VCC, B=VCC → Q=GND", status: "pending" }
        ];
        
        const instructions = `In this assignment you will lay out a NAND gate. 
            Place probes with the labels "A" and "B" on the inputs to your NAND gate. Place a probe with the label 
            "Q" on the output of your NAND gate.
            Do not place a VCC or GND on the trace that has the probe.
            If you place a VCC or GND for testing place the probes on the same 
            square as the test points so the test points are cleared. Then press "Grade" to check your circuit.`;
        
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
class NorGateExercise extends Exercise {
    constructor() {
        const steps = [
            { name: "Check for A, B and Q probes", status: "pending" },
            { name: "Test A=GND, B=GND → Q=VCC", status: "pending" },
            { name: "Test A=GND, B=VCC → Q=GND", status: "pending" },
            { name: "Test A=VCC, B=GND → Q=GND", status: "pending" },
            { name: "Test A=VCC, B=VCC → Q=GND", status: "pending" }
        ];
        
        const instructions = `In this assignment you will lay out a NOR gate. 
            Place probes with the labels "A" and "B" on the inputs to your NOR gate. Place a probe with the label 
            "Q" on the output of your NOR gate.
            Do not place a VCC or GND on the trace that has the probe.
            If you place a VCC or GND for testing place the probes on the same 
            square as the test points so the test points are cleared. Then press "Grade" to check your circuit.`;
        
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
