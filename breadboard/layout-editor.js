// Layout and Editor Module
// Handles all UI, drawing, and user interactions

class BreadboardEditor {
    constructor(canvas, circuitSimulator) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.simulator = circuitSimulator;
        
        // Grid configuration
        this.GRID_COLS = 30;
        this.GRID_ROWS = 14;
        this.DOT_RADIUS = 4;
        this.PADDING = 40;
        this.CENTER_GAP = 30;
        
        // Calculate canvas size and grid spacing
        this.CANVAS_WIDTH = 900;
        this.CANVAS_HEIGHT = 504 + this.CENTER_GAP;
        this.canvas.width = this.CANVAS_WIDTH;
        this.canvas.height = this.CANVAS_HEIGHT;
        
        this.CELL_WIDTH = (this.CANVAS_WIDTH - 2 * this.PADDING) / (this.GRID_COLS - 1);
        this.CELL_HEIGHT = (this.CANVAS_HEIGHT - 2 * this.PADDING - this.CENTER_GAP) / (this.GRID_ROWS - 1);
        
        // Store dots and lines
        this.dots = [];
        this.lines = [];
        this.isDragging = false;
        this.startDot = null;
        this.currentMousePos = { x: 0, y: 0 };
        this.warningTimeout = null;
        
        // Component type selector
        this.componentSelect = document.getElementById('componentType');
        
        // Add after the component type selector
        this.meltingWire = null;
        this.meltingProgress = 0;
        this.meltingAnimationId = null;
        this.smokeParticles = [];
        
        // Add after the existing state variables at the top
        this.autoCompute = true; // Default to true for automatic computation
        
        // Add delete mode state variable
        this.deleteMode = false;
        
        // Add transistor terminals tracking
        this.transistorTerminals = new Map();
        
        // Initialize dots
        this.initializeDots();
        
        // Initialize UI controls
        this.initializeUIControls();
        
        // Initialize event listeners
        this.initializeEventListeners();
        
        // Initial draw
        this.drawGrid();
    }
    
    // Initialize dots
    initializeDots() {
        this.dots.length = 0; // Clear existing dots
        for (let row = 0; row < this.GRID_ROWS; row++) {
            for (let col = 0; col < this.GRID_COLS; col++) {
                // Add CENTER_GAP to y position for rows 8 and beyond
                const extraGap = row >= 7 ? this.CENTER_GAP : 0;
                this.dots.push({
                    x: this.PADDING + col * this.CELL_WIDTH,
                    y: this.PADDING + row * this.CELL_HEIGHT + extraGap
                });
            }
        }
        
        // Initialize connections
        this.simulator.initializeConnections(this.dots);
    }
    
    // Initialize UI controls
    initializeUIControls() {
        // Add auto-compute toggle
        this.autoComputeToggle = document.createElement('button');
        this.autoComputeToggle.textContent = 'Auto Compute: ON';
        this.autoComputeToggle.style.marginLeft = '20px';
        this.autoComputeToggle.style.padding = '5px 10px';
        this.autoComputeToggle.style.backgroundColor = '#4CAF50';
        this.autoComputeToggle.style.color = 'white';
        this.autoComputeToggle.style.border = 'none';
        this.autoComputeToggle.style.borderRadius = '3px';
        this.autoComputeToggle.style.cursor = 'pointer';
        
        // Add hover effects
        this.autoComputeToggle.addEventListener('mouseover', () => {
            this.autoComputeToggle.style.backgroundColor = '#45a049';
        });
        
        this.autoComputeToggle.addEventListener('mouseout', () => {
            this.autoComputeToggle.style.backgroundColor = this.autoCompute ? '#4CAF50' : '#f44336';
        });
        
        // Add toggle handler
        this.autoComputeToggle.addEventListener('click', () => {
            this.autoCompute = !this.autoCompute;
            this.autoComputeToggle.textContent = `Auto Compute: ${this.autoCompute ? 'ON' : 'OFF'}`;
            this.autoComputeToggle.style.backgroundColor = this.autoCompute ? '#4CAF50' : '#f44336';
        });
        
        // Add delete mode button
        this.deleteModeButton = document.createElement('button');
        this.deleteModeButton.innerHTML = '<i class="fas fa-trash"></i>';
        this.deleteModeButton.style.marginLeft = '20px';
        this.deleteModeButton.style.padding = '5px 10px';
        this.deleteModeButton.style.backgroundColor = '#4CAF50';
        this.deleteModeButton.style.color = 'white';
        this.deleteModeButton.style.border = 'none';
        this.deleteModeButton.style.borderRadius = '3px';
        this.deleteModeButton.style.cursor = 'pointer';
        this.deleteModeButton.style.display = 'inline-flex';
        this.deleteModeButton.style.alignItems = 'center';
        this.deleteModeButton.style.justifyContent = 'center';
        this.deleteModeButton.style.width = 'auto';
        this.deleteModeButton.style.height = 'auto';
        this.deleteModeButton.title = 'Delete Mode (Off)';
        
        // Add hover effects for delete button
        this.deleteModeButton.addEventListener('mouseover', () => {
            this.deleteModeButton.style.backgroundColor = this.deleteMode ? '#d32f2f' : '#45a049';
        });
        
        this.deleteModeButton.addEventListener('mouseout', () => {
            this.deleteModeButton.style.backgroundColor = this.deleteMode ? '#f44336' : '#4CAF50';
        });
        
        // Add toggle handler for delete button
        this.deleteModeButton.addEventListener('click', () => {
            this.deleteMode = !this.deleteMode;
            this.deleteModeButton.style.backgroundColor = this.deleteMode ? '#f44336' : '#4CAF50';
            this.deleteModeButton.title = `Delete Mode (${this.deleteMode ? 'On' : 'Off'})`;
            this.canvas.style.cursor = this.deleteMode ? 'crosshair' : 'default';
            
            // Add shake animation when activated
            if (this.deleteMode) {
                this.deleteModeButton.style.animation = 'shake 0.5s';
                setTimeout(() => {
                    this.deleteModeButton.style.animation = '';
                }, 500);
            }
        });
        
        // Add computation feedback element
        this.computationFeedback = document.createElement('div');
        this.computationFeedback.style.position = 'fixed';
        this.computationFeedback.style.top = '20px';
        this.computationFeedback.style.right = '20px';
        this.computationFeedback.style.padding = '10px 20px';
        this.computationFeedback.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        this.computationFeedback.style.color = 'white';
        this.computationFeedback.style.borderRadius = '4px';
        this.computationFeedback.style.display = 'none';
        this.computationFeedback.style.zIndex = '1000';
        this.computationFeedback.textContent = 'Computing circuit...';
        document.body.appendChild(this.computationFeedback);
        
        // Add warning message element
        this.warningMessage = document.createElement('div');
        this.warningMessage.id = 'warningMessage';
        this.warningMessage.style.position = 'fixed';
        this.warningMessage.style.top = '20px';
        this.warningMessage.style.left = '50%';
        this.warningMessage.style.transform = 'translateX(-50%)';
        this.warningMessage.style.backgroundColor = '#ff4444';
        this.warningMessage.style.color = 'white';
        this.warningMessage.style.padding = '10px 20px';
        this.warningMessage.style.borderRadius = '4px';
        this.warningMessage.style.opacity = '0';
        this.warningMessage.style.transition = 'opacity 0.3s ease';
        this.warningMessage.style.zIndex = '1000';
        this.warningMessage.textContent = '⚠️ Warning: Short Circuit Detected!';
        document.body.appendChild(this.warningMessage);
        
        // Add to DOM
        document.addEventListener('DOMContentLoaded', () => {
            // Add Font Awesome CSS
            const fontAwesome = document.createElement('link');
            fontAwesome.rel = 'stylesheet';
            fontAwesome.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css';
            document.head.appendChild(fontAwesome);
            
            // Add shake animation keyframes
            const style = document.createElement('style');
            style.textContent = `
                @keyframes shake {
                    0% { transform: rotate(0deg); }
                    25% { transform: rotate(-10deg); }
                    50% { transform: rotate(10deg); }
                    75% { transform: rotate(-5deg); }
                    100% { transform: rotate(0deg); }
                }
            `;
            document.head.appendChild(style);
            
            const controls = document.querySelector('.controls');
            if (controls) {
                controls.appendChild(this.autoComputeToggle);
                controls.appendChild(this.deleteModeButton);
            }
        });
    }
    
    // Initialize event listeners
    initializeEventListeners() {
        // Mouse down handler
        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        
        // Mouse move handler
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        
        // Mouse up handler
        this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
        
        // Click handler
        this.canvas.addEventListener('click', (e) => this.handleClick(e));
        
        // Context menu handler
        this.canvas.addEventListener('contextmenu', (e) => this.handleContextMenu(e));
        
        // Escape key handler
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.turnOffDeleteMode();
            }
        });
    }
    
    // Handle mouse down
    handleMouseDown(e) {
        if (e.button !== 0) return; // Only handle left clicks
        
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Handle delete mode
        if (this.deleteMode) {
            this.handleDeleteMode(x, y);
            return;
        }

        // Check if we're clicking a switch first
        if (this.isNearSwitch(x, y)) {
            return;
        }

        // Handle voltage indicator placement
        if (this.componentSelect.value === 'voltage_indicator') {
            this.handleVoltageIndicatorPlacement(x, y);
            return;
        }

        // Handle transistor placement
        if (this.componentSelect.value === 'nmos' || this.componentSelect.value === 'pmos') {
            this.handleTransistorPlacement(x, y);
            return;
        }

        // Handle voltage source placement
        if (this.componentSelect.value === 'voltage_source') {
            this.handleVoltageSourcePlacement(x, y);
            return;
        }

        // Handle regular dot connections
        const dot = this.findClosestDot(x, y);
        if (dot) {
            this.isDragging = true;
            this.startDot = dot;
        }
    }
    
    // Handle mouse move
    handleMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        this.currentMousePos.x = e.clientX - rect.left;
        this.currentMousePos.y = e.clientY - rect.top;
        
        // Only redraw if we're actually doing something
        if (this.isDragging && this.startDot) {
            this.drawGrid();
        }
    }
    
    // Handle mouse up
    handleMouseUp(e) {
        const wasDragging = this.isDragging;
        const hadStartDot = this.startDot;
        
        this.isDragging = false;
        
        if (wasDragging && hadStartDot) {
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            // Check if we're ending on a transistor terminal
            const endTerminal = this.findClosestTransistorTerminal(x, y);
            let endDot;
            
            if (endTerminal) {
                endDot = {
                    x: endTerminal.pos.x,
                    y: endTerminal.pos.y,
                    isTransistorTerminal: true,
                    transistorConnection: { id: endTerminal.id, type: endTerminal.type }
                };
            } else {
                endDot = this.findClosestDot(x, y);
            }
            
            if (endDot && hadStartDot !== endDot) {
                const newLine = {
                    start: hadStartDot,
                    end: endDot,
                    type: this.componentSelect.value
                };
                
                // Add transistor connection information
                if (hadStartDot.isTransistorTerminal) {
                    newLine.transistorConnection = hadStartDot.transistorConnection;
                } else if (endDot.isTransistorTerminal) {
                    newLine.transistorConnection = endDot.transistorConnection;
                }
                
                this.lines.push(newLine);
                this.rebuildCircuit();
            }
        }
        
        this.startDot = null;
    }
    
    // Handle click
    handleClick(e) {
        const rect = this.canvas.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const clickY = e.clientY - rect.top;
        
        // Check for voltage source clicks first
        for (const line of this.lines) {
            if (line.type === 'voltage_source') {
                const distance = Math.sqrt((clickX - line.x) ** 2 + (clickY - line.y) ** 2);
                if (distance < 15) { // VOLTAGE_SOURCE_CHARACTERISTICS.radius
                    // Toggle the voltage source
                    const dotIndex = this.dots.indexOf(line.start);
                    const source = this.simulator.getVoltageSource(dotIndex);
                    if (source) {
                        this.simulator.setVoltageSource(dotIndex, !source.isVcc);
                        this.rebuildCircuit();
                    }
                    return;
                }
            }
        }
        
        // Check if click is near any switch
        this.lines.forEach(line => {
            if (line.type === 'switch_no' || line.type === 'switch_nc') {
                const switchId = this.simulator.getSwitchId(line.start, line.end, this.dots);
                
                // Initialize switch state if it doesn't exist
                if (!this.simulator.switches.has(switchId)) {
                    this.simulator.setSwitchState(line.start, line.end, false, this.dots);
                }
                
                const switchState = this.simulator.getSwitchState(line.start, line.end, this.dots);
                
                // Calculate switch center
                const dx = line.end.x - line.start.x;
                const dy = line.end.y - line.start.y;
                const switchCenterX = line.start.x + dx/2;
                const switchCenterY = line.start.y + dy/2;
                
                // Check if click is near switch
                const clickDist = Math.sqrt((clickX - switchCenterX)**2 + (clickY - switchCenterY)**2);
                if (clickDist < 20) {
                    // Toggle switch state
                    this.simulator.setSwitchState(line.start, line.end, !switchState, this.dots);
                    this.rebuildCircuit();
                    return;
                }
            }
        });
    }
    
    // Handle context menu
    handleContextMenu(e) {
        e.preventDefault();
        
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // Check for transistors
        for (const [id, transistor] of this.simulator.getAllTransistors()) {
            const centerDist = Math.sqrt((x - transistor.x) ** 2 + (y - transistor.y) ** 2);
            if (centerDist < 50) {
                // Remove all wires connected to this transistor
                for (let i = this.lines.length - 1; i >= 0; i--) {
                    if (this.lines[i].transistorConnection && this.lines[i].transistorConnection.id === id) {
                        this.lines.splice(i, 1);
                    }
                }
                this.simulator.removeTransistor(id);
                this.transistorTerminals.delete(id);
                this.rebuildCircuit();
                this.turnOffDeleteMode();
                return;
            }
        }

        // Check for other components
        for (let i = this.lines.length - 1; i >= 0; i--) {
            const line = this.lines[i];
            const centerX = (line.start.x + line.end.x) / 2;
            const centerY = (line.start.y + line.end.y) / 2;
            const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
            
            if (distance < 20) {
                this.lines.splice(i, 1);
                this.rebuildCircuit();
                this.turnOffDeleteMode();
                return;
            }
        }
    }
    
    // Handle delete mode
    handleDeleteMode(x, y) {
        // Check for transistors and single-point components
        for (const [id, transistor] of this.simulator.getAllTransistors()) {
            const centerDist = Math.sqrt((x - transistor.x) ** 2 + (y - transistor.y) ** 2);
            if (centerDist < 50) {
                // Remove all wires connected to this transistor
                for (let i = this.lines.length - 1; i >= 0; i--) {
                    if (this.lines[i].transistorConnection && this.lines[i].transistorConnection.id === id) {
                        this.lines.splice(i, 1);
                    }
                }
                this.simulator.removeTransistor(id);
                this.transistorTerminals.delete(id);
                this.rebuildCircuit();
                this.turnOffDeleteMode();
                return;
            }
        }

        // Check for voltage indicators
        for (let i = this.lines.length - 1; i >= 0; i--) {
            const line = this.lines[i];
            if (line.type === 'voltage_indicator') {
                const centerDist = Math.sqrt((x - line.x) ** 2 + (y - line.y) ** 2);
                if (centerDist < 20) {
                    this.lines.splice(i, 1);
                    this.rebuildCircuit();
                    this.turnOffDeleteMode();
                    return;
                }
            }
        }

        // Check for other components (wires, LEDs, switches)
        for (let i = this.lines.length - 1; i >= 0; i--) {
            const line = this.lines[i];
            if (line.type !== 'voltage_indicator') {
                const centerX = (line.start.x + line.end.x) / 2;
                const centerY = (line.start.y + line.end.y) / 2;
                const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
                
                if (distance < 20) {
                    this.lines.splice(i, 1);
                    this.rebuildCircuit();
                    this.turnOffDeleteMode();
                    return;
                }
            }
        }
    }
    
    // Handle voltage indicator placement
    handleVoltageIndicatorPlacement(x, y) {
        const dot = this.findClosestDot(x, y);
        if (dot) {
            // Create new voltage indicator
            const newLine = {
                start: dot,
                end: dot,
                x: dot.x,
                y: dot.y,
                type: 'voltage_indicator'
            };
            this.lines.push(newLine);
            
            this.rebuildCircuit();
            
            // Switch back to wire mode
            this.componentSelect.value = 'wire';
            this.componentSelect.dispatchEvent(new Event('change'));
        }
    }
    
    // Handle transistor placement
    handleTransistorPlacement(x, y) {
        const id = this.simulator.addTransistor(x, y, this.componentSelect.value);
        
        // Calculate terminal positions correctly
        const { channelLength, gateWidth } = this.simulator.getTransistorCharacteristics();
        const circleRadius = Math.max(channelLength, gateWidth) * 0.7;
        
        // Set up the transistor terminals with correct positions
        this.transistorTerminals.set(id, {
            gate: { x: x - circleRadius, y: y },
            drain: { x: x, y: y - circleRadius },
            source: { x: x, y: y + circleRadius }
        });
        
        this.drawGrid();
        
        // Switch to wire mode after placing transistor
        this.componentSelect.value = 'wire';
        this.componentSelect.dispatchEvent(new Event('change'));
    }
    
    // Handle voltage source placement
    handleVoltageSourcePlacement(x, y) {
        const dot = this.findClosestDot(x, y);
        if (dot) {
            const dotIndex = this.dots.indexOf(dot);
            
            // If source exists, toggle it
            if (this.simulator.getVoltageSource(dotIndex)) {
                const source = this.simulator.getVoltageSource(dotIndex);
                this.simulator.setVoltageSource(dotIndex, !source.isVcc);
            } else {
                // Create new source
                const newLine = {
                    start: dot,
                    end: dot,
                    x: dot.x,
                    y: dot.y,
                    type: 'voltage_source'
                };
                this.lines.push(newLine);
                this.simulator.setVoltageSource(dotIndex, true);
            }
            
            this.rebuildCircuit();
            
            // Switch back to wire mode
            this.componentSelect.value = 'wire';
            this.componentSelect.dispatchEvent(new Event('change'));
        }
    }
    
    // Rebuild circuit
    rebuildCircuit() {
        if (this.autoCompute) {
            this.simulator.rebuildAllConnections(this.dots, this.lines);
            this.simulator.calculateCircuitValues(this.dots, this.lines);
        }
        this.drawGrid();
    }
    
    // Turn off delete mode
    turnOffDeleteMode() {
        if (this.deleteMode) {
            this.deleteMode = false;
            this.deleteModeButton.style.backgroundColor = '#4CAF50';
            this.deleteModeButton.title = 'Delete Mode (Off)';
            this.canvas.style.cursor = 'default';
        }
    }
    
    // Show warning message
    showWarningMessage() {
        // Clear any existing timeout
        if (this.warningTimeout) {
            clearTimeout(this.warningTimeout);
            this.warningMessage.style.opacity = '0';
        }
        
        // Show the warning
        this.warningMessage.style.opacity = '1';
        
        // Hide after 3 seconds
        this.warningTimeout = setTimeout(() => {
            this.warningMessage.style.opacity = '0';
        }, 3000);
    }
    
    // Helper functions
    isNearDot(x, y, dot) {
        const distance = Math.sqrt((x - dot.x) ** 2 + (y - dot.y) ** 2);
        return distance < this.DOT_RADIUS * 3;
    }
    
    findClosestDot(x, y) {
        return this.dots.find(dot => this.isNearDot(x, y, dot));
    }
    
    isNearSwitch(x, y) {
        for (const line of this.lines) {
            if (line.type === 'switch_no' || line.type === 'switch_nc') {
                const switchCenterX = (line.start.x + line.end.x) / 2;
                const switchCenterY = (line.start.y + line.end.y) / 2;
                const distance = Math.sqrt((x - switchCenterX)**2 + (y - switchCenterY)**2);
                if (distance < 20) {
                    return true;
                }
            }
        }
        return false;
    }
    
    findClosestTransistorTerminal(x, y) {
        const detectionRadius = 10;
        
        for (const [id, transistor] of this.simulator.getAllTransistors()) {
            const terminals = this.transistorTerminals.get(id);
            if (!terminals) continue;
            
            // Check each terminal (gate, drain, source)
            for (const [type, pos] of Object.entries(terminals)) {
                const distance = Math.sqrt((x - pos.x) ** 2 + (y - pos.y) ** 2);
                if (distance < detectionRadius) {
                    return { id, type, pos, transistor };
                }
            }
        }
        return null;
    }
    
    // Drawing functions
    drawDot(x, y, isHighlighted = false) {
        this.ctx.beginPath();
        this.ctx.arc(x, y, this.DOT_RADIUS, 0, Math.PI * 2);
        
        // Get the dot from coordinates
        const dot = this.dots.find(d => d.x === x && d.y === y);
        if (dot) {
            // Get the dot's row
            const dotIndex = this.dots.indexOf(dot);
            const row = Math.floor(dotIndex / this.GRID_COLS);
            
            if (isHighlighted) {
                this.ctx.fillStyle = '#ff4444';  // Keep highlighted dots red
            } else if (row === 0 || row === this.GRID_ROWS - 1) {
                this.ctx.fillStyle = '#ff4444';  // VCC rails always red
            } else if (row === 1 || row === this.GRID_ROWS - 2) {
                this.ctx.fillStyle = '#4444ff';  // GND rails always blue
            } else {
                // For middle rows (a-j), only color if they have a voltage
                if (dot.voltage !== undefined && dot.voltage !== null) {
                    this.ctx.fillStyle = this.simulator.interpolateColor(dot.voltage);
                } else {
                    this.ctx.fillStyle = '#333333';  // Default gray for unconnected dots
                }
            }
        } else {
            this.ctx.fillStyle = isHighlighted ? '#ff4444' : '#333333';
        }
        
        this.ctx.fill();
    }
    
    // Continue with other drawing methods...
    // (The rest of the drawing methods would be implemented here,
    // but I'll continue with the main structure for now)
    
    drawGrid() {
        // Clear the entire canvas first
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw power rails first
        this.drawPowerRails();
        
        // Draw center channel
        this.drawCenterChannel();
        
        // Draw row labels
        this.drawRowLabels();
        
        // Draw column labels
        this.drawColumnLabels();
        
        // Draw dots with their indices FIRST
        this.dots.forEach((dot, index) => {
            const isHighlighted = this.isDragging && this.isNearDot(this.currentMousePos.x, this.currentMousePos.y, dot);
            this.drawDot(dot.x, dot.y, isHighlighted);
        });
        
        // Draw existing lines 
        this.lines.forEach(line => {
            this.drawComponent(line.start.x, line.start.y, line.end.x, line.end.y, line.type, line.start, line.end);
        });
        
        // Draw line being dragged (always on top)
        if (this.isDragging) {
            if (this.startDot) {
                const closestDot = this.findClosestDot(this.currentMousePos.x, this.currentMousePos.y);
                this.drawComponent(this.startDot.x, this.startDot.y, this.currentMousePos.x, this.currentMousePos.y,
                                 this.componentSelect.value, this.startDot, closestDot);
            }
        }
        
        // Draw transistors
        this.simulator.getAllTransistors().forEach((transistor, id) => {
            this.drawTransistor(transistor.x, transistor.y, id);
        });
    }
    
    drawPowerRails() {
        const railHeight = this.CELL_HEIGHT * 0.6;
        const lineWidth = 2;
        const labelPadding = 35;
        
        // Top VCC rail (first row)
        this.ctx.beginPath();
        this.ctx.rect(this.PADDING - labelPadding, this.PADDING - railHeight/2, 
                     this.CANVAS_WIDTH - 2 * (this.PADDING - labelPadding), railHeight);
        this.ctx.fillStyle = '#ffeeee';
        this.ctx.fill();
        this.ctx.strokeStyle = '#ff0000';
        this.ctx.lineWidth = 1;
        this.ctx.stroke();
        
        // Top GND rail (second row)
        const topGndY = this.PADDING + this.CELL_HEIGHT;
        this.ctx.beginPath();
        this.ctx.rect(this.PADDING - labelPadding, topGndY - railHeight/2,
                     this.CANVAS_WIDTH - 2 * (this.PADDING - labelPadding), railHeight);
        this.ctx.fillStyle = '#eeeeff';
        this.ctx.fill();
        this.ctx.strokeStyle = '#0000ff';
        this.ctx.lineWidth = 1;
        this.ctx.stroke();
        
        // Bottom VCC rail (last row)
        const bottomVccY = this.CANVAS_HEIGHT - this.PADDING;
        this.ctx.beginPath();
        this.ctx.rect(this.PADDING - labelPadding, bottomVccY - railHeight/2,
                     this.CANVAS_WIDTH - 2 * (this.PADDING - labelPadding), railHeight);
        this.ctx.fillStyle = '#ffeeee';
        this.ctx.fill();
        this.ctx.strokeStyle = '#ff0000';
        this.ctx.lineWidth = 1;
        this.ctx.stroke();
        
        // Bottom GND rail (second to last row)
        const bottomGndY = this.CANVAS_HEIGHT - this.PADDING - this.CELL_HEIGHT;
        this.ctx.beginPath();
        this.ctx.rect(this.PADDING - labelPadding, bottomGndY - railHeight/2,
                     this.CANVAS_WIDTH - 2 * (this.PADDING - labelPadding), railHeight);
        this.ctx.fillStyle = '#eeeeff';
        this.ctx.fill();
        this.ctx.strokeStyle = '#0000ff';
        this.ctx.lineWidth = 1;
        this.ctx.stroke();
        
        // Add labels
        this.ctx.font = 'bold 20px Arial';
        this.ctx.textAlign = 'center';
        
        // Function to draw ground symbol
        const drawGroundSymbol = (x, y) => {
            const symbolWidth = 8;
            const lineSpacing = 3;
            
            this.ctx.beginPath();
            // Horizontal line (moved up by lineSpacing)
            this.ctx.moveTo(x - symbolWidth, y - lineSpacing);
            this.ctx.lineTo(x + symbolWidth, y - lineSpacing);
            // Medium line (centered on dot)
            this.ctx.moveTo(x - symbolWidth * 0.7, y);
            this.ctx.lineTo(x + symbolWidth * 0.7, y);
            // Shortest line (moved down by lineSpacing)
            this.ctx.moveTo(x - symbolWidth * 0.4, y + lineSpacing);
            this.ctx.lineTo(x + symbolWidth * 0.4, y + lineSpacing);
            this.ctx.strokeStyle = '#0000ff';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
        };
        
        // Left edge position
        const leftX = this.PADDING - labelPadding + 15;
        // Right edge position
        const rightX = this.CANVAS_WIDTH - this.PADDING + labelPadding - 15;
        
        // Draw VCC symbols (+)
        this.ctx.fillStyle = '#ff0000';
        // Top rail - align with first row of dots
        this.ctx.fillText('+', leftX, this.PADDING + 6);
        this.ctx.fillText('+', rightX, this.PADDING + 6);
        // Bottom rail - align with last row of dots
        this.ctx.fillText('+', leftX, bottomVccY + 6);
        this.ctx.fillText('+', rightX, bottomVccY + 6);
        
        // Draw GND symbols - align with second row and second-to-last row of dots
        drawGroundSymbol(leftX, topGndY);
        drawGroundSymbol(rightX, topGndY);
        drawGroundSymbol(leftX, bottomGndY);
        drawGroundSymbol(rightX, bottomGndY);
    }
    
    drawCenterChannel() {
        // Calculate the y position for the center channel
        const row7Y = this.PADDING + 7 * this.CELL_HEIGHT;
        const channelX = this.PADDING - 25;
        const channelY = row7Y + this.CELL_HEIGHT/2 - 35;
        const channelWidth = this.CANVAS_WIDTH - 2 * (this.PADDING - 25);
        
        // Create gradient for 3D effect
        const gradient = this.ctx.createLinearGradient(0, channelY, 0, channelY + this.CENTER_GAP);
        gradient.addColorStop(0, '#e8e8e8');
        gradient.addColorStop(0.1, '#f8f8f8');
        gradient.addColorStop(0.9, '#f8f8f8');
        gradient.addColorStop(1, '#e0e0e0');
        
        // Draw main channel with gradient
        this.ctx.beginPath();
        this.ctx.rect(channelX, channelY, channelWidth, this.CENTER_GAP);
        this.ctx.fillStyle = gradient;
        this.ctx.fill();
        
        // Add inner shadow at the top
        this.ctx.beginPath();
        this.ctx.rect(channelX, channelY, channelWidth, 2);
        this.ctx.fillStyle = 'rgba(0,0,0,0.1)';
        this.ctx.fill();
        
        // Add highlight at the bottom
        this.ctx.beginPath();
        this.ctx.rect(channelX, channelY, channelWidth, 2);
        this.ctx.fillStyle = 'rgba(255,255,255,0.3)';
        this.ctx.fill();
        
        // Add subtle side shadows
        this.ctx.beginPath();
        this.ctx.rect(channelX, channelY, 1, this.CENTER_GAP);
        this.ctx.rect(channelX + channelWidth - 1, channelY, 1, this.CENTER_GAP);
        this.ctx.fillStyle = 'rgba(0,0,0,0.05)';
        this.ctx.fill();
    }
    
    drawRowLabels() {
        const labelPadding = 35;
        this.ctx.font = 'bold 14px Arial';
        this.ctx.fillStyle = '#666666';
        
        // Letters for labels
        const letters = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'];
        
        // Calculate center positions for labels
        const leftLabelX = this.PADDING - labelPadding/2;
        const rightLabelX = this.CANVAS_WIDTH - this.PADDING + labelPadding/2;
        
        // Draw labels for rows 3-6 (before gap)
        for (let row = 2; row < 7; row++) {
            const y = this.PADDING + row * this.CELL_HEIGHT + 5;
            const letter = letters[row - 2];
            
            // Left side label
            this.ctx.textAlign = 'center';
            this.ctx.fillText(letter, leftLabelX, y);
            
            // Right side label
            this.ctx.fillText(letter, rightLabelX, y);
        }
        
        // Draw labels for rows 8-13 (after gap)
        for (let row = 7; row < 12; row++) {
            const y = this.PADDING + row * this.CELL_HEIGHT + this.CENTER_GAP + 5;
            const letter = letters[row - 2];
            
            // Left side label
            this.ctx.textAlign = 'center';
            this.ctx.fillText(letter, leftLabelX, y);
            
            // Right side label
            this.ctx.fillText(letter, rightLabelX, y);
        }
    }
    
    drawColumnLabels() {
        this.ctx.font = 'bold 12px Arial';
        this.ctx.fillStyle = '#666666';
        this.ctx.textAlign = 'center';
        
        // Calculate vertical positions to center between dots and edge
        const topLabelY = this.PADDING - 20;
        const bottomLabelY = this.CANVAS_HEIGHT - this.PADDING + 30;
        
        // Draw numbers for each column
        for (let col = 0; col < this.GRID_COLS; col++) {
            const x = this.PADDING + col * this.CELL_WIDTH;
            const number = col + 1;
            
            // Top numbers
            this.ctx.fillText(number, x, topLabelY);
            
            // Bottom numbers
            this.ctx.fillText(number, x, bottomLabelY);
        }
    }
    
    drawComponent(startX, startY, endX, endY, type, startDot, endDot) {
        if (type === 'led') {
            this.drawLED(startX, startY, endX, endY, startDot, endDot);
        } else if (type === 'wire') {
            this.drawWire(startX, startY, endX, endY, startDot, endDot);
        } else if (type === 'switch_no' || type === 'switch_nc') {
            const switchId = this.simulator.getSwitchId(startDot, endDot, this.dots);
            const isPressed = this.simulator.getSwitchState(startDot, endDot, this.dots);
            this.drawSwitch(startX, startY, endX, endY, type, startDot, endDot, isPressed);
        } else if (type === 'voltage_indicator') {
            this.drawVoltageIndicator(startX, startY, startDot);
        } else if (type === 'voltage_source') {
            this.drawVoltageSource(startX, startY, startDot);
        }
    }
    
    drawWire(startX, startY, endX, endY, startDot, endDot, isCurrentWire = false) {
        // Handle case where dots might be undefined
        let startIndex = startDot ? this.dots.indexOf(startDot) : -1;
        let endIndex = endDot ? this.dots.indexOf(endDot) : -1;
        
        let startConnections = startIndex !== -1 ? this.simulator.connections.get(startIndex) : new Set();
        let endConnections = endIndex !== -1 ? this.simulator.connections.get(endIndex) : new Set();
        
        // Default to no power/ground if connections aren't available
        const hasStartPower = startConnections ? Array.from(startConnections).some(i => this.dots[i].voltage === 9) : false;
        const hasStartGround = startConnections ? Array.from(startConnections).some(i => this.dots[i].voltage === 0) : false;
        const hasEndPower = endConnections ? Array.from(endConnections).some(i => this.dots[i].voltage === 9) : false;
        const hasEndGround = endConnections ? Array.from(endConnections).some(i => this.dots[i].voltage === 0) : false;
        
        // Check for direct power to ground connection
        const isShortCircuit = (hasStartPower && hasEndGround) || (hasStartGround && hasEndPower);
        
        // Always draw the wire
        this.ctx.beginPath();
        this.ctx.moveTo(startX, startY);
        this.ctx.lineTo(endX, endY);
        
        if (hasStartPower || hasEndPower) {
            this.ctx.strokeStyle = '#ff4444';  // Red for power
        } else if (hasStartGround || hasEndGround) {
            this.ctx.strokeStyle = '#4444ff';  // Blue for ground
        } else {
            this.ctx.strokeStyle = '#000000';  // Black for other connections
        }
        
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
        
        return isShortCircuit;
    }
    
    drawLED(startX, startY, endX, endY, startDot, endDot) {
        // Calculate the angle and length of the line
        const dx = endX - startX;
        const dy = endY - startY;
        const angle = Math.atan2(dy, dx);
        const length = Math.sqrt(dx * dx + dy * dy);
        
        // LED dimensions
        const diameter = Math.min(30, length * 0.3);
        const radius = diameter / 2;
        
        // Calculate LED position
        const startWireLength = (length - diameter) / 2;
        const ledStartX = startX + Math.cos(angle) * startWireLength;
        const ledStartY = startY + Math.sin(angle) * startWireLength;
        const ledCenterX = ledStartX + Math.cos(angle) * radius;
        const ledCenterY = ledStartY + Math.sin(angle) * radius;
        
        // Get voltage and current from voltage map
        let isProperlyConnected = false;
        let current = 0;
        let actualVoltage = 0;

        if (startDot && endDot) {
            const voltageMap = this.simulator.calculateIntermediateVoltages(this.dots);
            const startVoltage = this.simulator.getDotVoltage(startDot, this.dots, voltageMap);
            const endVoltage = this.simulator.getDotVoltage(endDot, this.dots, voltageMap);
            
            if (startVoltage !== null && endVoltage !== null) {
                const voltageDiff = Math.abs(startVoltage - endVoltage);
                actualVoltage = voltageDiff;
                
                const ledChars = this.simulator.getLEDCharacteristics();
                if (voltageDiff >= ledChars.vf) {
                    const remainingVoltage = voltageDiff - ledChars.vf;
                    current = remainingVoltage / ledChars.resistance;
                    isProperlyConnected = current >= ledChars.minCurrent;
                }
            }
        }
        
        // Draw connecting wires
        this.ctx.beginPath();
        this.ctx.moveTo(startX, startY);
        this.ctx.lineTo(ledStartX, ledStartY);
        this.ctx.moveTo(endX, endY);
        this.ctx.lineTo(ledStartX + Math.cos(angle) * diameter, 
                       ledStartY + Math.sin(angle) * diameter);
        this.ctx.strokeStyle = '#000000';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
        
        // Save context for LED drawing
        this.ctx.save();
        
        // Translate to LED center and rotate
        this.ctx.translate(ledCenterX, ledCenterY);
        this.ctx.rotate(angle);
        
        // Draw LED body (main circle)
        this.ctx.beginPath();
        this.ctx.arc(0, 0, radius, 0, Math.PI * 2);
        
        // Create radial gradient for 3D effect
        const gradient = this.ctx.createRadialGradient(
            -radius * 0.3, -radius * 0.3, radius * 0.1,
            0, 0, radius
        );

        if (isProperlyConnected) {
            // Calculate brightness based on current
            const ledChars = this.simulator.getLEDCharacteristics();
            const brightness = Math.min(1, current / ledChars.maxCurrent);
            const brightnessFactor = 0.3 + (0.7 * brightness);
            
            gradient.addColorStop(0, `rgba(255, 255, 255, ${brightnessFactor})`);
            gradient.addColorStop(0.2, `rgba(255, 204, 204, ${brightnessFactor})`);
            gradient.addColorStop(0.7, `rgba(255, 51, 51, ${brightnessFactor})`);
            gradient.addColorStop(1, `rgba(204, 0, 0, ${brightnessFactor})`);
            
            this.ctx.shadowColor = '#ff0000';
            this.ctx.shadowBlur = 15 * brightnessFactor;
            this.ctx.shadowOffsetX = 0;
            this.ctx.shadowOffsetY = 0;
        } else {
            gradient.addColorStop(0, '#ff9999');
            gradient.addColorStop(0.3, '#ff0000');
            gradient.addColorStop(1, '#990000');
        }
        
        this.ctx.fillStyle = gradient;
        this.ctx.fill();
        
        // Add rim lighting effect
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        this.ctx.lineWidth = 1;
        this.ctx.stroke();
        
        // Draw enhanced polarity indicators
        const symbolSize = radius * 0.6;
        this.ctx.strokeStyle = '#800000';
        this.ctx.fillStyle = '#800000';
        this.ctx.lineWidth = 2;
        this.ctx.shadowBlur = 0;
        
        // Plus symbol (anode)
        this.ctx.beginPath();
        this.ctx.arc(-radius * 1.6, 0, 8, 0, Math.PI * 2);
        this.ctx.fillStyle = 'white';
        this.ctx.fill();
        this.ctx.stroke();
        this.ctx.beginPath();
        this.ctx.moveTo(-radius * 1.6 - 4, 0);
        this.ctx.lineTo(-radius * 1.6 + 4, 0);
        this.ctx.moveTo(-radius * 1.6, -4);
        this.ctx.lineTo(-radius * 1.6, 4);
        this.ctx.moveTo(-radius * 1.4, 0);
        this.ctx.lineTo(-radius * 1.8, 0);
        this.ctx.moveTo(-radius * 1.6, -symbolSize * 0.2);
        this.ctx.lineTo(-radius * 1.6, symbolSize * 0.2);
        this.ctx.stroke();
        
        // Minus symbol
        this.ctx.beginPath();
        this.ctx.moveTo(radius * 1.4, 0);
        this.ctx.lineTo(radius * 1.8, 0);
        this.ctx.stroke();
        
        // Add a subtle inner shadow
        this.ctx.beginPath();
        this.ctx.arc(0, 0, radius * 0.9, 0, Math.PI * 2);
        this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
        this.ctx.lineWidth = radius * 0.2;
        this.ctx.stroke();
        
        // Restore context
        this.ctx.restore();
    }
    
    drawSwitch(startX, startY, endX, endY, type, startDot, endDot, isPressed = false) {
        // Calculate the angle and length of the line
        const dx = endX - startX;
        const dy = endY - startY;
        const angle = Math.atan2(dy, dx);
        const length = Math.sqrt(dx * dx + dy * dy);
        
        // Switch dimensions
        const switchWidth = Math.min(40, length * 0.4);
        const switchHeight = 20;
        
        // Calculate switch position
        const startWireLength = (length - switchWidth) / 2;
        const switchStartX = startX + Math.cos(angle) * startWireLength;
        const switchStartY = startY + Math.sin(angle) * startWireLength;
        
        // Draw connecting wires
        this.ctx.beginPath();
        this.ctx.moveTo(startX, startY);
        this.ctx.lineTo(switchStartX, switchStartY);
        this.ctx.moveTo(endX, endY);
        this.ctx.lineTo(switchStartX + Math.cos(angle) * switchWidth, 
                       switchStartY + Math.sin(angle) * switchWidth);
        this.ctx.strokeStyle = '#000000';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
        
        // Save context
        this.ctx.save();
        
        // Translate and rotate for switch drawing
        this.ctx.translate(switchStartX + Math.cos(angle) * (switchWidth/2), 
                         switchStartY + Math.sin(angle) * (switchWidth/2));
        this.ctx.rotate(angle);
        
        // Draw switch base (rectangle)
        this.ctx.beginPath();
        this.ctx.rect(-switchWidth/2, -switchHeight/2, switchWidth, switchHeight);
        this.ctx.fillStyle = '#e0e0e0';
        this.ctx.fill();
        this.ctx.strokeStyle = '#666666';
        this.ctx.lineWidth = 1;
        this.ctx.stroke();
        
        // Draw switch lever
        this.ctx.beginPath();
        if (type === 'switch_no') {
            // Normally Open: disconnected unless pressed
            if (isPressed) {
                // Connected position
                this.ctx.moveTo(-switchWidth/4, -switchHeight/4);
                this.ctx.lineTo(switchWidth/4, -switchHeight/4);
            } else {
                // Disconnected position
                this.ctx.moveTo(-switchWidth/4, -switchHeight/4);
                this.ctx.lineTo(switchWidth/4, switchHeight/4);
            }
        } else {
            // Normally Closed: connected unless pressed
            if (isPressed) {
                // Disconnected position
                this.ctx.moveTo(-switchWidth/4, -switchHeight/4);
                this.ctx.lineTo(switchWidth/4, switchHeight/4);
            } else {
                // Connected position
                this.ctx.moveTo(-switchWidth/4, -switchHeight/4);
                this.ctx.lineTo(switchWidth/4, -switchHeight/4);
            }
        }
        this.ctx.strokeStyle = '#000000';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
        
        // Draw connection points
        this.ctx.beginPath();
        this.ctx.arc(-switchWidth/4, -switchHeight/4, 3, 0, Math.PI * 2);
        this.ctx.arc(switchWidth/4, -switchHeight/4, 3, 0, Math.PI * 2);
        this.ctx.fillStyle = '#000000';
        this.ctx.fill();
        
        // Restore context
        this.ctx.restore();
    }
    
    drawVoltageIndicator(x, y, dot) {
        // Get voltage from the connected point
        let voltage = null;
        if (dot) {
            const voltageMap = this.simulator.calculateIntermediateVoltages(this.dots);
            voltage = this.simulator.getDotVoltage(dot, this.dots, voltageMap);
        }
        
        // Save context
        this.ctx.save();
        
        const radius = 12;
        
        // Create gradient for 3D effect
        const gradient = this.ctx.createRadialGradient(
            x - radius * 0.3,
            y - radius * 0.3,
            radius * 0.1,
            x,
            y,
            radius
        );

        // Use the same color interpolation as the dots
        const bgColor = this.simulator.interpolateColor(voltage);
        const lighterColor = voltage === null ? '#666666' : 
                            voltage === 9 ? '#ffaaaa' : 
                            voltage === 0 ? '#aaaaff' : 
                            bgColor.replace('rgb(', 'rgba(').replace(')', ',0.7)');
        
        gradient.addColorStop(0, lighterColor);
        gradient.addColorStop(1, bgColor);
        
        // Draw indicator body (circle) with gradient
        this.ctx.beginPath();
        this.ctx.arc(x, y, radius, 0, Math.PI * 2);
        this.ctx.fillStyle = gradient;
        this.ctx.fill();
        
        // Add a subtle border
        this.ctx.strokeStyle = voltage === null ? '#444444' :
                             voltage === 9 ? '#ff0000' :
                             voltage === 0 ? '#0000ff' :
                             '#666666';
        this.ctx.lineWidth = 1;
        this.ctx.stroke();
        
        // Draw voltage value with contrasting text color
        this.ctx.font = 'bold 10px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        
        // Set text color based on background brightness
        this.ctx.fillStyle = '#ffffff';
        
        // Add text shadow for better readability
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        this.ctx.shadowBlur = 2;
        this.ctx.shadowOffsetX = 1;
        this.ctx.shadowOffsetY = 1;
        
        if (voltage !== null) {
            this.ctx.fillText(`${voltage.toFixed(1)}V`, x, y);
        } else {
            this.ctx.fillText('--V', x, y);
        }
        
        // Restore context
        this.ctx.restore();
    }
    
    drawVoltageSource(x, y, dot) {
        const dotIndex = this.dots.indexOf(dot);
        const source = this.simulator.getVoltageSource(dotIndex);
        
        if (!source) return;
        
        const isVcc = source.isVcc;
        const radius = 15;
        
        // Save context
        this.ctx.save();
        
        // Draw source body (circle)
        this.ctx.beginPath();
        this.ctx.arc(x, y, radius, 0, Math.PI * 2);
        
        if (isVcc) {
            this.ctx.fillStyle = '#ffeeee';
            this.ctx.strokeStyle = '#ff4444';
        } else {
            this.ctx.fillStyle = '#eeeeff';
            this.ctx.strokeStyle = '#4444ff';
        }
        
        this.ctx.fill();
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
        
        // Draw voltage indicator text
        this.ctx.font = 'bold 12px Arial';
        this.ctx.fillStyle = isVcc ? '#ff0000' : '#0000ff';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(isVcc ? 'VCC' : 'GND', x, y);
        
        // Restore context
        this.ctx.restore();
    }
    
    drawTransistor(x, y, id) {
        const { channelLength, gateWidth } = this.simulator.getTransistorCharacteristics();
        const transistor = this.simulator.getTransistor(id);
        const isConnecting = transistor?.conducting;
        const isPMOS = transistor?.type === 'pmos';
        
        // Save context
        this.ctx.save();
        
        // Translate to transistor center
        this.ctx.translate(x, y);

        // Add opaque background circle
        const circleRadius = Math.max(channelLength, gateWidth) * 0.7;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, circleRadius, 0, Math.PI * 2);
        if (isPMOS) {
            this.ctx.fillStyle = '#3CB371'; // Solid green
        } else {
            this.ctx.fillStyle = '#FFA500'; // Solid Orange
        }
        this.ctx.fill();
        
        // Add connection points on the circle edge
        const connectionRadius = 4;
        
        // Draw Drain connection point (top)
        this.ctx.beginPath();
        this.ctx.arc(0, -circleRadius, connectionRadius, 0, Math.PI * 2);
        this.ctx.fillStyle = '#000';
        this.ctx.fill();
        this.ctx.strokeStyle = '#fff';
        this.ctx.lineWidth = 1;
        this.ctx.stroke();

        // Draw Source connection point (bottom)
        this.ctx.beginPath();
        this.ctx.arc(0, circleRadius, connectionRadius, 0, Math.PI * 2);
        this.ctx.fillStyle = '#000';
        this.ctx.fill();
        this.ctx.strokeStyle = '#fff';
        this.ctx.lineWidth = 1;
        this.ctx.stroke();

        // Draw Gate connection point (left)
        this.ctx.beginPath();
        this.ctx.arc(-circleRadius, 0, connectionRadius, 0, Math.PI * 2);
        this.ctx.fillStyle = '#000';
        this.ctx.fill();
        this.ctx.strokeStyle = '#fff';
        this.ctx.lineWidth = 1;
        this.ctx.stroke();
        
        // Continue with existing transistor drawing code
        this.ctx.beginPath();
        this.ctx.moveTo(0, -channelLength/2-5);
        this.ctx.lineTo(0, -channelLength/6);
        this.ctx.strokeStyle = '#000';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
        
        // Draw source (bottom)
        this.ctx.beginPath();
        this.ctx.moveTo(0, channelLength/6);
        this.ctx.lineTo(0, channelLength/2+5);
        this.ctx.stroke();
        
        // Draw upper left leg
        this.ctx.beginPath();
        this.ctx.moveTo(0, -channelLength/6);
        this.ctx.lineTo(-channelLength/6, -channelLength/6);
        this.ctx.lineWidth = 3;
        this.ctx.stroke();

        // Draw lower left leg
        this.ctx.beginPath();
        this.ctx.moveTo(0, channelLength/6);
        this.ctx.lineTo(-channelLength/6, channelLength/6);
        this.ctx.lineWidth = 3;
        this.ctx.stroke();

        // Draw connected gate with indication of conducting state
        this.ctx.beginPath();
        this.ctx.moveTo(-channelLength/6, -channelLength/6);
        this.ctx.lineTo(-channelLength/6, channelLength/6);
        this.ctx.strokeStyle = isConnecting ? '#4CAF50' : '#666';
        this.ctx.lineWidth = 3;
        this.ctx.stroke();

        // Draw  gate connection
        this.ctx.beginPath();
        this.ctx.moveTo((-channelLength/6)-5, -channelLength/6);
        this.ctx.lineTo((-channelLength/6)-5, channelLength/6);
        this.ctx.strokeStyle = '#000';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();

        // Draw gate
        this.ctx.beginPath();
        this.ctx.moveTo((-channelLength/6)-15, 0);
        this.ctx.lineTo((-channelLength/6)-5, 0);
        this.ctx.strokeStyle = '#000';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
        
        // Draw gate terminal
        this.ctx.beginPath();
        this.ctx.moveTo(-gateWidth/2, 0);
        this.ctx.lineTo(-gateWidth+5, 0);
        this.ctx.stroke();
        
        // Add PMOS circle at gate if PMOS
        if (isPMOS) {
            this.ctx.beginPath();
            this.ctx.arc(-gateWidth/2, 0, 3, 0, Math.PI * 2);
            this.ctx.fillStyle = '#000';
            this.ctx.fill();
        }
        
        // Add terminal indicators
        this.ctx.fillStyle = '#000';
        this.ctx.font = '10px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText('G', -gateWidth+7, -7);
        this.ctx.fillText('D', 5, -channelLength/3);
        this.ctx.fillText('S', 5, channelLength/3 + 5);
        
        // Add type and state indicator
        if (transistor?.conducting) {
            this.ctx.fillStyle = '#FF0000';
            this.ctx.fillText('ON', 8, 3);
        }
        this.ctx.fillStyle = '#000';
        this.ctx.fillText(isPMOS ? 'P' : 'N', -3, 3.5);
        
        // Restore context
        this.ctx.restore();
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BreadboardEditor;
} else {
    window.BreadboardEditor = BreadboardEditor;
}
