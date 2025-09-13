<?php

require_once "../config.php";
require_once "register.php";
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
        <title><?php echo(htmlentities($REGISTER_LTI2["name"])); ?></title>
        <link rel="stylesheet" href="style.css">
        <link rel="stylesheet" href="../common/modal-styles.css">
    </head>
    <body class="tool-interface">
        <center>
            <h1><?php echo(htmlentities($REGISTER_LTI2["name"])); ?></h1>
            <div id="toolbar">
                <div class="draw-dropdown">
                    <button class="draw-dropdown-btn" id="layersDropdownBtn" onclick="toggleLayersDropdown()">
                        Layers ▼
                    </button>
                    <div class="draw-dropdown-content" id="layersDropdown">
                        <div class="dropdown-item" onclick="setLayer('')">
                            Layers
                        </div>
                        <div class="dropdown-item" onclick="setLayer('metal')">
                            <span class="color-indicator" style="background-color: rgba(0, 0, 255, 0.3);"></span>
                            Metal
                        </div>
                        <div class="dropdown-item" onclick="setLayer('polysilicon')">
                            <span class="color-indicator" style="background-color: rgba(255, 0, 0, 0.2);"></span>
                            Poly
                        </div>
                        <div class="dropdown-item" onclick="setLayer('N+ diffusion')">
                            <span class="color-indicator" style="background-color: rgba(0, 255, 0, 0.3);"></span>
                            N+
                        </div>
                        <div class="dropdown-item" onclick="setLayer('P+ diffusion')">
                            <span class="color-indicator" style="background-color: rgba(255, 165, 0, 0.5);"></span>
                            P+
                        </div>
                        <div class="dropdown-item" onclick="setLayer('erase')">
                            <span class="color-indicator" style="background-color: rgba(255, 255, 255, 1);">🧽</span>
                            Erase
                        </div>
                        <div class="dropdown-item" onclick="setDetailMode()">
                            <span class="color-indicator" style="background-color: #eef7ff; display: flex; align-items: center; justify-content: center; color: #333; font-weight: bold;">🔍</span>
                            Detail
                        </div>
                    </div>
                </div>
                <div class="draw-dropdown">
                    <button class="draw-dropdown-btn" id="contactsDropdownBtn" onclick="toggleContactsDropdown()">
                        Contacts ▼
                    </button>
                    <div class="draw-dropdown-content" id="contactsDropdown">
                        <div class="dropdown-item" onclick="setLayer('contact')">
                            <span class="color-indicator via-icon"></span>
                            Via
                        </div>
                        <div class="dropdown-item" onclick="setLayer('VCC')">
                            <span class="color-indicator" style="background-color: #f0f0f0; display: flex; align-items: center; justify-content: center; color: #333; font-weight: bold;">+</span>
                            VCC
                        </div>
                        <div class="dropdown-item" onclick="setLayer('GND')">
                            <span class="color-indicator" style="background-color: #f0f0f0; display: flex; align-items: center; justify-content: center; color: #333; font-weight: bold;">-</span>
                            GND
                        </div>
                        <?php if ($USER) : ?>
                        <div class="dropdown-item" onclick="setLayer('probe')">
                            <span class="color-indicator" style="background-color: rgba(128, 0, 128, 0.3);"></span>
                            Probe
                        </div>
                        <?php endif; ?>
                    </div>
                </div>
                <button onclick="confirmClear()" style="background-color: #ffe6e6;">🗑️</button>
                <select id="storageDropdown" style="padding: 6px 12px; background-color: #6c757d; color: white; border: none; border-radius: 4px;">
                    <option value="">💾 Storage</option>
                    <option value="save">💾 Save Layout</option>
                    <option value="load">📁 Load Layout</option>
                    <option value="delete">🗑️ Delete Layout</option>
                </select>
                <button onclick="toggleCommandLine()" style="background-color: #6c757d; color: white;">Commands</button>
<?php if ($USER) : ?>
                <button id="assignmentBtn" style="background-color:#fff0e6;">Assignment</button>
<?php endif; ?>
                <button onclick="readCircuit()" style="background-color: #607D8B; color: white;">Read Circuit</button>
<?php if ($USER && $USER->instructor) : ?>
                <a href="instructor.php" style="background-color: #28a745; color: white; font-size: 14px; padding: 8px 15px; border-radius: 6px; border: 1px solid #ccc; cursor: pointer; min-width: 60px; transition: all 0.2s ease; box-shadow: 0 2px 4px rgba(0,0,0,0.1); text-decoration: none; display: inline-block; margin: 2px;">Instructor</a>
<?php endif; ?>
                <button onclick="openDocumentation()" style="background-color: #FF9800; color: white; font-weight: bold; font-size: 16px; width: 40px; height: 40px; border-radius: 50%;">?</button>
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
                        <p id="assignmentInstructions">
                            <!-- Instructions will be loaded dynamically from the exercise class -->
                        </p>
                        <div id="gradingSection" style="margin-top: 20px; display: none;">
                            <h3>VLSI Layout Grading</h3>
                            <div id="stepDisplay"></div>
                            <button id="gradeBtn" onclick="startGrading()">Start Grading</button>
                        </div>
                        <div id="startGradingSection" style="margin-top: 20px;">
                            <button id="startGradeBtn" onclick="startGrading()">Start Grading</button>
                        </div>
                    </div>
                </div>
<?php endif; ?>
            </div>

            <script src="../common/save-restore.js"></script>
            <script src="../common/modal-manager.js"></script>
            <script src="../common/grading-interface.js"></script>
            <script src="../common/tool-utilities.js"></script>
            <script src="exercises.js"></script>
            <script>
                const canvas = document.getElementById('vlsiCanvas');
                const ctx = canvas.getContext('2d');
                const layerCanvas = document.getElementById('layerCanvas');
                const lctx = layerCanvas ? layerCanvas.getContext('2d') : null;
                const layerModal = document.getElementById('layerModal');
                const layerModalHeader = document.getElementById('layerModalHeader');
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
                let probeVoltages = {}; // Store probe voltage types: {x_y: 'VCC'|'GND'|'0'}
                
                // Exercise instance
                let currentExercise = null;

                // Initialize save/restore manager
                const saveRestoreManager = new SaveRestoreManager('mistic', {
                    defaultNamePrefix: 'MISTIC_Layout_',
                    maxSaves: 25
                });
                
                // Clean up any potentially corrupted save data from development
                try {
                    const savedData = localStorage.getItem('ca4e_mistic_saves');
                    if (savedData) {
                        const saves = JSON.parse(savedData);
                        let needsCleanup = false;
                        
                        for (const [name, save] of Object.entries(saves)) {
                            if (save.data && (!save.data.grid || !save.data.volts)) {
                                needsCleanup = true;
                                break;
                            }
                        }
                        
                        if (needsCleanup) {
                            console.log('Cleaning up corrupted MISTIC save data...');
                            localStorage.removeItem('ca4e_mistic_saves');
                        }
                    }
                } catch (error) {
                    console.warn('Error checking MISTIC save data, clearing:', error);
                    localStorage.removeItem('ca4e_mistic_saves');
                }

                // Functions to get/set layout data for save/restore
                function getCurrentLayoutData() {
                    return {
                        grid: grid,
                        volts: volts,
                        probeLabels: probeLabels,
                        probeVoltages: probeVoltages,
                        gridSize: gridSize,
                        currentLayer: currentLayer
                    };
                }

                function setLayoutData(data) {
                    if (data && data.grid && data.volts) {
                        // Resize grid if necessary
                        if (data.gridSize && data.gridSize !== gridSize) {
                            resizeGrid(data.gridSize);
                        }
                        
                        grid = data.grid;
                        volts = data.volts;
                        probeLabels = data.probeLabels || {};
                        probeVoltages = data.probeVoltages || {};
                        currentLayer = data.currentLayer || '';
                        
                        // Update UI
                        redrawAllTiles();
                        compute();
                    }
                }

                // Initialize save/restore dropdown
                saveRestoreManager.createStorageDropdown({
                    dropdownId: 'storageDropdown',
                    getDataCallback: getCurrentLayoutData,
                    setDataCallback: setLayoutData
                });

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
                    const newProbeVoltages = {};
                    for (let key in probeLabels) {
                        const [x, y] = key.split('_').map(Number);
                        if (x < copy && y < copy) {
                            newProbeLabels[key] = probeLabels[key];
                            newProbeVoltages[key] = probeVoltages[key];
                        }
                    }
                    probeLabels = newProbeLabels;
                    probeVoltages = newProbeVoltages;
                    grid = newGrid;
                    volts = newVolts; // will be recomputed
                    gridSize = newSize;
                }

                function setLayer(layer) {
                    currentLayer = layer;
                    console.log('setLayer called with:', layer); // Debug log
                    
                    // Determine which dropdown this layer belongs to and update accordingly
                    const contactLayers = ['contact', 'VCC', 'GND', 'probe'];
                    const isContactLayer = contactLayers.includes(layer);
                    
                    if (isContactLayer) {
                        // Update contacts dropdown button
                        const contactsBtn = document.getElementById('contactsDropdownBtn');
                        if (layer === 'contact') {
                            // Create custom Via icon with thick diagonal black crosses
                            contactsBtn.innerHTML = '<span style="display: inline-block; width: 16px; height: 16px; background: rgba(0,0,0,0.3); border: 2px solid #000; position: relative; margin-right: 8px; vertical-align: middle;"><span style="position: absolute; width: 22px; height: 2px; background: #000; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(45deg);"></span><span style="position: absolute; width: 22px; height: 2px; background: #000; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-45deg);"></span></span>Via';
                        } else if (layer === 'VCC') {
                            contactsBtn.innerHTML = '<span style="display: inline-flex; width: 16px; height: 16px; background: #f0f0f0; border: 1px solid rgba(0,0,0,0.2); border-radius: 3px; margin-right: 8px; vertical-align: middle; align-items: center; justify-content: center; color: #333; font-weight: bold;">+</span>VCC';
                        } else if (layer === 'GND') {
                            contactsBtn.innerHTML = '<span style="display: inline-flex; width: 16px; height: 16px; background: #f0f0f0; border: 1px solid rgba(0,0,0,0.2); border-radius: 3px; margin-right: 8px; vertical-align: middle; align-items: center; justify-content: center; color: #333; font-weight: bold;">-</span>GND';
                        } else if (layer === 'probe') {
                            contactsBtn.innerHTML = '<span style="display: inline-block; width: 16px; height: 16px; background: rgba(128, 0, 128, 0.3); border: 1px solid rgba(0,0,0,0.2); border-radius: 3px; margin-right: 8px; vertical-align: middle;"></span>Probe';
                        } else {
                            contactsBtn.textContent = 'Contacts';
                        }
                        // Reset layers dropdown button
                        document.getElementById('layersDropdownBtn').textContent = 'Layers ▼';
                    } else {
                        // Update layers dropdown button
                        const layersBtn = document.getElementById('layersDropdownBtn');
                        if (layer === '') {
                            layersBtn.textContent = 'Layers ▼';
                        } else if (layer === 'erase') {
                            layersBtn.innerHTML = '<span style="display: inline-block; width: 16px; height: 16px; background: rgba(255,255,255,1); border-radius: 3px; margin-right: 8px; vertical-align: middle;">🧽</span>Erase';
                        } else {
                            // Create rounded corner rectangles with faint outlines for material layers
                            // Colors must match exactly with the dropdown color-indicator styles
                            const layerColors = {
                                'metal': 'rgba(0, 0, 255, 0.3)',
                                'polysilicon': 'rgba(255, 0, 0, 0.2)',
                                'N+ diffusion': 'rgba(0, 255, 0, 0.3)',
                                'P+ diffusion': 'rgba(255, 165, 0, 0.5)'
                            };
                            const color = layerColors[layer];
                            const names = {
                                'metal': 'Metal',
                                'polysilicon': 'Poly',
                                'N+ diffusion': 'N+',
                                'P+ diffusion': 'P+'
                            };
                            layersBtn.innerHTML = `<span style="display: inline-block; width: 16px; height: 16px; background: ${color}; border: 1px solid rgba(0,0,0,0.2); border-radius: 3px; margin-right: 8px; vertical-align: middle;"></span>${names[layer]}`;
                        }
                        // Reset contacts dropdown button
                        document.getElementById('contactsDropdownBtn').textContent = 'Contacts ▼';
                    }
                    
                    // Close both dropdowns when a selection is made
                    document.getElementById('layersDropdown').style.display = 'none';
                    document.getElementById('contactsDropdown').style.display = 'none';
                    
                    // Turn off detail hover mode when a real layer is selected
                    if (layer !== '') {
                        // Close the layers modal if it's open
                        if (!layerModal.classList.contains('hidden')) {
                            layerModal.classList.add('hidden');
                        }
                    }
                }

                function setDetailMode() {
                    // Set the layers button to show Detail with magnifying glass
                    const layersBtn = document.getElementById('layersDropdownBtn');
                    layersBtn.textContent = '🔍 Detail';
                    // Reset contacts dropdown button
                    document.getElementById('contactsDropdownBtn').textContent = 'Contacts ▼';
                    // Close both dropdowns
                    document.getElementById('layersDropdown').style.display = 'none';
                    document.getElementById('contactsDropdown').style.display = 'none';
                    // Open the layers modal
                    toggleLayersModal();
                }
                
                function toggleLayersDropdown() {
                    const dropdown = document.getElementById('layersDropdown');
                    const contactsDropdown = document.getElementById('contactsDropdown');
                    // Close contacts dropdown when opening layers
                    contactsDropdown.style.display = 'none';
                    if (dropdown.style.display === 'block') {
                        dropdown.style.display = 'none';
                    } else {
                        dropdown.style.display = 'block';
                    }
                }

                function toggleContactsDropdown() {
                    const dropdown = document.getElementById('contactsDropdown');
                    const layersDropdown = document.getElementById('layersDropdown');
                    // Close layers dropdown when opening contacts
                    layersDropdown.style.display = 'none';
                    if (dropdown.style.display === 'block') {
                        dropdown.style.display = 'none';
                    } else {
                        dropdown.style.display = 'block';
                    }
                }
                
                function closeAllDropdowns() {
                    document.getElementById('layersDropdown').style.display = 'none';
                    document.getElementById('contactsDropdown').style.display = 'none';
                }
                
                function toggleCommandLine() {
                    const commandLine = document.querySelector('.command-line');
                    const toggleItem = document.querySelector('.dropdown-item[onclick="toggleCommandLine()"]');
                    
                    if (commandLine.style.display === 'none') {
                        commandLine.style.display = 'block';
                        toggleItem.innerHTML = '<span class="color-indicator" style="background-color: #6c757d; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 10px;">⌨️</span>Hide Commands';
                    } else {
                        commandLine.style.display = 'none';
                        toggleItem.innerHTML = '<span class="color-indicator" style="background-color: #6c757d; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 10px;">⌨️</span>Show Commands';
                    }
                }

                function clearCanvas() {
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    grid.forEach(row => row.forEach(col => col.fill(false)));
                    probeLabels = {}; // Clear probe labels
                    probeVoltages = {}; // Clear probe voltages
                }

                function confirmClear() {
                    if (confirm("Are you sure you want to clear the entire canvas? This action cannot be undone.")) {
                        clearCanvas();
                    }
                }

                function openDocumentation() {
                    // Open the documentation HTML file in a new tab
                    window.open('documentation.html', '_blank');
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
                        // Clear all special layers at this position
                        grid[startY][startX][getLayerIndex('contact')] = false;
                        grid[startY][startX][getLayerIndex('VCC')] = false;
                        grid[startY][startX][getLayerIndex('GND')] = false;
                        grid[startY][startX][getLayerIndex('probe')] = false;

                        // Clean up probe data if this was a probe location
                        const key = startX + '_' + startY;
                        if (probeLabels[key]) {
                            delete probeLabels[key];
                            delete probeVoltages[key];
                        }

                        // Set the current layer
                        grid[startY][startX][getLayerIndex(currentLayer)] = true;
                        
                        // Handle probe label input
                        if (currentLayer === 'probe') {
                            console.log('Placing probe at:', startX, startY); // Debug log
                            const label = prompt('Enter a single character label for this probe:');
                            if (label && label.length > 0) {
                                probeLabels[startX + '_' + startY] = label.charAt(0);
                                // Automatically set all probes to zero voltage
                                probeVoltages[startX + '_' + startY] = '0';
                                console.log('Probe placed with label:', label.charAt(0), 'and voltage type: 0');
                            } else {
                                // If no label provided, remove the probe
                                grid[startY][startX][getLayerIndex('probe')] = false;
                                console.log('Probe placement cancelled'); // Debug log
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
                
                // Close dropdowns when clicking outside
                document.addEventListener('click', function(event) {
                    const layersDropdown = document.querySelector('#layersDropdown').parentElement;
                    const contactsDropdown = document.querySelector('#contactsDropdown').parentElement;
                    if (!layersDropdown.contains(event.target) && !contactsDropdown.contains(event.target)) {
                        closeAllDropdowns();
                    }
                });

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
                function toggleLayersModal() {
                    if (layerModal.classList.contains('hidden')) {
                        layerModal.classList.remove('hidden');
                        modalUserMoved = false;
                        centerModalTopCentered();
                    } else {
                        layerModal.classList.add('hidden');
                    }
                }

<?php if ($USER) : ?>
                // Assignment modal variables
                const gradeSubmitUrl = '<?php echo addSession("grade-submit.php"); ?>';
                const isInstructor = <?php echo $USER && $USER->instructor ? 'true' : 'false'; ?>;
                const assignmentType = '<?php echo $assn; ?>';

                // Initialize assignment modal using common utilities (moved to after exercise creation)

                // Keep compatibility functions
                function resetToBeginningScreen() {
                    if (currentExercise) {
                        currentExercise.resetGrading();
                    }
                }

                // Global function for HTML onclick handlers
                function closeAssignmentModal() {
                    if (typeof assignmentModalManager !== 'undefined' && assignmentModalManager.hide) {
                        assignmentModalManager.hide();
                    }
                }

                function nextStep() {
                    if (currentExercise) {
                        currentExercise.nextStep();
                    }
                }


                function resetAllProbesToZero() {
                    if (currentExercise) {
                        currentExercise.resetAllProbesToZero();
                    }
                }

                function resetToBeginningScreen() {
                    if (currentExercise) {
                        currentExercise.resetGrading();
                    }
                }

                function resetGrading() {
                    if (currentExercise) {
                        currentExercise.resetGrading();
                    }
                }

                // LTI Grade Submission Function
                function submitGradeToLMS(grade) {
                    console.log('Submitting grade to LMS:', grade);
                    
                    // Check if we're in an LTI session (user is authenticated)
                    <?php if ($USER) : ?>
                    console.log('User is authenticated via LTI, proceeding with grade submission...');
                    
                    // Submit the grade via AJAX using form data (as expected by the endpoint)
                    const formData = new FormData();
                    formData.append('grade', grade);
                    formData.append('code', 'VLSI_NOT_GATE_COMPLETED'); // Add a code identifier for the assignment
                    
                    console.log('Sending grade=' + grade);
                    
                    fetch('<?php echo addSession($CFG->wwwroot . '/api/grade-submit.php'); ?>', {
                        method: 'POST',
                        body: formData
                    })
                    .then(response => {
                        console.log('Response received:', response);
                        if (!response.ok) {
                            throw new Error(`HTTP error! status: ${response.status}`);
                        }
                        return response.json();
                    })
                    .then(data => {
                        console.log('Grade response received...');
                        console.log(data);
                        
                        if (data.status === 'success') {
                            console.log('Grade submitted successfully:', data);
                            // Show success message to user
                            const stepText = document.getElementById('stepText');
                            if (stepText) {
                                stepText.innerHTML = `<span style="color: green;">✓ Assignment completed! Grade ${grade} submitted to LMS.</span>`;
                            }
                            // Show alert to user
                            alert(`🎉 Congratulations! Your grade of 1.0 has been successfully submitted to the LMS.`);
                        } else {
                            console.error('Grade submission failed:', data);
                            // Show error message to user
                            const stepText = document.getElementById('stepText');
                            if (stepText) {
                                stepText.innerHTML = `<span style="color: orange;">⚠ Assignment completed, but grade submission failed: ${data.detail}</span>`;
                            }
                            // Show error alert to user
                            alert(`⚠️ Grade submission failed: ${data.detail}\n\nYour assignment was completed successfully, but the grade could not be sent to the LMS. Please contact your instructor.`);
                        }
                        
                        // Close the assignment modal after showing the alert
                        if (typeof assignmentModalManager !== 'undefined' && assignmentModalManager.hide) {
                            assignmentModalManager.hide();
                        }
                    })
                    .catch(error => {
                        console.error('Error submitting grade:', error);
                        // Show error message to user
                        const stepText = document.getElementById('stepText');
                        if (stepText) {
                            stepText.innerHTML = `<span style="color: orange;">⚠ Assignment completed, but grade submission failed: ${error.message}</span>`;
                        }
                        // Show error alert to user
                        alert(`⚠️ Grade submission error: ${error.message}\n\nYour assignment was completed successfully, but there was a technical error sending the grade to the LMS. Please contact your instructor.`);
                        
                        // Close the assignment modal after showing the alert
                        if (typeof assignmentModalManager !== 'undefined' && assignmentModalManager.hide) {
                            assignmentModalManager.hide();
                        }
                    });
                    <?php else : ?>
                    // User is not authenticated (anonymous access), just log it
                    console.log('Anonymous user - grade not submitted to LMS:', grade);
                    <?php endif; ?>
                }

                // Initialize the exercise when the page loads
                document.addEventListener('DOMContentLoaded', function() {
                    // Create the appropriate exercise instance based on assignment
                    if ( '<?php echo $assn; ?>' == 'NandGateExercise') {
                        currentExercise = new NandGateExercise();
                    } else if ( '<?php echo $assn; ?>' == 'NorGateExercise') {
                        currentExercise = new NorGateExercise();
                    } else {
                        currentExercise = new NotGateExercise();
                    }
                    
                    // Override the exercise's submitGradeToLMS method to use the global function
                    if (currentExercise) {
                        currentExercise.submitGradeToLMS = submitGradeToLMS;
                    }
                    
                    // Initialize assignment modal with common utilities (after exercise is created)
                    assignmentModalManager.initialize({
                        modalId: 'assignmentModal',
                        buttonId: 'assignmentBtn',
                        exerciseInstance: currentExercise,
                        gradeSubmitUrl: gradeSubmitUrl,
                        isInstructor: isInstructor,
                        assignmentType: assignmentType
                    });
                });

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
                    
                    // Add probe labels for NOT gate manually (since executeCommand would prompt for labels)
                    // Add input probe A at (1, 6)
                    grid[6][1][7] = true; // layer 7 is probe layer
                    probeLabels['1_6'] = 'A';
                    
                    // Add output probe Q at (8, 6) 
                    grid[6][8][7] = true; // layer 7 is probe layer
                    probeLabels['8_6'] = 'Q';
                    
                    console.log('Added probe labels: A at (1,6) and Q at (8,6)');
                    
                    // Redraw everything
                    redrawAllTiles();
                }
<?php endif; ?>

                function flashCommandOutline(command) {
                    // Parse the command to extract coordinates
                    const match = command.match(/from \((\d+), (\d+)\) to \((\d+), (\d+)\)|at \((\d+), (\d+)\)/);
                    if (!match) return; // Skip if no coordinates found
                    
                    let x1, y1, x2, y2;
                    if (match[1] !== undefined) {
                        // "from (x1, y1) to (x2, y2)" format
                        x1 = parseInt(match[1]);
                        y1 = parseInt(match[2]);
                        x2 = parseInt(match[3]);
                        y2 = parseInt(match[4]);
                    } else if (match[5] !== undefined) {
                        // "at (x, y)" format - single point
                        x1 = x2 = parseInt(match[5]);
                        y1 = y2 = parseInt(match[6]);
                    } else {
                        return; // No valid coordinates
                    }
                    
                    // Calculate canvas coordinates
                    const tileSize = canvas.width / gridSize;
                    const canvasX1 = x1 * tileSize;
                    const canvasY1 = y1 * tileSize;
                    const canvasX2 = (x2 + 1) * tileSize;
                    const canvasY2 = (y2 + 1) * tileSize;
                    
                    // Flash the outline
                    let flashCount = 0;
                    const maxFlashes = 4; // 2 complete on/off cycles
                    
                    function flash() {
                        if (flashCount >= maxFlashes) return;
                        
                        // Draw outline
                        ctx.save();
                        ctx.strokeStyle = flashCount % 2 === 0 ? '#000000' : '#ffffff';
                        ctx.lineWidth = 3;
                        ctx.setLineDash([5, 5]);
                        ctx.strokeRect(canvasX1, canvasY1, canvasX2 - canvasX1, canvasY2 - canvasY1);
                        ctx.restore();
                        
                        flashCount++;
                        setTimeout(() => {
                            // Clear the flash by redrawing that area
                            redrawAllTiles();
                            if (flashCount < maxFlashes) {
                                setTimeout(flash, 600);
                            }
                        }, 600);
                    }
                    
                    flash();
                }

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
                    
                    // Helper function to check if a connected area forms a rectangle
                    function isConnectedAreaRectangle(connectedCells, layerIndex) {
                        if (connectedCells.length < 4) return false;
                        
                        const minX = Math.min(...connectedCells.map(p => p.x));
                        const maxX = Math.max(...connectedCells.map(p => p.x));
                        const minY = Math.min(...connectedCells.map(p => p.y));
                        const maxY = Math.max(...connectedCells.map(p => p.y));
                        
                        // Check if all points in the bounding box are filled
                        for (let x = minX; x <= maxX; x++) {
                            for (let y = minY; y <= maxY; y++) {
                                if (!grid[y][x][layerIndex]) return false;
                            }
                        }
                        
                        // Check if we have exactly the right number of points for a rectangle
                        const expectedPoints = (maxX - minX + 1) * (maxY - minY + 1);
                        return connectedCells.length === expectedPoints;
                    }
                    
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
                        
                        // Check if this connected area forms a rectangle first
                        if (isConnectedAreaRectangle(allConnected, layerIndex)) {
                            segments.push(allConnected);
                            return segments;
                        }
                        
                        // Now break the connected region into line segments
                        // Use processed points approach: processed points can't start new segments but can be part of segments
                        const remaining = new Set(allConnected.map(p => `${p.x},${p.y}`));
                        const processed = new Set();
                        
                        while (remaining.size > 0) {
                            const start = remaining.values().next().value;
                            const [startX, startY] = start.split(',').map(Number);
                            
                            // Try to find horizontal line
                            let horizontalLine = [{x: startX, y: startY}];
                            let x = startX + 1;
                            while (remaining.has(`${x},${startY}`) || processed.has(`${x},${startY}`)) {
                                horizontalLine.push({x, y: startY});
                                x++;
                            }
                            x = startX - 1;
                            while (remaining.has(`${x},${startY}`) || processed.has(`${x},${startY}`)) {
                                horizontalLine.unshift({x, y: startY});
                                x--;
                            }
                            
                            // Try vertical line
                            let verticalLine = [{x: startX, y: startY}];
                            let y = startY + 1;
                            while (remaining.has(`${startX},${y}`) || processed.has(`${startX},${y}`)) {
                                verticalLine.push({x: startX, y});
                                y++;
                            }
                            y = startY - 1;
                            while (remaining.has(`${startX},${y}`) || processed.has(`${startX},${y}`)) {
                                verticalLine.unshift({x: startX, y});
                                y--;
                            }
                            
                            // Choose the longer line
                            let bestLine;
                            if (horizontalLine.length >= verticalLine.length && horizontalLine.length > 1) {
                                bestLine = horizontalLine;
                            } else if (verticalLine.length > 1) {
                                bestLine = verticalLine;
                            } else {
                                // Single point
                                bestLine = [{x: startX, y: startY}];
                            }
                            
                            // Add the line to segments
                            segments.push(bestLine);
                            
                            // Mark all points in the line as processed
                            bestLine.forEach(point => {
                                processed.add(`${point.x},${point.y}`);
                            });
                            
                            // Remove ALL points in the line from remaining (processed points can't start new segments)
                            bestLine.forEach(point => {
                                remaining.delete(`${point.x},${point.y}`);
                            });
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
                    function createDrawCommand(segment, layerName, layerIndex) {
                        if (segment.length === 1) {
                            const p = segment[0];
                            return `draw ${layerName} at (${p.x}, ${p.y})`;
                        } else if (isConnectedAreaRectangle(segment, layerIndex)) {
                            const minX = Math.min(...segment.map(p => p.x));
                            const maxX = Math.max(...segment.map(p => p.x));
                            const minY = Math.min(...segment.map(p => p.y));
                            const maxY = Math.max(...segment.map(p => p.y));
                            return `draw ${layerName} from (${minX}, ${minY}) to (${maxX}, ${maxY})`;
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
                                        
                                        const command = createDrawCommand(segment, layer.name, layer.index);
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
                        const voltageType = probeVoltages[key];
                        if (voltageType && voltageType !== undefined) {
                            console.log(`  - Probe "${probeLabels[key]}" at (${x}, ${y}) with voltage ${voltageType}`);
                        } else {
                            console.log(`  - Probe "${probeLabels[key]}" at (${x}, ${y})`);
                        }
                    });
                    
                    // Handle probes separately - add them last so they're read last
                    Object.keys(probeLabels).forEach(key => {
                        const [x, y] = key.split('_').map(Number);
                        const voltageType = probeVoltages[key];
                        if (voltageType && voltageType !== undefined) {
                            commands.push(`draw probe "${probeLabels[key]}" at (${x}, ${y}) with voltage ${voltageType}`);
                        } else {
                            commands.push(`draw probe "${probeLabels[key]}" at (${x}, ${y})`);
                        }
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
                        
                        Object.keys(layerGroups).forEach(layer => {
                            layerGroups[layer].forEach(cmd => {
                                // Special handling for probe commands to add pause between name and "at"
                                if (cmd.includes('probe')) {
                                    const probeMatch = cmd.match(/draw probe "([^"]+)" at \((\d+), (\d+)\)(?:\s+with voltage (.+))?/);
                                    if (probeMatch) {
                                        const probeName = probeMatch[1];
                                        const x = probeMatch[2];
                                        const y = probeMatch[3];
                                        const voltage = probeMatch[4];
                                        
                                        speechQueue.push(`draw probe ${probeName}`);
                                        speechQueue.push("pause"); // Pause between name and "at"
                                        if (voltage) {
                                            speechQueue.push(`at (${x}, ${y}) with voltage ${voltage}`);
                                        } else {
                                            speechQueue.push(`at (${x}, ${y})`);
                                        }
                                    } else {
                                        speechQueue.push(cmd);
                                    }
                                } else {
                                    speechQueue.push(cmd);
                                }
                                speechQueue.push("pause"); // 0.5 second pause after each command
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
                                // Flash outline for draw commands
                                flashCommandOutline(text);
                                
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
                                for (let k = 0; k < 8; k++) {
                                    grid[i][j][k] = false;
                                }
                                // Also remove probe data if this was a probe location
                                const key = j + '_' + i;
                                if (probeLabels[key]) {
                                    delete probeLabels[key];
                                    delete probeVoltages[key];
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
                            // Handle probe voltages based on stored voltage types
                            if (grid[i][j][layerProbe]) {
                                const key = j + '_' + i; // Note: grid[i][j] but key is "x_y"
                                const voltageType = probeVoltages[key];
                                // console.log('Found a probe at ', i, j, 'with voltage type:', voltageType);
                                
                                if (voltageType === 'VCC') {
                                    for (let l = 0; l < 8; l++) {
                                        volts[i][j][l] = 1;
                                    }
                                    // console.log('Set probe at (', i, j, ') to VCC (1)');
                                } else if (voltageType === 'GND') {
                                    for (let l = 0; l < 8; l++) {
                                        volts[i][j][l] = -1;
                                    }
                                    // console.log('Set probe at (', i, j, ') to GND (-1)');
                                } else {
                                    // Default to 0 (neutral)
                                    for (let l = 0; l < 8; l++) {
                                        volts[i][j][l] = 0;
                                    }
                                    // console.log('Set probe at (', i, j, ') to neutral (0)');
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
                window.CircuitProbes = {
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

                    // Get the voltage type (VCC, GND, or 0) at a probe with the given label
                    getProbeVoltageType: function(label) {
                        for (let key in probeLabels) {
                            if (probeLabels[key] === label) {
                                return probeVoltages[key] || '0';
                            }
                        }
                        return null; // Probe not found
                    },

                    // Set the voltage value at a probe with the given label
                    setProbeValue: function(label, voltage) {
                        // console.log('Setting probe voltage type', label, voltage, probeLabels);
                        for (let key in probeLabels) {
                            if (probeLabels[key] === label) {
                                const [x, y] = key.split('_').map(Number);
                                if (grid[y] && grid[y][x] && grid[y][x][layerProbe]) {
                                    // Convert voltage value to voltage type and store it
                                    let voltageType = '0';
                                    if (voltage === 1) voltageType = 'VCC';
                                    else if (voltage === -1) voltageType = 'GND';
                                    
                                    probeVoltages[key] = voltageType;
                                    // console.log(`Updated probe ${label} voltage type to ${voltageType}`);
                                    
                                    // Recompute to apply the new voltage
                                    compute();
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
            <div class="command-line" style="display: none;">
                <input type="text" id="commandInput" placeholder="Type commands here... (e.g., 'clear', 'draw metal at (5,5)', 'draw metal from (5,5) to (10,10)', 'redraw')">
                <div class="status" id="status">Ready. Type 'help' for available commands.</div>
            </div>



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
                            
                            // Clear all special layers at this position if placing a contact type
                            if (['contact', 'vcc', 'gnd', 'probe'].includes(layer)) {
                                grid[y][x][getLayerIndex('contact')] = false;
                                grid[y][x][getLayerIndex('VCC')] = false;
                                grid[y][x][getLayerIndex('GND')] = false;
                                grid[y][x][getLayerIndex('probe')] = false;
                                
                                // Clean up probe data if this was a probe location
                                const key = x + '_' + y;
                                if (probeLabels[key]) {
                                    delete probeLabels[key];
                                    delete probeVoltages[key];
                                }
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

                // Easter egg: Ctrl + * to unlock Not gate (Hitchhiker's Guide reference - 42)
                
                // Test function to verify the Easter egg is working
                window.testEasterEgg = function() {
                    if (typeof drawNotGate === 'function') {
                        drawNotGate();
                    }
                };
                
                document.addEventListener('keydown', (e) => {
                    // Debug logging to see what keys are being pressed
                    // console.log('🎹 Key event detected:', {
                    //     key: e.key,
                    //     code: e.code,
                    //     ctrlKey: e.ctrlKey,
                    //     shiftKey: e.shiftKey,
                    //     altKey: e.altKey,
                    //     metaKey: e.metaKey,
                    //     target: e.target.tagName
                    // });
                    
                    // Test for Ctrl + * (Hitchhiker's Guide reference - 42!)
                    if (e.ctrlKey && e.key === '*') {
                        console.log('🎯 Easter egg triggered! Ctrl + * detected! (Hitchhiker\'s Guide reference!)');
                        unlockNotGate();
                    }
                });
                
                function unlockNotGate() {
                    // Only allow for instructors
                    <?php if ($USER && $USER->instructor) : ?>
                    // Draw the Not gate
                    if (typeof drawNotGate === 'function') {
                        drawNotGate();
                    }
                    <?php else : ?>
                    // Students can't unlock it
                    console.log('❌ Not gate Easter egg attempted by non-instructor');
                    <?php endif; ?>
                }
                

            </script>
        </center>
    </body>
</html>
