<?php

require_once "../config.php";
require_once "assignments.php";

use \Tsugi\Core\LTIX;
use \Tsugi\Core\Settings;

// Initialize LTI if we received a launch.  If this was a non-LTI GET,
// then $USER will be null (i.e. anonymous)
$LTI = LTIX::session_start();

$_SESSION['GSRF'] = 10;

// See if we have an assignment configured, if not check for a custom variable
$assn = Settings::linkGetCustom('exercise');

// Make sure it is a valid assignment
if ( $assn && ! isset($assignments[$assn]) ) $assn = null;
?><!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CDC8512 Emulator Integration</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 10px;
            background-color: #f5f5f5;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
        }
        
        .controls {
            background: white;
            padding: 12px;
            border-radius: 6px;
            margin-bottom: 15px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .top-nav {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 10px;
            padding-bottom: 8px;
            border-bottom: 1px solid #dee2e6;
        }
        
        .nav-left {
            display: flex;
            align-items: center;
        }
        
        .nav-right {
            display: flex;
            align-items: center;
            gap: 4px;
        }
        
        .control-group {
            margin-bottom: 10px;
        }
        
        button {
            background-color: #007bff;
            color: white;
            border: none;
            padding: 6px 10px;
            border-radius: 4px;
            cursor: pointer;
            margin-right: 6px;
            margin-bottom: 3px;
            font-size: 14px;
        }
        
        button:hover {
            background-color: #0056b3;
        }
        
        button:disabled {
            background-color: #6c757d;
            cursor: not-allowed;
        }

        .assignment-btn {
            background-color: #fff0e6 !important;
            color: #333 !important;
            border: 1px solid #ddd !important;
        }

        .assignment-btn:hover {
            background-color: #ffe4cc !important;
            color: #333 !important;
        }

        .instructor-button {
            background-color: #28a745;
            color: white;
            text-decoration: none;
            padding: 8px 12px;
            border-radius: 4px;
            border: none;
            cursor: pointer;
            font-size: 14px;
            display: inline-block;
            transition: all 0.2s ease;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .instructor-button:hover {
            background-color: #218838;
            transform: translateY(-1px);
            box-shadow: 0 4px 8px rgba(0,0,0,0.15);
            text-decoration: none;
            color: white;
        }

        .instructor-button:active {
            transform: translateY(1px);
            box-shadow: 0 1px 2px rgba(0,0,0,0.1);
        }

        .instructor-button:visited {
            color: white;
        }

        /* Assignment Modal Styles */
        .assignment-modal {
            position: fixed;
            background: white;
            border: 2px solid #007bff;
            border-radius: 8px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
            z-index: 1000;
            width: 500px;
            max-width: 90vw;
            max-height: 80vh;
            overflow-y: auto;
        }

        .assignment-modal.hidden {
            display: none;
        }

        .modal-header {
            background: #007bff;
            color: white;
            padding: 12px 16px;
            border-radius: 6px 6px 0 0;
            cursor: grab;
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-weight: bold;
        }

        .modal-header:active {
            cursor: grabbing;
        }

        .close-btn {
            background: none;
            border: none;
            color: white;
            font-size: 20px;
            cursor: pointer;
            padding: 0;
            width: 24px;
            height: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .close-btn:hover {
            background: rgba(255,255,255,0.2);
            border-radius: 50%;
        }

        .modal-content {
            padding: 20px;
        }

        .modal-content h3 {
            margin-top: 0;
            color: #007bff;
        }

        .modal-content h4 {
            color: #333;
            margin-top: 15px;
            margin-bottom: 8px;
        }

        .modal-content ul {
            margin: 8px 0;
            padding-left: 20px;
        }

        .modal-content li {
            margin: 4px 0;
        }

        .modal-content pre {
            background: #f8f9fa;
            border: 1px solid #dee2e6;
            border-radius: 4px;
            padding: 12px;
            font-family: 'Courier New', monospace;
            font-size: 14px;
            overflow-x: auto;
        }

        #gradeBtn {
            background-color: #28a745;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
            margin-top: 10px;
        }

        #gradeBtn:hover {
            background-color: #218838;
        }

        #stepDisplay {
            margin: 15px 0;
            padding: 10px;
            border-radius: 4px;
            background: #f8f9fa;
        }

        #stepDisplay .success {
            color: #28a745;
            font-weight: bold;
        }

        #stepDisplay .error {
            color: #dc3545;
            font-weight: bold;
        }
        
        .spinner-gear {
            display: inline-block;
            animation: spin 2s linear infinite;
            font-size: 20px;
        }
        
        @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }
        
        .running {
            background-color: #dc3545 !important;
        }
        
                .running::after {
            content: '';
            display: inline-block;
            width: 20px;
            height: 12px;
            margin-left: 6px;
            background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='12' viewBox='0 0 20 12'%3E%3Cpath d='M0,10 L10,10 L10,2 L20,2' stroke='white' stroke-width='2' fill='none'/%3E%3C/svg%3E");
            background-repeat: no-repeat;
            background-size: contain;
            animation: clockwave 1s linear infinite;
        }

        @keyframes clockwave {
            0%, 49% {
                background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='12' viewBox='0 0 20 12'%3E%3Cpath d='M0,10 L10,10 L10,2 L20,2' stroke='white' stroke-width='2' fill='none'/%3E%3C/svg%3E");
            }
            50%, 99% {
                background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='12' viewBox='0 0 20 12'%3E%3Cpath d='M0,2 L10,2 L10,10 L20,10' stroke='white' stroke-width='2' fill='none'/%3E%3C/svg%3E");
            }
        }
        
        .status {
            font-weight: bold;
            color: #28a745;
            margin: 6px 0;
        }
        
        .printed-output {
            margin: 6px 0;
        }
        
        .printed-label {
            font-weight: bold;
        }
        
        .printed-text {
            color: inherit;
        }
        
        .printed-text.has-output {
            color: #28a745;
        }
        
        .output {
            background: #f8f9fa;
            border: 1px solid #dee2e6;
            padding: 15px;
            border-radius: 4px;
            font-family: monospace;
            white-space: pre-wrap;
            min-height: 100px;
            margin-top: 20px;
        }
        
        .trace {
            background: #f8f9fa;
            border: 1px solid #dee2e6;
            padding: 15px;
            border-radius: 4px;
            font-family: monospace;
            font-size: 12px;
            max-height: 300px;
            overflow-y: auto;
            margin-top: 20px;
        }
        
        #assembly-input {
            font-family: 'Courier New', Courier, monospace;
            font-size: 12px;
            border: 1px solid #ced4da;
            border-radius: 4px;
            padding: 8px;
            resize: vertical;
            width: 100%;
        }
        
        #assembly-input:focus {
            outline: none;
            border-color: #007bff;
            box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="control-group" id="assembler-section" style="display: none;">
            <h3>CDC6512 Assembly Editor</h3>
            <textarea id="assembly-input" rows="8" cols="50"></textarea>
            <br><br>
            <button id="assemble">Assemble</button>
            <select id="storageDropdown" style="background-color: #6c757d; color: white; border: 1px solid #6c757d; padding: 8px 12px; border-radius: 4px; margin: 0 5px;">
                <option value="">💾 Storage</option>
                <option value="save">💾 Save</option>
                <option value="load">📁 Load</option>
                <option value="delete">🗑️ Delete</option>
            </select>
            <button id="clear-assembly">Clear</button>
        </div>
        
        <div class="controls">
            <div class="top-nav">
                <div class="nav-left">
                    <select id="load-program">
                        <option value="">-- Load Program --</option>
                        <option value="simple-sample">Load Simple Sample</option>
                        <option value="add-sample">Load Add Sample</option>
                        <option value="uppercase-sample">Load Uppercase Sample</option>
                        <option value="hi">Load Hi</option>
                        <option value="hello">Load Hello</option>
                        <option value="hello-world">Load Hello World</option>
                        <option value="labels-demo">Load Labels Demo</option>
                        <option value="toggle-assembler">Toggle Assembler</option>
                    </select>
                </div>
                <div class="nav-right">
<?php if ($USER && $assn) : ?>
                    <button id="assignmentBtn" class="assignment-btn">Assignment</button>
<?php endif; ?>
<?php if ($USER && $USER->instructor) : ?>
                    <a href="<?php echo addSession('instructor.php'); ?>" class="instructor-button" title="Instructor Panel">Instructor</a>
<?php endif; ?>
                    <button id="asciiChart" style="background-color: #17a2b8; font-weight: bold;" title="ASCII Chart">ASCII</button>
                    <button id="help" style="background-color: #28a745; font-weight: bold;">?</button>
                </div>
            </div>
            
            <div class="control-group">
                <div style="margin-bottom: 3px;">
                    <span style="font-weight: bold;">Status:</span> <span id="status" class="status">Ready</span>
                </div>
                <div class="printed-output">
                    <span class="printed-label">Printed:</span> <span id="output-text" class="printed-text">No output yet</span>
                </div>
            </div>
        </div>
        
        <!-- Control buttons positioned above registers -->
        <div style="display: flex; gap: 6px; margin-bottom: 0; align-items: center;">
            <button id="reset" style="padding: 4px 10px; font-size: 13px;">Reset</button>
            <button id="step" style="padding: 4px 10px; font-size: 13px;">Step</button>
            <button id="start" style="padding: 4px 10px; font-size: 13px;">Start</button>
        </div>
        <!-- Your existing CDC8512 web component -->
        <cdc8512-cpu name="CA4E.com"></cdc8512-cpu>
        
        <div class="trace">
            <h3>Execution Trace</h3>
            <div id="trace">No execution trace yet</div>
        </div>
    </div>

    <!-- Include your existing web component -->
    <script type="module" src="./wc/cdc8512-cpu.js"></script>
    
    <!-- Include the emulator -->
    <script src="./cpu-emulator.js"></script>
    
    <script>
        // Wait for the web component to be ready
        document.addEventListener('DOMContentLoaded', () => {
            // Get the CPU component
            const cpuComponent = document.querySelector('cdc8512-cpu');
            
            // Wait for the component to be fully initialized
            setTimeout(() => {
                // Create the emulator instance
                const emulator = new CDC8512Emulator(cpuComponent);
                
                // Set up event listeners
                document.getElementById('load-program').addEventListener('change', () => {
                    const select = document.getElementById('load-program');
                    const value = select.value;
                    
                    if (value === 'hello') {
                        emulator.loadHelloProgram();
                        enableStepButton(); // Re-enable step button after loading program
                        // Load assembly code into textarea
                        document.getElementById('assembly-input').value = `SET X2, 72
SET A2, 0
SET X2, 101
INC A2
SET X2, 108
INC A2
INC A2
SET X2, 111
INC A2
HALT`;
                        updateStatus();
                        updateTrace();
                    } else if (value === 'hello-world') {
                        emulator.loadHelloWorldProgram();
                        enableStepButton(); // Re-enable step button after loading program
                        // Load assembly code into textarea
                        document.getElementById('assembly-input').value = `HALT
DATA 'Hello World!'`;
                        updateStatus();
                        updateTrace();
                        updateOutput();
                    } else if (value === 'labels-demo') {
                        // Load a demo program that uses labels
                        const labelsDemo = `ZERO X0
loop:
CMP X0, 5
JE end
INC X0
JP loop
end:
HALT`;
                        emulator.reset();
                        emulator.loadProgram(labelsDemo);
                        enableStepButton(); // Re-enable step button after loading program
                        document.getElementById('assembly-input').value = labelsDemo;
                        updateStatus();
                        updateTrace();
                        updateOutput();
                    } else if (value === 'add-sample') {
                        emulator.loadAddSample();
                        enableStepButton(); // Re-enable step button after loading program
                        // Load assembly code into textarea
                        document.getElementById('assembly-input').value = `SET A0, 1
ADD X0, 5
MOV X2, X0
SET A2, 3
HALT
DATA 0x00 0x0A`;
                        updateStatus();
                        updateTrace();
                        updateOutput();
                    } else if (value === 'simple-sample') {
                        emulator.loadSimpleSample();
                        enableStepButton(); // Re-enable step button after loading program
                        // Load assembly code into textarea
                        document.getElementById('assembly-input').value = `ZERO X2
INC X2
INC X2
ZERO A2
HALT`;
                        updateStatus();
                        updateTrace();
                        updateOutput();
                    } else if (value === 'uppercase-sample') {
                        emulator.loadUppercaseSample();
                        enableStepButton(); // Re-enable step button after loading program
                        // Load assembly code into textarea
                        document.getElementById('assembly-input').value = `SET X2, 0x70
CMP X2, 0x61
JL skip
SUB X2, 0x20
skip:
HALT`;
                        updateStatus();
                        updateTrace();
                        updateOutput();
                    } else if (value === 'hi') {
                        emulator.loadHiProgram();
                        enableStepButton(); // Re-enable step button after loading program
                        // Load assembly code into textarea
                        document.getElementById('assembly-input').value = `SET X2, 'H'
ZERO A2
SET X2, 'i'
INC A2
HALT`;
                        updateStatus();
                        updateTrace();
                        updateOutput();
                    } else if (value === 'toggle-assembler') {
                        const assemblerSection = document.getElementById('assembler-section');
                        if (assemblerSection.style.display === 'none') {
                            assemblerSection.style.display = 'block';
                        } else {
                            assemblerSection.style.display = 'none';
                        }
                    }
                    
                    // Reset select box
                    select.value = '';
                });

                document.getElementById('assemble').addEventListener('click', () => {
                    const assemblyCode = document.getElementById('assembly-input').value;
                    if (assemblyCode.trim()) {
                        try {
                            emulator.reset();
                            emulator.loadProgram(assemblyCode);
                            enableStepButton(); // Re-enable step button after assembly
                            updateStatus();
                            updateTrace();
                            updateOutput();
                            console.log('Assembly loaded successfully');
                            alert('Assembly successful! Code has been loaded into instruction memory and the CPU has been reset and is ready to execute.');
                        } catch (error) {
                            console.error('Assembly error:', error);
                            alert('Assembly error: ' + error.message);
                        }
                    } else {
                        alert('Please enter some assembly code');
                    }
                });

                document.getElementById('clear-assembly').addEventListener('click', () => {
                    document.getElementById('assembly-input').value = '';
                });

                // Storage dropdown event handler
                document.getElementById('storageDropdown').addEventListener('change', (e) => {
                    const action = e.target.value;
                    
                    if (action === 'save') {
                        const assemblyCode = document.getElementById('assembly-input').value;
                        if (assemblyCode.trim()) {
                            const timestamp = new Date().toISOString().slice(0, 19).replace('T', ' ');
                            const programName = prompt('Enter a name for this program:', `Program_${timestamp}`);
                            if (programName) {
                                const savedPrograms = JSON.parse(localStorage.getItem('cdc8512_programs') || '{}');
                                savedPrograms[programName] = {
                                    code: assemblyCode,
                                    timestamp: new Date().toISOString()
                                };
                                localStorage.setItem('cdc8512_programs', JSON.stringify(savedPrograms));
                                alert(`Program "${programName}" saved successfully!`);
                            }
                        } else {
                            alert('Please enter some assembly code to save');
                        }
                    } else if (action === 'load') {
                        const savedPrograms = JSON.parse(localStorage.getItem('cdc8512_programs') || '{}');
                        const programNames = Object.keys(savedPrograms);
                        
                        if (programNames.length === 0) {
                            alert('No saved programs found');
                            return;
                        }
                        
                        let message = 'Enter the name of the program to load:\n\nAvailable programs:\n';
                        programNames.forEach(name => {
                            const program = savedPrograms[name];
                            const date = new Date(program.timestamp).toLocaleString();
                            message += `${name} (${date})\n`;
                        });
                        
                        const programName = prompt(message);
                        if (programName && savedPrograms[programName]) {
                            document.getElementById('assembly-input').value = savedPrograms[programName].code;
                            alert(`Program "${programName}" loaded successfully!`);
                        } else if (programName) {
                            alert(`Program "${programName}" not found`);
                        }
                    } else if (action === 'delete') {
                        const savedPrograms = JSON.parse(localStorage.getItem('cdc8512_programs') || '{}');
                        const programNames = Object.keys(savedPrograms);
                        
                        if (programNames.length === 0) {
                            alert('No saved programs found');
                            return;
                        }
                        
                        let message = 'Enter the name of the program to delete:\n\nAvailable programs:\n';
                        programNames.forEach(name => {
                            const program = savedPrograms[name];
                            const date = new Date(program.timestamp).toLocaleString();
                            message += `${name} (${date})\n`;
                        });
                        
                        const programName = prompt(message);
                        if (programName && savedPrograms[programName]) {
                            if (confirm(`Are you sure you want to delete "${programName}"?`)) {
                                delete savedPrograms[programName];
                                localStorage.setItem('cdc8512_programs', JSON.stringify(savedPrograms));
                                alert(`Program "${programName}" deleted successfully!`);
                            }
                        } else if (programName) {
                            alert(`Program "${programName}" not found`);
                        }
                    }
                    
                    // Reset dropdown to default after action
                    setTimeout(() => {
                        e.target.value = '';
                    }, 100);
                });

                document.getElementById('help').addEventListener('click', () => {
                    window.open('./documentation.html', '_blank');
                });


                
                document.getElementById('reset').addEventListener('click', () => {
                    emulator.reset();
                    enableStepButton(); // Re-enable step button after reset
                    updateStatus();
                    updateTrace();
                    updateOutput();
                });
                
                document.getElementById('step').addEventListener('click', () => {
                    const result = emulator.step();
                    if (result) {
                        console.log('Step result:', result);
                    } else {
                        // CPU halted, disable step button
                        document.getElementById('step').disabled = true;
                    }
                    updateStatus();
                    updateTrace();
                    updateOutput();
                });
                
                document.getElementById('start').addEventListener('click', () => {
                    const startButton = document.getElementById('start');
                    const status = emulator.getStatus();
                    
                    if (status.running) {
                        // Currently running, so stop
                        emulator.stop();
                        startButton.textContent = 'Start';
                        startButton.classList.remove('running');
                        updateStatus();
                    } else {
                        // Currently stopped, check if halted and reset PC to 0 (restart)
                        if (status.halted) {
                            emulator.cpu.pc = 0;
                            console.log('CPU was halted, resetting PC to 0 for restart');
                        }
                        
                        // Start execution
                        emulator.start();
                        startButton.textContent = 'Stop';
                        startButton.classList.add('running');
                        updateStatus();
                        
                        // Set up a timer to update the UI during continuous execution
                        const updateInterval = setInterval(() => {
                            if (!emulator.getStatus().running) {
                                clearInterval(updateInterval);
                                startButton.textContent = 'Start';
                                startButton.classList.remove('running');
                                // Check if CPU halted and disable step button if so
                                if (emulator.getStatus().halted) {
                                    document.getElementById('step').disabled = true;
                                }
                                updateStatus();
                                updateTrace();
                                updateOutput();
                            } else {
                                updateStatus();
                                updateTrace();
                                updateOutput();
                            }
                        }, 100); // Update UI every 100ms during execution
                    }
                });
                
                // Enable step button
                function enableStepButton() {
                    document.getElementById('step').disabled = false;
                }
                
                // Update functions
                function updateStatus() {
                    const status = emulator.getStatus();
                    const cpuComponent = document.querySelector('cdc8512-cpu');
                    
                    // Check if mode register indicates error
                    if (cpuComponent.mode === 1) {
                        document.getElementById('status').textContent = 'Error: Invalid instruction';
                    } else if (cpuComponent.mode === 2) {
                        document.getElementById('status').textContent = 'Error: Jump address out of range';
                    } else if (cpuComponent.mode === 3) {
                        document.getElementById('status').textContent = 'Error: A register address out of range';
                    } else {
                        document.getElementById('status').textContent = 
                            status.running ? 'Running' : status.halted ? 'Halted' : 'Stopped';
                    }
                }
                
                function updateTrace() {
                    const status = emulator.getStatus();
                    const traceDiv = document.getElementById('trace');
                    
                    if (status.trace.length === 0) {
                        traceDiv.textContent = 'No execution trace yet';
                        return;
                    }
                    
                    const traceText = status.trace.map(step => 
                        `PC: 0x${step.pc.toString(16).padStart(2, '0')} | ${step.instruction} | X2: 0x${step.registers.x2.toString(16).padStart(2, '0')} | A2: 0x${step.registers.a2.toString(16).padStart(2, '0')}`
                    ).join('\n');
                    
                    traceDiv.textContent = traceText;
                }
                
                function updateOutput() {
                    const status = emulator.getStatus();
                    const outputText = status.output ? status.output.trim() : '';
                    const outputElement = document.getElementById('output-text');
                    
                    if (outputText) {
                        outputElement.textContent = outputText;
                        outputElement.classList.add('has-output');
                    } else {
                        outputElement.textContent = 'No output yet';
                        outputElement.classList.remove('has-output');
                    }
                }
                
                // Initial status update
                updateStatus();
                
                // Make emulator globally accessible for debugging
                window.emulator = emulator;
                
                console.log('CDC8512 Emulator Integration Ready!');
                console.log('Use window.emulator to access the emulator instance');
            }, 1000); // Wait 1 second for component to initialize
        });
    </script>

<?php if ($USER && $assn) : ?>
    <!-- Assignment Modal -->
    <div id="assignmentModal" class="assignment-modal hidden">
        <div id="assignmentModalHeader" class="modal-header" title="Drag to move">
            <span>📋 Assignment</span>
            <button class="close-btn" onclick="closeAssignmentModal()" title="Close">×</button>
        </div>
        <div class="modal-content">
            <p id="assignmentInstructions">
                <!-- Instructions will be loaded dynamically from the exercise class -->
            </p>
            <div id="gradingSection" style="margin-top: 20px;">
                <div id="stepDisplay"></div>
                <button id="gradeBtn" onclick="startGrading()">Start Grading</button>
            </div>
        </div>
    </div>
<?php endif; ?>

    <!-- ASCII Chart Modal -->
    <div id="asciiChartModal" class="assignment-modal hidden">
        <div id="asciiChartModalHeader" class="modal-header" title="Drag to move">
            <span>📊 ASCII Chart</span>
            <button class="close-btn" onclick="closeAsciiChartModal()" title="Close">×</button>
        </div>
        <div class="modal-content">
            <div id="asciiChartContent">
                <!-- ASCII chart will be generated here -->
            </div>
        </div>
    </div>

    <script src="../common/exercise-base.js"></script>
    <script src="exercises.js"></script>
    <script>
        // Assignment modal elements
        const assignmentModal = document.getElementById('assignmentModal');
        const assignmentModalHeader = document.getElementById('assignmentModalHeader');
        const assignmentBtn = document.getElementById('assignmentBtn');
        let modalUserMoved = false; // if user drags, we keep their position

        // Assignment modal functions
        function showAssignmentModal() {
            // Reset the grading state to ensure fresh start
            if (currentExercise) {
                currentExercise.resetGrading();
            }
            
            // Load instructions from the current exercise
            if (currentExercise && currentExercise.instructions) {
                const instructionsElement = document.getElementById('assignmentInstructions');
                if (instructionsElement) {
                    let instructions = currentExercise.instructions;
                    
                    
                    instructionsElement.innerHTML = instructions;
                }
            }
            
            assignmentModal.classList.remove('hidden');
            centerAssignmentModal();
        }

        function closeAssignmentModal() {
            // Reset the grading state when closing
            if (currentExercise) {
                currentExercise.resetGrading();
            }
            
            // Hide the modal
            assignmentModal.classList.add('hidden');
        }

        function centerAssignmentModal() {
            // Only set initial position if modal doesn't already have a position
            if (!assignmentModal.style.left && !assignmentModal.style.top) {
                console.log('centerAssignmentModal');
                const modalW = assignmentModal.offsetWidth;
                const modalH = assignmentModal.offsetHeight;
                // Position modal nudged to the right, near the top of viewport
                const left = Math.max(0, Math.floor((window.innerWidth - modalW) * 0.7)); // 70% from left edge
                const top = Math.max(20, Math.floor(window.innerHeight * 0.1)); // 10% from top, minimum 20px
                assignmentModal.style.left = left + 'px';
                assignmentModal.style.top = top + 'px';
            }
        }

        // Assignment button click handler (only if button exists)
        if (assignmentBtn) {
            assignmentBtn.addEventListener('click', showAssignmentModal);
        }

        // Grading functions
        function startGrading() {
            if (currentExercise) {
                currentExercise.startGrading();
            }
        }

        // Grade submission function
        function submitGradeToLMS(grade) {
            const formData = new FormData();
            formData.append('grade', grade);
            formData.append('code', 'CDC8512_EXERCISE_COMPLETED');
            
            console.log('Sending grade=' + grade);
            
            fetch('<?php echo addSession($CFG->wwwroot . '/api/grade-submit.php'); ?>', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                console.log('Grade submission response:', data);
                if (data.status === 'success') {
                    // Show success message
                    alert('🎉 Excellent work! Your assignment has been completed successfully and your grade has been submitted to the LMS.');
                    // Close the assignment modal automatically
                    const assignmentModal = document.getElementById('assignmentModal');
                    if (assignmentModal) {
                        assignmentModal.classList.add('hidden');
                    }
                } else {
                    console.error('Grade submission failed:', data);
                    // Show error alert to user
                    alert(`⚠️ Grade submission failed: ${data.detail}\n\nYour assignment was completed successfully, but the grade could not be sent to the LMS. Please contact your instructor.`);
                }
            })
            .catch(error => {
                console.error('Grade submission error:', error);
                // Show error alert to user
                alert(`⚠️ Grade submission error: ${error.message}\n\nYour assignment was completed successfully, but there was a technical error sending the grade to the LMS. Please contact your instructor.`);
            });
        }

        // Initialize the exercise when the page loads
        document.addEventListener('DOMContentLoaded', function() {
            // Create the appropriate exercise instance based on assignment
            if ( '<?php echo $assn; ?>' == 'HelloWorldExercise') {
                currentExercise = new HelloWorldExercise();
            } else if ( '<?php echo $assn; ?>' == 'Print42Exercise') {
                currentExercise = new Print42Exercise();
            }
            
            // Override the exercise's submitGradeToLMS method to use the global function
            if (currentExercise) {
                currentExercise.submitGradeToLMS = submitGradeToLMS;
            }
        });

        // Make modal draggable
        (function enableAssignmentDrag() {
            if (!assignmentModal || !assignmentModalHeader) return;
            let dragging = false;
            let startClientX = 0, startClientY = 0;
            let startLeft = 0, startTop = 0;

            function onPointerDown(e) {
                dragging = true;
                modalUserMoved = true;
                // For position: fixed, use viewport coordinates directly
                startLeft = parseInt(assignmentModal.style.left) || 0;
                startTop = parseInt(assignmentModal.style.top) || 0;
                if (e.touches) {
                    startClientX = e.touches[0].clientX;
                    startClientY = e.touches[0].clientY;
                } else {
                    startClientX = e.clientX;
                    startClientY = e.clientY;
                }
                assignmentModalHeader.style.cursor = 'grabbing';
                window.addEventListener('mousemove', onPointerMove, { passive: false });
                window.addEventListener('mouseup', onPointerUp, { passive: false });
                window.addEventListener('touchmove', onPointerMove, { passive: false });
                window.addEventListener('touchend', onPointerUp, { passive: false });
                e.preventDefault();
            }

            function onPointerMove(e) {
                if (!dragging) return;
                let currentClientX, currentClientY;
                if (e.touches) {
                    currentClientX = e.touches[0].clientX;
                    currentClientY = e.touches[0].clientY;
                } else {
                    currentClientX = e.clientX;
                    currentClientY = e.clientY;
                }
                const dx = currentClientX - startClientX;
                const dy = currentClientY - startClientY;
                // Remove canvas container constraints - allow modal to move freely on screen
                const maxLeft = window.innerWidth - assignmentModal.offsetWidth;
                const maxTop = window.innerHeight - assignmentModal.offsetHeight;
                const newLeft = Math.max(0, Math.min(maxLeft, startLeft + dx));
                const newTop = Math.max(0, Math.min(maxTop, startTop + dy));
                assignmentModal.style.left = newLeft + 'px';
                assignmentModal.style.top = newTop + 'px';
            }

            function onPointerUp(e) {
                dragging = false;
                assignmentModalHeader.style.cursor = 'grab';
                window.removeEventListener('mousemove', onPointerMove);
                window.removeEventListener('mouseup', onPointerUp);
                window.removeEventListener('touchmove', onPointerMove);
                window.removeEventListener('touchend', onPointerUp);
            }

            assignmentModalHeader.addEventListener('mousedown', onPointerDown);
            assignmentModalHeader.addEventListener('touchstart', onPointerDown, { passive: false });
        })();

        // ASCII Chart Modal functionality
        const asciiChartModal = document.getElementById('asciiChartModal');
        const asciiChartModalHeader = document.getElementById('asciiChartModalHeader');
        const asciiChartBtn = document.getElementById('asciiChart');

        // ASCII Chart functions
        function showAsciiChartModal() {
            if (!asciiChartModal) return;
            
            // Adjust modal width based on window size for better responsiveness
            const windowWidth = window.innerWidth;
            if (windowWidth < 600) {
                asciiChartModal.style.width = '95vw';
            } else if (windowWidth < 900) {
                asciiChartModal.style.width = '85vw';
            } else {
                asciiChartModal.style.width = '700px'; // Wider for larger screens
            }
            
            generateAsciiChart();
            asciiChartModal.classList.remove('hidden');
            centerAsciiChartModal();
        }

        function closeAsciiChartModal() {
            if (!asciiChartModal) return;
            asciiChartModal.classList.add('hidden');
        }

        function centerAsciiChartModal(force = false) {
            if (!asciiChartModal) return;
            // Set initial position if modal doesn't already have a position, or if forced (for resize)
            if (force || (!asciiChartModal.style.left && !asciiChartModal.style.top)) {
                // Use requestAnimationFrame to ensure modal is rendered before getting dimensions
                requestAnimationFrame(() => {
                    if (!asciiChartModal) return;
                    const rect = asciiChartModal.getBoundingClientRect();
                    const modalWidth = rect.width || asciiChartModal.offsetWidth || 500; // fallback to default width
                    const modalHeight = rect.height || asciiChartModal.offsetHeight || 400; // fallback to default height
                    
                    const left = (window.innerWidth - modalWidth) / 2;
                    const top = (window.innerHeight - modalHeight) / 2;
                    asciiChartModal.style.left = Math.max(0, left) + 'px';
                    asciiChartModal.style.top = Math.max(0, top) + 'px';
                });
            } else {
                // If modal already has a position, just ensure it stays within viewport bounds
                requestAnimationFrame(() => {
                    if (!asciiChartModal) return;
                    const rect = asciiChartModal.getBoundingClientRect();
                    const modalWidth = rect.width || asciiChartModal.offsetWidth || 500;
                    const modalHeight = rect.height || asciiChartModal.offsetHeight || 400;
                    const currentLeft = parseInt(asciiChartModal.style.left) || 0;
                    const currentTop = parseInt(asciiChartModal.style.top) || 0;
                    
                    // Keep modal within viewport bounds
                    const maxLeft = window.innerWidth - modalWidth;
                    const maxTop = window.innerHeight - modalHeight;
                    const newLeft = Math.max(0, Math.min(maxLeft, currentLeft));
                    const newTop = Math.max(0, Math.min(maxTop, currentTop));
                    
                    asciiChartModal.style.left = newLeft + 'px';
                    asciiChartModal.style.top = newTop + 'px';
                });
            }
        }

        function generateAsciiChart() {
            const content = document.getElementById('asciiChartContent');
            if (!content) return;
            
            // Calculate responsive number of columns based on window width
            // Each character cell is approximately 80-100px wide (including gap)
            const modalWidth = asciiChartModal ? (asciiChartModal.offsetWidth || 500) : window.innerWidth;
            const availableWidth = Math.min(modalWidth - 40, window.innerWidth - 40); // Account for padding
            const minCellWidth = 80; // Minimum width per cell
            const maxColumns = Math.max(3, Math.floor(availableWidth / minCellWidth));
            const columns = Math.min(maxColumns, 8); // Cap at 8 columns for readability
            
            let html = '<h3>ASCII Character Chart</h3>';
            
            // Printable ASCII characters (32-126) with responsive grid
            html += `<div style="display: grid; grid-template-columns: repeat(${columns}, 1fr); gap: 8px; font-family: monospace; font-size: 14px; margin: 10px 0;">`;
            
            for (let i = 32; i <= 126; i++) {
                const char = String.fromCharCode(i);
                const hex = i.toString(16).toUpperCase().padStart(2, '0');
                const binary = i.toString(2).padStart(8, '0');
                
                // Special handling for common characters
                let displayChar = char;
                if (char === ' ') displayChar = 'SP';
                else if (char === '\t') displayChar = 'TAB';
                else if (char === '\n') displayChar = 'LF';
                else if (char === '\r') displayChar = 'CR';
                
                html += `<div style="border: 1px solid #ccc; padding: 6px; text-align: center; background: ${i % 2 === 0 ? '#f9f9f9' : '#fff'};">
                    <div style="font-weight: bold; font-size: 16px;">${displayChar}</div>
                    <div style="color: #666; font-size: 12px;">${i}</div>
                    <div style="color: #0066cc; font-size: 12px;">0x${hex}</div>
                    <div style="color: #cc6600; font-size: 11px;">${binary}</div>
                </div>`;
            }
            
            html += '</div>';
            
            content.innerHTML = html;
        }

        // Event listeners
        if (asciiChartBtn) {
            asciiChartBtn.addEventListener('click', showAsciiChartModal);
        }

        // Handle window resize to keep ASCII chart modal responsive
        let resizeTimeout;
        window.addEventListener('resize', () => {
            if (!asciiChartModal || asciiChartModal.classList.contains('hidden')) return;
            
            // Debounce resize events for better performance
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                // Adjust modal width based on new window size
                const windowWidth = window.innerWidth;
                if (windowWidth < 600) {
                    asciiChartModal.style.width = '95vw';
                } else if (windowWidth < 900) {
                    asciiChartModal.style.width = '85vw';
                } else {
                    asciiChartModal.style.width = '700px';
                }
                
                centerAsciiChartModal(false); // Reposition without forcing center
                
                // Regenerate chart with responsive grid based on new modal width
                const content = document.getElementById('asciiChartContent');
                if (content) {
                    generateAsciiChart();
                }
            }, 150);
        });

        // Make ASCII chart modal draggable
        (function enableAsciiChartDrag() {
            if (!asciiChartModal || !asciiChartModalHeader) return;
            let dragging = false;
            let startClientX = 0, startClientY = 0;
            let startLeft = 0, startTop = 0;

            function onPointerDown(e) {
                dragging = true;
                asciiChartModalHeader.style.cursor = 'grabbing';
                if (e.touches) {
                    startClientX = e.touches[0].clientX;
                    startClientY = e.touches[0].clientY;
                } else {
                    startClientX = e.clientX;
                    startClientY = e.clientY;
                }
                startLeft = parseInt(asciiChartModal.style.left) || 0;
                startTop = parseInt(asciiChartModal.style.top) || 0;
                e.preventDefault();
                window.addEventListener('mousemove', onPointerMove);
                window.addEventListener('mouseup', onPointerUp);
                window.addEventListener('touchmove', onPointerMove, { passive: false });
                window.addEventListener('touchend', onPointerUp);
            }

            function onPointerMove(e) {
                if (!dragging) return;
                let currentClientX, currentClientY;
                if (e.touches) {
                    currentClientX = e.touches[0].clientX;
                    currentClientY = e.touches[0].clientY;
                } else {
                    currentClientX = e.clientX;
                    currentClientY = e.clientY;
                }
                const dx = currentClientX - startClientX;
                const dy = currentClientY - startClientY;
                const maxLeft = window.innerWidth - asciiChartModal.offsetWidth;
                const maxTop = window.innerHeight - asciiChartModal.offsetHeight;
                const newLeft = Math.max(0, Math.min(maxLeft, startLeft + dx));
                const newTop = Math.max(0, Math.min(maxTop, startTop + dy));
                asciiChartModal.style.left = newLeft + 'px';
                asciiChartModal.style.top = newTop + 'px';
            }

            function onPointerUp(e) {
                dragging = false;
                asciiChartModalHeader.style.cursor = 'grab';
                window.removeEventListener('mousemove', onPointerMove);
                window.removeEventListener('mouseup', onPointerUp);
                window.removeEventListener('touchmove', onPointerMove);
                window.removeEventListener('touchend', onPointerUp);
            }

            asciiChartModalHeader.addEventListener('mousedown', onPointerDown);
            asciiChartModalHeader.addEventListener('touchstart', onPointerDown, { passive: false });
        })();
    </script>

</body>
</html>
