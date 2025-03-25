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

        // Add label mode state
        this.labelMode = false;

        // Setup move mode
        this.setupMoveMode();

        // Setup additional event listeners
        this.setupDeleteMode();

        // Setup label mode
        this.setupLabelMode();

        // Add about modal handling
        this.setupAboutModal();

        this.initializeCanvas();
        this.setupEventListeners();

        // Add the bars
        this.initializeBars();

        // Store canvas reference for external access
        this.canvasId = canvasId;
    }

    initializeCanvas() {
        const updateCanvasSize = () => {
            this.canvas.width = window.innerWidth - 40;
            this.canvas.height = window.innerHeight - 100;
            
            // Update bars and battery
            if (this.vddBar) {
                // On narrow screens, use full canvas width
                const isNarrowScreen = window.innerWidth <= 768;
                if (isNarrowScreen) {
                    this.vddBar.margin = 0;
                    this.vddBar.width = this.canvas.width; // Match canvas width exactly
                } else {
                    this.vddBar.margin = 40;
                    this.vddBar.width = this.canvas.width - (2 * this.vddBar.margin);
                }
                this.vddBar.updateDimensions(this.canvas.width);
            }
            if (this.gndBar) {
                // On narrow screens, use full canvas width
                const isNarrowScreen = window.innerWidth <= 768;
                if (isNarrowScreen) {
                    this.gndBar.margin = 0;
                    this.gndBar.width = this.canvas.width; // Match canvas width exactly
                } else {
                    this.gndBar.margin = 40;
                    this.gndBar.width = this.canvas.width - (2 * this.gndBar.margin);
                }
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
                // Clear all modes
                this.exitAllModes();
                // Set the new tool
                this.selectedTool = button.dataset.component;
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

        // Add ESC key listener
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                this.exitAllModes();
            }
        });
    }

    setupMoveMode() {
        const moveButton = document.getElementById('moveMode');
        moveButton.addEventListener('click', () => {
            this.exitAllModes();
            this.moveMode = true;
            this.updateModeButtons();
            this.updateStatusBar();
            this.canvas.style.cursor = 'move';
        });
    }

    setupDeleteMode() {
        const deleteButton = document.getElementById('deleteMode');
        deleteButton.addEventListener('click', () => {
            this.exitAllModes();
            this.deleteMode = true;
            this.updateModeButtons();
            this.updateStatusBar();
            this.canvas.style.cursor = 'not-allowed';
        });
    }

    setupLabelMode() {
        const labelButton = document.getElementById('labelMode');
        labelButton.addEventListener('click', () => {
            this.exitAllModes();
            this.labelMode = true;
            this.updateModeButtons();
            this.updateStatusBar();
            this.canvas.style.cursor = 'crosshair';
        });
    }

    setupAboutModal() {
        const modal = document.getElementById('aboutModal');
        const btn = document.getElementById('aboutButton');
        const span = document.getElementsByClassName('close')[0];

        // When the user clicks the button, open the modal
        btn.onclick = () => {
            modal.style.display = 'block';
        };

        // When the user clicks on <span> (x), close the modal
        span.onclick = () => {
            modal.style.display = 'none';
        };

        // When the user clicks anywhere outside of the modal, close it
        window.onclick = (event) => {
            if (event.target === modal) {
                modal.style.display = 'none';
            }
        };

        // Add ESC key handler for modal
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && modal.style.display === 'block') {
                modal.style.display = 'none';
            }
        });
    }

    exitAllModes() {
        this.moveMode = false;
        this.deleteMode = false;
        this.labelMode = false;
        this.selectedTool = null;
        this.updateModeButtons();
        this.updateStatusBar();
        this.canvas.style.cursor = 'default';
    }

    updateModeButtons() {
        // Update move mode button - only toggle the active class
        const moveButton = document.getElementById('moveMode');
        moveButton.classList.toggle('active', this.moveMode);

        // Update delete mode button - only toggle the active class
        const deleteButton = document.getElementById('deleteMode');
        deleteButton.classList.toggle('active', this.deleteMode);

        // Add label mode button update
        const labelButton = document.getElementById('labelMode');
        labelButton.classList.toggle('active', this.labelMode);
    }

    handleMouseDown(event) {
        const rect = this.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        // Check for double click
        const currentTime = Date.now();
        const timeDiff = currentTime - this.lastClickTime;
        this.lastClickTime = currentTime;

        // Clear any existing selection first
        this.selectedComponent = null;

        // Get clicked component
        const clickedComponent = this.findComponentAt(x, y);

        // Add label mode handling
        if (this.labelMode && clickedComponent) {
            const label = prompt("Enter label for the component:", clickedComponent.label || "");
            if (label !== null) {  // Check if user didn't cancel
                clickedComponent.label = label;
                this.draw();
            }
            // Exit label mode after labeling one component
            this.exitAllModes();
            return;
        }

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
                clickedComponent.toggle();
                this.circuit.fullRecompute();
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
                // Check if we need to flip the connection direction
                let startComp = this.wireStartComponent;
                let startPt = { x: this.wireStartPoint.x, y: this.wireStartPoint.y };
                let endComp = endConnectionPoint.component;
                let endPt = { x: endConnectionPoint.point.x, y: endConnectionPoint.point.y };

                // If ending at a voltage source or switch, or starting from source and ending at drain, flip the connection
                const shouldFlip = endComp instanceof VDDBar || 
                    endComp instanceof GNDBar || 
                    endComp instanceof Switch ||
                    startComp instanceof Probe ||
                    (this.wireStartConnectionPoint?.point?.name === 'drain' && 
                     endConnectionPoint?.point?.name === 'source');

                if (shouldFlip) {
                    console.log('Flipping wire direction:', {
                        from: startComp.type,
                        to: endComp.type,
                        reason: startComp instanceof Probe ? 'Probe as start' : 
                               (this.wireStartConnectionPoint?.point?.name === 'drain' ? 'Drain to Source' : 'VDD/GND/Switch as end'),
                        flipping: true
                    });
                    // Swap start and end
                    [startComp, endComp] = [endComp, startComp];
                    [startPt, endPt] = [endPt, startPt];
                }

                // Add relative position for VDD/GND connections
                if (startComp === this.vddBar || startComp === this.gndBar) {
                    startPt.relativePosition = this.wireStartConnectionPoint?.point.relativePosition;
                }
                if (endComp === this.vddBar || endComp === this.gndBar) {
                    endPt.relativePosition = endConnectionPoint.point.relativePosition;
                }

                const wire = new Wire(startComp, startPt, endComp, endPt);
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
            
            // Exit move mode after moving one component
            if (this.moveMode) {
                this.moveMode = false;
                this.updateModeButtons();
                this.updateStatusBar();
                this.canvas.style.cursor = 'default';
            }
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

        // Only simulate if not drawing a wire
        if (!this.isDrawingWire) {
            this.circuit.simulate();
        }

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

        // Draw battery symbol only if screen is wide enough (>768px)
        if (this.batterySymbol && window.innerWidth > 768) {
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
        if (this.labelMode) {
            toolDisplay.textContent = 'Click component to label or ESC';
        } else if (this.deleteMode) {
            toolDisplay.textContent = 'Click to Delete or ESC';
        } else if (this.moveMode) {
            toolDisplay.textContent = 'Click to Move or ESC';
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
        
        // Exit delete mode after deleting one component
        this.deleteMode = false;
        this.updateModeButtons();
        this.updateStatusBar();
        this.canvas.style.cursor = 'default';
        
        // Simulate and redraw
        this.circuit.simulate();
        this.draw();
    }

    getProbeVoltageByLabel(label) {
        const probe = this.circuit.components.find(component => 
            component instanceof Probe && 
            component.label === label
        );
        return probe ? probe.voltage : null;
    }

    getAllProbeLabels() {
        return this.circuit.components
            .filter(component => component instanceof Probe && component.label)
            .map(probe => probe.label);
    }

    getSwitchByLabel(label) {
        return this.circuit.components.find(component => 
            component instanceof Switch && 
            component.label === label
        );
    }

    setSwitchVoltage(label, isHigh) {
        const switchComponent = this.getSwitchByLabel(label);
        if (switchComponent) {
            if (isHigh !== switchComponent.isOn) {
                switchComponent.toggle();
                this.circuit.fullRecompute();
                this.draw();
            }
            return true;
        }
        return false;
    }

    setSwitchHigh(label) {
        return this.setSwitchVoltage(label, true);
    }

    setSwitchLow(label) {
        return this.setSwitchVoltage(label, false);
    }
}

// Modify initialization to make editor globally accessible
window.addEventListener('load', () => {
    const canvas = document.getElementById('circuitCanvas');
    window.circuitEditor = new CircuitEditor('circuitCanvas');
    window.circuitEditor.draw();
});

window.addEventListener('resize', () => {
    const width = window.innerWidth - 40;
    const height = window.innerHeight - 100;
    
    this.canvas.width = width;
    this.canvas.height = height;
    
    // Update VDD and GND bars to match canvas width exactly on mobile
    const isNarrowScreen = window.innerWidth <= 768;
    if (isNarrowScreen) {
        this.vddBar.margin = 0;
        this.gndBar.margin = 0;
        this.vddBar.width = this.canvas.width; // Match canvas width exactly
        this.gndBar.width = this.canvas.width; // Match canvas width exactly
    } else {
        this.vddBar.margin = 40;
        this.gndBar.margin = 40;
        this.vddBar.width = width - (2 * this.vddBar.margin);
        this.gndBar.width = width - (2 * this.gndBar.margin);
    }
    
    this.vddBar.updateDimensions(width);
    this.gndBar.updateDimensions(width, height);
    this.batterySymbol.updatePosition();

    // Update wire positions for full-width bars
    this.circuit.wires.forEach(wire => {
        if (wire.startComponent === this.vddBar) {
            wire.startPoint.x = wire.startPoint.relativePosition * this.vddBar.width;
            wire.startPoint.y = this.vddBar.y + this.vddBar.height/2;
        }
        if (wire.endComponent === this.vddBar) {
            wire.endPoint.x = wire.endPoint.relativePosition * this.vddBar.width;
            wire.endPoint.y = this.vddBar.y + this.vddBar.height/2;
        }
        if (wire.startComponent === this.gndBar) {
            wire.startPoint.x = wire.startPoint.relativePosition * this.gndBar.width;
            wire.startPoint.y = this.gndBar.y - this.gndBar.height/2;
        }
        if (wire.endComponent === this.gndBar) {
            wire.endPoint.x = wire.endPoint.relativePosition * this.gndBar.width;
            wire.endPoint.y = this.gndBar.y - this.gndBar.height/2;
        }
    });

    this.draw();
}); 