class CircuitEditor {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.circuit = new Circuit();
        
        // State management
        this.selectedComponent = null;
        this.selectedTool = null;
        this.draggingComponent = null;
        this.wireStartComponent = null;
        this.wireStartPoint = null;
        this.tempWireEnd = null;
        this.isDrawingWire = false;

        // Mouse coordinates
        this.mouseX = 0;
        this.mouseY = 0;

        // Add new state variables for wire drawing
        this.hoveredConnectionPoint = null;
        this.wireEndPoint = null;
        this.wireStartConnectionPoint = null;

        // Add flag to track if we're clicking a switch
        this.clickedSwitch = null;

        // Store references to both bars
        this.vddBar = null;
        this.gndBar = null;
        this.batterySymbol = null;

        // Add wire tracking to dragging component
        this.connectedWires = [];
        this.dragStartPos = null;

        // Add variables to track mouse movement
        this.mouseDownPos = null;
        this.mouseDownTime = null;
        this.dragThreshold = 5; // pixels of movement before considered a drag
        this.clickThreshold = 200; // milliseconds before considered a drag

        // Add double click tracking
        this.lastClickTime = 0;
        this.doubleClickDelay = 300; // milliseconds

        // Add move mode state
        this.moveMode = false;

        // Add delete mode state
        this.deleteMode = false;

        // Setup move mode
        this.setupMoveMode();

        // Setup additional event listeners
        this.setupDeleteMode();

        this.initializeCanvas();
        this.setupEventListeners();

        // Add the bars
        this.initializeBars();
    }

    initializeCanvas() {
        const updateCanvasSize = () => {
            this.canvas.width = window.innerWidth - 40;
            this.canvas.height = window.innerHeight - 100;
            
            // Update bars and battery
            if (this.vddBar) {
                this.vddBar.updateDimensions(this.canvas.width);
            }
            if (this.gndBar) {
                this.gndBar.updateDimensions(this.canvas.width, this.canvas.height);
            }
            if (this.batterySymbol) {
                this.batterySymbol.updatePosition();
            }
            
            // Update connected wires
            this.circuit.wires.forEach(wire => {
                const startComponent = wire.startComponent;
                const endComponent = wire.endComponent;
                
                // Update VDD connections
                if (startComponent === this.vddBar) {
                    const output = startComponent.outputs.find(o => 
                        Math.abs(o.relativePosition - wire.startPoint.relativePosition) < 0.01
                    );
                    if (output) {
                        wire.startPoint.x = output.x;
                        wire.startPoint.y = output.y;
                    }
                }
                
                // Update GND connections
                if (startComponent === this.gndBar || endComponent === this.gndBar) {
                    const point = startComponent === this.gndBar ? wire.startPoint : wire.endPoint;
                    const input = this.gndBar.inputs.find(i => 
                        Math.abs(i.relativePosition - point.relativePosition) < 0.01
                    );
                    if (input) {
                        point.x = input.x;
                        point.y = input.y;
                    }
                }
            });
            
            this.draw();
        };
        
        updateCanvasSize();
        window.addEventListener('resize', updateCanvasSize);
    }

    initializeBars() {
        // Remove any existing bars
        this.circuit.components = this.circuit.components.filter(c => 
            !(c instanceof VDDBar) && !(c instanceof GNDBar)
        );
        
        // Add new bars
        this.vddBar = new VDDBar(this.canvas.width);
        this.gndBar = new GNDBar(this.canvas.width, this.canvas.height);
        this.batterySymbol = new BatterySymbol(this.vddBar, this.gndBar);
        
        this.circuit.addComponent(this.vddBar);
        this.circuit.addComponent(this.gndBar);
    }

    setupEventListeners() {
        // Tool selection
        document.querySelectorAll('.component-selector button').forEach(button => {
            button.addEventListener('click', () => {
                this.selectedTool = button.dataset.component;
                this.selectedComponent = null;
                this.updateStatusBar();
            });
        });

        // Delete button
        document.getElementById('deleteMode').addEventListener('click', () => {
            if (this.selectedComponent) {
                this.circuit.removeComponent(this.selectedComponent);
                this.selectedComponent = null;
                this.draw();
            }
        });

        // Clear button
        document.getElementById('clear').addEventListener('click', () => {
            if (confirm('Are you sure you want to clear the circuit?')) {
                // Store references to bars before clearing
                const vddBar = this.circuit.components.find(c => c.type === 'VDD_BAR');
                const gndBar = this.circuit.components.find(c => c.type === 'GND_BAR');
                
                // Clear the circuit
                this.circuit.clear();
                
                // Update the bars' dimensions if needed
                if (vddBar) vddBar.updateDimensions(this.canvas.width);
                if (gndBar) gndBar.updateDimensions(this.canvas.width, this.canvas.height);
                
                this.selectedComponent = null;
                this.draw();
            }
        });

        // Canvas mouse events
        this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
        this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
        this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));

        // Add ESC key listener for both move and delete modes
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                this.exitMoveMode();
                this.exitDeleteMode();
            }
        });
    }

    setupMoveMode() {
        // Set up move mode button listener
        const moveButton = document.getElementById('moveMode');
        moveButton.addEventListener('click', () => this.toggleMoveMode());
    }

    toggleMoveMode() {
        this.moveMode = !this.moveMode;
        this.selectedTool = null;
        this.updateModeButtons();
        this.updateStatusBar();
        this.canvas.style.cursor = this.moveMode ? 'move' : 'default';
    }

    exitMoveMode() {
        if (this.moveMode) {
            this.moveMode = false;
            this.updateModeButtons();
            this.updateStatusBar();
            this.canvas.style.cursor = 'default';
        }
    }

    updateModeButtons() {
        // Update move mode button - only toggle the active class
        const moveButton = document.getElementById('moveMode');
        moveButton.classList.toggle('active', this.moveMode);

        // Update delete mode button - only toggle the active class
        const deleteButton = document.getElementById('deleteMode');
        deleteButton.classList.toggle('active', this.deleteMode);
    }

    setupDeleteMode() {
        const deleteButton = document.getElementById('deleteMode');
        deleteButton.addEventListener('click', () => this.toggleDeleteMode());
    }

    toggleDeleteMode() {
        this.deleteMode = !this.deleteMode;
        this.moveMode = false; // Exit move mode if active
        this.selectedTool = null;
        this.updateModeButtons();
        this.updateStatusBar();
        this.canvas.style.cursor = this.deleteMode ? 'not-allowed' : 'default';
    }

    exitDeleteMode() {
        if (this.deleteMode) {
            this.deleteMode = false;
            this.updateModeButtons();
            this.updateStatusBar();
            this.canvas.style.cursor = 'default';
        }
    }

    handleMouseDown(event) {
        const rect = this.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        // Clear any existing selection first
        this.selectedComponent = null;

        // Get clicked component
        const clickedComponent = this.findComponentAt(x, y);

        if (clickedComponent) {
            if (this.deleteMode) {
                // In delete mode, remove clicked component if it's not a VDD/GND bar
                if (clickedComponent.type !== 'VDD_BAR' && clickedComponent.type !== 'GND_BAR') {
                    this.deleteComponent(clickedComponent);
                }
                return;
            } else if (this.moveMode) {
                // In move mode, start dragging
                this.startComponentDragging(clickedComponent, x, y);
                return;
            } else if (clickedComponent instanceof Switch) {
                // Normal mode, toggle switch
                clickedComponent.toggle();
                this.circuit.simulate();
                this.draw();
                return;
            }
        }

        // Check if clicking on a connection point for wire drawing
        const connectionPoint = this.findConnectionPoint(x, y);
        if (connectionPoint && !this.deleteMode && !this.moveMode) {
            this.isDrawingWire = true;
            this.wireStartComponent = connectionPoint.component;
            this.wireStartConnectionPoint = connectionPoint;
            this.wireStartPoint = { x: connectionPoint.point.x, y: connectionPoint.point.y };
            this.wireEndPoint = { x, y };
            return;
        }

        // Handle tool selection and component placement
        if (this.selectedTool && !this.moveMode && !this.deleteMode) {
            let component;
            switch (this.selectedTool) {
                case 'NMOS':
                    component = new NMOS(x, y);
                    break;
                case 'PMOS':
                    component = new PMOS(x, y);
                    break;
                case 'PROBE':
                    component = new Probe(x, y);
                    break;
                case 'SWITCH':
                    component = new Switch(x, y);
                    break;
            }
            if (component) {
                this.circuit.addComponent(component);
                this.selectedTool = null;
                this.draw();
            }
        }
        
        this.updateStatusBar();
    }

    handleMouseMove(event) {
        const rect = this.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        // If mouse has moved beyond threshold, it's definitely a drag
        if (this.mouseDownPos && this.draggingComponent) {
            const dx = x - this.mouseDownPos.x;
            const dy = y - this.mouseDownPos.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > this.dragThreshold) {
                this.draggingComponent.isDragging = true;
            }
        }

        // Update coordinates display
        document.getElementById('coordinates').textContent = 
            `Position: ${Math.round(x)}, ${Math.round(y)}`;

        // Check for connection point hovering
        this.hoveredConnectionPoint = this.findConnectionPoint(x, y);

        if (this.draggingComponent) {
            // First drag the component
            this.draggingComponent.drag(x, y);
            
            // Then update all connected wires
            this.connectedWires.forEach(wire => {
                if (wire.startComponent === this.draggingComponent) {
                    // Update start point based on stored relative position
                    wire.startPoint.x = this.draggingComponent.x + wire.startPoint._relX;
                    wire.startPoint.y = this.draggingComponent.y + wire.startPoint._relY;
                }
                if (wire.endComponent === this.draggingComponent) {
                    // Update end point based on stored relative position
                    wire.endPoint.x = this.draggingComponent.x + wire.endPoint._relX;
                    wire.endPoint.y = this.draggingComponent.y + wire.endPoint._relY;
                }
            });
            
            this.draw();
        } else if (this.isDrawingWire) {
            this.wireEndPoint = { x, y };
            this.draw();
        }

        // Redraw if hovering over a connection point
        if (this.hoveredConnectionPoint) {
            this.draw();
        }
    }

    handleMouseUp(event) {
        const rect = this.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        if (this.isDrawingWire) {
            const endConnectionPoint = this.findConnectionPoint(x, y);
            if (endConnectionPoint && endConnectionPoint.component !== this.wireStartComponent) {
                const wire = new Wire(
                    this.wireStartComponent,
                    this.wireStartPoint,
                    endConnectionPoint.component,
                    { x: endConnectionPoint.point.x, y: endConnectionPoint.point.y }
                );
                this.circuit.addWire(wire);
            }
            this.isDrawingWire = false;
            this.wireStartPoint = null;
            this.wireEndPoint = null;
            this.wireStartComponent = null;
            this.wireStartConnectionPoint = null;
        }

        if (this.draggingComponent) {
            this.draggingComponent.endDrag();
            this.selectedComponent = null;
            this.draggingComponent = null;
            this.connectedWires = [];
        }

        this.draw();
    }

    startComponentDragging(component, x, y) {
        this.draggingComponent = component;
        component.startDrag(x, y);
        this.dragStartPos = { x: component.x, y: component.y };
        
        // Store all wires connected to this component
        this.connectedWires = this.circuit.wires.filter(wire => 
            wire.startComponent === component || wire.endComponent === component
        );

        // Store the initial relative positions of wire endpoints
        this.connectedWires.forEach(wire => {
            if (wire.startComponent === component) {
                wire.startPoint._relX = wire.startPoint.x - component.x;
                wire.startPoint._relY = wire.startPoint.y - component.y;
            }
            if (wire.endComponent === component) {
                wire.endPoint._relX = wire.endPoint.x - component.x;
                wire.endPoint._relY = wire.endPoint.y - component.y;
            }
        });
    }

    findConnectionPoint(x, y) {
        for (const component of this.circuit.components) {
            // Check input connection points
            for (const input of component.inputs || []) {
                const dx = x - input.x;
                const dy = y - input.y;
                if (dx * dx + dy * dy < 25) { // 5px radius
                    return { component, point: input, type: 'input' };
                }
            }
            // Check output connection points
            for (const output of component.outputs || []) {
                const dx = x - output.x;
                const dy = y - output.y;
                if (dx * dx + dy * dy < 25) { // 5px radius
                    return { component, point: output, type: 'output' };
                }
            }
        }
        return null;
    }

    findComponentAt(x, y) {
        return this.circuit.components.find(component => component.isPointInside(x, y));
    }

    draw() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw grid
        this.drawGrid();

        // Simulate circuit before drawing
        this.circuit.simulate();

        // Draw all wires
        this.circuit.wires.forEach(wire => wire.draw(this.ctx));

        // Draw temporary wire while drawing
        if (this.isDrawingWire && this.wireStartPoint && this.wireEndPoint) {
            this.ctx.beginPath();
            this.ctx.strokeStyle = '#666';
            this.ctx.lineWidth = 2;
            this.ctx.setLineDash([5, 5]);
            this.ctx.moveTo(this.wireStartPoint.x, this.wireStartPoint.y);
            this.ctx.lineTo(this.wireEndPoint.x, this.wireEndPoint.y);
            this.ctx.stroke();
            this.ctx.setLineDash([]);
            this.ctx.lineWidth = 1;
        }

        // Draw all components
        this.circuit.components.forEach(component => {
            component.selected = component === this.selectedComponent;
            component.draw(this.ctx);
        });

        // Draw battery symbol
        if (this.batterySymbol) {
            this.batterySymbol.draw(this.ctx);
        }

        // Draw hover effect for connection points
        if (this.hoveredConnectionPoint) {
            this.ctx.beginPath();
            this.ctx.arc(
                this.hoveredConnectionPoint.point.x,
                this.hoveredConnectionPoint.point.y,
                6, 0, Math.PI * 2
            );
            this.ctx.strokeStyle = '#2196F3';
            this.ctx.stroke();
        }
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

    updateStatusBar() {
        const toolDisplay = document.getElementById('selectedTool');
        if (this.deleteMode) {
            toolDisplay.textContent = 'Click to delete or ESC';
        } else if (this.moveMode) {
            toolDisplay.textContent = 'Click to move or ESC';
        } else if (this.selectedTool) {
            toolDisplay.textContent = `Selected: ${this.selectedTool}`;
        } else {
            toolDisplay.textContent = 'Selected: None';
        }
    }

    findMatchingConnectionPoint(component, point) {
        // Try to find the matching connection point based on relative position
        if (component.inputs) {
            const input = component.inputs.find(input => 
                this.isNearOriginalPoint(input, point)
            );
            if (input) return input;
        }
        if (component.outputs) {
            const output = component.outputs.find(output => 
                this.isNearOriginalPoint(output, point)
            );
            if (output) return output;
        }
        return null;
    }

    isNearOriginalPoint(newPoint, originalPoint) {
        // Helper function to determine if this is the same connection point
        // Use relative position for VDD/GND bars
        if (newPoint.hasOwnProperty('relativePosition') && 
            originalPoint.hasOwnProperty('relativePosition')) {
            return Math.abs(newPoint.relativePosition - originalPoint.relativePosition) < 0.01;
        }
        
        // For other components, use the original coordinates to identify the point
        // We compare the relative position of the point to the component
        const dx = Math.abs((newPoint.x - this.draggingComponent.x) - 
                          (originalPoint.x - this.draggingComponent.x));
        const dy = Math.abs((newPoint.y - this.draggingComponent.y) - 
                          (originalPoint.y - this.draggingComponent.y));
        return dx < 1 && dy < 1;
    }

    deleteComponent(component) {
        // Remove all wires connected to this component
        this.circuit.wires = this.circuit.wires.filter(wire => 
            wire.startComponent !== component && wire.endComponent !== component
        );
        
        // Remove the component
        this.circuit.removeComponent(component);
        
        // Simulate and redraw
        this.circuit.simulate();
        this.draw();
    }
}

// Initialize the editor when the page loads
window.addEventListener('load', () => {
    const editor = new CircuitEditor('circuitCanvas');
    editor.draw();
}); 