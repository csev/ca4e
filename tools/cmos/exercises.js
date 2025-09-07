/**
 * Exercise Classes for CMOS Circuit Tool
 * 
 * This file contains the base Exercise class and specific exercise implementations
 * for grading CMOS circuit designs in the CMOS tool.
 */

/**
 * Base Exercise Class
 * 
 * Provides common functionality for all CMOS exercises including:
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
        
        // Reset all switches to neutral after successful grade
        this.resetAllSwitches();
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
     * Reset all switches to neutral state
     */
    resetAllSwitches() {
        // Reset all switches to neutral state
        if (typeof window.circuitEditor !== 'undefined') {
            // Get all switch labels and reset them
            const switchLabels = window.circuitEditor.getAllSwitchLabels();
            switchLabels.forEach(label => {
                window.circuitEditor.setSwitchNeutral(label);
            });
        }
        
        console.log('All switches reset to neutral state');
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
     * @param {string} inputSwitch - The input switch label (e.g., 'A')
     * @param {string} inputState - The input state ('high' or 'low')
     * @param {string} outputProbe - The output probe label (e.g., 'Q')
     * @param {number} expectedVoltage - The expected output voltage (5 for high, 0 for low)
     * @returns {boolean} - Whether the test passed
     */
    testCircuit(inputSwitch, inputState, outputProbe, expectedVoltage) {
        console.log(`Testing circuit with ${inputSwitch}=${inputState}, expecting ${outputProbe}=${expectedVoltage}V`);
        
        if (typeof window.circuitEditor === 'undefined') {
            console.error('Circuit editor not available');
            return false;
        }

        // Set the input switch to the specified state
        if (inputState === 'high') {
            window.circuitEditor.setSwitchHigh(inputSwitch);
        } else if (inputState === 'low') {
            window.circuitEditor.setSwitchLow(inputSwitch);
        } else {
            console.error('Invalid input state:', inputState);
            return false;
        }
        
        console.log(`Set switch ${inputSwitch} to ${inputState}`);
        
        // Get the output voltage
        const outputVoltage = window.circuitEditor.getProbeVoltageByLabel(outputProbe);
        console.log(`Probe ${outputProbe} voltage: ${outputVoltage}V (should be ${expectedVoltage}V)`);
        
        // Allow for small voltage tolerance (within 0.5V)
        const tolerance = 0.5;
        const voltageMatch = Math.abs(outputVoltage - expectedVoltage) <= tolerance;
        
        return voltageMatch;
    }

    /**
     * Check if required probes and switches are present
     * @param {Array<string>} requiredProbes - Array of required probe labels
     * @param {Array<string>} requiredSwitches - Array of required switch labels
     * @returns {boolean} - Whether all required components are present
     */
    checkComponents(requiredProbes, requiredSwitches = []) {
        if (typeof window.circuitEditor === 'undefined') {
            console.error('Circuit editor not available');
            return false;
        }

        const probeLabels = window.circuitEditor.getAllProbeLabels();
        const switchLabels = window.circuitEditor.getAllSwitchLabels();
        
        // Check probes
        for (const requiredProbe of requiredProbes) {
            if (!probeLabels.includes(requiredProbe)) {
                return false;
            }
        }
        
        // Check switches
        for (const requiredSwitch of requiredSwitches) {
            if (!switchLabels.includes(requiredSwitch)) {
                return false;
            }
        }
        
        // Check that we have exactly the required number of probes
        const probeCountMatch = probeLabels.length === requiredProbes.length;
        const switchCountMatch = switchLabels.length === requiredSwitches.length;
        
        return probeCountMatch && switchCountMatch;
    }
}

/**
 * CMOS NOT Gate Exercise Class
 * 
 * Implements the specific grading logic for a CMOS NOT gate exercise.
 * Tests that the circuit correctly implements a NOT gate with:
 * - Input switch A and output probe Q
 * - A=low → Q=high (5V)
 * - A=high → Q=low (0V)
 */
class CmosNotGateExercise extends Exercise {
    constructor() {
        const steps = [
            { name: "Check for input switch A and output probe Q", status: "pending" },
            { name: "Test A=low → Q=high (5V)", status: "pending" },
            { name: "Test A=high → Q=low (0V)", status: "pending" }
        ];
        
        const instructions = `
            <strong>Assignment:</strong> Design a CMOS NOT gate circuit.<br><br>
            <strong>Instructions:</strong><br>
            1. Add a switch component and label it "A" (this will be your input)<br>
            2. Add a probe component and label it "Q" (this will be your output)<br>
            3. Design a CMOS NOT gate using NMOS and PMOS transistors<br>
            4. Connect the components properly<br>
            5. Test your circuit by setting the switch to high and low states<br>
            6. When ready, press "Grade" to check your circuit.
        `;
        
        super(
            "CMOS NOT Gate Exercise",
            "Design and test a CMOS NOT gate circuit with input switch A and output probe Q",
            steps,
            instructions
        );
    }

    /**
     * Execute a specific step for the CMOS NOT gate exercise
     * @param {number} stepIndex - The index of the step to execute
     * @returns {Object} - {success: boolean, error?: string}
     */
    executeStep(stepIndex) {
        switch (stepIndex) {
            case 0:
                // Step 1: Check for A switch and Q probe
                if (this.checkComponents(['Q'], ['A'])) {
                    return { success: true };
                } else {
                    return { 
                        success: false, 
                        error: 'You need exactly one switch labeled "A" and one probe labeled "Q".' 
                    };
                }
                
            case 1:
                // Step 2: Test A=low → Q=high (5V)
                if (this.testCircuit('A', 'low', 'Q', 5)) {
                    return { success: true };
                } else {
                    return { 
                        success: false, 
                        error: 'When A=low, the output should be high (5V). Check your CMOS NOT gate implementation.' 
                    };
                }
                
            case 2:
                // Step 3: Test A=high → Q=low (0V)
                if (this.testCircuit('A', 'high', 'Q', 0)) {
                    return { success: true };
                } else {
                    return { 
                        success: false, 
                        error: 'When A=high, the output should be low (0V). Check your CMOS NOT gate implementation.' 
                    };
                }
                
            default:
                return { success: false, error: 'Unknown step' };
        }
    }
}

/**
 * CMOS NOR Gate Exercise Class
 * 
 * Implements the specific grading logic for a CMOS NOR gate exercise.
 * Tests that the circuit correctly implements a NOR gate with:
 * - Input switches A, B and output probe Q
 * - A=low, B=low → Q=high (5V)
 * - A=low, B=high → Q=low (0V)
 * - A=high, B=low → Q=low (0V)
 * - A=high, B=high → Q=low (0V)
 */
class CmosNorGateExercise extends Exercise {
    constructor() {
        const steps = [
            { name: "Check for input switches A, B and output probe Q", status: "pending" },
            { name: "Test A=low, B=low → Q=high (5V)", status: "pending" },
            { name: "Test A=low, B=high → Q=low (0V)", status: "pending" },
            { name: "Test A=high, B=low → Q=low (0V)", status: "pending" },
            { name: "Test A=high, B=high → Q=low (0V)", status: "pending" }
        ];
        
        const instructions = `
            <strong>Assignment:</strong> Design a CMOS NOR gate circuit.<br><br>
            <strong>Instructions:</strong><br>
            1. Add two switch components and label them "A" and "B" (these will be your inputs)<br>
            2. Add a probe component and label it "Q" (this will be your output)<br>
            3. Design a CMOS NOR gate using NMOS and PMOS transistors<br>
            4. Connect the components properly (PMOS in series, NMOS in parallel)<br>
            5. Test your circuit by setting the switches to different combinations<br>
            6. When ready, press "Grade" to check your circuit.
        `;
        
        super(
            "CMOS NOR Gate Exercise",
            "Design and test a CMOS NOR gate circuit with input switches A, B and output probe Q",
            steps,
            instructions
        );
    }

    /**
     * Execute a specific step for the CMOS NOR gate exercise
     * @param {number} stepIndex - The index of the step to execute
     * @returns {Object} - {success: boolean, error?: string}
     */
    executeStep(stepIndex) {
        switch (stepIndex) {
            case 0:
                // Step 1: Check for A, B switches and Q probe
                if (this.checkComponents(['Q'], ['A', 'B'])) {
                    return { success: true };
                } else {
                    return { 
                        success: false, 
                        error: 'You need exactly two switches labeled "A" and "B", and one probe labeled "Q".' 
                    };
                }
                
            case 1:
                // Step 2: Test A=low, B=low → Q=high (5V)
                return this.testCmosNorGate('low', 'low', 5, 'A=low, B=low → Q=high (5V)');
                
            case 2:
                // Step 3: Test A=low, B=high → Q=low (0V)
                return this.testCmosNorGate('low', 'high', 0, 'A=low, B=high → Q=low (0V)');
                
            case 3:
                // Step 4: Test A=high, B=low → Q=low (0V)
                return this.testCmosNorGate('high', 'low', 0, 'A=high, B=low → Q=low (0V)');
                
            case 4:
                // Step 5: Test A=high, B=high → Q=low (0V)
                return this.testCmosNorGate('high', 'high', 0, 'A=high, B=high → Q=low (0V)');
                
            default:
                return { success: false, error: 'Unknown step' };
        }
    }

    /**
     * Test CMOS NOR gate with specific input values
     * @param {string} inputA - Input A state ('high' or 'low')
     * @param {string} inputB - Input B state ('high' or 'low')
     * @param {number} expectedVoltage - Expected output voltage (5 for high, 0 for low)
     * @param {string} testDescription - Description of the test for error messages
     * @returns {Object} - {success: boolean, error?: string}
     */
    testCmosNorGate(inputA, inputB, expectedVoltage, testDescription) {
        console.log(`Testing CMOS NOR gate: ${testDescription}`);
        
        if (typeof window.circuitEditor === 'undefined') {
            return { success: false, error: 'Circuit editor not available' };
        }

        // Set both input switches
        if (inputA === 'high') {
            window.circuitEditor.setSwitchHigh('A');
        } else {
            window.circuitEditor.setSwitchLow('A');
        }
        
        if (inputB === 'high') {
            window.circuitEditor.setSwitchHigh('B');
        } else {
            window.circuitEditor.setSwitchLow('B');
        }
        
        // Get the output voltage
        const outputVoltage = window.circuitEditor.getProbeVoltageByLabel('Q');
        console.log(`CMOS NOR gate test result: ${testDescription} - Output: ${outputVoltage}V, Expected: ${expectedVoltage}V`);
        
        // Allow for small voltage tolerance (within 0.5V)
        const tolerance = 0.5;
        const voltageMatch = Math.abs(outputVoltage - expectedVoltage) <= tolerance;
        
        if (voltageMatch) {
            return { success: true };
        } else {
            return { 
                success: false, 
                error: `When ${testDescription}, the output should be ${expectedVoltage}V. Check your CMOS NOR gate implementation.` 
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
            case 'cmosnot':
                return new CmosNotGateExercise();
            case 'nor':
            case 'norgate':
            case 'cmosnor':
                return new CmosNorGateExercise();
            default:
                throw new Error(`Unknown exercise type: ${exerciseType}`);
        }
    }
}

// Export classes for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Exercise, CmosNotGateExercise, CmosNorGateExercise, ExerciseFactory };
}
