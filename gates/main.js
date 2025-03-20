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
        
        // Bind event listeners
        this.initializeEventListeners();
        
        // Start render loop
        this.render();
    }

    initializeEventListeners() {
        // Gate selection buttons
        document.querySelectorAll('.gate-selector button').forEach(button => {
            button.addEventListener('click', () => {
                this.selectedTool = button.dataset.gate;
                this.canvas.style.cursor = 'crosshair';
                document.getElementById('selectedTool').textContent = `Selected: ${button.dataset.gate}`;
            });
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

        // Modify the click handler to include delete functionality
        this.canvas.addEventListener('click', this.handleClick.bind(this));

        // Add double-click handler for editing labels
        this.canvas.addEventListener('dblclick', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            // Check if clicked on an INPUT or OUTPUT gate
            for (const gate of this.gates) {
                if ((gate.type === 'INPUT' || gate.type === 'OUTPUT') && this.isPointInGate(x, y, gate)) {
                    const newLabel = prompt('Enter new label:', gate.label);
                    if (newLabel !== null) { // Check if user clicked Cancel
                        gate.setLabel(newLabel);
                        this.render();
                    }
                    break;
                }
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
                // Create new gate with reference to the editor
                let newGate;
                if (this.selectedTool === 'FULL_ADDER') {
                    newGate = new FullAdder(x, y, this);
                } else if (this.selectedTool === 'NIXIE_DISPLAY') {
                    newGate = new NixieDisplay(x, y, this);
                } else {
                    newGate = new Gate(this.selectedTool, x, y, this);
                }
                this.gates.push(newGate);
                this.selectedTool = null;
                this.canvas.style.cursor = 'default';
                // Clear the selected tool status
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

        // Handle gate dragging
        if (this.draggingGate) {
            const dx = x - this.dragStartX;
            const dy = y - this.dragStartY;
            
            // Update gate position
            this.draggingGate.x = this.dragStartGateX + dx;
            this.draggingGate.y = this.dragStartGateY + dy;
            
            // Update all node positions using stored relative positions
            this.draggingGate.inputNodes.forEach((node, index) => {
                // Special handling for different gate types
                if (this.draggingGate.type === 'NIXIE_DISPLAY') {
                    node.x = this.draggingGate.x - 40;
                } else if (this.draggingGate.type === 'FULL_ADDER') {
                    // Full adder has three inputs at different heights
                    node.x = this.draggingGate.x - 25;
                    node.y = this.draggingGate.y + (index - 1) * 20; // -20, 0, +20
                } else if (this.draggingGate.type === 'NOT') {
                    // NOT gate has a single input at a specific position
                    node.x = this.draggingGate.x - 27;
                    node.y = this.draggingGate.y;
                } else {
                    node.x = this.draggingGate.x - 20;
                }
                if (this.draggingGate.type !== 'FULL_ADDER' && this.draggingGate.type !== 'NOT') {
                    node.y = this.draggingGate.y + this.dragStartNodePositions.inputs[index].relativeY;
                }
            });
            this.draggingGate.outputNodes.forEach((node, index) => {
                if (this.draggingGate.type === 'FULL_ADDER') {
                    // Full adder has two outputs at different heights
                    node.x = this.draggingGate.x + 25; // Match the input offset
                    // Keep the outputs at fixed heights relative to the gate center
                    node.y = this.draggingGate.y + (index === 0 ? -10 : 10); // First output at -10, second at +10
                } else if (this.draggingGate.type === 'NOT') {
                    // NOT gate has a single output at a specific position
                    node.x = this.draggingGate.x + 27;
                    node.y = this.draggingGate.y;
                } else {
                    node.x = this.draggingGate.x + 20;
                    node.y = this.draggingGate.y + this.dragStartNodePositions.outputs[index].relativeY;
                }
            });
            
            // Force a render
            this.render();
            return;
        }

        // Update cursor for input gates
        let overInput = false;
        for (const gate of this.gates) {
            if (gate.type === 'INPUT' && this.isPointInGate(x, y, gate)) {
                overInput = true;
                this.canvas.style.cursor = 'pointer';
                break;
            }
        }

        if (!overInput && !this.wireStartNode) {
            this.canvas.style.cursor = 'default';
        }
    }

    handleMouseUp() {
        this.isMouseDown = false;
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

    handleClick(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

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
            // Existing click handling for input gates
            for (const gate of this.gates) {
                if (gate.type === 'INPUT' && this.isPointInGate(x, y, gate)) {
                    if (gate.toggleInput()) {
                        this.showMessage(`Input set to ${gate.state ? '1' : '0'}`);
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
            endGate: endNode.gate
        };

        // Update connection states
        startNode.gate.connectNode(startNode.node, false);
        endNode.gate.connectNode(endNode.node, true);

        this.wires.push(wire);
        
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
            this.ctx.beginPath();
            this.ctx.moveTo(wire.start.x, wire.start.y);
            
            // Calculate wire path using Bezier curves for all connections
            const dx = wire.end.x - wire.start.x;
            const dy = wire.end.y - wire.start.y;
            const angle = Math.atan2(dy, dx) * 180 / Math.PI;
            
            // Calculate control points to ensure proper angles
            let cp1x, cp1y, cp2x, cp2y;
            
            if (Math.abs(angle) <= 20) {
                // If angle is within limits, use direct curve
                const midX = (wire.start.x + wire.end.x) / 2;
                cp1x = midX;
                cp1y = wire.start.y;
                cp2x = midX;
                cp2y = wire.end.y;
            } else {
                // If angle is outside limits, create intermediate points
                const distance = Math.sqrt(dx * dx + dy * dy);
                const maxAngle = 20 * Math.PI / 180;
                
                // Calculate intermediate points to maintain angle limits
                if (angle > 20) {
                    // Angle is too steep upward
                    const yOffset = distance * Math.sin(maxAngle);
                    cp1x = wire.start.x + distance * 0.3;
                    cp1y = wire.start.y + yOffset;
                    cp2x = wire.end.x - distance * 0.3;
                    cp2y = wire.end.y - yOffset;
                } else {
                    // Angle is too steep downward
                    const yOffset = distance * Math.sin(maxAngle);
                    cp1x = wire.start.x + distance * 0.3;
                    cp1y = wire.start.y - yOffset;
                    cp2x = wire.end.x - distance * 0.3;
                    cp2y = wire.end.y + yOffset;
                }
            }
            
            // Draw the curve with calculated control points
            this.ctx.bezierCurveTo(
                cp1x, cp1y,
                cp2x, cp2y,
                wire.end.x, wire.end.y
            );
            
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
            
            // Draw wire
            this.ctx.stroke();

            // Draw connection points
            this.ctx.beginPath();
            this.ctx.arc(wire.start.x, wire.start.y, 3, 0, Math.PI * 2);
            this.ctx.arc(wire.end.x, wire.end.y, 3, 0, Math.PI * 2);
            this.ctx.fillStyle = wire === this.hoveredWire ? '#2196F3' : '#4CAF50';
            this.ctx.fill();
        });
    }

    isPointNearWire(x, y, wire) {
        const threshold = 5;
        
        // Check if point is near wire curve
        const midX = (wire.start.x + wire.end.x) / 2;
        const points = [
            { x: wire.start.x, y: wire.start.y },
            { x: midX, y: wire.start.y },
            { x: midX, y: wire.end.y },
            { x: wire.end.x, y: wire.end.y }
        ];

        for (let i = 0; i < points.length - 1; i++) {
            const dist = this.pointToLineDistance(
                x, y,
                points[i].x, points[i].y,
                points[i + 1].x, points[i + 1].y
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
        } else {
            document.getElementById('selectedTool').textContent = 'Selected: Delete Mode';
        }
    }

    clear() {
        this.gates = [];
        this.wires = [];
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
}

// Initialize the circuit editor when the page loads
window.addEventListener('load', () => {
    window.circuitEditor = new CircuitEditor();
}); 