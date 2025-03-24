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

        this.initializeCanvas();
        this.setupEventListeners();
    }

    initializeCanvas() {
        // Set canvas size to match window size
        const updateCanvasSize = () => {
            this.canvas.width = window.innerWidth - 40;
            this.canvas.height = window.innerHeight - 100;
        };
        updateCanvasSize();
        window.addEventListener('resize', updateCanvasSize);
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
        document.getElementById('delete').addEventListener('click', () => {
            if (this.selectedComponent) {
                this.circuit.removeComponent(this.selectedComponent);
                this.selectedComponent = null;
                this.draw();
            }
        });

        // Clear button
        document.getElementById('clear').addEventListener('click', () => {
            if (confirm('Are you sure you want to clear the circuit?')) {
                this.circuit.clear();
                this.selectedComponent = null;
                this.draw();
            }
        });

        // Canvas mouse events
        this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
        this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
        this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
    }

    handleMouseDown(event) {
        const rect = this.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        // Check if clicking on a connection point
        const connectionPoint = this.findConnectionPoint(x, y);
        
        if (connectionPoint) {
            // Start wire drawing
            this.isDrawingWire = true;
            this.wireStartComponent = connectionPoint.component;
            this.wireStartConnectionPoint = connectionPoint;
            this.wireStartPoint = { x: connectionPoint.point.x, y: connectionPoint.point.y };
            this.wireEndPoint = { x, y };
            return;
        }

        // Check if clicking on a switch
        const clickedComponent = this.findComponentAt(x, y);
        if (clickedComponent && clickedComponent instanceof Switch) {
            this.clickedSwitch = clickedComponent;
            clickedComponent.toggle();
            // Simulate the circuit after toggling the switch
            this.circuit.simulate();
            this.draw();
            return;
        }

        // Handle other mouse down events
        if (this.selectedTool) {
            // Create new component
            let component;
            switch (this.selectedTool) {
                case 'VDD':
                    component = new VoltageSource(x, y);
                    break;
                case 'GND':
                    component = new Ground(x, y);
                    break;
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
        } else {
            // Check for component selection
            const clickedComponent = this.findComponentAt(x, y);
            if (clickedComponent) {
                this.startComponentDragging(clickedComponent, x, y);
            }
        }
        this.updateStatusBar();
    }

    handleMouseMove(event) {
        const rect = this.canvas.getBoundingClientRect();
        this.mouseX = event.clientX - rect.left;
        this.mouseY = event.clientY - rect.top;

        // Update coordinates display
        document.getElementById('coordinates').textContent = 
            `Position: ${Math.round(this.mouseX)}, ${Math.round(this.mouseY)}`;

        // Check for connection point hovering
        this.hoveredConnectionPoint = this.findConnectionPoint(this.mouseX, this.mouseY);

        if (this.draggingComponent) {
            this.draggingComponent.drag(this.mouseX, this.mouseY);
            this.draw();
        } else if (this.isDrawingWire) {
            this.wireEndPoint = { x: this.mouseX, y: this.mouseY };
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
                // Create wire between connection points
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
            this.draggingComponent = null;
        }

        // Reset clicked switch
        this.clickedSwitch = null;

        this.draw();
    }

    startComponentDragging(component, x, y) {
        this.selectedComponent = component;
        this.draggingComponent = component;
        component.startDrag(x, y);
    }

    findConnectionPoint(x, y) {
        for (const component of this.circuit.components) {
            // Check input connection points
            for (const input of component.inputs) {
                const dx = x - input.x;
                const dy = y - input.y;
                if (dx * dx + dy * dy < 25) { // 5px radius
                    return { component, point: input, type: 'input' };
                }
            }
            // Check output connection points if they exist
            if (component.outputs) {
                for (const output of component.outputs) {
                    const dx = x - output.x;
                    const dy = y - output.y;
                    if (dx * dx + dy * dy < 25) { // 5px radius
                        return { component, point: output, type: 'output' };
                    }
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
        toolDisplay.textContent = this.selectedTool ? 
            `Selected: ${this.selectedTool}` : 
            'Selected: None';
    }
}

// Initialize the editor when the page loads
window.addEventListener('load', () => {
    const editor = new CircuitEditor('circuitCanvas');
    editor.draw();
}); 