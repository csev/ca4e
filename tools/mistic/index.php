<?php

require_once "../config.php";

use \Tsugi\Core\LTIX;

// Initialize LTI if we received a launch.  If this was a non-LTI GET,
// then $USER will be null (i.e. anonymous)
$LTI = LTIX::session_start();
?><!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Mistic VLSI Layout</title>
        <style>
            h1 {
                font-size: 1.5em;
                margin-bottom: 10px;
            }

            #toolbar {
                margin-bottom: 10px;
                display: flex;
                gap: 6px;
                flex-wrap: wrap;
                justify-content: center;
                padding: 8px;
            }

            #toolbar button {
                font-size: 14px;
                padding: 8px 15px;
                border-radius: 6px;
                border: 1px solid #ccc;
                cursor: pointer;
                min-width: 60px;
                transition: all 0.2s ease;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }

            #toolbar button:hover {
                transform: translateY(-1px);
                box-shadow: 0 4px 8px rgba(0,0,0,0.15);
            }

            #toolbar button:active {
                transform: translateY(1px);
                box-shadow: 0 1px 2px rgba(0,0,0,0.1);
            }
            
            .layer-modal {
                position: absolute;
                background: #fff;
                border: 1px solid #000;
                box-shadow: 0 6px 18px rgba(0,0,0,0.2);
                z-index: 1000;
                user-select: none;
            }
            .layer-modal.hidden { display: none; }
            .layer-modal .modal-header {
                display: flex;
                align-items: center;
                gap: 6px;
                padding: 6px 10px;
                background: #f7f7f7;
                border-bottom: 1px solid #ddd;
                cursor: grab;
                font-weight: bold;
            }
            
            .assignment-modal {
                position: absolute;
                background: #fff;
                border: 2px solid #333;
                border-radius: 8px;
                box-shadow: 0 8px 24px rgba(0,0,0,0.3);
                z-index: 1001;
                user-select: none;
                min-width: 300px;
                min-height: 200px;
                max-width: 90vw;
                max-height: 90vh;
                resize: both;
                overflow: auto;
            }
            .assignment-modal.hidden { display: none; }
            .assignment-modal .modal-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 6px;
                padding: 10px 15px;
                background: #f0f8ff;
                border-bottom: 1px solid #ddd;
                cursor: grab;
                font-weight: bold;
                border-radius: 6px 6px 0 0;
            }
            .assignment-modal .modal-content {
                padding: 20px;
                overflow-y: auto;
                height: calc(100% - 50px);
            }
            .assignment-modal .close-btn {
                background: none;
                border: none;
                font-size: 18px;
                cursor: pointer;
                color: #666;
                padding: 0;
                width: 24px;
                height: 24px;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            .assignment-modal .close-btn:hover {
                color: #000;
                background: #f0f0f0;
                border-radius: 3px;
            }
        </style>
    </head>
    <body>
        <center>
            <h1>Mistic VLSI Layout</h1>
            <div id="toolbar">
                <button onclick="setLayer('polysilicon')" style="background-color: rgba(255, 0, 0, 0.2);">Poly</button>
                <button onclick="setLayer('N+ diffusion')" style="background-color: rgba(0, 255, 0, 0.3);">N+</button>
                <button onclick="setLayer('P+ diffusion')" style="background-color: rgba(255, 165, 0, 0.5);">P+</button>
                <button onclick="setLayer('contact')" style="background-color: rgba(0, 0, 0, 0.3); color: white;">Via</button>
                <button onclick="setLayer('metal')" style="background-color: rgba(0, 0, 255, 0.3);">Metal</button>
                <button onclick="setLayer('VCC')" style="background-color: #f0f0f0;">VCC</button>
                <button onclick="setLayer('GND')" style="background-color: #f0f0f0;">GND</button>
<?php if ($USER) : ?>
                <button onclick="setLayer('probe')" style="background-color: rgba(128, 0, 128, 0.3);">Probe</button>
<?php endif; ?>
                <button onclick="setLayer('erase')" style="background-color: rgba(255, 255, 255, 1);">🧽</button>
                <button onclick="confirmClear()" style="background-color: #ffe6e6;">🗑️</button>
                <button id="toggleLayersBtn" style="background-color:#eef7ff;">Layers</button>
<?php if ($USER) : ?>
                <button id="assignmentBtn" style="background-color:#fff0e6;">Assignment</button>
<?php endif; ?>
<?php if ($USER && $USER->instructor) : ?>
                <button onclick="drawNotGate()" style="background-color: #9C27B0; color: white;">Not</button>
<?php endif; ?>
                <button onclick="readCircuit()" style="background-color: #607D8B; color: white;">Read Circuit</button>
            </div>
            <div id="canvasContainer" style="position:relative; display:inline-block;">
                <canvas id="vlsiCanvas" width="600" height="600" style="border:1px solid #000000; display:block;"></canvas>
                <div id="layerModal" class="layer-modal hidden">
                    <div id="layerModalHeader" class="modal-header" title="Drag to move">
                        <span>✋</span>
                        <span>Layers</span>
                    </div>
                    <div style="padding:8px;">
                        <canvas id="layerCanvas" width="220" height="240" style="border:1px solid #000000;"></canvas>
                    </div>
                </div>
<?php if ($USER) : ?>
                <div id="assignmentModal" class="assignment-modal hidden">
                    <div id="assignmentModalHeader" class="modal-header" title="Drag to move">
                        <span>📋 Assignment</span>
                        <button class="close-btn" onclick="closeAssignmentModal()" title="Close">×</button>
                    </div>
                    <div class="modal-content">
                        <p>In this assignment you will lay out a Not gate. 
                            Place a probe with the label "A" on the input to your NOT gate. Place a probe with the label 
                            "Q" on the output of your NOT gate. Do not place a VCC or GND on the trace that has the probe.
                            If you place a VCC or GND for testing place the probes on the same 
                            square as the test points so the test points are cleared.. Then press "Grade" to check your circuit.</p>
                        <div id="gradingSection" style="margin-top: 20px; display: none;">
                            <h3>Circuit Grading</h3>
                            <div id="stepDisplay">
                                <p id="stepText">Ready to grade your circuit!</p>
                            </div>
                            <div style="margin-top: 15px;">
                                <button id="nextBtn" onclick="nextStep()" style="background-color: #2196F3; color: white; padding: 8px 16px; border: none; border-radius: 4px; cursor: pointer; display: none;">Next</button>
                            </div>
                        </div>
                        <div style="margin-top: 20px;">
                            <button onclick="startGrading()" style="background-color: #4CAF50; color: white; padding: 8px 16px; border: none; border-radius: 4px; cursor: pointer;">Grade</button>
                        </div>
                    </div>
                </div>
<?php endif; ?>
            </div>

            <script>
                const canvas = document.getElementById('vlsiCanvas');
                const ctx = canvas.getContext('2d');
                const layerCanvas = document.getElementById('layerCanvas');
                const lctx = layerCanvas ? layerCanvas.getContext('2d') : null;
                const layerModal = document.getElementById('layerModal');
                const layerModalHeader = document.getElementById('layerModalHeader');
                const toggleLayersBtn = document.getElementById('toggleLayersBtn');
                const canvasContainer = document.getElementById('canvasContainer');
<?php if ($USER) : ?>
                const assignmentModal = document.getElementById('assignmentModal');
                const assignmentModalHeader = document.getElementById('assignmentModalHeader');
                const assignmentBtn = document.getElementById('assignmentBtn');
<?php endif; ?>
                let modalUserMoved = false; // if user drags, we keep their position
                let tileSize = 30; // fixed pixel size per grid tile (finger-friendly)
                let gridSize = 30;
                const MAX_GRID_SIZE = 60;
                const layers = {
                    'polysilicon': 'rgba(255, 0, 0, 0.2)',
                    'N+ diffusion': 'rgba(0, 255, 0, 0.3)',
                    'P+ diffusion': 'rgba(255, 165, 0, 0.5)',
                    'contact': 'rgba(0, 0, 0, 0.3)',
                    'metal': 'rgba(0, 0, 255, 0.3)',
                    'VCC': 'rgba(0, 0, 0, 0)',
                    'GND': 'rgba(0, 0, 0, 0)'
                };

                const layerPolysilicon = 0;
                const layerNPlus = 1;
                const layerPPlus = 2;
                const layerContact = 3;
                const layerMetal = 4;
                const layerVCC = 5;
                const layerGND = 6;
                const layerProbe = 7;

                let currentLayer = '';
                let isDrawing = false;
                let startX, startY;
                let grid = Array(gridSize).fill().map(() => Array(gridSize).fill().map(() => Array(8).fill(false)));
                let volts = Array(gridSize).fill().map(() => Array(gridSize).fill().map(() => Array(8).fill(0)));
                let probeLabels = {}; // Store probe labels: {x_y: 'label'}
                
                // Grading variables
                let currentStep = 0;
                let gradingSteps = [
                    { name: "Check for A and Q probes", status: "pending" },
                    { name: "Test A=0 → Q=1", status: "pending" },
                    { name: "Test A=1 → Q=0", status: "pending" }
                ];

                function createGrid(size) {
                    return Array(size).fill().map(() => Array(size).fill().map(() => Array(8).fill(false)));
                }

                function createVolts(size) {
                    return Array(size).fill().map(() => Array(size).fill().map(() => Array(8).fill(0)));
                }

                function resizeGrid(newSize) {
                    const oldGrid = grid;
                    const oldSize = gridSize;
                    const newGrid = createGrid(newSize);
                    const newVolts = createVolts(newSize);
                    const copy = Math.min(oldSize, newSize);
                    for (let i = 0; i < copy; i++) {
                        for (let j = 0; j < copy; j++) {
                            for (let l = 0; l < 7; l++) {
                                newGrid[i][j][l] = oldGrid[i][j][l];
                            }
                        }
                    }
                    // Preserve probe labels for copied area
                    const newProbeLabels = {};
                    for (let key in probeLabels) {
                        const [x, y] = key.split('_').map(Number);
                        if (x < copy && y < copy) {
                            newProbeLabels[key] = probeLabels[key];
                        }
                    }
                    probeLabels = newProbeLabels;
                    grid = newGrid;
                    volts = newVolts; // will be recomputed
                    gridSize = newSize;
                }

                function setLayer(layer) {
                    currentLayer = layer;
                }

                function clearCanvas() {
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    grid.forEach(row => row.forEach(col => col.fill(false)));
                    probeLabels = {}; // Clear probe labels
                }

                function confirmClear() {
                    if (confirm("Are you sure you want to clear the entire canvas? This action cannot be undone.")) {
                        clearCanvas();
                    }
                }

                function getEventCoordinates(event) {
                    const rect = canvas.getBoundingClientRect();
                    let clientX, clientY;
                    
                    if (event.touches) {
                        clientX = event.touches[0].clientX;
                        clientY = event.touches[0].clientY;
                    } else {
                        clientX = event.clientX;
                        clientY = event.clientY;
                    }
                    
                    return {
                        x: Math.floor((clientX - rect.left) / tileSize),
                        y: Math.floor((clientY - rect.top) / tileSize)
                    };
                }

                function handleStart(event) {
                    event.preventDefault();
                    isDrawing = true;
                    const coords = getEventCoordinates(event);
                    startX = coords.x;
                    startY = coords.y;
                    
                    if (['contact', 'VCC', 'GND', 'probe'].includes(currentLayer)) {
                        grid[startY][startX][getLayerIndex('contact')] = false;
                        grid[startY][startX][getLayerIndex('VCC')] = false;
                        grid[startY][startX][getLayerIndex('GND')] = false;
                        grid[startY][startX][getLayerIndex('probe')] = false;

                        grid[startY][startX][getLayerIndex(currentLayer)] = true;
                        
                        // Handle probe label input
                        if (currentLayer === 'probe') {
                            const label = prompt('Enter a single character label for this probe:');
                            if (label && label.length > 0) {
                                probeLabels[startX + '_' + startY] = label.charAt(0);
                            } else {
                                // If no label provided, remove the probe
                                grid[startY][startX][getLayerIndex('probe')] = false;
                            }
                        }
                        
                        redrawTile(startX, startY);
                        isDrawing = false;
                        redrawAllTiles();
                        drawLayerView(startX, startY);
                        return;
                    }
                }

                function handleMove(event) {
                    if (!isDrawing || ['contact', 'VCC', 'GND'].includes(currentLayer)) return;
                    event.preventDefault();
                    const coords = getEventCoordinates(event);
                    drawRubberBand(startX, startY, coords.x, coords.y);
                }

                function handleEnd(event) {
                    if (!isDrawing) return;
                    event.preventDefault();
                    
                    if (currentLayer !== 'contact' && currentLayer !== 'VCC' && currentLayer !== 'GND' && currentLayer !== 'probe') {
                        const coords = getEventCoordinates(event.changedTouches ? event.changedTouches[0] : event);
                        fillTiles(startX, startY, coords.x, coords.y);
                    }
                    isDrawing = false;
                    ctx.beginPath();
                }

                canvas.addEventListener('touchstart', handleStart, { passive: false });
                canvas.addEventListener('touchmove', handleMove, { passive: false });
                canvas.addEventListener('touchend', handleEnd, { passive: false });
                canvas.addEventListener('touchcancel', handleEnd, { passive: false });

                canvas.addEventListener('mousedown', handleStart);
                canvas.addEventListener('mousemove', handleMove);
                canvas.addEventListener('mouseup', handleEnd);

                // Hover preview for mouse
                canvas.addEventListener('mousemove', function(evt) {
                    const coords = getEventCoordinates(evt);
                    drawLayerView(coords.x, coords.y);
                });
                canvas.addEventListener('mouseleave', function() {
                    clearLayerView();
                });

                // Hover preview for touch
                canvas.addEventListener('touchstart', function(evt) {
                    const coords = getEventCoordinates(evt);
                    drawLayerView(coords.x, coords.y);
                }, { passive: false });
                canvas.addEventListener('touchmove', function(evt) {
                    const coords = getEventCoordinates(evt);
                    drawLayerView(coords.x, coords.y);
                }, { passive: false });

                // Toggle modal visibility
                toggleLayersBtn.addEventListener('click', function() {
                    if (layerModal.classList.contains('hidden')) {
                        layerModal.classList.remove('hidden');
                        modalUserMoved = false;
                        centerModalTopCentered();
                    } else {
                        layerModal.classList.add('hidden');
                    }
                });

<?php if ($USER) : ?>
                // Assignment modal functions
                function showAssignmentModal() {
                    assignmentModal.classList.remove('hidden');
                    centerAssignmentModal();
                }

                function closeAssignmentModal() {
                    assignmentModal.classList.add('hidden');
                }

                function centerAssignmentModal() {
                    const containerRect = canvasContainer.getBoundingClientRect();
                    const modalW = assignmentModal.offsetWidth;
                    const left = Math.max(0, Math.floor((containerRect.width - modalW) / 2));
                    const top = 20; // 20px from the top of canvas
                    assignmentModal.style.left = left + 'px';
                    assignmentModal.style.top = top + 'px';
                }

                // Assignment button click handler
                assignmentBtn.addEventListener('click', showAssignmentModal);

                // Grading functions
                function startGrading() {
                    currentStep = 0;
                    document.getElementById('gradingSection').style.display = 'block';
                    document.getElementById('nextBtn').style.display = 'none';
                    nextStep();
                }

                function nextStep() {
                    if (currentStep >= gradingSteps.length) {
                        // All steps completed successfully
                        alert("yay");
                        return;
                    }

                    const step = gradingSteps[currentStep];
                    const stepText = document.getElementById('stepText');
                    
                    switch (currentStep) {
                        case 0:
                            // Step 1: Check for A and out probes
                            if (checkProbes()) {
                                stepText.innerHTML = `<span style="color: green;">✓ ${step.name}</span>`;
                                step.status = "passed";
                                currentStep++;
                                document.getElementById('nextBtn').style.display = 'inline-block';
                            } else {
                                stepText.innerHTML = `<span style="color: red;">✗ ${step.name}</span><br>
                                    <small>Error: You need exactly one probe labeled "A" and one probe labeled "Q".</small>`;
                                step.status = "failed";
                            }
                            break;
                            
                        case 1:
                            // Step 2: Test A=0 → out=1
                            if (testCircuit(0, 1)) {
                                stepText.innerHTML = `<span style="color: green;">✓ ${step.name}</span>`;
                                step.status = "passed";
                                currentStep++;
                                document.getElementById('nextBtn').style.display = 'inline-block';
                            } else {
                                stepText.innerHTML = `<span style="color: red;">✗ ${step.name}</span><br>
                                    <small>Error: When A=0, the output should be 1. Check your NOT gate implementation.</small>`;
                                step.status = "failed";
                            }
                            break;
                            
                        case 2:
                            // Step 3: Test A=1 → out=0
                            if (testCircuit(1, 0)) {
                                stepText.innerHTML = `<span style="color: green;">✓ ${step.name}</span>`;
                                step.status = "passed";
                                currentStep++;
                                document.getElementById('nextBtn').style.display = 'inline-block';
                            } else {
                                stepText.innerHTML = `<span style="color: red;">✗ ${step.name}</span><br>
                                    <small>Error: When A=1, the output should be 0. Check your NOT gate implementation.</small>`;
                                step.status = "failed";
                            }
                            break;
                    }
                }

                function checkProbes() {
                    const probeLabels = window.MisticProbes.getProbeLabels();
                    const hasA = probeLabels.includes('A');
                    const hasQ = probeLabels.includes('Q');
                    return hasA && hasQ && probeLabels.length === 2;
                }

                function testCircuit(inputValue, expectedOutput) {
                    // Set the A probe to the input value
                    window.MisticProbes.setProbeValue('A', inputValue);
                    
                    // Recompute the circuit
                    window.MisticProbes.recompute();
                    
                    // Get the output value
                    const outputValue = window.MisticProbes.getProbeValue('Q');
                    
                    return outputValue === expectedOutput;
                }

                function drawNotGate() {
                    // Clear the canvas first
                    clearCanvas();
                    
                    // Execute the exact draw commands for the NOT gate
                    const commands = [
                        'draw VCC at (1, 1)',
                        'draw GND at (1, 11)',
                        'draw P+ from (5, 1) to (5, 5)',
                        'draw N+ from (5, 7) to (5, 11)',
                        'draw polysilicon from (3, 3) to (6, 3)',
                        'draw polysilicon from (3, 4) to (3, 9)',
                        'draw polysilicon from (1, 6) to (2, 6)',
                        'draw polysilicon from (4, 9) to (6, 9)',
                        'draw metal from (1, 1) to (9, 1)',
                        'draw metal from (5, 5) to (5, 7)',
                        'draw metal from (6, 6) to (8, 6)',
                        'draw metal from (1, 11) to (9, 11)',
                        'draw via at (5, 1)',
                        'draw via at (5, 5)',
                        'draw via at (5, 7)',
                        'draw via at (5, 11)'
                    ];
                    
                    // Execute each command in order
                    commands.forEach(command => {
                        const result = executeCommand(command);
                        console.log(`Executed: ${command} -> ${result}`);
                    });
                    
                    // Redraw everything
                    redrawAllTiles();
                }
<?php endif; ?>

                function readCircuit() {
                    console.log("=== CIRCUIT ANALYSIS ===");
                    console.log("Reading current circuit layout...");
                    
                    // Check if speech synthesis is available
                    if (!window.speechSynthesis) {
                        alert("Speech synthesis not available in this browser");
                        return;
                    }
                    
                    // Stop any current speech
                    window.speechSynthesis.cancel();
                    
                    // Analyze the circuit and generate commands
                    const commands = [];
                    
                    // Helper function to find connected line segments
                    function findConnectedLineSegments(startX, startY, layerIndex) {
                        const visited = new Set();
                        const segments = [];
                        
                        // First, collect all connected cells
                        const allConnected = [];
                        
                        function collectConnected(x, y) {
                            const key = `${x},${y}`;
                            if (visited.has(key) || x < 0 || x >= gridSize || y < 0 || y >= gridSize || !grid[y][x][layerIndex]) {
                                return;
                            }
                            visited.add(key);
                            allConnected.push({x, y});
                            
                            // Check adjacent cells
                            collectConnected(x+1, y);
                            collectConnected(x-1, y);
                            collectConnected(x, y+1);
                            collectConnected(x, y-1);
                        }
                        
                        collectConnected(startX, startY);
                        
                        if (allConnected.length === 0) return segments;
                        
                        // Now break the connected region into line segments
                        const remaining = new Set(allConnected.map(p => `${p.x},${p.y}`));
                        
                        while (remaining.size > 0) {
                            const start = remaining.values().next().value;
                            const [startX, startY] = start.split(',').map(Number);
                            
                            // Try to find horizontal line
                            let horizontalLine = [{x: startX, y: startY}];
                            remaining.delete(start);
                            
                            // Extend horizontally
                            let x = startX + 1;
                            while (remaining.has(`${x},${startY}`)) {
                                horizontalLine.push({x, y: startY});
                                remaining.delete(`${x},${startY}`);
                                x++;
                            }
                            
                            x = startX - 1;
                            while (remaining.has(`${x},${startY}`)) {
                                horizontalLine.unshift({x, y: startY});
                                remaining.delete(`${x},${startY}`);
                                x--;
                            }
                            
                            // If horizontal line is longer than 1, use it
                            if (horizontalLine.length > 1) {
                                segments.push(horizontalLine);
                                continue;
                            }
                            
                            // Try vertical line
                            let verticalLine = [{x: startX, y: startY}];
                            
                            // Extend vertically
                            let y = startY + 1;
                            while (remaining.has(`${startX},${y}`)) {
                                verticalLine.push({x: startX, y});
                                remaining.delete(`${startX},${y}`);
                                y++;
                            }
                            
                            y = startY - 1;
                            while (remaining.has(`${startX},${y}`)) {
                                verticalLine.unshift({x: startX, y});
                                remaining.delete(`${startX},${y}`);
                                y--;
                            }
                            
                            // If vertical line is longer than 1, use it
                            if (verticalLine.length > 1) {
                                segments.push(verticalLine);
                            } else {
                                // Single point
                                segments.push([{x: startX, y: startY}]);
                            }
                        }
                        
                        // Now add overlapping points to show connections
                        const finalSegments = [];
                        for (let i = 0; i < segments.length; i++) {
                            const segment = segments[i];
                            finalSegments.push(segment);
                            
                            // Check if this segment connects to any other segments
                            for (let j = i + 1; j < segments.length; j++) {
                                const otherSegment = segments[j];
                                
                                // Find intersection points
                                const intersection = segment.filter(point => 
                                    otherSegment.some(otherPoint => 
                                        point.x === otherPoint.x && point.y === otherPoint.y
                                    )
                                );
                                
                                // If there's an intersection, add the connecting point to both segments
                                if (intersection.length > 0) {
                                    intersection.forEach(point => {
                                        // Add to current segment if not already present
                                        if (!segment.some(p => p.x === point.x && p.y === point.y)) {
                                            segment.push(point);
                                        }
                                        // Add to other segment if not already present
                                        if (!otherSegment.some(p => p.x === point.x && p.y === point.y)) {
                                            otherSegment.push(point);
                                        }
                                    });
                                }
                            }
                        }
                        
                        return finalSegments;
                    }
                    
                    // Helper function to create draw command from segment
                    function createDrawCommand(segment, layerName) {
                        if (segment.length === 1) {
                            const p = segment[0];
                            return `draw ${layerName} at (${p.x}, ${p.y})`;
                        } else {
                            const first = segment[0];
                            const last = segment[segment.length - 1];
                            return `draw ${layerName} from (${first.x}, ${first.y}) to (${last.x}, ${last.y})`;
                        }
                    }
                    
                    // Track processed cells to avoid duplicates
                    const processed = new Set();
                    
                    // Process each layer
                    const layers = [
                        { index: layerVCC, name: 'VCC' },
                        { index: layerGND, name: 'GND' },
                        { index: layerPPlus, name: 'P+ diffusion' },
                        { index: layerNPlus, name: 'N+ diffusion' },
                        { index: layerPolysilicon, name: 'polysilicon' },
                        { index: layerMetal, name: 'metal' },
                        { index: layerContact, name: 'via' }
                    ];
                    
                    layers.forEach(layer => {
                        for (let y = 0; y < gridSize; y++) {
                            for (let x = 0; x < gridSize; x++) {
                                const key = `${layer.index},${x},${y}`;
                                if (!processed.has(key) && grid[y][x][layer.index]) {
                                    const segments = findConnectedLineSegments(x, y, layer.index);
                                    
                                    segments.forEach(segment => {
                                        // DEBUG: Log segment details for edge expansion experimentation
                                        console.log(`=== SEGMENT DEBUG ===`);
                                        console.log(`Layer: ${layer.name}`);
                                        console.log(`Segment:`, segment);
                                        console.log(`Bounds: (${Math.min(...segment.map(p => p.x))},${Math.min(...segment.map(p => p.y))}) to (${Math.max(...segment.map(p => p.x))},${Math.max(...segment.map(p => p.y))})`);
                                        console.log(`Length: ${segment.length}`);
                                        
                                        // TODO: Add edge expansion logic here
                                        // Check if we can expand edges without pulling in open grid points
                                        
                                        const command = createDrawCommand(segment, layer.name);
                                        commands.push(command);
                                        
                                        // Mark all cells in segment as processed
                                        segment.forEach(p => {
                                            processed.add(`${layer.index},${p.x},${p.y}`);
                                        });
                                    });
                                }
                            }
                        }
                    });
                    
                    // Handle probes separately
                    Object.keys(probeLabels).forEach(key => {
                        const [x, y] = key.split('_').map(Number);
                        commands.push(`draw probe "${probeLabels[key]}" at (${x}, ${y})`);
                    });
                    
                    // Output the commands in a clean format
                    console.log("=== DRAWING COMMANDS FOR ACCESSIBILITY ===");
                    console.log("Commands to recreate this circuit:");
                    console.log("clear");
                    
                    // Output all commands in order
                    commands.forEach(cmd => {
                        console.log(`  ${cmd}`);
                    });
                    
                    console.log("redraw");
                    console.log("=== END COMMANDS ===");
                    
                    // Also show a summary
                    console.log("=== CIRCUIT SUMMARY ===");
                    console.log(`Grid size: ${gridSize}x${gridSize}`);
                    console.log(`Total commands: ${commands.length}`);
                    console.log(`Probes found: ${Object.keys(probeLabels).length}`);
                    Object.keys(probeLabels).forEach(key => {
                        const [x, y] = key.split('_');
                        console.log(`  - Probe "${probeLabels[key]}" at (${x}, ${y})`);
                    });
                    
                    // Speak the commands with pauses and proper ordering
                    function speakCommands() {
                        let allCommands = [];
                        
                        // Group commands by type for speech organization
                        const groupedCommands = {
                            'VCC': commands.filter(cmd => cmd.includes('VCC')),
                            'GND': commands.filter(cmd => cmd.includes('GND')),
                            'P+ diffusion': commands.filter(cmd => cmd.includes('P+ diffusion')),
                            'N+ diffusion': commands.filter(cmd => cmd.includes('N+ diffusion')),
                            'polysilicon': commands.filter(cmd => cmd.includes('polysilicon')),
                            'metal': commands.filter(cmd => cmd.includes('metal')),
                            'via': commands.filter(cmd => cmd.includes('via')),
                            'probe': commands.filter(cmd => cmd.includes('probe'))
                        };
                        
                        // Collect all commands and sort by position (upper-left to lower-right)
                        Object.keys(groupedCommands).forEach(layer => {
                            if (groupedCommands[layer].length > 0) {
                                groupedCommands[layer].forEach(cmd => {
                                    // Extract coordinates for sorting
                                    const coords = cmd.match(/\((\d+),\s*(\d+)\)/);
                                    if (coords) {
                                        const x = parseInt(coords[1]);
                                        const y = parseInt(coords[2]);
                                        allCommands.push({
                                            cmd: cmd,
                                            x: x,
                                            y: y,
                                            layer: layer
                                        });
                                    } else {
                                        allCommands.push({
                                            cmd: cmd,
                                            x: 0,
                                            y: 0,
                                            layer: layer
                                        });
                                    }
                                });
                            }
                        });
                        
                        // Sort by y first (top to bottom), then by x (left to right)
                        allCommands.sort((a, b) => {
                            if (a.y !== b.y) return a.y - b.y;
                            return a.x - b.x;
                        });
                        
                        // Group by layer for speech
                        const layerGroups = {};
                        allCommands.forEach(item => {
                            if (!layerGroups[item.layer]) {
                                layerGroups[item.layer] = [];
                            }
                            layerGroups[item.layer].push(item.cmd);
                        });
                        
                        // Speak with pauses
                        let speechQueue = [];
                        speechQueue.push("Circuit drawing commands.");
                        
                        Object.keys(layerGroups).forEach(layer => {
                            speechQueue.push(`${layer}:`);
                            layerGroups[layer].forEach(cmd => {
                                speechQueue.push(cmd);
                                speechQueue.push("pause"); // 0.5 second pause
                            });
                        });
                        
                        // Speak the queue with pauses
                        let index = 0;
                        function speakNext() {
                            if (index >= speechQueue.length) return;
                            
                            const text = speechQueue[index];
                            if (text === "pause") {
                                // Wait 500ms then continue
                                setTimeout(speakNext, 500);
                            } else {
                                const utterance = new SpeechSynthesisUtterance(text);
                                utterance.rate = 0.8;
                                utterance.pitch = 1.0;
                                utterance.volume = 1.0;
                                
                                // Try to use a good voice
                                const voices = window.speechSynthesis.getVoices();
                                const preferredVoice = voices.find(voice => 
                                    voice.name.includes('Google') || 
                                    voice.name.includes('Samantha') || 
                                    voice.name.includes('Alex')
                                );
                                if (preferredVoice) {
                                    utterance.voice = preferredVoice;
                                }
                                
                                utterance.onend = speakNext;
                                window.speechSynthesis.speak(utterance);
                            }
                            index++;
                        }
                        
                        speakNext();
                    }
                    
                    speakCommands();
                    
                    console.log("Speaking circuit commands with pauses...");
                }

                // Drag handling for the modal (mouse + touch)
                (function enableDrag() {
                    if (!layerModal || !layerModalHeader) return;
                    let dragging = false;
                    let startClientX = 0, startClientY = 0;
                    let startLeft = 0, startTop = 0;

                    function onPointerDown(e) {
                        e.preventDefault();
                        dragging = true;
                        const rect = layerModal.getBoundingClientRect();
                        const containerRect = canvasContainer.getBoundingClientRect();
                        startLeft = rect.left - containerRect.left;
                        startTop = rect.top - containerRect.top;
                        if (e.touches) {
                            startClientX = e.touches[0].clientX;
                            startClientY = e.touches[0].clientY;
                        } else {
                            startClientX = e.clientX;
                            startClientY = e.clientY;
                        }
                        layerModalHeader.style.cursor = 'grabbing';
                        window.addEventListener('mousemove', onPointerMove, { passive: false });
                        window.addEventListener('mouseup', onPointerUp, { passive: false });
                        window.addEventListener('touchmove', onPointerMove, { passive: false });
                        window.addEventListener('touchend', onPointerUp, { passive: false });
                    }

                    function onPointerMove(e) {
                        if (!dragging) return;
                        e.preventDefault();
                        let clientX, clientY;
                        if (e.touches) {
                            clientX = e.touches[0].clientX;
                            clientY = e.touches[0].clientY;
                        } else {
                            clientX = e.clientX;
                            clientY = e.clientY;
                        }
                        const dx = clientX - startClientX;
                        const dy = clientY - startClientY;
                        const containerRect = canvasContainer.getBoundingClientRect();
                        const maxLeft = containerRect.width - layerModal.offsetWidth;
                        const maxTop = containerRect.height - layerModal.offsetHeight;
                        const newLeft = Math.max(0, Math.min(maxLeft, startLeft + dx));
                        const newTop = Math.max(0, Math.min(maxTop, startTop + dy));
                        layerModal.style.left = newLeft + 'px';
                        layerModal.style.top = newTop + 'px';
                        modalUserMoved = true;
                    }

                    function onPointerUp(e) {
                        dragging = false;
                        layerModalHeader.style.cursor = 'grab';
                        window.removeEventListener('mousemove', onPointerMove);
                        window.removeEventListener('mouseup', onPointerUp);
                        window.removeEventListener('touchmove', onPointerMove);
                        window.removeEventListener('touchend', onPointerUp);
                    }

                    layerModalHeader.addEventListener('mousedown', onPointerDown);
                    layerModalHeader.addEventListener('touchstart', onPointerDown, { passive: false });
                })();

<?php if ($USER) : ?>
                // Drag handling for the assignment modal (mouse + touch)
                (function enableAssignmentDrag() {
                    if (!assignmentModal || !assignmentModalHeader) return;
                    let dragging = false;
                    let startClientX = 0, startClientY = 0;
                    let startLeft = 0, startTop = 0;

                    function onPointerDown(e) {
                        e.preventDefault();
                        dragging = true;
                        const rect = assignmentModal.getBoundingClientRect();
                        const containerRect = canvasContainer.getBoundingClientRect();
                        startLeft = rect.left - containerRect.left;
                        startTop = rect.top - containerRect.top;
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
                    }

                    function onPointerMove(e) {
                        if (!dragging) return;
                        e.preventDefault();
                        let clientX, clientY;
                        if (e.touches) {
                            clientX = e.touches[0].clientX;
                            clientY = e.touches[0].clientY;
                        } else {
                            clientX = e.clientX;
                            clientY = e.clientY;
                        }
                        const dx = clientX - startClientX;
                        const dy = clientY - startClientY;
                        const containerRect = canvasContainer.getBoundingClientRect();
                        const maxLeft = containerRect.width - assignmentModal.offsetWidth;
                        const maxTop = containerRect.height - assignmentModal.offsetHeight;
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
<?php endif; ?>

                // Responsive canvas sizing: scale with window, keep square
                function resizeCanvasToContainer() {
                    const horizontalPadding = 40; // breathing room around canvas in layout
                    // Use 80% of viewport width on large screens (width-driven sizing)
                    const targetWidth = Math.floor(window.innerWidth * 0.8);
                    const maxWidth = Math.max(320, Math.min(targetWidth, window.innerWidth - horizontalPadding));
                    // Fixed tile size; compute how many tiles fit horizontally only
                    const fitCols = Math.floor(maxWidth / tileSize);
                    const newGridSize = Math.min(MAX_GRID_SIZE, Math.max(5, fitCols));
                    const pixelSize = newGridSize * tileSize;
                    if (newGridSize !== gridSize) {
                        resizeGrid(newGridSize);
                    }
                    canvas.width = pixelSize;
                    canvas.height = pixelSize;
                    // Redraw grid according to new canvas size
                    redrawAllTiles();
                    // Keep modal near the top and horizontally centered while resizing if visible
                    if (!layerModal.classList.contains('hidden')) {
                        centerModalTopCentered();
                    }
                }

                function centerModalOverCanvas() {
                    const containerRect = canvasContainer.getBoundingClientRect();
                    const modalW = layerModal.offsetWidth;
                    const modalH = layerModal.offsetHeight;
                    const left = Math.max(0, Math.floor((containerRect.width - modalW) / 2));
                    const top = Math.max(0, Math.floor((containerRect.height - modalH) / 2));
                    layerModal.style.left = left + 'px';
                    layerModal.style.top = top + 'px';
                }

                function centerModalTopCentered() {
                    const containerRect = canvasContainer.getBoundingClientRect();
                    const modalW = layerModal.offsetWidth;
                    const left = Math.max(0, Math.floor((containerRect.width - modalW) / 2));
                    const top = 8; // keep near top during resizing
                    layerModal.style.left = left + 'px';
                    layerModal.style.top = top + 'px';
                }

                window.addEventListener('resize', resizeCanvasToContainer);
                // Initial sizing
                resizeCanvasToContainer();

                function drawRubberBand(startX, startY, endX, endY) {
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    redrawAllTiles();

                    const x1 = Math.min(startX, endX);
                    const y1 = Math.min(startY, endY);
                    const x2 = Math.max(startX, endX);
                    const y2 = Math.max(startY, endY);
                    ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
                    ctx.lineWidth = 2;
                    ctx.strokeRect(x1 * tileSize, y1 * tileSize, (x2 - x1 + 1) * tileSize, (y2 - y1 + 1) * tileSize);
                }

                function fillTiles(startX, startY, endX, endY) {
                    const x1 = Math.min(startX, endX);
                    const y1 = Math.min(startY, endY);
                    const x2 = Math.max(startX, endX);
                    const y2 = Math.max(startY, endY);

                    for (let i = y1; i <= y2; i++) {
                        for (let j = x1; j <= x2; j++) {
                            const layerIndex = getLayerIndex(currentLayer);
                            if (currentLayer === 'erase') {
                                for (let k = 0; k < 7; k++) {
                                    grid[i][j][k] = false;
                                }
                            } else if (layerIndex !== -1) {
                                grid[i][j][layerIndex] = true;
                            }
                        }
                    }
                    redrawAllTiles();
                }

                function redrawAllTiles() {
                    compute();
                    for (let i = 0; i < grid.length; i++) {
                        for (let j = 0; j < grid[i].length; j++) {
                            redrawTile(j, i);
                        }
                    }
                }

                function redrawTile(x, y) {
                    ctx.clearRect(x * tileSize, y * tileSize, tileSize, tileSize);
                    let voltage = 0;
                    for (let i = 0; i < 8; i++) {
                        if (grid[y][x][i]) {
                            if (volts[y][x][i] == 1) {
                                voltage = 1;
                            } else if (volts[y][x][i] == -1) {
                                voltage = -1;
                            }
                            if (i === 3) {
                                drawContactLines(x, y);
                            } else if (i === 5) {
                                if ( volts[y][x][i] == 100 ) {
                                    drawText(x, y, '🔥');
                                } else {
                                    drawRectangle(x, y, 0);
                                    drawText(x, y, 'V');
                                }
                            } else if (i === 6) {
                                if ( volts[y][x][i] == 100 ) {
                                    drawText(x, y, '🔥');
                                } else {
                                    drawRectangle(x, y, 0);
                                    drawText(x, y, 'G');
                                }
                            } else if (i === 7) {
                                // Probe rendering
                                drawRectangle(x, y, 0);
                                const label = probeLabels[x + '_' + y] || '?';
                                drawText(x, y, label);
                            } else {
                                ctx.fillStyle = Object.values(layers)[i];
                                ctx.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);
                                if (grid[y][x][layerContact] || grid[y][x][layerVCC] || grid[y][x][layerGND] || grid[y][x][layerProbe]) {
                                    // No voltage
                                } else {
                                    if ( i == layerNPlus && grid[y][x][layerPolysilicon] && volts[y][x][layerPolysilicon] == -1) {
                                        drawText(x, y, '🚫');
                                    } else if (i == layerPPlus && grid[y][x][layerPolysilicon] && volts[y][x][layerPolysilicon] == 1) {
                                        drawText(x, y, '🚫');
                                    } else if (voltage == 1) {
                                        drawText(x, y, '+');
                                    } else if (voltage == -1) {
                                        drawText(x, y, '-');
                                    }
                                }
                            }
                        }
                    }
                }

                function drawRectangle(x, y, inset) {
                    ctx.strokeStyle = 'black';
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.strokeRect(x * tileSize + inset, y * tileSize + inset, tileSize - inset * 2, tileSize - inset * 2);
                    ctx.stroke();
                }

                function drawContactLines(x, y) {
                    const inset = tileSize / 4;
                    drawRectangle(x, y, inset);
                    ctx.strokeStyle = 'black';
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.moveTo(x * tileSize + inset, y * tileSize + inset);
                    ctx.lineTo((x + 1) * tileSize - inset, (y + 1) * tileSize - inset);
                    ctx.moveTo((x + 1) * tileSize - inset, y * tileSize + inset);
                    ctx.lineTo(x * tileSize + inset, (y + 1) * tileSize - inset);
                    ctx.stroke();
                }

                function drawText(x, y, text) {
                    ctx.fillStyle = 'black';
                    ctx.font = 'bold 12px Arial';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(text, x * tileSize + tileSize / 2, y * tileSize + tileSize / 2);
                }

                // Draws the vertical layer stack preview for a given grid cell
                function drawLayerView(gridX, gridY) {
                    if (!lctx || !layerCanvas) return;
                    lctx.clearRect(0, 0, layerCanvas.width, layerCanvas.height);

                    if (gridX < 0 || gridX >= gridSize || gridY < 0 || gridY >= gridSize) return;

                    // Header
                    lctx.fillStyle = 'black';
                    lctx.font = '12px Arial';
                    lctx.textAlign = 'left';
                    lctx.textBaseline = 'alphabetic';
                    lctx.fillText('(' + gridX + ', ' + gridY + ')', 8, 16);

                    const padding = 12;
                    const labelGutter = 70; // reserved space on the left for text labels
                    const left = padding + labelGutter;
                    const top = 28;
                    const width = layerCanvas.width - padding * 2 - labelGutter;
                    const layerHeight = 30;
                    const gapHeight = 12; // gap between metal and P+

                    // Top to bottom visual order: N+, Poly, P+, gap, Metal (metal is bottom)
                    const presentN = grid[gridY][gridX][layerNPlus];
                    const presentP = grid[gridY][gridX][layerPPlus];
                    const presentPoly = grid[gridY][gridX][layerPolysilicon];
                    const presentMetal = grid[gridY][gridX][layerMetal];
                    const viaPresent = grid[gridY][gridX][layerContact] || grid[gridY][gridX][layerVCC] || grid[gridY][gridX][layerGND];

                    const slots = [
                        { name: 'N+ diffusion', color: layers['N+ diffusion'], present: presentN, height: layerHeight },
                        { name: 'polysilicon', color: layers['polysilicon'], present: presentPoly, height: layerHeight },
                        { name: 'P+ diffusion', color: layers['P+ diffusion'], present: presentP, height: layerHeight },
                        { name: 'gap', color: 'rgba(0,0,0,0)', present: true, height: gapHeight },
                        { name: 'metal', color: layers['metal'], present: presentMetal, height: layerHeight }
                    ];

                    const viaWidth = Math.max(12, Math.floor(width * 0.4));
                    const viaX = left + Math.floor((width - viaWidth) / 2);

                    let yPos = top;
                    for (let s of slots) {
                        // outline
                        lctx.strokeStyle = '#333';
                        lctx.lineWidth = 1;
                        lctx.strokeRect(left, yPos, width, s.height);

                        if (s.name !== 'gap' && s.present) {
                            lctx.fillStyle = s.color;
                            lctx.fillRect(left, yPos, width, s.height);
                        }

                        if (viaPresent) {
                            // drill a hole through every layer slot
                            lctx.clearRect(viaX, yPos, viaWidth, s.height);
                        }

                        // Label (accessibility): draw to the left of the bar, vertically centered
                        lctx.fillStyle = '#000';
                        lctx.font = '12px Arial';
                        lctx.textAlign = 'right';
                        lctx.textBaseline = 'middle';
                        const labelX = left - 6; // small gap from bar
                        const labelY = yPos + s.height / 2;
                        const labelText = s.name === 'gap' ? 'gap' : s.name;
                        lctx.fillText(labelText, labelX, labelY);

                        yPos += s.height;
                    }

                    if (viaPresent) {
                        // Fill the drilled center with metal (same as layer metal color)
                        lctx.fillStyle = layers['metal'];
                        lctx.fillRect(viaX, top, viaWidth, yPos - top);
                        lctx.strokeStyle = '#000';
                        lctx.strokeRect(viaX, top, viaWidth, yPos - top);
                    }
                }

                function clearLayerView() {
                    if (!lctx || !layerCanvas) return;
                    lctx.clearRect(0, 0, layerCanvas.width, layerCanvas.height);
                }

                function getLayerIndex(layer) {
                    // Convert to lowercase for case-insensitive matching
                    const layerLower = layer.toLowerCase();
                    switch (layerLower) {
                        case 'polysilicon': return layerPolysilicon;
                        case 'n+ diffusion': return layerNPlus;
                        case 'n+': return layerNPlus;  // Shorter alias
                        case 'p+ diffusion': return layerPPlus;
                        case 'p+': return layerPPlus;  // Shorter alias
                        case 'contact': return layerContact;
                        case 'via': return layerContact;  // Alias for contact
                        case 'metal': return layerMetal;
                        case 'vcc': return layerVCC;
                        case 'gnd': return layerGND;
                        case 'probe': return layerProbe;
                        case 'erase': return -1;
                        default: return -1;
                    }
                }

                function compute() {
                    for (let i = 0; i < grid.length; i++) {
                        for (let j = 0; j < grid[i].length; j++) {
                            for (let l = 0; l < 8; l++) {
                                volts[i][j][l] = 0;
                            }
                        }
                    }

                    for (let i = 0; i < grid.length; i++) {
                        for (let j = 0; j < grid[i].length; j++) {
                            if (grid[i][j][layerVCC]) {
                                for (let l = 0; l < 8; l++) {
                                    volts[i][j][l] = 1;
                                }
                            }
                            if (grid[i][j][layerGND]) {
                                for (let l = 0; l < 8; l++) {
                                    volts[i][j][l] = -1;
                                }
                            }
                        }
                    }

                    let changed = true;
                    for (let phase = 0; phase < 5; phase++) {
                        try {
                            changed = false;
                            for (let i = 0; i < grid.length; i++) {
                                for (let j = 0; j < grid[i].length; j++) {
                                    for (let l = 0; l < 8; l++) {
                                        if (grid[i][j][l] && volts[i][j][l] != 0) {
                                            changed = changed | propogateVoltage(volts[i][j][l], i-1, j, l);
                                            changed = changed | propogateVoltage(volts[i][j][l], i, j-1, l);
                                            changed = changed | propogateVoltage(volts[i][j][l], i+1, j, l);
                                            changed = changed | propogateVoltage(volts[i][j][l], i, j+1, l);
                                        }
                                    }
                                }
                            }

                            for (let i = 0; i < grid.length; i++) {
                                for (let j = 0; j < grid[i].length; j++) {
                                    if (grid[i][j][layerContact]) {
                                        voltage = 0;
                                        for (let l = 0; l < 8; l++) {
                                            if (volts[i][j][l] != 0) voltage = volts[i][j][l];
                                        }
                                        for (let l = 0; l < 8; l++) {
                                            if (volts[i][j][l] != voltage) {
                                                changed = true;
                                                volts[i][j][l] = voltage;
                                            }
                                        }
                                    }
                                }
                            }
                            if (!changed) break;
                        } catch (e) {
                            break;
                        }
                    }
                }

                function propogateVoltage(voltage, i, j, l) {
                    if (i < 0 || i+1 > grid.length) return false;
                    if (j < 0 || j+1 > grid.length) return false;

                    if (!grid[i][j][l]) return false;
                    if (volts[i][j][l] == -1*voltage && voltage != 0) {
                        console.log('short detected', i, j, l);
                        for ( let ll = 0; ll < 8; ll++) volts[i][j][ll] = 100;
                        throw new Error('short detected');
                    }
                    if (volts[i][j][l] == voltage) return false;

                    if (l == layerNPlus && grid[i][j][layerPolysilicon] && volts[i][j][layerPolysilicon] != 1) return;
                    if (l == layerPPlus && grid[i][j][layerPolysilicon] && volts[i][j][layerPolysilicon] != -1) return;

                    volts[i][j][l] = voltage;

                    if (i > 0) propogateVoltage(voltage, i-1, j, l);
                    if (j > 0) propogateVoltage(voltage, i, j-1, l);
                    if (i < grid.length-1) propogateVoltage(voltage, i+1, j, l);
                    if (j < grid.length-1) propogateVoltage(voltage, i, j+1, l);
                    return true;
                }

                // JavaScript API for probe access
                window.MisticProbes = {
                    // Get the voltage value at a probe with the given label
                    getProbeValue: function(label) {
                        for (let key in probeLabels) {
                            if (probeLabels[key] === label) {
                                const [x, y] = key.split('_').map(Number);
                                if (grid[y] && grid[y][x] && grid[y][x][layerProbe]) {
                                    // Return the voltage at this location
                                    let voltage = 0;
                                    for (let l = 0; l < 8; l++) {
                                        if (volts[y][x][l] == 1) voltage = 1;
                                        else if (volts[y][x][l] == -1) voltage = -1;
                                    }
                                    return voltage;
                                }
                            }
                        }
                        return null; // Probe not found
                    },

                    // Set the voltage value at a probe with the given label
                    setProbeValue: function(label, voltage) {
                        for (let key in probeLabels) {
                            if (probeLabels[key] === label) {
                                const [x, y] = key.split('_').map(Number);
                                if (grid[y] && grid[y][x] && grid[y][x][layerProbe]) {
                                    // Set voltage for all layers at this location
                                    for (let l = 0; l < 8; l++) {
                                        volts[y][x][l] = voltage;
                                    }
                                    redrawTile(x, y);
                                    return true;
                                }
                            }
                        }
                        return false; // Probe not found
                    },

                    // Get all probe labels
                    getProbeLabels: function() {
                        return Object.values(probeLabels);
                    },

                    // Get probe locations (x, y coordinates)
                    getProbeLocations: function() {
                        const locations = {};
                        for (let key in probeLabels) {
                            const [x, y] = key.split('_').map(Number);
                            locations[probeLabels[key]] = {x: x, y: y};
                        }
                        return locations;
                    },

                    // Force recomputation of the circuit
                    recompute: function() {
                        compute();
                        redrawAllTiles();
                    }
                };
            </script>

            <!-- Command line interface -->
            <div class="command-line">
                <input type="text" id="commandInput" placeholder="Type commands here... (e.g., 'clear', 'draw metal at (5,5)', 'draw metal from (5,5) to (10,10)', 'redraw')">
                <div class="status" id="status">Ready. Type 'help' for available commands.</div>
            </div>

            <style>
                /* Command line interface styles */
                .command-line {
                    position: fixed;
                    bottom: 0;
                    left: 0;
                    right: 0;
                    background-color: #2c3e50;
                    color: white;
                    padding: 15px 20px;
                    border-top: 2px solid #3498db;
                    z-index: 1000;
                }

                .command-line input {
                    width: 100%;
                    background-color: #34495e;
                    color: #ecf0f1;
                    border: 1px solid #7f8c8d;
                    padding: 10px 15px;
                    border-radius: 4px;
                    font-family: 'Courier New', monospace;
                    font-size: 14px;
                    margin-bottom: 8px;
                }

                .command-line input:focus {
                    outline: none;
                    border-color: #3498db;
                    box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
                }

                .command-line input::placeholder {
                    color: #95a5a6;
                }

                .status {
                    font-size: 12px;
                    color: #bdc3c7;
                    font-family: 'Courier New', monospace;
                }

                /* Adjust canvas container to make room for command line */
                #canvasContainer {
                    margin-bottom: 100px;
                }
            </style>

            <script>
                // Command line interface functionality
                const commandInput = document.getElementById('commandInput');
                const status = document.getElementById('status');
                let commandHistory = [];
                let historyIndex = -1;

                // Command history management
                function addToHistory(command) {
                    commandHistory.push(command);
                    if (commandHistory.length > 50) commandHistory.shift(); // Keep last 50 commands
                    historyIndex = commandHistory.length;
                }

                function getPreviousCommand() {
                    if (historyIndex > 0) {
                        historyIndex--;
                        return commandHistory[historyIndex];
                    }
                    return null;
                }

                function getNextCommand() {
                    if (historyIndex < commandHistory.length - 1) {
                        historyIndex++;
                        return commandHistory[historyIndex];
                    } else if (historyIndex === commandHistory.length - 1) {
                        historyIndex = commandHistory.length;
                        return '';
                    }
                    return null;
                }

                function updateCommandInput(command) {
                    commandInput.value = command || '';
                    commandInput.setSelectionRange(commandInput.value.length, commandInput.value.length);
                }

                // Command execution
                function executeCommand(command) {
                    const parts = command.toLowerCase().split(' ');
                    
                    if (parts[0] === 'clear') {
                        clearCanvas();
                        return 'Canvas cleared.';
                    } else if (parts[0] === 'redraw') {
                        redrawAllTiles();
                        return 'Canvas redrawn.';
                    } else if (parts[0] === 'draw') {
                        // Parse draw commands like: draw metal at (5,5) or draw metal rectangle from (5,5) to (10,10)
                        if (parts.length < 4) {
                            return 'Error: Invalid draw command. Use: draw <layer> at (x,y) or draw <layer> rectangle from (x,y) to (x,y)';
                        }
                        
                        const layer = parts[1];
                        const layerIndex = getLayerIndex(layer);
                        
                        if (layerIndex === -1) {
                            return `Error: Invalid layer "${layer}". Valid layers: polysilicon, n+ diffusion, p+ diffusion, contact, metal, vcc, gnd, probe`;
                        }
                        
                        if (parts[2] === 'at') {
                            // Single point: draw metal at (5,5)
                            // Handle spaces around coordinates by using a more flexible regex
                            const commandStr = command.toLowerCase();
                            const coords = commandStr.match(/at\s*\((\d+)\s*,\s*(\d+)\)/);
                            if (!coords) {
                                return 'Error: Invalid coordinates. Use format: (x,y)';
                            }
                            const x = parseInt(coords[1]);
                            const y = parseInt(coords[2]);
                            
                            if (x < 0 || x >= gridSize || y < 0 || y >= gridSize) {
                                return `Error: Coordinates (${x},${y}) out of bounds. Grid size is ${gridSize}x${gridSize}`;
                            }
                            
                            grid[y][x][layerIndex] = true;
                            redrawAllTiles();
                            return `Drew ${layer} at (${x},${y})`;
                            
                        } else if (parts[2] === 'from') {
                            // Rectangle: draw metal from (5,5) to (10,10)
                            // Check if this layer supports rectangle drawing
                            if (layerIndex === layerContact || layerIndex === layerProbe) {
                                return `Error: ${layer} layers only support single-point placement. Use: draw ${layer} at (x,y)`;
                            }
                            
                            // Handle spaces around coordinates by joining parts and using a more flexible regex
                            const commandStr = command.toLowerCase();
                            const fromMatch = commandStr.match(/from\s*\((\d+)\s*,\s*(\d+)\)/);
                            const toMatch = commandStr.match(/to\s*\((\d+)\s*,\s*(\d+)\)/);
                            
                            if (!fromMatch || !toMatch) {
                                return 'Error: Invalid coordinates. Use format: (x,y) to (x,y)';
                            }
                            
                            const fromX = parseInt(fromMatch[1]);
                            const fromY = parseInt(fromMatch[2]);
                            const toX = parseInt(toMatch[1]);
                            const toY = parseInt(toMatch[2]);
                            
                            if (fromX < 0 || fromX >= gridSize || fromY < 0 || fromY >= gridSize ||
                                toX < 0 || toX >= gridSize || toY < 0 || toY >= gridSize) {
                                return `Error: Coordinates out of bounds. Grid size is ${gridSize}x${gridSize}`;
                            }
                            
                            const minX = Math.min(fromX, toX);
                            const maxX = Math.max(fromX, toX);
                            const minY = Math.min(fromY, toY);
                            const maxY = Math.max(fromY, toY);
                            
                            for (let y = minY; y <= maxY; y++) {
                                for (let x = minX; x <= maxX; x++) {
                                    grid[y][x][layerIndex] = true;
                                }
                            }
                            
                            redrawAllTiles();
                            return `Drew ${layer} from (${minX},${minY}) to (${maxX},${maxY})`;
                        } else {
                            return 'Error: Invalid draw command. Use: draw <layer> at (x,y) or draw <layer> from (x,y) to (x,y)';
                        }
                    } else if (parts[0] === 'help') {
                        return `Available commands:
- clear: Clear the entire canvas
- redraw: Redraw all tiles
- draw <layer> at (x,y): Draw a single point (all layers)
- draw <layer> from (x,y) to (x,y): Draw a rectangle (polysilicon, n+ diffusion, p+ diffusion, metal, vcc, gnd)
- help: Show this help message

Valid layers: polysilicon, n+ diffusion/n+, p+ diffusion/p+, contact/via, metal, vcc, gnd, probe
Note: contact/via and probe layers only support single-point placement with 'at'
Grid size: ${gridSize}x${gridSize}`;
                    } else {
                        return `Unknown command: "${parts[0]}". Type 'help' for available commands.`;
                    }
                }

                // Event listeners
                commandInput.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        const command = commandInput.value.trim();
                        if (command) {
                            addToHistory(command);
                            const result = executeCommand(command);
                            status.textContent = result;
                            commandInput.value = '';
                        }
                    }
                });

                // Arrow key navigation for command history
                commandInput.addEventListener('keydown', (e) => {
                    if (e.key === 'ArrowUp') {
                        e.preventDefault();
                        const previousCommand = getPreviousCommand();
                        if (previousCommand !== null) {
                            updateCommandInput(previousCommand);
                        }
                    } else if (e.key === 'ArrowDown') {
                        e.preventDefault();
                        const nextCommand = getNextCommand();
                        if (nextCommand !== null) {
                            updateCommandInput(nextCommand);
                        }
                    }
                });

                // Focus command input when page loads
                window.addEventListener('load', () => {
                    commandInput.focus();
                });
            </script>
        </center>
    </body>
</html>
