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
        
        // Add screen reader toggle button
        this.addScreenReaderToggle();
        
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
        
        // Start render loop
        this.render();
    }

    initializeEventListeners() {
        // Gate selection buttons
        document.querySelectorAll('.gate-selector button').forEach(button => {
            // Add hover announcement
            button.addEventListener('mouseenter', () => {
                if (this.screenReaderMode) {
                    this.announce(`Toolbar button: ${button.dataset.gate} gate`);
                }
            });

            button.addEventListener('click', () => {
                this.selectedTool = button.dataset.gate;
                this.canvas.style.cursor = 'crosshair';
                document.getElementById('selectedTool').textContent = `Selected: ${button.dataset.gate}`;
                
                // Announce tool selection
                if (this.screenReaderMode) {
                    this.announce(`Selected ${button.dataset.gate} gate tool`);
                }
            });
        });

        // Add hover announcement for delete button
        const deleteButton = document.getElementById('delete');
        deleteButton.addEventListener('mouseenter', () => {
            if (this.screenReaderMode) {
                this.announce('Delete mode button');
            }
        });

        // Add hover announcement for screen reader toggle
        const screenReaderButton = document.getElementById('screenReaderToggle');
        screenReaderButton.addEventListener('mouseenter', () => {
            if (this.screenReaderMode) {
                this.announce('Screen reader toggle button');
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
                // Reset selected tool display
                document.getElementById('selectedTool').textContent = 'Selected: None';
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
                document.getElementById('selectedTool').textContent = 'Selected: Tag Mode';
                // Disable delete mode if it was active
                if (this.deleteMode) {
                    this.setDeleteMode(false);
                }
            } else {
                this.canvas.style.cursor = 'default';
                document.getElementById('selectedTool').textContent = 'Selected: None';
            }
        });

        // Modify the handleClick method to include tag mode
        this.canvas.addEventListener('click', this.handleClick.bind(this));
        this.canvas.addEventListener('dblclick', this.handleDoubleClick.bind(this));
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
                    this.updateWireValues();
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
                document.getElementById('selectedTool').textContent = 'Selected: None';
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
                this.updateWireValues();
            }
        }, this.updateDebounceTime);

        // Handle waypoint dragging
        if (this.draggingWaypoint) {
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
            const dx = x - this.dragStartX;
            const dy = y - this.dragStartY;
            
            // Update gate position
            this.draggingGate.x = this.dragStartGateX + dx;
            this.draggingGate.y = this.dragStartGateY + dy;
            
            // Update all node positions using stored relative positions
            this.draggingGate.inputNodes.forEach((node, index) => {
                if (this.draggingGate.type === 'ONE_BIT_LATCH') {
                    if (index === 0) {  // Data input
                        node.x = this.draggingGate.x - this.draggingGate.width/2;
                        node.y = this.draggingGate.y + Gate.twoInputSquareVeritcalOffset; // Offset D input down
                    } else if (index === 1) {  // Clock input
                        node.x = this.draggingGate.x - this.draggingGate.width/2;
                        node.y = this.draggingGate.y - Gate.twoInputSquareVeritcalOffset;

                    } 
                    return;
                } else if (this.draggingGate.type === 'JK_FLIP_FLOP') {
                    if (index === 0) {      // J input
                        node.x = this.draggingGate.x - this.draggingGate.width/2;
                        node.y = this.draggingGate.y - Gate.twoInputSquareVeritcalOffset;
                    } else if (index === 1) { // Clock input
                        node.x = this.draggingGate.x;
                        node.y = this.draggingGate.y - this.draggingGate.height/2;
                    } else if (index === 2) { // K input
                        node.x = this.draggingGate.x - this.draggingGate.width/2;
                        node.y = this.draggingGate.y + Gate.twoInputSquareVeritcalOffset;
                    }
                    return;
                } else if (this.draggingGate.type === 'SR_FLIP_FLOP') {
                    node.x = this.draggingGate.x - this.draggingGate.width/2;
                    if (index === 0) {      // S input
                        node.y = this.draggingGate.y - Gate.twoInputSquareVeritcalOffset;
                    } else {                // R input
                        node.y = this.draggingGate.y + Gate.twoInputSquareVeritcalOffset;
                    }
                } else if (this.draggingGate.type === 'CLOCK_PULSE') {
                    // Clock pulse has no input nodes
                } else if (this.draggingGate.type === 'THREE_BIT_ADDER') {
                    if (index < 3) {  // A inputs (left side)
                        node.x = this.draggingGate.x - this.draggingGate.width/2;
                        node.y = this.draggingGate.y + (index - 1) * 25;  // -25, 0, +25
                    } else {          // B inputs (right side)
                        node.x = this.draggingGate.x + this.draggingGate.width/2;
                        node.y = this.draggingGate.y + ((index - 4) * 25);  // -25, 0, +25
                    }
                } else if (this.draggingGate.type === 'THREE_BIT_LATCH') {
                    if (index === 0) {  // Clock input
                        node.x = this.draggingGate.x;
                        node.y = this.draggingGate.y - this.draggingGate.height/2;
                    } else {  // Data inputs
                        node.x = this.draggingGate.x - this.draggingGate.width/2;
                        node.y = this.draggingGate.y + ((index - 2) * 15);  // -15, 0, +15
                    }
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
                } else {
                    node.x = this.draggingGate.x - 20;
                }
                if (this.draggingGate.type !== 'FULL_ADDER' && 
                    this.draggingGate.type !== 'NOT' && 
                    this.draggingGate.type !== 'AND' && 
                    this.draggingGate.type !== 'NAND') {
                    node.y = this.draggingGate.y + this.dragStartNodePositions.inputs[index].relativeY;
                }
            });

            // Update output node positions
            this.draggingGate.outputNodes.forEach((node, index) => {
                if (this.draggingGate.type === 'ONE_BIT_LATCH') {
                    node.x = this.draggingGate.x + this.draggingGate.width/2;
                    node.y = this.draggingGate.y; //
                } else if (this.draggingGate.type === 'JK_FLIP_FLOP') {
                    node.x = this.draggingGate.x + this.draggingGate.width/2;
                    if (index === 0) {      // Q output
                        node.y = this.draggingGate.y - Gate.twoInputSquareVeritcalOffset; // Match J input height
                    } else {                // Q' output
                        node.y = this.draggingGate.y + Gate.twoInputSquareVeritcalOffset; // Match K input height
                    }
                    return;
                } else if (this.draggingGate.type === 'SR_FLIP_FLOP') {
                    node.x = this.draggingGate.x + this.draggingGate.width/2;
                    if (index === 0) {      // Q output
                        node.y = this.draggingGate.y - Gate.twoInputSquareVeritcalOffset;
                    } else {                // Q' output
                        node.y = this.draggingGate.y + Gate.twoInputSquareVeritcalOffset;
                    }
                } else if (this.draggingGate.type === 'CLOCK_PULSE') {
                    // ... existing CLOCK_PULSE code ...
                } else if (this.draggingGate.type === 'THREE_BIT_ADDER') {
                    const spacing = 15;
                    if (index < 3) {  // Sum outputs (S1, S2, S4) - bottom
                        node.x = this.draggingGate.x + (index - 1) * spacing;
                        node.y = this.draggingGate.y + this.draggingGate.height/2 + 20; // 20 pixels below component
                    } else {          // Overflow output (OVF) - top
                        node.x = this.draggingGate.x;
                        node.y = this.draggingGate.y - this.draggingGate.height/2;
                    }
                } else if (this.draggingGate.type === 'THREE_BIT_LATCH') {
                    // ... existing THREE_BIT_LATCH code ...
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
        }
        if (this.draggingGate) {
            // Check if gate position actually changed
            const dx = this.dragStartX - this.draggingGate.x;
            const dy = this.dragStartY - this.draggingGate.y;
            if (Math.abs(dx) > 0.1 || Math.abs(dy) > 0.1) {
                this.updateWireValues();
            }
            this.draggingGate = null;
            this.canvas.style.cursor = 'default';
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
                if ((gate.type === 'INPUT' || gate.type === 'OUTPUT') && this.isPointInGate(x, y, gate)) {
                    const newLabel = prompt('Enter label for the ' + gate.type.toLowerCase() + ':', gate.label);
                    if (newLabel !== null) {
                        gate.setLabel(newLabel);
                        // Exit tag mode after setting label
                        this.isTagMode = false;
                        document.getElementById('tagMode').classList.remove('active');
                        this.canvas.style.cursor = 'default';
                        document.getElementById('selectedTool').textContent = 'Selected: None';
                        this.render();
                    }
                    return;
                }
            }
            // If clicked on non-INPUT/OUTPUT gate while in tag mode
            this.showMessage('Only inputs and outputs can be tagged', 'error');
            return;
        }

        if (this.deleteMode) {
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
                                this.updateWireValues();
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
                        this.updateWireValues();
                    }
                    break;
                }
            }
        }
    }

    updateWireValues() {
        // Skip update if mouse is moving or down
        if (this.isMouseMoving || this.isMouseDown) {
            return;
        }

        // Check if circuit has actually changed
        if (!this.hasCircuitChanged()) {
            return;
        }

        const startTime = performance.now();
        
        // Update the circuit layout
        this.circuit.setLayout(this.gates, this.wires);
        
        // Update the circuit state
        const state = this.circuit.update();
        
        // Log the state if needed
        this.circuit.logState();
        
        // Update display
        this.render();

        const endTime = performance.now();
        const elapsedTime = endTime - startTime;
        console.log(`Circuit recomputation completed in ${elapsedTime.toFixed(2)}ms`);
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
        // Add a waypoint at the specified position
        wire.waypoints.push({ x, y });
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
        this.updateWireValues();
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
        this.ctx.strokeStyle = '#000';
        this.ctx.lineWidth = 2;

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
            
            // Draw waypoints
            wire.waypoints.forEach((waypoint, index) => {
                this.ctx.beginPath();
                this.ctx.arc(waypoint.x, waypoint.y, 4, 0, Math.PI * 2);
                this.ctx.fillStyle = '#FF9800'; // Orange for waypoints
                this.ctx.fill();
                this.ctx.strokeStyle = '#000';
                this.ctx.lineWidth = 1;
                this.ctx.stroke();
            });
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
                return { x: node.x, y: node.y + 10 }; // Exit 10 pixels down from the node
            }
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
        
        // Check if point is near any part of the wire path
        const segments = [];
        
        // Add segments for wire path
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
        this.updateWireValues();
        this.render();
    }

    setDeleteMode(enabled) {
        this.deleteMode = enabled;
        this.canvas.style.cursor = enabled ? 'not-allowed' : 'default';
        document.getElementById('delete').classList.toggle('active', enabled);
        if (!enabled) {
            document.getElementById('selectedTool').textContent = 'Selected: None';
            if (this.screenReaderMode) {
                this.announce('Delete mode cancelled');
            }
        } else {
            document.getElementById('selectedTool').textContent = 'Selected: Delete Mode';
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
        const changed = newHash !== this.circuitHash;
        this.circuitHash = newHash;
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
            gate.type === 'INPUT' && gate.label === label
        );

        if (!inputGate) {
            this.showMessage(`Input component with label "${label}" not found`, true);
            return false;
        }

        // Set the input value
        inputGate.state = value;
        
        // Update the circuit
        this.updateWireValues();
        
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
            gate.type === 'OUTPUT' && gate.label === label
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

    addScreenReaderToggle() {
        const button = document.createElement('button');
        button.id = 'screenReaderToggle';
        button.className = 'screen-reader-toggle';
        button.innerHTML = '🔊 Screen Reader';
        button.onclick = () => this.toggleScreenReader();
        
        // Add to toolbar
        document.querySelector('.right-section').appendChild(button);
    }

    toggleScreenReader() {
        this.screenReaderMode = !this.screenReaderMode;
        const button = document.getElementById('screenReaderToggle');
        button.classList.toggle('active', this.screenReaderMode);
        button.innerHTML = this.screenReaderMode ? '🔊 Screen Reader On' : '🔊 Screen Reader Off';
        
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

    // Add method to handle ESC key to exit tag mode
    handleKeyDown(e) {
        if (e.key === 'Escape') {
            if (this.isTagMode) {
                this.isTagMode = false;
                document.getElementById('tagMode').classList.remove('active');
                this.canvas.style.cursor = 'default';
                document.getElementById('selectedTool').textContent = 'Selected: None';
            }
            // ... rest of existing ESC key handling ...
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
