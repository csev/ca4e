class CircuitEditor {
    constructor() {
        this.canvas = document.getElementById('circuitCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.gates = [];
        this.wires = [];
        this.selectedGate = null;
        this.draggingGate = null;
        this.selectedTool = null;
        this.wireStartNode = null;
        this.draggingWaypoint = null;
        this.selectedWaypoint = null;
        this.dragStartX = 0;
        this.dragStartY = 0;
        this.dragStartGateX = 0;
        this.dragStartGateY = 0;
        
        // Add mouse interaction tracking
        this.isMouseMoving = false;
        this.isMouseDown = false;
        this.mouseMoveTimeout = null;
        this.lastUpdateTime = 0;
        this.updateDebounceTime = 100; // ms to wait after mouse stops moving
        
        // Add circuit change tracking
        this.circuitHash = '';
        this.lastCircuitState = null;
        
        // Add debounced circuit update system
        this.circuitUpdateTimeout = null;
        this.circuitUpdateDebounceTime = 500; // 500ms debounce for circuit updates
        this.circuitNeedsUpdate = false;
        this.lastCircuitHash = '';
        
        // Create circuit instance for computations with message display function
        this.circuit = new Circuit(this.showMessage.bind(this));
        
        // Set canvas size
        this.canvas.width = window.innerWidth - 40;
        this.canvas.height = window.innerHeight - 100;
        
        this.hoveredNode = null;
        this.hoveredWire = null;
        this.messageTimeout = null;
        
        // Add message display element
        this.messageEl = document.createElement('div');
        this.messageEl.className = 'validation-message';
        document.body.appendChild(this.messageEl);
        
        // Add delete mode flag
        this.deleteMode = false;
        
        // Add screen reader mode flag
        this.screenReaderMode = false;
        
        // Add last announced element to prevent duplicate announcements
        this.lastAnnouncedElement = null;
        
        // Add announcement element
        this.announcementEl = document.createElement('div');
        this.announcementEl.className = 'screen-reader-announcement';
        this.announcementEl.setAttribute('aria-live', 'polite');
        document.body.appendChild(this.announcementEl);
        
        // Add speech synthesis
        this.speechSynthesis = window.speechSynthesis;
        this.speechUtterance = null;
        
        // Initialize speech synthesis
        this.initializeSpeechSynthesis();
        
        // Bind event listeners
        this.initializeEventListeners();
        
        // Add gate ordinal tracking
        this.gateOrdinals = new Map();
        
        // Add tag mode flag
        this.isTagMode = false;
        
        // Add waypoints visibility flag
        this.showWaypoints = true;
        
        // Command history system
        this.commandHistory = [];
        this.historyIndex = -1;
        this.currentCommand = '';
        
        // Initialize the circuit hash after all setup is complete
        this.lastCircuitHash = this.computeCircuitHash();
        
        // Start render loop
        this.render();
    }

    initializeEventListeners() {
        // Gate selection dropdown
        const gateSelector = document.getElementById('gateSelector');
        gateSelector.addEventListener('change', (e) => {
            this.selectedTool = e.target.value;
            this.canvas.style.cursor = 'crosshair';
            
            // Announce tool selection
            if (this.screenReaderMode) {
                this.announce(`Selected ${e.target.value} gate tool`);
            }
        });

        // Commands dropdown
        const commandsSelector = document.getElementById('commandsSelector');
        commandsSelector.addEventListener('change', (e) => {
            const command = e.target.value;
            
            switch(command) {
                case 'waypointsToggle':
                    this.showWaypoints = !this.showWaypoints;
                    this.showMessage(this.showWaypoints ? 'Waypoints shown' : 'Waypoints hidden');
                    if (this.screenReaderMode) {
                        this.announce(this.showWaypoints ? 'Waypoints shown' : 'Waypoints hidden');
                    }
                    break;
                    
                case 'clear':
                    // Show confirmation modal for clear
                    const confirmModal = document.getElementById('confirmModal');
                    confirmModal.style.display = 'block';
                    break;
                    
                case 'screenReaderToggle':
                    this.toggleScreenReader();
                    break;
            }
            
            // Reset dropdown to default
            commandsSelector.value = '';
        });

        // Add event listener for help button
        const helpButton = document.getElementById('helpButton');
        helpButton.addEventListener('click', () => {
            window.open('help.html', '_blank');
        });

        // Add hover announcement for delete button
        const deleteButton = document.getElementById('delete');
        deleteButton.addEventListener('mouseenter', () => {
            if (this.screenReaderMode) {
                this.announce('Delete mode button');
            }
        });

        // Canvas mouse events
        this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
        this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
        this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
        
        // Add mousemove event for node and wire hovering
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            // Update mouse position for wire drawing
            this.lastMouseX = x;
            this.lastMouseY = y;

            // Check for node hovering
            const hoveredNode = this.findClickedNode(x, y);
            if (hoveredNode !== this.hoveredNode) {
                this.hoveredNode = hoveredNode;
                this.canvas.style.cursor = hoveredNode ? 'pointer' : 'default';
                this.render();
            }

            // Check for wire hovering
            const hoveredWire = this.findHoveredWire(x, y);
            if (hoveredWire !== this.hoveredWire) {
                this.hoveredWire = hoveredWire;
                this.canvas.style.cursor = hoveredWire ? 'pointer' : this.canvas.style.cursor;
                this.render();
            }
        });

        // Add delete button listener
        document.getElementById('delete').addEventListener('click', () => {
            this.setDeleteMode(!this.deleteMode);
        });

        // Update the ESC key listener to handle all cases
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                // Clear any selected tool
                this.selectedTool = null;
                // Clear delete mode if active
                if (this.deleteMode) {
                    this.setDeleteMode(false);
                    this.showMessage('Delete mode cancelled');
                }
                // Reset cursor
                this.canvas.style.cursor = 'default';
                // Clear any wire drawing in progress
                this.wireStartNode = null;
                // Force a render to clear any temporary visual states
                this.render();
            }
        });

        // Add tag mode button listener
        const tagButton = document.getElementById('tagMode');
        tagButton.addEventListener('click', () => {
            this.isTagMode = !this.isTagMode;
            tagButton.classList.toggle('active', this.isTagMode);
            
            // Update cursor and selected tool text
            if (this.isTagMode) {
                this.canvas.style.cursor = 'text';
                // Disable delete mode if it was active
                if (this.deleteMode) {
                    this.setDeleteMode(false);
                }
            } else {
                this.canvas.style.cursor = 'default';
            }
        });

        // Modify the handleClick method to include tag mode
        this.canvas.addEventListener('click', this.handleClick.bind(this));
        this.canvas.addEventListener('dblclick', this.handleDoubleClick.bind(this));

        // Command line interface
        const commandInput = document.getElementById('commandInput');
        const status = document.getElementById('status');
        
        commandInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const command = commandInput.value.trim();
                if (command) {
                    // Add command to history
                    this.addToHistory(command);
                    
                    const result = this.executeCommand(command);
                    status.textContent = result;
                    commandInput.value = '';
                }
            }
        });
        
        // Add arrow key navigation for command history
        commandInput.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowUp') {
                e.preventDefault();
                const previousCommand = this.getPreviousCommand();
                if (previousCommand !== null) {
                    this.updateCommandInput(previousCommand);
                }
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                const nextCommand = this.getNextCommand();
                this.updateCommandInput(nextCommand);
            }
        });
    }

    handleMouseDown(e) {
        this.isMouseDown = true;
        if (e.button === 2) { // Right click
            e.preventDefault();
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            // Check for waypoint deletion first
            const waypointInfo = this.findWaypointAt(x, y);
            if (waypointInfo) {
                this.removeWaypoint(waypointInfo.wire, waypointInfo.index);
                this.showMessage('Waypoint removed');
                return;
            }

            // Check for wire deletion
            for (let i = this.wires.length - 1; i >= 0; i--) {
                const wire = this.wires[i];
                if (this.isPointNearWire(x, y, wire)) {
                    wire.startGate.disconnectNode(wire.start, false);
                    wire.endGate.disconnectNode(wire.end, true);
                    this.wires.splice(i, 1);
                    this.scheduleCircuitUpdate();
                    return;
                }
            }
        } else {
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            if (this.selectedTool) {
                let newGate;
                if (this.selectedTool === 'CLOCK_PULSE') {
                    newGate = new ClockPulse(x, y, this);
                } else if (this.selectedTool === 'FULL_ADDER') {
                    newGate = new FullAdder(x, y, this);
                } else if (this.selectedTool === 'NIXIE_DISPLAY') {
                    newGate = new NixieDisplay(x, y, this);
                } else if (this.selectedTool === 'THREE_BIT_ADDER') {
                    newGate = new ThreeBitAdder(x, y, this);
                } else if (this.selectedTool === 'THREE_BIT_LATCH') {
                    newGate = new ThreeBitLatch(x, y, this);
                } else if (this.selectedTool === 'JK_FLIP_FLOP') {
                    newGate = new JKFlipFlop(x, y, this);
                } else if (this.selectedTool === 'ONE_BIT_LATCH') {
                    newGate = new OneBitLatch(x, y, this);
                } else if (this.selectedTool === 'SR_FLIP_FLOP') {
                    newGate = new SRFlipFlop(x, y, this);
                } else {
                    newGate = new Gate(this.selectedTool, x, y, this);
                }

                // Assign ordinal and update label
                newGate.ordinal = this.getGateOrdinal(newGate);
                newGate.updateLabelWithOrdinal();

                this.gates.push(newGate);
                this.selectedTool = null;
                this.canvas.style.cursor = 'default';
                
                // Reset dropdown to default option
                const gateSelector = document.getElementById('gateSelector');
                gateSelector.value = '';
            } else {
                // Check if clicked on a gate for dragging
                for (const gate of this.gates) {
                    if (this.isPointInGate(x, y, gate)) {
                        this.draggingGate = gate;
                        this.dragStartX = x;
                        this.dragStartY = y;
                        this.dragStartGateX = gate.x;
                        this.dragStartGateY = gate.y;
                        // Store initial relative positions of nodes
                        this.dragStartNodePositions = {
                            inputs: gate.inputNodes.map(node => ({
                                relativeY: node.y - gate.y
                            })),
                            outputs: gate.outputNodes.map(node => ({
                                relativeY: node.y - gate.y
                            }))
                        };
                        this.canvas.style.cursor = 'grabbing';
                        return;
                    }
                }

                // Check if clicked on waypoint for dragging
                const waypointInfo = this.findWaypointAt(x, y);
                if (waypointInfo) {
                    this.draggingWaypoint = waypointInfo;
                    this.dragStartX = x;
                    this.dragStartY = y;
                    this.canvas.style.cursor = 'grabbing';
                    return;
                }

                // Check if clicked on node (for wire creation)
                const clickedNode = this.findClickedNode(x, y);
                if (clickedNode) {
                    if (!this.wireStartNode) {
                        this.wireStartNode = clickedNode;
                    } else {
                        // Create wire between nodes
                        this.createWire(this.wireStartNode, clickedNode);
                        this.wireStartNode = null;
                    }
                }
            }
        }
    }

    handleMouseMove(e) {
        this.isMouseMoving = true;
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Clear any existing timeout
        if (this.mouseMoveTimeout) {
            clearTimeout(this.mouseMoveTimeout);
        }

        // Set new timeout to update circuit after mouse stops moving
        this.mouseMoveTimeout = setTimeout(() => {
            this.isMouseMoving = false;
            if (!this.isMouseDown) {
                this.scheduleCircuitUpdate();
            }
        }, this.updateDebounceTime);

        // Handle waypoint dragging
        if (this.draggingWaypoint) {
            // Clear circuit update timeout during dragging
            if (this.circuitUpdateTimeout) {
                clearTimeout(this.circuitUpdateTimeout);
                this.circuitNeedsUpdate = true;
            }
            
            const dx = x - this.dragStartX;
            const dy = y - this.dragStartY;
            
            // Update waypoint position
            this.draggingWaypoint.waypoint.x = this.draggingWaypoint.waypoint.x + dx;
            this.draggingWaypoint.waypoint.y = this.draggingWaypoint.waypoint.y + dy;
            
            // Update drag start position for next move
            this.dragStartX = x;
            this.dragStartY = y;
            
            // Force a render
            this.render();
            return;
        }

        // Handle gate dragging
        if (this.draggingGate) {
            // Clear circuit update timeout during dragging
            if (this.circuitUpdateTimeout) {
                clearTimeout(this.circuitUpdateTimeout);
                this.circuitNeedsUpdate = true;
            }
            
            const dx = x - this.dragStartX;
            const dy = y - this.dragStartY;
            
            // Update gate position
            this.draggingGate.x = this.dragStartGateX + dx;
            this.draggingGate.y = this.dragStartGateY + dy;
            
            // Special handling for components with updateConnectionPoints methods
            if (this.draggingGate.type === 'THREE_BIT_ADDER' || 
                this.draggingGate.type === 'THREE_BIT_LATCH' ||
                this.draggingGate.type === 'CLOCK_PULSE' ||
                this.draggingGate.type === 'JK_FLIP_FLOP' ||
                this.draggingGate.type === 'ONE_BIT_LATCH' ||
                this.draggingGate.type === 'SR_FLIP_FLOP' ||
                this.draggingGate.type === 'OR' ||
                this.draggingGate.type === 'NOR' ||
                this.draggingGate.type === 'XOR') {
                this.draggingGate.updateConnectionPoints();
                // Force a render
                this.render();
                return;
            }
            
            // Update all node positions using stored relative positions
            this.draggingGate.inputNodes.forEach((node, index) => {
                if (this.draggingGate.type === 'ONE_BIT_LATCH') {
                    // Handled by updateConnectionPoints() above
                    return;
                } else if (this.draggingGate.type === 'JK_FLIP_FLOP') {
                    // Handled by updateConnectionPoints() above
                    return;
                } else if (this.draggingGate.type === 'SR_FLIP_FLOP') {
                    // Handled by updateConnectionPoints() above
                    return;
                } else if (this.draggingGate.type === 'CLOCK_PULSE') {
                    // Clock pulse has no input nodes
                } else if (this.draggingGate.type === 'THREE_BIT_ADDER') {
                    // Handled by updateConnectionPoints() above
                    return;
                } else if (this.draggingGate.type === 'THREE_BIT_LATCH') {
                    // Handled by updateConnectionPoints() above
                    return;
                } else if (this.draggingGate.type === 'NIXIE_DISPLAY') {
                    node.x = this.draggingGate.x - 40;
                } else if (this.draggingGate.type === 'FULL_ADDER') {
                    // Full adder has three inputs at different heights
                    node.x = this.draggingGate.x - 25;
                    node.y = this.draggingGate.y + (index - 1) * 20; // -20, 0, +20
                } else if (this.draggingGate.type === 'NOT') {
                    // NOT gate has a single input at a specific position
                    node.x = this.draggingGate.x - 27;
                    node.y = this.draggingGate.y;
                } else if (this.draggingGate.type === 'AND' || this.draggingGate.type === 'NAND') {
                    // AND and NAND gates have two inputs at specific positions
                    node.x = this.draggingGate.x - 25;
                    node.y = this.draggingGate.y + (index === 0 ? -10 : 10); // First input at -10, second at +10
                } else if (this.draggingGate.type === 'OR' || this.draggingGate.type === 'NOR' || this.draggingGate.type === 'XOR') {
                    // OR, NOR, and XOR gates have two inputs at specific positions
                    node.x = this.draggingGate.x - 20;
                    node.y = this.draggingGate.y + (index === 0 ? -10 : 10); // First input at -10, second at +10
                } else {
                    node.x = this.draggingGate.x - 20;
                }
                if (this.draggingGate.type !== 'FULL_ADDER' && 
                    this.draggingGate.type !== 'NOT' && 
                    this.draggingGate.type !== 'AND' && 
                    this.draggingGate.type !== 'NAND' &&
                    this.draggingGate.type !== 'OR' && 
                    this.draggingGate.type !== 'NOR' && 
                    this.draggingGate.type !== 'XOR') {
                    node.y = this.draggingGate.y + this.dragStartNodePositions.inputs[index].relativeY;
                }
            });

            // Update output node positions
            this.draggingGate.outputNodes.forEach((node, index) => {
                if (this.draggingGate.type === 'ONE_BIT_LATCH') {
                    // Handled by updateConnectionPoints() above
                    return;
                } else if (this.draggingGate.type === 'JK_FLIP_FLOP') {
                    // Handled by updateConnectionPoints() above
                    return;
                } else if (this.draggingGate.type === 'SR_FLIP_FLOP') {
                    // Handled by updateConnectionPoints() above
                    return;
                } else if (this.draggingGate.type === 'CLOCK_PULSE') {
                    // Handled by updateConnectionPoints() above
                    return;
                } else if (this.draggingGate.type === 'THREE_BIT_ADDER') {
                    // Handled by updateConnectionPoints() above
                    return;
                } else if (this.draggingGate.type === 'THREE_BIT_LATCH') {
                    // Handled by updateConnectionPoints() above
                    return;
                } else if (this.draggingGate.type === 'NIXIE_DISPLAY') {
                    // ... existing NIXIE_DISPLAY code ...
                } else if (this.draggingGate.type === 'FULL_ADDER') {
                    // ... existing FULL_ADDER code ...
                } else if (this.draggingGate.type === 'NOT') {
                    // ... existing NOT code ...
                } else if (this.draggingGate.type === 'AND' || this.draggingGate.type === 'NAND') {
                    // ... existing AND/NAND code ...
                } else {
                    node.x = this.draggingGate.x + 20;
                    node.y = this.draggingGate.y + this.dragStartNodePositions.outputs[index].relativeY;
                }
            });
            

            
            // Force a render
            this.render();
            return;
        }

        // Check for hovered elements and announce them
        if (this.screenReaderMode) {
            // Check for node hover
            const hoveredNode = this.findClickedNode(x, y);
            if (hoveredNode) {
                const gate = hoveredNode.gate;
                const nodeType = hoveredNode.type;
                const nodeIndex = hoveredNode.type === 'input' ? 
                    gate.inputNodes.indexOf(hoveredNode.node) : 
                    gate.outputNodes.indexOf(hoveredNode.node);
                
                let announcement = `${gate.type} gate ${gate.ordinal} "${gate.label}" ${nodeType} ${nodeIndex + 1}`;
                if (hoveredNode.node.connected || hoveredNode.node.hasOutput) {
                    announcement += ' (connected)';
                }
                this.announce(announcement);
                return;
            }

            // Check for wire hover
            const hoveredWire = this.findHoveredWire(x, y);
            if (hoveredWire) {
                const startGate = hoveredWire.startGate;
                const endGate = hoveredWire.endGate;
                this.announce(`Wire from ${startGate.type} gate ${startGate.ordinal} "${startGate.label}" to ${endGate.type} gate ${endGate.ordinal} "${endGate.label}"`);
                return;
            }

            // Check for gate hover
            for (const gate of this.gates) {
                if (this.isPointInGate(x, y, gate)) {
                    let announcement = `${gate.type} gate ${gate.ordinal} "${gate.label}"`;
                    if (gate.type === 'INPUT') {
                        announcement += ` (value: ${gate.state ? '1' : '0'})`;
                    } else if (gate.type === 'OUTPUT') {
                        const value = gate.inputNodes[0]?.sourceValue;
                        announcement += ` (value: ${value === undefined ? '?' : value ? '1' : '0'})`;
                    }
                    this.announce(announcement);
                    return;
                }
            }
        }

        // Update cursor for input gates and waypoints
        let overInput = false;
        for (const gate of this.gates) {
            if (gate.type === 'INPUT' && this.isPointInGate(x, y, gate)) {
                overInput = true;
                this.canvas.style.cursor = 'pointer';
                break;
            }
        }

        // Check for wire hover in delete mode
        if (this.deleteMode) {
            const hoveredWire = this.findHoveredWire(x, y);
            if (hoveredWire) {
                this.canvas.style.cursor = 'not-allowed';
                return;
            }
        }

        // Check for waypoint hover
        const waypointInfo = this.findWaypointAt(x, y);
        if (waypointInfo) {
            this.canvas.style.cursor = 'grab';
        } else if (!overInput && !this.wireStartNode) {
            this.canvas.style.cursor = 'default';
        }
    }

    handleMouseUp() {
        this.isMouseDown = false;
        if (this.draggingWaypoint) {
            this.draggingWaypoint = null;
            this.canvas.style.cursor = 'default';
            // Trigger circuit update after waypoint dragging ends
            this.scheduleCircuitUpdate();
        }
        if (this.draggingGate) {
            // Check if gate position actually changed
            const dx = this.dragStartX - this.draggingGate.x;
            const dy = this.dragStartY - this.draggingGate.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            this.draggingGate = null;
            this.canvas.style.cursor = 'default';
            
            // Only trigger circuit update if gate was actually moved
            if (distance > 1) {
                this.scheduleCircuitUpdate();
            }
        }
    }

    handleDoubleClick(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Check if double-clicked on a wire to add a waypoint
        const wire = this.findHoveredWire(x, y);
        if (wire) {
            this.addWaypointToWire(wire, x, y);
            this.showMessage('Waypoint added to wire');
            return;
        }
    }

    handleClick(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Handle tag mode first
        if (this.isTagMode) {
            for (const gate of this.gates) {
                if (this.isPointInGate(x, y, gate)) {
                    const newLabel = prompt('Enter label for the ' + gate.type.toLowerCase() + ':', gate.label);
                    if (newLabel !== null) {
                        gate.setLabel(newLabel);
                        // Exit tag mode after setting label
                        this.isTagMode = false;
                        document.getElementById('tagMode').classList.remove('active');
                        this.canvas.style.cursor = 'default';
                        this.render();
                    }
                    return;
                }
            }
            // If clicked on empty space while in tag mode
            this.showMessage('Click on a component to tag it', 'error');
            return;
        }

        if (this.deleteMode) {
            // Check if clicked on a wire first
            for (let i = this.wires.length - 1; i >= 0; i--) {
                const wire = this.wires[i];
                if (this.isPointNearWire(x, y, wire)) {
                    wire.startGate.disconnectNode(wire.start, false);
                    wire.endGate.disconnectNode(wire.end, true);
                    this.wires.splice(i, 1);
                    this.scheduleCircuitUpdate();
                    this.showMessage('Wire deleted');
                    this.setDeleteMode(false);
                    return;
                }
            }
            
            // Check if clicked on a gate
            for (let i = this.gates.length - 1; i >= 0; i--) {
                const gate = this.gates[i];
                if (this.isPointInGate(x, y, gate)) {
                    this.deleteGate(gate);
                    this.showMessage('Component deleted');
                    this.setDeleteMode(false);
                    return;
                }
            }
        } else {
            // Handle clicks for input gates and clock pulse
            for (const gate of this.gates) {
                if ((gate.type === 'INPUT' || gate.type === 'CLOCK_PULSE') && 
                    this.isPointInGate(x, y, gate)) {
                    if (gate.type === 'CLOCK_PULSE') {
                        // Start/stop the clock pulse timer
                        if (!gate.timer) {
                            // Start the timer
                            gate.timer = setInterval(() => {
                                gate.toggleState();
                                this.performImmediateCircuitUpdate(); // Use immediate update for clock
                            }, 2000); // Toggle every 2 seconds
                            gate.isRunning = true;  // Set running state to true
                            this.showMessage('Clock started');
                        } else {
                            // Stop the timer
                            clearInterval(gate.timer);
                            gate.timer = null;
                            gate.isRunning = false;  // Set running state to false
                            this.showMessage('Clock stopped');
                        }
                        this.render();  // Force render to update the display
                    } else if (gate.toggleInput?.() || gate.toggleState?.()) {
                        this.scheduleCircuitUpdate();
                    }
                    break;
                }
            }
        }
    }

    // Add immediate circuit update method (bypasses debouncing)
    performImmediateCircuitUpdate() {
        // Check if circuit has actually changed
        if (!this.hasCircuitChanged()) {
            return;
        }

        // Show updating indicator
        const statusBar = document.querySelector('.status-bar');
        const updatingIndicator = document.createElement('span');
        updatingIndicator.id = 'updating-indicator';
        updatingIndicator.style.color = '#ff9800';
        updatingIndicator.style.marginLeft = '10px';
        updatingIndicator.textContent = '🔄 Computing...';
        statusBar.appendChild(updatingIndicator);

        const startTime = performance.now();
        
        // Update the circuit layout
        this.circuit.setLayout(this.gates, this.wires);
        
        // Update the circuit state
        const state = this.circuit.update();
        
        // Log the state if needed
        this.circuit.logState();
        
        // Update the circuit hash
        this.lastCircuitHash = this.computeCircuitHash();

        const endTime = performance.now();
        const elapsedTime = endTime - startTime;
        console.log(`Circuit recomputation completed in ${elapsedTime.toFixed(2)}ms`);
        
        // Remove updating indicator
        const indicator = document.getElementById('updating-indicator');
        if (indicator) {
            indicator.remove();
        }
    }

    // Add debounced circuit update method
    scheduleCircuitUpdate() {
        // Clear any existing timeout
        if (this.circuitUpdateTimeout) {
            clearTimeout(this.circuitUpdateTimeout);
        }
        
        // Mark that circuit needs update
        this.circuitNeedsUpdate = true;
        
        // Schedule the update after debounce period
        this.circuitUpdateTimeout = setTimeout(() => {
            this.performCircuitUpdate();
        }, this.circuitUpdateDebounceTime);
    }
    
    // Perform the actual circuit update
    performCircuitUpdate() {
        // Skip update if mouse is moving or down
        if (this.isMouseMoving || this.isMouseDown) {
            return;
        }

        // Check if circuit has actually changed
        if (!this.hasCircuitChanged()) {
            this.circuitNeedsUpdate = false;
            return;
        }

        // Use the immediate update method
        this.performImmediateCircuitUpdate();
        this.circuitNeedsUpdate = false;
    }

    updateWireValues() {
        // Instead of immediately updating, schedule a debounced update
        this.scheduleCircuitUpdate();
    }

    isPointInGate(x, y, gate) {
        if (gate.type === 'INPUT' || gate.type === 'OUTPUT') {
            // For circular gates, use distance from center
            const distance = Math.sqrt(
                Math.pow(x - gate.x, 2) + 
                Math.pow(y - gate.y, 2)
            );
            return distance <= 15; // 15 is the radius we used for INPUT/OUTPUT
        } else {
            // Existing rectangular hit detection for other gates
            const width = 40;
            const height = 40;
            return x >= gate.x - width/2 && 
                   x <= gate.x + width/2 && 
                   y >= gate.y - height/2 && 
                   y <= gate.y + height/2;
        }
    }

    findClickedNode(x, y, radius = 5) {
        for (const gate of this.gates) {

            
            // Check input nodes
            for (const node of gate.inputNodes) {
                if (Math.hypot(x - node.x, y - node.y) < radius) {
                    return { gate, node, type: 'input' };
                }
            }
            // Check output nodes
            for (const node of gate.outputNodes) {
                if (Math.hypot(x - node.x, y - node.y) < radius) {
                    return { gate, node, type: 'output' };
                }
            }
        }
        return null;
    }

    findHoveredWire(x, y) {
        return this.wires.find(wire => this.isPointNearWire(x, y, wire));
    }

    findWaypointAt(x, y, radius = 6) {
        for (const wire of this.wires) {
            for (let i = 0; i < wire.waypoints.length; i++) {
                const waypoint = wire.waypoints[i];
                if (Math.hypot(x - waypoint.x, y - waypoint.y) < radius) {
                    return { wire, waypoint, index: i };
                }
            }
        }
        return null;
    }

    drawSmoothCurve(points) {
        if (points.length < 2) return;
        
        // Use Catmull-Rom spline for smooth interpolation through all points
        const tension = 0.5; // Controls curve tightness (0-1)
        const segments = 10; // Number of segments between each point
        
        for (let i = 0; i < points.length - 1; i++) {
            const p0 = i > 0 ? points[i - 1] : points[i];
            const p1 = points[i];
            const p2 = points[i + 1];
            const p3 = i < points.length - 2 ? points[i + 2] : p2;
            
            // Draw smooth curve between p1 and p2
            for (let j = 0; j <= segments; j++) {
                const t = j / segments;
                const point = this.catmullRomInterpolate(p0, p1, p2, p3, t, tension);
                
                if (j === 0) {
                    this.ctx.lineTo(point.x, point.y);
                } else {
                    this.ctx.lineTo(point.x, point.y);
                }
            }
        }
    }
    
    catmullRomInterpolate(p0, p1, p2, p3, t, tension) {
        const t2 = t * t;
        const t3 = t2 * t;
        
        // Catmull-Rom matrix coefficients
        const c0 = -tension * t3 + 2 * tension * t2 - tension * t;
        const c1 = (2 - tension) * t3 + (tension - 3) * t2 + 1;
        const c2 = (tension - 2) * t3 + (3 - 2 * tension) * t2 + tension * t;
        const c3 = tension * t3 - tension * t2;
        
        return {
            x: c0 * p0.x + c1 * p1.x + c2 * p2.x + c3 * p3.x,
            y: c0 * p0.y + c1 * p1.y + c2 * p2.y + c3 * p3.y
        };
    }



    addWaypointToWire(wire, x, y) {
        // Get entry points
        const startEntry = this.getEntryPoint(wire.start, wire.startGate);
        const endEntry = this.getEntryPoint(wire.end, wire.endGate);
        
        // Create all points for the curve
        const allPoints = [startEntry, ...wire.waypoints, endEntry];
        
        if (allPoints.length < 2) {
            // Simple line case - add at the end
            wire.waypoints.push({ x, y });
            return;
        }
        
        // Find the closest point on the curve and determine insertion position
        let closestSegment = 0;
        let minDistance = Infinity;
        let closestT = 0;
        
        // Sample the curve to find where to insert the waypoint
        const segments = 50; // High resolution sampling
        
        for (let i = 0; i < allPoints.length - 1; i++) {
            const p0 = i > 0 ? allPoints[i - 1] : allPoints[i];
            const p1 = allPoints[i];
            const p2 = allPoints[i + 1];
            const p3 = i < allPoints.length - 2 ? allPoints[i + 2] : p2;
            
            for (let j = 0; j <= segments; j++) {
                const t = j / segments;
                const point = this.catmullRomInterpolate(p0, p1, p2, p3, t, 0.5);
                
                const distance = Math.hypot(x - point.x, y - point.y);
                if (distance < minDistance) {
                    minDistance = distance;
                    closestSegment = i;
                    closestT = t;
                }
            }
        }
        
        // Map the segment index to the correct waypoint insertion position
        // allPoints = [startEntry, waypoint0, waypoint1, ..., endEntry]
        // wire.waypoints = [waypoint0, waypoint1, ...]
        
        let insertIndex;
        if (closestSegment === 0) {
            // Between start entry and first waypoint (or end entry if no waypoints)
            insertIndex = 0;
        } else if (closestSegment === allPoints.length - 2) {
            // Between last waypoint and end entry
            insertIndex = wire.waypoints.length;
        } else {
            // Between waypoints
            insertIndex = closestSegment;
        }
        
        // Insert the waypoint at the correct position
        wire.waypoints.splice(insertIndex, 0, { x, y });
    }

    removeWaypoint(wire, index) {
        // Remove a waypoint at the specified index
        if (index >= 0 && index < wire.waypoints.length) {
            wire.waypoints.splice(index, 1);
        }
    }

    showMessage(message, isError = false) {
        this.messageEl.textContent = message;
        this.messageEl.className = `validation-message ${isError ? 'error' : 'info'}`;
        this.messageEl.style.opacity = '1';
        
        // Clear existing timeout
        if (this.messageTimeout) {
            clearTimeout(this.messageTimeout);
        }
        
        // Hide message after 3 seconds
        this.messageTimeout = setTimeout(() => {
            this.messageEl.style.opacity = '0';
        }, 3000);
    }

    createWire(startNode, endNode) {
        // Don't connect if both nodes are inputs or both are outputs
        if (startNode.type === endNode.type) {
            this.showMessage('Cannot connect two ' + startNode.type + 's', true);
            return;
        }
        
        // Ensure start is always an output and end is always an input
        if (startNode.type === 'input') {
            [startNode, endNode] = [endNode, startNode];
        }

        // Check if input node can accept connections
        if (!endNode.gate.canAcceptConnection(endNode.node, true)) {
            this.showMessage('Input is already connected', true);
            return;
        }

        const wire = {
            start: startNode.node,
            end: endNode.node,
            startGate: startNode.gate,
            endGate: endNode.gate,
            waypoints: [] // Array of waypoint positions for wire routing
        };

        // Update connection states
        startNode.gate.connectNode(startNode.node, false);
        endNode.gate.connectNode(endNode.node, true);

        this.wires.push(wire);
        
        // Announce successful connection if screen reader is enabled
        if (this.screenReaderMode) {
            const startGate = startNode.gate;
            const endGate = endNode.gate;
            const startNodeIndex = startGate.outputNodes.indexOf(startNode.node) + 1;
            const endNodeIndex = endGate.inputNodes.indexOf(endNode.node) + 1;
            
            this.announce(`Connected output ${startNodeIndex} of ${startGate.type} gate ${startGate.ordinal} "${startGate.label}" to input ${endNodeIndex} of ${endGate.type} gate ${endGate.ordinal} "${endGate.label}"`);
        }
        
        // Force circuit update since we added a wire
        this.scheduleCircuitUpdate();
    }

    render() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw grid (optional)
        this.drawGrid();

        // Draw wires
        this.drawWires();

        // Draw gates
        this.gates.forEach(gate => {
            gate.draw(this.ctx);
        });

        // Draw wire being created
        if (this.wireStartNode) {
            this.ctx.beginPath();
            this.ctx.moveTo(this.wireStartNode.node.x, this.wireStartNode.node.y);
            this.ctx.lineTo(this.lastMouseX || this.wireStartNode.node.x, 
                           this.lastMouseY || this.wireStartNode.node.y);
            this.ctx.strokeStyle = '#666';
            this.ctx.stroke();
        }

        requestAnimationFrame(this.render.bind(this));
    }

    drawGrid() {
        const gridSize = 20;
        this.ctx.strokeStyle = '#eee';
        this.ctx.lineWidth = 0.5;

        for (let x = 0; x < this.canvas.width; x += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
            this.ctx.stroke();
        }

        for (let y = 0; y < this.canvas.height; y += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
            this.ctx.stroke();
        }
    }

    drawWires() {
        // Use different color for wires in delete mode
        this.ctx.strokeStyle = this.deleteMode ? '#ff4444' : '#000';
        this.ctx.lineWidth = this.deleteMode ? 3 : 2; // Make wires thicker in delete mode

        this.wires.forEach(wire => {
            // Get entry/exit points outside the components
            const startEntry = this.getEntryPoint(wire.start, wire.startGate);
            const endEntry = this.getEntryPoint(wire.end, wire.endGate);
            
            this.ctx.beginPath();
            this.ctx.moveTo(wire.start.x, wire.start.y);
            
            // Special handling for THREE_BIT_ADDER sum outputs - straight line down first
            if (wire.startGate.type === 'THREE_BIT_ADDER' && wire.start.y > wire.startGate.y + wire.startGate.height/2) {
                // This is a sum output, draw straight line down to entry point
                this.ctx.lineTo(startEntry.x, startEntry.y);
            } else {
                // Normal bezier curve for other components
                const startDx = startEntry.x - wire.start.x;
                const startDy = startEntry.y - wire.start.y;
                const startCp1x = wire.start.x + startDx * 0.5;
                const startCp1y = wire.start.y;
                const startCp2x = startEntry.x - startDx * 0.5;
                const startCp2y = startEntry.y;
                
                this.ctx.bezierCurveTo(
                    startCp1x, startCp1y,
                    startCp2x, startCp2y,
                    startEntry.x, startEntry.y
                );
            }
            
            // Draw smooth curve through all waypoints
            if (wire.waypoints.length > 0) {
                // Create a smooth curve through all waypoints
                const allPoints = [startEntry, ...wire.waypoints, endEntry];
                this.drawSmoothCurve(allPoints);
            } else {
                // No waypoints - draw simple curve from start to end
                const dx = endEntry.x - startEntry.x;
                const dy = endEntry.y - startEntry.y;
                
                const cp1x = startEntry.x + dx * 0.5;
                const cp1y = startEntry.y;
                const cp2x = endEntry.x - dx * 0.5;
                const cp2y = endEntry.y;
                
                this.ctx.bezierCurveTo(
                    cp1x, cp1y,
                    cp2x, cp2y,
                    endEntry.x, endEntry.y
                );
            }
            
            this.ctx.lineTo(wire.end.x, wire.end.y);
            
            // Set wire style based on hover/selected state
            if (wire === this.hoveredWire) {
                this.ctx.strokeStyle = '#2196F3';
                this.ctx.lineWidth = 3;
            } else if (wire.selected) {
                this.ctx.strokeStyle = '#ff0000';
                this.ctx.lineWidth = 2;
            } else {
                this.ctx.strokeStyle = '#000000';
                this.ctx.lineWidth = 2;
            }
            
            this.ctx.stroke();

            // Draw connection points
            this.ctx.beginPath();
            this.ctx.arc(wire.start.x, wire.start.y, 3, 0, Math.PI * 2);
            this.ctx.arc(wire.end.x, wire.end.y, 3, 0, Math.PI * 2);
            this.ctx.fillStyle = wire === this.hoveredWire ? '#2196F3' : '#4CAF50';
            this.ctx.fill();
            
            // Draw waypoints (if enabled)
            if (this.showWaypoints) {
                wire.waypoints.forEach((waypoint, index) => {
                    this.ctx.beginPath();
                    this.ctx.arc(waypoint.x, waypoint.y, 4, 0, Math.PI * 2);
                    this.ctx.fillStyle = '#FF9800'; // Orange for waypoints
                    this.ctx.fill();
                    this.ctx.strokeStyle = '#000';
                    this.ctx.lineWidth = 1;
                    this.ctx.stroke();
                });
            }
        });
    }

    getEntryPoint(node, gate) {
        // Calculate entry point just outside the component
        const margin = 20; // Distance outside the component
        
        // Special handling for THREE_BIT_ADDER sum outputs
        if (gate.type === 'THREE_BIT_ADDER') {
            // Check if this is a sum output (S1, S2, S4) - they should exit downward
            const isSumOutput = node.y > gate.y + gate.height/2;
            if (isSumOutput) {
                return { x: node.x, y: node.y }; // Use the node position directly, no extra offset
            }
        }
        
        // Special handling for OR, NOR, and XOR input nodes - they are on curved edges
        if ((gate.type === 'OR' || gate.type === 'NOR' || gate.type === 'XOR') && 
            gate.inputNodes.includes(node)) {
            // For curved gates, place entry point just outside the node position
            return { x: node.x - margin, y: node.y };
        }
        
        // Get component bounds
        let bounds;
        if (gate.type === 'INPUT' || gate.type === 'OUTPUT') {
            // Circular gates
            bounds = {
                left: gate.x - 15,
                right: gate.x + 15,
                top: gate.y - 15,
                bottom: gate.y + 15
            };
        } else {
            // Rectangular gates
            bounds = {
                left: gate.x - 20,
                right: gate.x + 20,
                top: gate.y - 20,
                bottom: gate.y + 20
            };
        }
        
        // Determine which side of the component the node is on
        const nodeX = node.x;
        const nodeY = node.y;
        
        // Find the closest edge and place entry point just outside
        if (nodeX <= bounds.left) {
            // Node is on the left side
            return { x: bounds.left - margin, y: nodeY };
        } else if (nodeX >= bounds.right) {
            // Node is on the right side
            return { x: bounds.right + margin, y: nodeY };
        } else if (nodeY <= bounds.top) {
            // Node is on the top side
            return { x: nodeX, y: bounds.top - margin };
        } else if (nodeY >= bounds.bottom) {
            // Node is on the bottom side
            return { x: nodeX, y: bounds.bottom + margin };
        } else {
            // Node is inside the component (shouldn't happen, but fallback)
            return { x: bounds.right + margin, y: nodeY };
        }
    }

    isPointNearWire(x, y, wire) {
        const threshold = 5;
        
        // Get entry points for the wire
        const startEntry = this.getEntryPoint(wire.start, wire.startGate);
        const endEntry = this.getEntryPoint(wire.end, wire.endGate);
        
        // Create all points for the curve
        const allPoints = [startEntry, ...wire.waypoints, endEntry];
        
        if (allPoints.length < 2) {
            // Simple line case - check straight line segments
            const segments = [];
            segments.push({ start: wire.start, end: startEntry });
            segments.push({ start: startEntry, end: endEntry });
            segments.push({ start: endEntry, end: wire.end });
            
            for (const segment of segments) {
                const dist = this.pointToLineDistance(
                    x, y,
                    segment.start.x, segment.start.y,
                    segment.end.x, segment.end.y
                );
                if (dist < threshold) return true;
            }
            return false;
        }
        
        // Check if point is near the curved spline path
        const segments = 20; // Sample the curve at 20 points per segment
        
        for (let i = 0; i < allPoints.length - 1; i++) {
            const p0 = i > 0 ? allPoints[i - 1] : allPoints[i];
            const p1 = allPoints[i];
            const p2 = allPoints[i + 1];
            const p3 = i < allPoints.length - 2 ? allPoints[i + 2] : p2;
            
            for (let j = 0; j < segments; j++) {
                const t1 = j / segments;
                const t2 = (j + 1) / segments;
                
                const point1 = this.catmullRomInterpolate(p0, p1, p2, p3, t1, 0.5);
                const point2 = this.catmullRomInterpolate(p0, p1, p2, p3, t2, 0.5);
                
                const dist = this.pointToLineDistance(
                    x, y,
                    point1.x, point1.y,
                    point2.x, point2.y
                );
                if (dist < threshold) return true;
            }
        }
        
        return false;
    }

    pointToLineDistance(x, y, x1, y1, x2, y2) {
        const A = x - x1;
        const B = y - y1;
        const C = x2 - x1;
        const D = y2 - y1;

        const dot = A * C + B * D;
        const lenSq = C * C + D * D;
        let param = -1;

        if (lenSq !== 0) param = dot / lenSq;

        let xx, yy;

        if (param < 0) {
            xx = x1;
            yy = y1;
        } else if (param > 1) {
            xx = x2;
            yy = y2;
        } else {
            xx = x1 + param * C;
            yy = y1 + param * D;
        }

        const dx = x - xx;
        const dy = y - yy;
        return Math.sqrt(dx * dx + dy * dy);
    }

    deleteGate(gate) {
        // Clear any existing timer if it's a clock pulse
        if (gate.type === 'CLOCK_PULSE') {
            if (gate.timer) {
                clearInterval(gate.timer);
                gate.timer = null;
            }
            gate.isRunning = false;  // Reset running state
        }
        
        // Remove all wires connected to this gate
        this.wires = this.wires.filter(wire => {
            if (wire.startGate === gate || wire.endGate === gate) {
                // Disconnect the nodes on the other gate
                if (wire.startGate === gate) {
                    wire.endGate.disconnectNode(wire.end, true);
                } else {
                    wire.startGate.disconnectNode(wire.start, false);
                }
                return false; // Remove this wire
            }
            return true; // Keep wires not connected to this gate
        });

        // Remove the gate from the gates array
        const index = this.gates.indexOf(gate);
        if (index > -1) {
            this.gates.splice(index, 1);
        }

        // Force circuit update since we deleted a gate
        this.scheduleCircuitUpdate();
        this.render();
    }

    setDeleteMode(enabled) {
        this.deleteMode = enabled;
        this.canvas.style.cursor = enabled ? 'not-allowed' : 'default';
        document.getElementById('delete').classList.toggle('active', enabled);
        if (!enabled) {
            if (this.screenReaderMode) {
                this.announce('Delete mode cancelled');
            }
        } else {
            if (this.screenReaderMode) {
                this.announce('Delete mode activated');
            }
        }
    }

    clear() {
        this.gates = [];
        this.wires = [];
        this.gateOrdinals.clear(); // Reset all ordinals
        this.render();
    }

    // Add method to compute circuit hash
    computeCircuitHash() {
        const state = {
            gates: this.gates.map(gate => ({
                type: gate.type,
                label: gate.label,
                x: gate.x,
                y: gate.y,
                state: gate.state,
                inputs: gate.inputNodes.map(n => n.sourceValue),
                outputs: gate.outputNodes.map(n => n.sourceValue)
            })),
            wires: this.wires.map(wire => ({
                start: wire.start.sourceValue,
                end: wire.end.sourceValue
            }))
        };
        return JSON.stringify(state);
    }

    // Add method to check if circuit has changed
    hasCircuitChanged() {
        const newHash = this.computeCircuitHash();
        const changed = newHash !== this.lastCircuitHash;
        return changed;
    }

    /**
     * Sets the value of an input component by its label.
     * 
     * Usage:
     * 1. First create an INPUT component in the circuit editor
     * 2. Double-click the INPUT component to set its label
     * 3. Call this function from external JavaScript:
     *    window.circuitEditor.setInputByLabel("A", true);  // Set input "A" to 1
     *    window.circuitEditor.setInputByLabel("A", false); // Set input "A" to 0
     * 
     * @param {string} label - The label of the input component to find
     * @param {boolean} value - The value to set (true for 1, false for 0)
     * @returns {boolean} - true if input was found and set, false if not found
     */
    setInputByLabel(label, value) {
        // Find the input gate with matching label
        const inputGate = this.gates.find(gate => 
            gate.type === 'INPUT' && gate.label.toLowerCase() === label.toLowerCase()
        );

        if (!inputGate) {
            this.showMessage(`Input component with label "${label}" not found`, true);
            return false;
        }

        // Set the input value
        inputGate.state = value;
        
        // Update the circuit
        this.scheduleCircuitUpdate();
        
        this.showMessage(`Set input "${label}" to ${value ? '1' : '0'}`);
        return true;
    }

    /**
     * Gets the current value of an output component by its label.
     * 
     * Usage:
     * 1. First create an OUTPUT component in the circuit editor
     * 2. Double-click the OUTPUT component to set its label
     * 3. Call this function from external JavaScript:
     *    const value = window.circuitEditor.getOutputByLabel("B");
     *    console.log(value); // true for 1, false for 0, undefined if not connected
     * 
     * @param {string} label - The label of the output component to find
     * @returns {boolean|undefined} - The current value of the output (true for 1, false for 0, undefined if not connected)
     */
    getOutputByLabel(label) {
        // Find the output gate with matching label
        const outputGate = this.gates.find(gate => 
            gate.type === 'OUTPUT' && gate.label.toLowerCase() === label.toLowerCase()
        );

        if (!outputGate) {
            this.showMessage(`Output component with label "${label}" not found`, true);
            return undefined;
        }

        // Get the input node value (outputs only have one input node)
        const inputNode = outputGate.inputNodes[0];
        if (!inputNode || !inputNode.connected) {
            return undefined;
        }

        return inputNode.sourceValue;
    }

    toggleScreenReader() {
        this.screenReaderMode = !this.screenReaderMode;
        
        // Cancel any ongoing speech when toggling off
        if (!this.screenReaderMode) {
            this.speechSynthesis.cancel();
        }
        
        const message = this.screenReaderMode ? 'Screen reader mode enabled' : 'Screen reader mode disabled';
        this.showMessage(message);
        this.announce(message);
    }

    initializeSpeechSynthesis() {
        // Cancel any existing speech
        if (this.speechUtterance) {
            this.speechSynthesis.cancel();
        }
        
        // Create new utterance
        this.speechUtterance = new SpeechSynthesisUtterance();
        
        // Configure speech settings
        this.speechUtterance.rate = 1.0;  // Speed of speech
        this.speechUtterance.pitch = 1.0; // Pitch of voice
        this.speechUtterance.volume = 1.0; // Volume (0 to 1)
        
        // Set voice if available
        const voices = this.speechSynthesis.getVoices();
        if (voices.length > 0) {
            // Try to find a female voice
            const femaleVoice = voices.find(voice => voice.name.includes('Female'));
            if (femaleVoice) {
                this.speechUtterance.voice = femaleVoice;
            } else {
                this.speechUtterance.voice = voices[0];
            }
        }
    }

    announce(text) {
        if (!this.screenReaderMode) return;
        
        // Only announce if text is different from last announcement
        if (text === this.lastAnnouncedElement) return;
        
        this.lastAnnouncedElement = text;
        
        // Update ARIA live region
        this.announcementEl.textContent = text;
        
        // Cancel any ongoing speech
        this.speechSynthesis.cancel();
        
        // Set new text and speak
        this.speechUtterance.text = text;
        this.speechSynthesis.speak(this.speechUtterance);
        
        // Clear the announcement after a short delay
        setTimeout(() => {
            this.announcementEl.textContent = '';
            this.lastAnnouncedElement = null;
        }, 1000);
    }

    // Add method to get ordinal for a gate
    getGateOrdinal(gate) {
        if (!this.gateOrdinals.has(gate.type)) {
            this.gateOrdinals.set(gate.type, 0);
        }
        const currentOrdinal = this.gateOrdinals.get(gate.type);
        this.gateOrdinals.set(gate.type, currentOrdinal + 1);
        return currentOrdinal + 1;
    }

    // Find a good placement position that doesn't overlap with existing components
    findPlacementPosition() {
        const spacing = 80; // Minimum distance between components
        const margin = 50; // Margin from canvas edges
        
        // Start from center
        let x = this.canvas.width / 2;
        let y = this.canvas.height / 2;
        
        // If no components exist, use center
        if (this.gates.length === 0) {
            return { x, y };
        }
        
        // Try to find a position near existing components but not overlapping
        let attempts = 0;
        const maxAttempts = 50;
        
        while (attempts < maxAttempts) {
            // Check if this position is too close to any existing component
            let tooClose = false;
            for (const gate of this.gates) {
                const distance = Math.sqrt(
                    Math.pow(x - gate.x, 2) + Math.pow(y - gate.y, 2)
                );
                if (distance < spacing) {
                    tooClose = true;
                    break;
                }
            }
            
            if (!tooClose) {
                return { x, y };
            }
            
            // Try a new position
            const angle = (attempts * 137.5) * (Math.PI / 180); // Golden angle for good distribution
            const radius = spacing + (attempts * 10);
            x = this.canvas.width / 2 + Math.cos(angle) * radius;
            y = this.canvas.height / 2 + Math.sin(angle) * radius;
            
            // Keep within canvas bounds
            x = Math.max(margin, Math.min(this.canvas.width - margin, x));
            y = Math.max(margin, Math.min(this.canvas.height - margin, y));
            
            attempts++;
        }
        
        // If we can't find a good position, use a random position
        x = margin + Math.random() * (this.canvas.width - 2 * margin);
        y = margin + Math.random() * (this.canvas.height - 2 * margin);
        
        return { x, y };
    }

    // Command line interface
    executeCommand(command) {
        const parts = command.toLowerCase().split(' ');
        
        if (parts[0] === 'place') {
            if (parts.length < 2) {
                return 'Error: Please specify a component type. Example: place input a';
            }
            
            const componentType = parts[1].toLowerCase();
            const label = parts[2] || null;
            
            // Validate component type
            const validTypes = ['input', 'output', 'and', 'or', 'not', 'nand', 'nor', 'xor', 'full-adder', 'nixie', 'clock', 'sr-flip-flop', 'jk-flip-flop', '1-bit-latch', '3-bit-latch', '3-bit-adder'];
            if (!validTypes.includes(componentType)) {
                return `Error: Invalid component type "${componentType}". Valid types: ${validTypes.join(', ')}`;
            }
            
            // Check if label already exists
            if (label) {
                const existingGate = this.gates.find(gate => gate.label.toLowerCase() === label.toLowerCase());
                if (existingGate) {
                    return `Error: Component with label "${label}" already exists (${existingGate.type})`;
                }
            }
            
            // Map component types to our gate types
            const componentMap = {
                'input': 'INPUT',
                'output': 'OUTPUT',
                'and': 'AND',
                'or': 'OR',
                'not': 'NOT',
                'nand': 'NAND',
                'nor': 'NOR',
                'xor': 'XOR',
                'full-adder': 'FULL_ADDER',
                'nixie': 'NIXIE_DISPLAY',
                'clock': 'CLOCK_PULSE',
                'sr-flip-flop': 'SR_FLIP_FLOP',
                'jk-flip-flop': 'JK_FLIP_FLOP',
                '1-bit-latch': 'ONE_BIT_LATCH',
                '3-bit-latch': 'THREE_BIT_LATCH',
                '3-bit-adder': 'THREE_BIT_ADDER'
            };
            
            const gateType = componentMap[componentType];
            
            // Find a good placement position
            const position = this.findPlacementPosition();
            
            let newGate;
            if (gateType === 'CLOCK_PULSE') {
                newGate = new ClockPulse(position.x, position.y, this);
            } else if (gateType === 'FULL_ADDER') {
                newGate = new FullAdder(position.x, position.y, this);
            } else if (gateType === 'NIXIE_DISPLAY') {
                newGate = new NixieDisplay(position.x, position.y, this);
            } else if (gateType === 'THREE_BIT_ADDER') {
                newGate = new ThreeBitAdder(position.x, position.y, this);
            } else if (gateType === 'THREE_BIT_LATCH') {
                newGate = new ThreeBitLatch(position.x, position.y, this);
            } else if (gateType === 'JK_FLIP_FLOP') {
                newGate = new JKFlipFlop(position.x, position.y, this);
            } else if (gateType === 'ONE_BIT_LATCH') {
                newGate = new OneBitLatch(position.x, position.y, this);
            } else if (gateType === 'SR_FLIP_FLOP') {
                newGate = new SRFlipFlop(position.x, position.y, this);
            } else {
                newGate = new Gate(gateType, position.x, position.y, this);
            }
            
            // Set the label - use provided label or fall back to numbering scheme
            if (label) {
                newGate.setLabel(label);
            } else {
                // Use the old numbering scheme
                newGate.ordinal = this.getGateOrdinal(newGate);
                newGate.updateLabelWithOrdinal();
            }
            
            this.gates.push(newGate);
            this.scheduleCircuitUpdate();
            
            const finalLabel = label || newGate.label;
            return `Placed ${componentType} with label "${finalLabel}" at (${Math.round(position.x)}, ${Math.round(position.y)})`;
        } else if (parts[0] === 'delete') {
            if (parts.length < 2) {
                return 'Error: Please specify a component type. Example: delete input a';
            }
            
            const componentType = parts[1].toLowerCase();
            const label = parts[2];
            
            if (!label) {
                return 'Error: Please specify a component label. Example: delete input a';
            }
            
            // Validate component type
            const validTypes = ['input', 'output', 'and', 'or', 'not', 'nand', 'nor', 'xor', 'full-adder', 'nixie', 'clock', 'sr-flip-flop', 'jk-flip-flop', '1-bit-latch', '3-bit-latch', '3-bit-adder'];
            if (!validTypes.includes(componentType)) {
                return `Error: Invalid component type "${componentType}". Valid types: ${validTypes.join(', ')}`;
            }
            
            // Map component type to gate type
            const componentMap = {
                'input': 'INPUT',
                'output': 'OUTPUT',
                'and': 'AND',
                'or': 'OR',
                'not': 'NOT',
                'nand': 'NAND',
                'nor': 'NOR',
                'xor': 'XOR',
                'full-adder': 'FULL_ADDER',
                'nixie': 'NIXIE_DISPLAY',
                'clock': 'CLOCK_PULSE',
                'sr-flip-flop': 'SR_FLIP_FLOP',
                'jk-flip-flop': 'JK_FLIP_FLOP',
                '1-bit-latch': 'ONE_BIT_LATCH',
                '3-bit-latch': 'THREE_BIT_LATCH',
                '3-bit-adder': 'THREE_BIT_ADDER'
            };
            
            const gateType = componentMap[componentType];
            
            // Find the component to delete
            const gateToDelete = this.gates.find(gate => 
                gate.type === gateType && gate.label.toLowerCase() === label.toLowerCase()
            );
            
            if (!gateToDelete) {
                return `Error: ${componentType} "${label}" not found. Use 'read' to see available components.`;
            }
            
            // Remove wires connected to this gate
            this.wires = this.wires.filter(wire => 
                wire.startGate !== gateToDelete && wire.endGate !== gateToDelete
            );
            
            // Remove the gate
            this.gates = this.gates.filter(gate => gate !== gateToDelete);
            this.scheduleCircuitUpdate();
            
            return `Deleted ${componentType} "${label}"`;
        } else if (parts[0] === 'connect') {
            // Parse: connect [from-component] [from-connector] to [to-component] [to-connector]
            if (parts.length < 5) {
                return 'Error: Invalid connect syntax. Use: connect [from] [from-connector] to [to] [to-connector]';
            }
            
            if (parts[3] !== 'to') {
                return 'Error: Invalid syntax. Use: connect [from] [from-connector] to [to] [to-connector]';
            }
            
            const fromComponent = parts[1];
            const fromConnector = parts[2];
            const toComponent = parts[4];
            const toConnector = parts[5];
            
            if (!fromConnector || !toConnector) {
                return 'Error: Please specify both connectors. Use: connect [from] [from-connector] to [to] [to-connector]';
            }
            
            // Find the source component
            const fromGate = this.gates.find(gate => gate.label.toLowerCase() === fromComponent.toLowerCase());
            if (!fromGate) {
                return `Error: Source component "${fromComponent}" not found. Use 'read' to see available components.`;
            }
            
            // Find the target component
            const toGate = this.gates.find(gate => gate.label.toLowerCase() === toComponent.toLowerCase());
            if (!toGate) {
                return `Error: Target component "${toComponent}" not found. Use 'read' to see available components.`;
            }
            
            // Validate connectors
            const fromNode = this.findNode(fromGate, fromConnector);
            if (!fromNode) {
                const validConnectors = this.getValidConnectors(fromGate);
                return `Error: Invalid source connector "${fromConnector}". Valid connectors for ${fromComponent}: ${validConnectors.join(', ')}`;
            }
            
            const toNode = this.findNode(toGate, toConnector);
            if (!toNode) {
                const validConnectors = this.getValidConnectors(toGate);
                return `Error: Invalid target connector "${toConnector}". Valid connectors for ${toComponent}: ${validConnectors.join(', ')}`;
            }
            
            // Check if connection already exists
            const existingConnection = this.wires.find(wire => 
                wire.startGate === fromGate && wire.start === fromNode &&
                wire.endGate === toGate && wire.end === toNode
            );
            
            if (existingConnection) {
                return `Error: Connection from ${fromComponent} ${fromConnector} to ${toComponent} ${toConnector} already exists.`;
            }
            
            // Create the wire
            const wire = {
                startGate: fromGate,
                start: fromNode,
                endGate: toGate,
                end: toNode,
                waypoints: []
            };
            
            this.wires.push(wire);
            this.scheduleCircuitUpdate();
            
            return `Connected ${fromComponent} ${fromConnector} to ${toComponent} ${toConnector}`;
        } else if (parts[0] === 'read') {
            if (this.gates.length === 0) {
                return 'Circuit is empty. Use "place" to add components.';
            }
            
            // Check if a specific component label was provided
            if (parts.length > 1) {
                const componentLabel = parts[1];
                return this.readComponent(componentLabel);
            }
            
            return this.readCircuit();
        } else if (parts[0] === 'clear') {
            if (this.gates.length === 0) {
                return 'Circuit is already empty.';
            }
            this.clear();
            return 'Circuit cleared';
        } else if (parts[0] === 'help') {
            return `Available commands:
- place [component-type] [optional-label] - Place a component
- delete [component-type] [label] - Delete a component
- connect [from] [from-connector] to [to] [to-connector] - Connect components
- read - Read circuit status
- read [component-label] - Read detailed information about a specific component
- clear - Clear all components
- layout - Optimize component layout to minimize wire crossings
- help - Show this help

Component types: input, output, and, or, not, nand, nor, xor, full-adder, nixie, clock, sr-flip-flop, jk-flip-flop, 1-bit-latch, 3-bit-latch, 3-bit-adder

Navigation:
- ↑ (Up Arrow) - Browse command history (previous commands)
- ↓ (Down Arrow) - Browse command history (next commands)

Examples:
- place input a
- place and
- delete input a
- connect a output to gate1 input-1
- connect sam output to full1 Cin
- connect full1 S to result input-1
- read full1`;
        } else if (parts[0] === 'layout') {
            return this.performLayout();
        } else {
            return `Error: Unknown command "${parts[0]}". Type "help" for available commands.`;
        }
    }

    readCircuit() {
        let result = "Circuit Status:\n";
        
        // Components
        result += "\nComponents:\n";
        for (const gate of this.gates) {
            result += `- ${gate.label} (${gate.type}) at (${Math.round(gate.x)}, ${Math.round(gate.y)})\n`;
        }
        
        // Connections
        result += "\nConnections:\n";
        for (const wire of this.wires) {
            result += `- ${wire.startGate.label} output to ${wire.endGate.label} input\n`;
        }
        
        // Circuit state
        if (this.gates.length > 0) {
            result += "\nCircuit State:\n";
            for (const gate of this.gates) {
                if (gate.type === 'INPUT') {
                    result += `- ${gate.label}: ${gate.state ? '1' : '0'}\n`;
                } else if (gate.type === 'OUTPUT') {
                    const value = gate.inputNodes[0]?.sourceValue;
                    result += `- ${gate.label}: ${value === undefined ? '?' : value ? '1' : '0'}\n`;
                }
            }
        }
        
        return result;
    }

    readComponent(componentLabel) {
        // Find the component by label (case insensitive)
        const component = this.gates.find(gate => 
            gate.label.toLowerCase() === componentLabel.toLowerCase()
        );
        
        if (!component) {
            return `Error: Component "${componentLabel}" not found. Use 'read' to see all components.`;
        }
        
        let result = `Component: ${component.label} (${component.type})\n`;
        result += `Position: (${Math.round(component.x)}, ${Math.round(component.y)})\n`;
        
        // Show inputs
        if (component.inputNodes && component.inputNodes.length > 0) {
            result += `\nInputs:\n`;
            component.inputNodes.forEach((node, index) => {
                const connectorName = this.getConnectorName(component, node, 'input', index);
                const value = node.connected ? (node.sourceValue ? '1' : '0') : '?';
                result += `  ${connectorName}: ${value}${node.connected ? '' : ' (not connected)'}\n`;
            });
        }
        
        // Show outputs
        if (component.outputNodes && component.outputNodes.length > 0) {
            result += `\nOutputs:\n`;
            component.outputNodes.forEach((node, index) => {
                const connectorName = this.getConnectorName(component, node, 'output', index);
                const value = node.hasOutput ? (node.sourceValue ? '1' : '0') : '?';
                result += `  ${connectorName}: ${value}${node.hasOutput ? '' : ' (not connected)'}\n`;
            });
        }
        
        // Show special state for certain components
        if (component.type === 'INPUT') {
            result += `\nState: ${component.state ? '1' : '0'}\n`;
        } else if (component.type === 'CLOCK_PULSE') {
            result += `\nClock State: ${component.isRunning ? (component.state ? 'HIGH' : 'LOW') : 'OFF'}\n`;
        } else if (component.type === 'THREE_BIT_LATCH') {
            result += `\nStored Value: ${component.storedValue}\n`;
        }
        
        // Show connections
        const incomingWires = this.wires.filter(wire => wire.endGate === component);
        const outgoingWires = this.wires.filter(wire => wire.startGate === component);
        
        if (incomingWires.length > 0) {
            result += `\nIncoming Connections:\n`;
            incomingWires.forEach(wire => {
                const fromConnector = this.getConnectorName(wire.startGate, wire.start, 'output', 
                    wire.startGate.outputNodes.indexOf(wire.start));
                result += `  ${wire.startGate.label} ${fromConnector} → ${component.label}\n`;
            });
        }
        
        if (outgoingWires.length > 0) {
            result += `\nOutgoing Connections:\n`;
            outgoingWires.forEach(wire => {
                const toConnector = this.getConnectorName(wire.endGate, wire.end, 'input', 
                    wire.endGate.inputNodes.indexOf(wire.end));
                result += `  ${component.label} → ${wire.endGate.label} ${toConnector}\n`;
            });
        }
        
        return result;
    }
    
    getConnectorName(component, node, type, index) {
        // For complex components, return the labeled connector name
        if (component.type === 'FULL_ADDER') {
            if (type === 'input') {
                if (index === 0) return 'Cin';
                if (index === 1) return 'A';
                if (index === 2) return 'B';
            } else {
                if (index === 0) return 'S';
                if (index === 1) return 'Cout';
            }
        } else if (component.type === 'NIXIE_DISPLAY') {
            if (type === 'input') {
                if (index === 0) return 'I1';
                if (index === 1) return 'I2';
                if (index === 2) return 'I4';
            }
        } else if (component.type === 'THREE_BIT_ADDER') {
            if (type === 'input') {
                if (index === 0) return 'A0';
                if (index === 1) return 'A1';
                if (index === 2) return 'A2';
                if (index === 3) return 'B0';
                if (index === 4) return 'B1';
                if (index === 5) return 'B2';
            } else {
                if (index === 0) return 'S0';
                if (index === 1) return 'S1';
                if (index === 2) return 'S2';
                if (index === 3) return 'Cout';
            }
        } else if (component.type === 'CLOCK_PULSE') {
            if (type === 'output') {
                if (index === 0) return 'Hi';
                if (index === 1) return 'Lo';
            }
        } else if (component.type === 'SR_FLIP_FLOP') {
            if (type === 'input') {
                if (index === 0) return 'S';
                if (index === 1) return 'R';
                if (index === 2) return 'CLK';
            } else {
                if (index === 0) return 'Q';
                if (index === 1) return 'Q\'';
            }
        } else if (component.type === 'JK_FLIP_FLOP') {
            if (type === 'input') {
                if (index === 0) return 'J';
                if (index === 1) return 'K';
                if (index === 2) return 'CLK';
            } else {
                if (index === 0) return 'Q';
                if (index === 1) return 'Q\'';
            }
        } else if (component.type === 'ONE_BIT_LATCH') {
            if (type === 'input') {
                if (index === 0) return 'D';
                if (index === 1) return 'CLK';
            } else {
                if (index === 0) return 'Q';
            }
        } else if (component.type === 'THREE_BIT_LATCH') {
            if (type === 'input') {
                if (index === 0) return 'CLK';
                if (index === 1) return 'I1';
                if (index === 2) return 'I2';
                if (index === 3) return 'I3';
            } else {
                if (index === 0) return 'O1';
                if (index === 1) return 'O2';
                if (index === 2) return 'O3';
            }
        }
        
        // For simple gates, return numbered connectors
        if (type === 'input') {
            if (component.type === 'OUTPUT') {
                return 'input'; // OUTPUT components only have one input
            }
            return component.inputNodes.length === 1 ? 'input' : `input-${index + 1}`;
        } else {
            if (component.type === 'INPUT') {
                return 'output'; // INPUT components only have one output
            }
            return component.outputNodes.length === 1 ? 'output' : `output-${index + 1}`;
        }
    }

    // Command history system
    addToHistory(command) {
        // Don't add empty commands or duplicate consecutive commands
        if (command.trim() === '' || 
            (this.commandHistory.length > 0 && this.commandHistory[this.commandHistory.length - 1] === command)) {
            return;
        }
        
        this.commandHistory.push(command);
        
        // Keep only the last 50 commands
        if (this.commandHistory.length > 50) {
            this.commandHistory.shift();
        }
        
        // Reset history index
        this.historyIndex = -1;
    }
    
    getPreviousCommand() {
        if (this.commandHistory.length === 0) {
            return null;
        }
        
        if (this.historyIndex === -1) {
            // First time going up, save current command
            this.currentCommand = document.getElementById('commandInput').value;
        }
        
        if (this.historyIndex < this.commandHistory.length - 1) {
            this.historyIndex++;
            return this.commandHistory[this.commandHistory.length - 1 - this.historyIndex];
        }
        
        return this.commandHistory[0]; // Return oldest command
    }
    
    getNextCommand() {
        if (this.historyIndex <= 0) {
            // Going back to current command or beyond
            this.historyIndex = -1;
            return this.currentCommand;
        }
        
        this.historyIndex--;
        return this.commandHistory[this.commandHistory.length - 1 - this.historyIndex];
    }
    
    updateCommandInput(command) {
        const commandInput = document.getElementById('commandInput');
        commandInput.value = command || '';
        // Move cursor to end
        commandInput.setSelectionRange(commandInput.value.length, commandInput.value.length);
    }

    // Add method to handle ESC key to exit tag mode
    handleKeyDown(e) {
        if (e.key === 'Escape') {
            if (this.isTagMode) {
                this.isTagMode = false;
                document.getElementById('tagMode').classList.remove('active');
                this.canvas.style.cursor = 'default';
            }
            // ... rest of existing ESC key handling ...
        }
    }

    // Helper methods for command validation
    findNode(gate, connectorName) {
        const connector = connectorName.toLowerCase();
        
        // Handle output connections
        if (connector === 'output') {
            return gate.outputNodes[0];
        } else if (connector.startsWith('output-')) {
            const outputIndex = parseInt(connector.split('-')[1]) - 1;
            return gate.outputNodes[outputIndex];
        }
        
        // Handle input connections
        if (connector === 'input') {
            return gate.inputNodes[0];
        } else if (connector.startsWith('input-')) {
            const inputIndex = parseInt(connector.split('-')[1]) - 1;
            return gate.inputNodes[inputIndex];
        }
        
        // Handle labeled connectors for complex components
        // Check input nodes for labels
        for (let i = 0; i < gate.inputNodes.length; i++) {
            const node = gate.inputNodes[i];
            if (node.label && node.label.toLowerCase() === connector) {
                return node;
            }
        }
        
        // Check output nodes for labels
        for (let i = 0; i < gate.outputNodes.length; i++) {
            const node = gate.outputNodes[i];
            if (node.label && node.label.toLowerCase() === connector) {
                return node;
            }
        }
        
        // For components with known labeled connectors, check by position/index
        if (gate.type === 'FULL_ADDER') {
            // Full Adder: Cin, A, B inputs; S, Cout outputs
            if (connector === 'cin') return gate.inputNodes[0];
            if (connector === 'a') return gate.inputNodes[1];
            if (connector === 'b') return gate.inputNodes[2];
            if (connector === 's') return gate.outputNodes[0];
            if (connector === 'cout') return gate.outputNodes[1];
        } else if (gate.type === 'NIXIE_DISPLAY') {
            // Nixie Display: I1, I2, I4 inputs
            if (connector === 'i1') return gate.inputNodes[0];
            if (connector === 'i2') return gate.inputNodes[1];
            if (connector === 'i4') return gate.inputNodes[2];
        } else if (gate.type === 'THREE_BIT_ADDER') {
            // 3-bit Adder: A0, A1, A2, B0, B1, B2 inputs; S0, S1, S2, Cout outputs
            if (connector === 'a0') return gate.inputNodes[0];
            if (connector === 'a1') return gate.inputNodes[1];
            if (connector === 'a2') return gate.inputNodes[2];
            if (connector === 'b0') return gate.inputNodes[3];
            if (connector === 'b1') return gate.inputNodes[4];
            if (connector === 'b2') return gate.inputNodes[5];
            if (connector === 's0') return gate.outputNodes[0];
            if (connector === 's1') return gate.outputNodes[1];
            if (connector === 's2') return gate.outputNodes[2];
            if (connector === 'cout') return gate.outputNodes[3];
        } else if (gate.type === 'SR_FLIP_FLOP') {
            // SR Flip-Flop: S, R, CLK inputs; Q, Q' outputs
            if (connector === 's') return gate.inputNodes[0];
            if (connector === 'r') return gate.inputNodes[1];
            if (connector === 'clk') return gate.inputNodes[2];
            if (connector === 'q') return gate.outputNodes[0];
            if (connector === 'q\'') return gate.outputNodes[1];
        } else if (gate.type === 'JK_FLIP_FLOP') {
            // JK Flip-Flop: J, K, CLK inputs; Q, Q' outputs
            if (connector === 'j') return gate.inputNodes[0];
            if (connector === 'k') return gate.inputNodes[1];
            if (connector === 'clk') return gate.inputNodes[2];
            if (connector === 'q') return gate.outputNodes[0];
            if (connector === 'q\'') return gate.outputNodes[1];
        } else if (gate.type === 'ONE_BIT_LATCH') {
            // 1-bit Latch: D, CLK inputs; Q output
            if (connector === 'd') return gate.inputNodes[0];
            if (connector === 'clk') return gate.inputNodes[1];
            if (connector === 'q') return gate.outputNodes[0];
        } else if (gate.type === 'CLOCK_PULSE') {
            // Clock Pulse: Hi, Lo outputs
            if (connector === 'hi') return gate.outputNodes[0];
            if (connector === 'lo') return gate.outputNodes[1];
        } else if (gate.type === 'THREE_BIT_LATCH') {
            // 3-bit Latch: CLK, I1, I2, I3 inputs; O1, O2, O3 outputs
            if (connector === 'clk') return gate.inputNodes[0];
            if (connector === 'i1') return gate.inputNodes[1];
            if (connector === 'i2') return gate.inputNodes[2];
            if (connector === 'i3') return gate.inputNodes[3];
            if (connector === 'o1') return gate.outputNodes[0];
            if (connector === 'o2') return gate.outputNodes[1];
            if (connector === 'o3') return gate.outputNodes[2];
        }
        
        return null;
    }
    
    getValidConnectors(gate) {
        const connectors = [];
        
        // For complex components, show labeled connectors
        if (gate.type === 'FULL_ADDER') {
            connectors.push('Cin', 'A', 'B', 'S', 'Cout');
        } else if (gate.type === 'NIXIE_DISPLAY') {
            connectors.push('I1', 'I2', 'I4');
        } else if (gate.type === 'THREE_BIT_ADDER') {
            connectors.push('A0', 'A1', 'A2', 'B0', 'B1', 'B2', 'S0', 'S1', 'S2', 'Cout');
        } else if (gate.type === 'SR_FLIP_FLOP') {
            connectors.push('S', 'R', 'CLK', 'Q', 'Q\'');
        } else if (gate.type === 'JK_FLIP_FLOP') {
            connectors.push('J', 'K', 'CLK', 'Q', 'Q\'');
        } else if (gate.type === 'ONE_BIT_LATCH') {
            connectors.push('D', 'CLK', 'Q');
        } else if (gate.type === 'CLOCK_PULSE') {
            connectors.push('Hi', 'Lo');
        } else if (gate.type === 'THREE_BIT_LATCH') {
            connectors.push('CLK', 'I1', 'I2', 'I3', 'O1', 'O2', 'O3');
        } else {
            // For simple gates, use numbered connectors
            // Add input connectors
            if (gate.type === 'OUTPUT') {
                connectors.push('input'); // OUTPUT components only have one input
            } else if (gate.inputNodes.length === 1) {
                connectors.push('input');
            } else {
                gate.inputNodes.forEach((_, index) => {
                    connectors.push(`input-${index + 1}`);
                });
            }
            
            // Add output connectors
            if (gate.type === 'INPUT') {
                connectors.push('output'); // INPUT components only have one output
            } else if (gate.outputNodes.length === 1) {
                connectors.push('output');
            } else {
                gate.outputNodes.forEach((_, index) => {
                    connectors.push(`output-${index + 1}`);
                });
            }
        }
        
        return connectors;
    }

    // Layout optimization system
    performLayout() {
        if (this.gates.length === 0) {
            return 'No components to layout';
        }
        
        console.log(`Starting layout with ${this.gates.length} gates and ${this.wires.length} wires`);
        
        // Check if there are any existing waypoints
        const hasWaypoints = this.wires.some(wire => wire.waypoints && wire.waypoints.length > 0);
        
        if (hasWaypoints) {
            // Show confirmation dialog
            const confirmed = confirm('Layout will delete existing waypoints. Continue?');
            if (!confirmed) {
                return 'Layout cancelled';
            }
            
            // Remove all waypoints
            this.wires.forEach(wire => {
                wire.waypoints = [];
            });
        }
        
        const result = this.optimizeLayout();
        console.log(`Layout completed. Gates: ${this.gates.length}, Wires: ${this.wires.length}`);
        // Don't call circuit update for layout - just reposition components
        return result;
    }
    
    optimizeLayout() {
        console.log('Step 1: Analyzing circuit structure...');
        // Step 1: Analyze circuit structure
        const analysis = this.analyzeCircuit();
        
        console.log('Step 2: Applying force-directed layout...');
        // Step 2: Apply force-directed layout
        this.applyForceDirectedLayout(analysis);
        
        console.log('Step 3: Optimizing wire routing...');
        // Step 3: Optimize wire routing
        this.optimizeWireRouting();
        
        console.log('Step 4: Final positioning adjustments...');
        // Step 4: Final positioning adjustments
        this.finalizeLayout();
        
        return `Layout optimized: ${this.gates.length} components repositioned`;
    }
    
    analyzeCircuit() {
        const analysis = {
            inputs: [],
            outputs: [],
            gates: [],
            connections: [],
            levels: new Map(), // Component levels (depth from inputs)
            wireCrossings: 0
        };
        
        console.log(`Analyzing ${this.gates.length} gates...`);
        
        // Categorize components
        this.gates.forEach(gate => {
            if (gate.type === 'INPUT') {
                analysis.inputs.push(gate);
            } else if (gate.type === 'OUTPUT') {
                analysis.outputs.push(gate);
            } else {
                analysis.gates.push(gate);
            }
        });
        
        console.log(`Categorized: ${analysis.inputs.length} inputs, ${analysis.outputs.length} outputs, ${analysis.gates.length} gates`);
        
        // Build connection graph and calculate levels
        this.calculateComponentLevels(analysis);
        
        // Count wire crossings
        analysis.wireCrossings = this.countWireCrossings();
        
        return analysis;
    }
    
    calculateComponentLevels(analysis) {
        const visited = new Set();
        const levels = new Map();
        
        // Start with inputs at level 0
        analysis.inputs.forEach(input => {
            levels.set(input, 0);
            visited.add(input);
        });
        
        // BFS to calculate levels
        const queue = [...analysis.inputs];
        while (queue.length > 0) {
            const current = queue.shift();
            const currentLevel = levels.get(current);
            
            // Find all components connected to current
            this.wires.forEach(wire => {
                let target = null;
                if (wire.startGate === current) {
                    target = wire.endGate;
                } else if (wire.endGate === current) {
                    target = wire.startGate;
                }
                
                if (target && !visited.has(target)) {
                    visited.add(target);
                    levels.set(target, currentLevel + 1);
                    queue.push(target);
                }
            });
        }
        
        analysis.levels = levels;
    }
    
    countWireCrossings() {
        let crossings = 0;
        
        for (let i = 0; i < this.wires.length; i++) {
            for (let j = i + 1; j < this.wires.length; j++) {
                if (this.wiresIntersect(this.wires[i], this.wires[j])) {
                    crossings++;
                }
            }
        }
        
        return crossings;
    }
    
    wiresIntersect(wire1, wire2) {
        // Simplified intersection detection using bounding boxes
        const box1 = this.getWireBoundingBox(wire1);
        const box2 = this.getWireBoundingBox(wire2);
        
        return !(box1.right < box2.left || 
                box1.left > box2.right || 
                box1.bottom < box2.top || 
                box1.top > box2.bottom);
    }
    
    getWireBoundingBox(wire) {
        const points = this.getWirePoints(wire);
        let minX = Math.min(...points.map(p => p.x));
        let maxX = Math.max(...points.map(p => p.x));
        let minY = Math.min(...points.map(p => p.y));
        let maxY = Math.max(...points.map(p => p.y));
        
        return { left: minX, right: maxX, top: minY, bottom: maxY };
    }
    
    getWirePoints(wire) {
        const points = [];
        
        // Add start point
        const startEntry = this.getEntryPoint(wire.start, wire.startGate);
        points.push(startEntry);
        
        // Add waypoints
        if (wire.waypoints) {
            points.push(...wire.waypoints);
        }
        
        // Add end point
        const endEntry = this.getEntryPoint(wire.end, wire.endGate);
        points.push(endEntry);
        
        return points;
    }
    
    applyForceDirectedLayout(analysis) {
        const iterations = 20; // Reduced iterations
        const repulsionForce = 50; // Reduced force
        const attractionForce = 0.05; // Reduced force
        const damping = 0.9; // Increased damping
        
        // Initialize velocities
        const velocities = new Map();
        this.gates.forEach(gate => {
            velocities.set(gate, { x: 0, y: 0 });
        });
        
        for (let iter = 0; iter < iterations; iter++) {
            // Apply repulsion forces between all components
            this.applyRepulsionForces(velocities, repulsionForce);
            
            // Apply attraction forces between connected components
            this.applyAttractionForces(velocities, attractionForce, analysis);
            
            // Update positions
            this.updatePositions(velocities, damping);
            
            // Keep components within canvas bounds
            this.constrainToCanvas();
        }
        
        // Apply level-based positioning after force-directed layout
        this.applyLevelPositioning(analysis);
    }
    
    applyRepulsionForces(velocities, force) {
        for (let i = 0; i < this.gates.length; i++) {
            for (let j = i + 1; j < this.gates.length; j++) {
                const gate1 = this.gates[i];
                const gate2 = this.gates[j];
                
                const dx = gate2.x - gate1.x;
                const dy = gate2.y - gate1.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance > 0 && distance < 150) {
                    const repulsion = force / (distance * distance);
                    const fx = (dx / distance) * repulsion;
                    const fy = (dy / distance) * repulsion;
                    
                    velocities.get(gate1).x -= fx;
                    velocities.get(gate1).y -= fy;
                    velocities.get(gate2).x += fx;
                    velocities.get(gate2).y += fy;
                }
            }
        }
    }
    
    applyAttractionForces(velocities, force, analysis) {
        this.wires.forEach(wire => {
            const gate1 = wire.startGate;
            const gate2 = wire.endGate;
            
            const dx = gate2.x - gate1.x;
            const dy = gate2.y - gate1.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > 0) {
                const attraction = force * distance;
                const fx = (dx / distance) * attraction;
                const fy = (dy / distance) * attraction;
                
                velocities.get(gate1).x += fx;
                velocities.get(gate1).y += fy;
                velocities.get(gate2).x -= fx;
                velocities.get(gate2).y -= fy;
            }
        });
    }
    
    applyLevelPositioning(analysis) {
        const levelGroups = new Map();
        
        // Group components by level
        this.gates.forEach(gate => {
            const level = analysis.levels.get(gate) || 0;
            if (!levelGroups.has(level)) {
                levelGroups.set(level, []);
            }
            levelGroups.get(level).push(gate);
        });
        
        // Position components by level - use direct positioning instead of smooth transition
        const levelWidth = this.canvas.width / (levelGroups.size + 1);
        levelGroups.forEach((gates, level) => {
            const x = levelWidth * (level + 1);
            const gateSpacing = Math.min(120, this.canvas.height / (gates.length + 1));
            
            gates.forEach((gate, index) => {
                const y = gateSpacing * (index + 1);
                
                // Direct positioning - no smooth transition in the force loop
                gate.x = x;
                gate.y = y;
            });
        });
    }
    
    updatePositions(velocities, damping) {
        this.gates.forEach(gate => {
            const vel = velocities.get(gate);
            gate.x += vel.x;
            gate.y += vel.y;
            
            // Apply damping
            vel.x *= damping;
            vel.y *= damping;
        });
    }
    
    constrainToCanvas() {
        const margin = 50;
        this.gates.forEach(gate => {
            gate.x = Math.max(margin, Math.min(this.canvas.width - margin, gate.x));
            gate.y = Math.max(margin, Math.min(this.canvas.height - margin, gate.y));
        });
    }
    
    optimizeWireRouting() {
        this.wires.forEach(wire => {
            this.optimizeWirePath(wire);
        });
    }
    
    optimizeWirePath(wire) {
        // Layout optimization removes waypoints for cleaner appearance
        // Direct connections are preferred after layout optimization
        wire.waypoints = [];
    }
    
    isPathBlocked(from, to) {
        // Check if any component blocks the direct path
        const midX = (from.x + to.x) / 2;
        const midY = (from.y + to.y) / 2;
        
        return this.gates.some(gate => {
            const distance = Math.sqrt(
                Math.pow(gate.x - midX, 2) + Math.pow(gate.y - midY, 2)
            );
            return distance < 60; // Component radius
        });
    }
    
    createWaypoints(from, to) {
        const waypoints = [];
        const dx = to.x - from.x;
        const dy = to.y - from.y;
        
        // Create a simple detour
        if (Math.abs(dx) > Math.abs(dy)) {
            // Horizontal detour
            const midY = from.y + (dy / 2);
            waypoints.push({ x: from.x + (dx / 2), y: midY });
        } else {
            // Vertical detour
            const midX = from.x + (dx / 2);
            waypoints.push({ x: midX, y: from.y + (dy / 2) });
        }
        
        return waypoints;
    }
    
    finalizeLayout() {
        // Snap components to grid for cleaner appearance
        const gridSize = 20;
        this.gates.forEach(gate => {
            gate.x = Math.round(gate.x / gridSize) * gridSize;
            gate.y = Math.round(gate.y / gridSize) * gridSize;
        });
        
        // Ensure minimum spacing
        this.ensureMinimumSpacing();
    }
    
    ensureMinimumSpacing() {
        const minDistance = 80;
        
        for (let i = 0; i < this.gates.length; i++) {
            for (let j = i + 1; j < this.gates.length; j++) {
                const gate1 = this.gates[i];
                const gate2 = this.gates[j];
                
                const dx = gate2.x - gate1.x;
                const dy = gate2.y - gate1.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < minDistance) {
                    const pushDistance = minDistance - distance;
                    const pushX = (dx / distance) * pushDistance * 0.5;
                    const pushY = (dy / distance) * pushDistance * 0.5;
                    
                    gate1.x -= pushX;
                    gate1.y -= pushY;
                    gate2.x += pushX;
                    gate2.y += pushY;
                }
            }
        }
    }
}

// Initialize the circuit editor when the page loads
window.addEventListener('load', () => {
    window.circuitEditor = new CircuitEditor();
});

// Add styles for screen reader elements
const style = document.createElement('style');
style.textContent = `
    .screen-reader-announcement {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        border: 0;
    }

    .screen-reader-toggle {
        padding: 8px 15px;
        border: none;
        border-radius: 4px;
        background-color: #2196F3;
        color: white;
        cursor: pointer;
        transition: background-color 0.2s;
        font-weight: bold;
    }

    .screen-reader-toggle:hover {
        background-color: #1976D2;
    }

    .screen-reader-toggle.active {
        background-color: #1565C0;
    }

    /* Responsive toolbar styles */
    .toolbar {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        padding: 10px;
        background-color: #f5f5f5;
        border-bottom: 1px solid #ddd;
    }

    .gate-selector {
        display: flex;
        flex-wrap: wrap;
        gap: 5px;
        flex: 1;
        min-width: 200px;
    }

    .gate-selector button {
        padding: 8px 12px;
        font-size: 14px;
        white-space: nowrap;
        min-width: 40px;
    }

    .right-section {
        display: flex;
        gap: 10px;
        align-items: center;
    }

    #selectedTool {
        padding: 8px 12px;
        background-color: #fff;
        border: 1px solid #ddd;
        border-radius: 4px;
        min-width: 120px;
    }

    /* Responsive breakpoints */
    @media (max-width: 768px) {
        .toolbar {
            flex-direction: column;
        }

        .gate-selector {
            justify-content: center;
        }

        .right-section {
            justify-content: center;
            width: 100%;
        }

        .gate-selector button {
            padding: 6px 10px;
            font-size: 12px;
        }

        #selectedTool {
            font-size: 12px;
            min-width: 100px;
        }
    }

    @media (max-width: 480px) {
        .gate-selector button {
            padding: 4px 8px;
            font-size: 11px;
        }

        #selectedTool {
            font-size: 11px;
            min-width: 80px;
        }

        .screen-reader-toggle {
            padding: 6px 12px;
            font-size: 12px;
        }
    }

    #tagMode {
        background-color: #2196F3;
        min-width: 40px;
        min-height: 40px;
    }

    #tagMode:hover {
        background-color: #1976D2;
    }

    #tagMode.active {
        background-color: #1565C0;
    }

    #tagMode.active:hover {
        background-color: #0D47A1;
    }

    #waypointsToggle {
        background-color: #9C27B0;
        min-width: 40px;
        min-height: 40px;
    }

    #waypointsToggle:hover {
        background-color: #7B1FA2;
    }

    #waypointsToggle.active {
        background-color: #6A1B9A;
    }

    #waypointsToggle.active:hover {
        background-color: #4A148C;
    }
`;
document.head.appendChild(style);

// Add window resize handler
window.addEventListener('resize', () => {
    if (window.circuitEditor) {
        window.circuitEditor.canvas.width = window.innerWidth - 40;
        window.circuitEditor.canvas.height = window.innerHeight - 100;
        window.circuitEditor.render();
    }
}); 
