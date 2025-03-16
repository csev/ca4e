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
            });
        });

        // Canvas mouse events
        this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
        this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
        this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
        
        // Clear button
        document.getElementById('clear').addEventListener('click', () => {
            this.gates = [];
            this.wires = [];
            this.render();
        });

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

        // Add click handling for inputs
        this.canvas.addEventListener('click', this.handleClick.bind(this));
    }

    handleMouseDown(e) {
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
                const newGate = new Gate(this.selectedTool, x, y, this);
                this.gates.push(newGate);
                this.selectedTool = null;
                this.canvas.style.cursor = 'default';
            } else {
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
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

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
        this.draggingGate = null;
    }

    handleClick(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Check if we clicked on an input gate
        for (const gate of this.gates) {
            if (gate.type === 'INPUT' && this.isPointInGate(x, y, gate)) {
                if (gate.toggleInput()) {
                    this.showMessage(`Input set to ${gate.state ? '1' : '0'}`);
                    this.updateWireValues();
                    this.logCircuitState();
                }
                break;
            }
        }
    }

    updateSimulation() {
        // This will be implemented later when we add circuit simulation
        // For now, just update the display
        this.render();
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

        // Check if nodes can accept connections
        if (!startNode.gate.canAcceptConnection(startNode.node, false)) {
            this.showMessage('Output is already connected', true);
            return;
        }
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
        
        // Update wire values and log state
        this.updateWireValues();
        this.logCircuitState();
        
        this.showMessage('Connection created successfully');
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
            
            // Create a smooth curve for the wire
            const midX = (wire.start.x + wire.end.x) / 2;
            this.ctx.bezierCurveTo(
                midX, wire.start.y,
                midX, wire.end.y,
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

    // Add method to update wire values
    updateWireValues() {
        // Reset all node source values
        this.gates.forEach(gate => {
            gate.inputNodes.forEach(node => {
                node.sourceValue = undefined;
            });
            gate.outputNodes.forEach(node => {
                node.sourceValue = undefined;
            });
        });

        // Process gates in order: INPUT -> LOGIC GATES -> OUTPUT
        // First, process INPUT gates
        this.gates.forEach(gate => {
            if (gate.type === 'INPUT') {
                gate.evaluate();
            }
        });

        // Propagate values through wires
        this.wires.forEach(wire => {
            wire.end.sourceValue = wire.start.sourceValue;
        });

        // Process all logic gates
        let changed;
        do {
            changed = false;
            this.gates.forEach(gate => {
                if (gate.type !== 'INPUT' && gate.type !== 'OUTPUT') {
                    const oldValue = gate.outputNodes[0]?.sourceValue;
                    const newValue = gate.evaluate();
                    if (oldValue !== newValue) {
                        changed = true;
                    }
                }
            });

            // Propagate values through wires after each iteration
            this.wires.forEach(wire => {
                wire.end.sourceValue = wire.start.sourceValue;
            });
        } while (changed); // Continue until no more changes occur

        // Update display
        this.render();
    }

    // Add debug logging
    logCircuitState() {
        console.log('Circuit State:');
        this.gates.forEach(gate => {
            console.log(`Gate Type: ${gate.type}`);
            if (gate.inputNodes.length > 0) {
                console.log('  Input Values:', gate.inputNodes.map(n => n.sourceValue));
            }
            if (gate.outputNodes.length > 0) {
                console.log('  Output Values:', gate.outputNodes.map(n => n.sourceValue));
            }
        });
        console.log('Wires:');
        this.wires.forEach(wire => {
            console.log(`  Wire: ${wire.start.sourceValue} -> ${wire.end.sourceValue}`);
        });
    }
}

// Initialize the circuit editor when the page loads
window.addEventListener('load', () => {
    window.circuitEditor = new CircuitEditor();
}); 