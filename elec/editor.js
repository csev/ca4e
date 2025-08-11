class CircuitEditor {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.components = [];
        this.connections = [];
        this.mode = 'move'; // 'move' or 'connect'
        this.selectedComponent = null;
        this.dragging = false;
        this.dragOffset = { x: 0, y: 0 };
        this.connectingFrom = null;
        this.componentCounts = {
            battery: 0,
            switch: 0,
            light: 0,
            relay: 0
        };
        this.componentSize = 60;
        this.gridSize = 20;
        this.simulator = new CircuitSimulator();
    }

    initializeCanvas() {
        this.canvas = document.getElementById('circuitCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.resizeCanvas();
        this.draw();
        
        // Handle window resize
        window.addEventListener('resize', () => {
            this.resizeCanvas();
            this.draw();
        });
    }

    resizeCanvas() {
        const container = this.canvas.parentElement;
        const rect = container.getBoundingClientRect();
        this.canvas.width = rect.width - 40;
        this.canvas.height = rect.height - 40;
    }

    setMode(mode) {
        this.mode = mode;
        this.connectingFrom = null;
        this.selectedComponent = null;
    }

    placeComponent(type) {
        const count = ++this.componentCounts[type];
        const position = this.findNonOverlappingPosition();
        
        const component = {
            id: `${type}-${count}`,
            type: type,
            x: position.x,
            y: position.y,
            width: this.componentSize,
            height: this.componentSize,
            state: this.getDefaultState(type),
            label: `${type}-${count}`
        };
        
        this.components.push(component);
        
        // Run simulation after placing component
        this.runSimulation();
        this.draw();
        
        return `Placed ${component.label}`;
    }

    findNonOverlappingPosition() {
        const padding = 20; // Extra space between components
        const maxAttempts = 100;
        let attempts = 0;
        
        // If there are existing components, try to place near them first
        if (this.components.length > 0) {
            // Try placing near existing components
            const nearPosition = this.findPositionNearExisting(padding);
            if (nearPosition) {
                return nearPosition;
            }
        }
        
        while (attempts < maxAttempts) {
            // Generate a random position
            const x = 50 + Math.random() * (this.canvas.width - this.componentSize - 100);
            const y = 50 + Math.random() * (this.canvas.height - this.componentSize - 100);
            
            // Check if this position overlaps with any existing component
            const overlaps = this.components.some(existing => 
                this.componentsOverlap(
                    { x, y, width: this.componentSize, height: this.componentSize },
                    { x: existing.x, y: existing.y, width: existing.width, height: existing.height },
                    padding
                )
            );
            
            if (!overlaps) {
                return { x, y };
            }
            
            attempts++;
        }
        
        // If we can't find a non-overlapping position, try a grid-based approach
        return this.findGridPosition();
    }

    findPositionNearExisting(padding) {
        const maxAttempts = 50;
        let attempts = 0;
        
        while (attempts < maxAttempts) {
            // Pick a random existing component to place near
            const randomComponent = this.components[Math.floor(Math.random() * this.components.length)];
            
            // Generate positions around this component
            const positions = [
                // Right of the component
                { x: randomComponent.x + randomComponent.width + padding, y: randomComponent.y },
                // Left of the component
                { x: randomComponent.x - this.componentSize - padding, y: randomComponent.y },
                // Below the component
                { x: randomComponent.x, y: randomComponent.y + randomComponent.height + padding },
                // Above the component
                { x: randomComponent.x, y: randomComponent.y - this.componentSize - padding },
                // Diagonal positions
                { x: randomComponent.x + randomComponent.width + padding, y: randomComponent.y + randomComponent.height + padding },
                { x: randomComponent.x - this.componentSize - padding, y: randomComponent.y - this.componentSize - padding },
                { x: randomComponent.x + randomComponent.width + padding, y: randomComponent.y - this.componentSize - padding },
                { x: randomComponent.x - this.componentSize - padding, y: randomComponent.y + randomComponent.height + padding }
            ];
            
            // Try each position
            for (const pos of positions) {
                // Check if position is within canvas bounds
                if (pos.x >= 50 && pos.x <= this.canvas.width - this.componentSize - 50 &&
                    pos.y >= 50 && pos.y <= this.canvas.height - this.componentSize - 50) {
                    
                    // Check if this position overlaps with any existing component
                    const overlaps = this.components.some(existing => 
                        this.componentsOverlap(
                            { x: pos.x, y: pos.y, width: this.componentSize, height: this.componentSize },
                            { x: existing.x, y: existing.y, width: existing.width, height: existing.height },
                            padding
                        )
                    );
                    
                    if (!overlaps) {
                        return pos;
                    }
                }
            }
            
            attempts++;
        }
        
        return null; // Couldn't find a position near existing components
    }

    componentsOverlap(comp1, comp2, padding = 0) {
        return !(
            comp1.x + comp1.width + padding < comp2.x ||
            comp2.x + comp2.width + padding < comp1.x ||
            comp1.y + comp1.height + padding < comp2.y ||
            comp2.y + comp2.height + padding < comp1.y
        );
    }

    findGridPosition() {
        const gridSpacing = this.componentSize + 40; // Component size plus padding
        const startX = 50;
        const startY = 50;
        
        // Calculate grid dimensions
        const maxCols = Math.floor((this.canvas.width - 100) / gridSpacing);
        const maxRows = Math.floor((this.canvas.height - 100) / gridSpacing);
        
        // Try each grid position
        for (let row = 0; row < maxRows; row++) {
            for (let col = 0; col < maxCols; col++) {
                const x = startX + col * gridSpacing;
                const y = startY + row * gridSpacing;
                
                const overlaps = this.components.some(existing => 
                    this.componentsOverlap(
                        { x, y, width: this.componentSize, height: this.componentSize },
                        { x: existing.x, y: existing.y, width: existing.width, height: existing.height }
                    )
                );
                
                if (!overlaps) {
                    return { x, y };
                }
            }
        }
        
        // If all grid positions are taken, find the first available space
        return this.findFirstAvailableSpace();
    }

    findFirstAvailableSpace() {
        const step = this.componentSize + 20;
        let x = 50;
        let y = 50;
        
        while (y < this.canvas.height - this.componentSize - 50) {
            while (x < this.canvas.width - this.componentSize - 50) {
                const overlaps = this.components.some(existing => 
                    this.componentsOverlap(
                        { x, y, width: this.componentSize, height: this.componentSize },
                        { x: existing.x, y: existing.y, width: existing.width, height: existing.height }
                    )
                );
                
                if (!overlaps) {
                    return { x, y };
                }
                
                x += step;
            }
            x = 50;
            y += step;
        }
        
        // If we still can't find space, place it at the bottom right
        return {
            x: Math.max(50, this.canvas.width - this.componentSize - 50),
            y: Math.max(50, this.canvas.height - this.componentSize - 50)
        };
    }

    getDefaultState(type) {
        switch(type) {
            case 'battery': return { voltage: 6 };
            case 'switch': return { closed: false };
            case 'light': return { on: false };
            case 'relay': return { energized: false, position: 'A' };
            default: return {};
        }
    }

    getComponentConnectors(component) {
        const connectors = [];
        const x = component.x;
        const y = component.y;
        const w = component.width;
        const h = component.height;

        if (component.type === 'battery') {
            // Battery: output on top edge, input on bottom edge
            connectors.push({
                type: 'output',
                x: x + w/2,
                y: y - 8, // Move outside the component boundary
                voltage: 6
            });
            connectors.push({
                type: 'input',
                x: x + w/2,
                y: y + h + 8, // Move outside the component boundary
                voltage: 0
            });
        } else {
            // Other components: input on top, output on bottom
            // Get current voltage from simulation for accurate display
            const inputNodeId = `${component.id}-input`;
            const outputNodeId = `${component.id}-output`;
            
            connectors.push({
                type: 'input',
                x: x + w/2,
                y: y,
                voltage: this.simulator ? this.simulator.getNodeVoltage(inputNodeId) : null
            });
            connectors.push({
                type: 'output',
                x: x + w/2,
                y: y + h + 8, // Move outside the component boundary
                voltage: this.simulator ? this.simulator.getNodeVoltage(outputNodeId) : null
            });
        }

        return connectors;
    }

    findComponentAt(x, y) {
        return this.components.find(comp => 
            x >= comp.x && x <= comp.x + comp.width &&
            y >= comp.y && y <= comp.y + comp.height
        );
    }

    findConnectorAt(x, y) {
        for (const component of this.components) {
            const connectors = this.getComponentConnectors(component);
            for (const connector of connectors) {
                const distance = Math.sqrt(
                    Math.pow(x - connector.x, 2) + Math.pow(y - connector.y, 2)
                );
                if (distance <= 10) {
                    return { component, connector };
                }
            }
        }
        return null;
    }

    handleMouseDown(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        if (this.mode === 'move') {
            const component = this.findComponentAt(x, y);
            if (component) {
                // Check if it's a click to toggle component state
                if (e.detail === 1 && !this.dragging) {
                    this.toggleComponentState(component);
                }
                
                this.selectedComponent = component;
                this.dragging = true;
                this.dragOffset = {
                    x: x - component.x,
                    y: y - component.y
                };
            }
        } else if (this.mode === 'connect') {
            const connectorInfo = this.findConnectorAt(x, y);
            if (connectorInfo) {
                if (!this.connectingFrom) {
                    this.connectingFrom = connectorInfo;
                } else {
                    this.createConnection(this.connectingFrom, connectorInfo);
                    this.connectingFrom = null;
                }
            }
        }
    }

    handleMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        if (this.dragging && this.selectedComponent) {
            const newX = x - this.dragOffset.x;
            const newY = y - this.dragOffset.y;
            
            // Check if the new position would overlap with other components
            const wouldOverlap = this.components.some(other => {
                if (other === this.selectedComponent) return false;
                
                return this.componentsOverlap(
                    { x: newX, y: newY, width: this.selectedComponent.width, height: this.selectedComponent.height },
                    { x: other.x, y: other.y, width: other.width, height: other.height }
                );
            });
            
            // Only update position if it doesn't overlap
            if (!wouldOverlap) {
                this.selectedComponent.x = newX;
                this.selectedComponent.y = newY;
            }
            
            this.draw();
        }
    }

    handleMouseUp(e) {
        this.dragging = false;
        this.selectedComponent = null;
    }



    executeCommand(command) {
        const parts = command.toLowerCase().split(' ');
        
        if (parts[0] === 'place') {
            const componentType = parts[1];
            if (['battery', 'switch', 'light', 'relay'].includes(componentType)) {
                return this.placeComponent(componentType);
            } else {
                return `Unknown component type: ${componentType}`;
            }
        } else if (parts[0] === 'connect') {
            // Parse: connect battery-1 output to switch-1 input
            if (parts.length >= 6 && parts[3] === 'to') {
                const fromComponent = parts[1];
                const fromConnector = parts[2];
                const toComponent = parts[4];
                const toConnector = parts[5];
                
                const fromComp = this.components.find(c => c.id === fromComponent);
                const toComp = this.components.find(c => c.id === toComponent);
                
                if (!fromComp) return `Component not found: ${fromComponent}`;
                if (!toComp) return `Component not found: ${toComponent}`;
                
                const fromConnectors = this.getComponentConnectors(fromComp);
                const toConnectors = this.getComponentConnectors(toComp);
                
                const fromConn = fromConnectors.find(c => c.type === fromConnector);
                const toConn = toConnectors.find(c => c.type === toConnector);
                
                if (!fromConn) return `Connector not found: ${fromConnector}`;
                if (!toConn) return `Connector not found: ${toConnector}`;
                
                return this.createConnection(
                    { component: fromComp, connector: fromConn },
                    { component: toComp, connector: toConn }
                );
            }
        } else if (parts[0] === 'read') {
            return this.readCircuit();
        } else if (parts[0] === 'clear') {
            this.clearAll();
            return "Circuit cleared";
        } else if (parts[0] === 'help') {
            return "Available commands: place [battery|switch|light|relay], connect [component] [input|output] to [component] [input|output], read, clear, help";
        }
        
        return `Unknown command: ${command}`;
    }

    readCircuit() {
        // Run simulation to get current voltages
        this.runSimulation();
        
        let result = "Circuit Status:\n";
        
        // Components
        result += "\nComponents:\n";
        for (const component of this.components) {
            result += `- ${component.label} (${component.type}) at (${Math.round(component.x)}, ${Math.round(component.y)})\n`;
        }
        
        // Connections
        result += "\nConnections:\n";
        for (const conn of this.connections) {
            result += `- ${conn.from.componentId} ${conn.from.connectorType} to ${conn.to.componentId} ${conn.to.connectorType}\n`;
        }
        
        // Voltages from simulation
        result += "\nVoltages:\n";
        const nodeVoltages = this.simulator.getAllNodeVoltages();
        for (const [nodeId, voltage] of Object.entries(nodeVoltages)) {
            const voltageText = voltage !== null ? `${voltage}V` : "not connected";
            result += `- ${nodeId}: ${voltageText}\n`;
        }
        
        // Component states
        result += "\nComponent States:\n";
        const componentStates = this.simulator.getAllComponentStates();
        for (const [componentId, state] of Object.entries(componentStates)) {
            result += `- ${componentId}: ${JSON.stringify(state)}\n`;
        }
        
        return result;
    }

    clearAll() {
        this.components = [];
        this.connections = [];
        this.componentCounts = {
            battery: 0,
            switch: 0,
            light: 0,
            relay: 0
        };
        this.connectingFrom = null;
        this.selectedComponent = null;
        this.draw();
    }

    draw() {
        if (!this.ctx) return;
        
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw grid
        this.drawGrid();
        
        // Draw connections
        this.drawConnections();
        
        // Draw components
        this.drawComponents();
        
        // Draw connection preview
        if (this.connectingFrom) {
            this.drawConnectionPreview();
        }
    }

    drawGrid() {
        this.ctx.strokeStyle = '#f0f0f0';
        this.ctx.lineWidth = 1;
        
        for (let x = 0; x <= this.canvas.width; x += this.gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
            this.ctx.stroke();
        }
        
        for (let y = 0; y <= this.canvas.height; y += this.gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
            this.ctx.stroke();
        }
    }

    drawComponents() {
        for (const component of this.components) {
            // Component background
            this.ctx.fillStyle = '#ffffff';
            this.ctx.strokeStyle = '#333333';
            this.ctx.lineWidth = 2;
            this.ctx.fillRect(component.x, component.y, component.width, component.height);
            this.ctx.strokeRect(component.x, component.y, component.width, component.height);
            
            // Component label
            this.ctx.fillStyle = '#000000';
            this.ctx.font = '12px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(component.label, component.x + component.width/2, component.y + component.height/2);
            
            // Component state
            this.drawComponentState(component);
            
            // Connectors
            this.drawComponentConnectors(component);
        }
    }

    drawComponentState(component) {
        this.ctx.font = '10px Arial';
        this.ctx.textAlign = 'center';
        
        switch(component.type) {
            case 'battery':
                this.ctx.fillStyle = '#ff6b6b';
                this.ctx.fillText('6V', component.x + component.width/2, component.y + component.height/2 + 15);
                break;
            case 'switch':
                this.ctx.fillStyle = component.state.closed ? '#51cf66' : '#ff6b6b';
                this.ctx.fillText(component.state.closed ? 'CLOSED' : 'OPEN', component.x + component.width/2, component.y + component.height/2 + 15);
                break;
            case 'light':
                this.ctx.fillStyle = component.state.on ? '#ffd43b' : '#868e96';
                this.ctx.fillText(component.state.on ? 'ON' : 'OFF', component.x + component.width/2, component.y + component.height/2 + 15);
                break;
            case 'relay':
                this.ctx.fillStyle = component.state.energized ? '#51cf66' : '#ff6b6b';
                this.ctx.fillText(`${component.state.position}`, component.x + component.width/2, component.y + component.height/2 + 15);
                break;
        }
    }

    drawComponentConnectors(component) {
        const connectors = this.getComponentConnectors(component);
        
        for (const connector of connectors) {
            if (connector.type === 'input') {
                // Filled triangle pointing inward (toward component)
                this.ctx.fillStyle = this.getConnectorColor(connector.voltage);
                this.ctx.beginPath();
                this.ctx.moveTo(connector.x, connector.y);
                this.ctx.lineTo(connector.x - 5, connector.y - 8);
                this.ctx.lineTo(connector.x + 5, connector.y - 8);
                this.ctx.closePath();
                this.ctx.fill();
            } else {
                // Filled triangle pointing outward (away from component)
                // For non-battery components, flip the triangle to point outward
                if (component.type === 'battery') {
                    // Battery output points down (away from component)
                    this.ctx.fillStyle = this.getConnectorColor(connector.voltage);
                    this.ctx.beginPath();
                    this.ctx.moveTo(connector.x, connector.y);
                    this.ctx.lineTo(connector.x - 5, connector.y + 8);
                    this.ctx.lineTo(connector.x + 5, connector.y + 8);
                    this.ctx.closePath();
                    this.ctx.fill();
                } else {
                    // Other components output points up (away from component)
                    this.ctx.fillStyle = this.getConnectorColor(connector.voltage);
                    this.ctx.beginPath();
                    this.ctx.moveTo(connector.x, connector.y);
                    this.ctx.lineTo(connector.x - 5, connector.y - 8);
                    this.ctx.lineTo(connector.x + 5, connector.y - 8);
                    this.ctx.closePath();
                    this.ctx.fill();
                }
            }
        }
    }

    getConnectorColor(voltage) {
        if (voltage === 6) return '#ff6b6b'; // Red for 6V
        if (voltage === 0) return '#4dabf7'; // Blue for 0V
        return '#868e96'; // Gray for no voltage
    }

    drawConnections() {
        for (const connection of this.connections) {
            this.drawManhattanWire(connection);
        }
    }

    drawManhattanWire(connection) {
        // Get current component positions and connector locations
        const fromComponent = this.components.find(c => c.id === connection.from.componentId);
        const toComponent = this.components.find(c => c.id === connection.to.componentId);
        
        if (!fromComponent || !toComponent) return;
        
        const fromConnectors = this.getComponentConnectors(fromComponent);
        const toConnectors = this.getComponentConnectors(toComponent);
        
        const fromConnector = fromConnectors.find(c => c.type === connection.from.connectorType);
        const toConnector = toConnectors.find(c => c.type === connection.to.connectorType);
        
        if (!fromConnector || !toConnector) return;
        
        // Determine wire color based on voltage
        let wireColor = '#868e96'; // Gray for unknown/no voltage
        
        // Check if either connector has a known voltage
        if (fromConnector.voltage !== null) {
            wireColor = this.getConnectorColor(fromConnector.voltage);
        } else if (toConnector.voltage !== null) {
            wireColor = this.getConnectorColor(toConnector.voltage);
        }
        
        this.ctx.strokeStyle = wireColor;
        this.ctx.lineWidth = 2;
        
        // Calculate approach points for 90-degree connections
        const fromApproach = this.getApproachPoint(fromConnector, fromComponent);
        const toApproach = this.getApproachPoint(toConnector, toComponent);
        
        // Draw the wire with 90-degree approach to connectors
        this.ctx.beginPath();
        this.ctx.moveTo(fromConnector.x, fromConnector.y);
        this.ctx.lineTo(fromApproach.x, fromApproach.y);
        this.ctx.lineTo(toApproach.x, toApproach.y);
        this.ctx.lineTo(toConnector.x, toConnector.y);
        this.ctx.stroke();
    }

    getApproachPoint(connector, component) {
        const approachDistance = 15; // Distance from connector to approach point
        
        // Determine which side of the component the connector is on
        const centerX = component.x + component.width / 2;
        const centerY = component.y + component.height / 2;
        
        // Calculate approach direction based on connector position
        if (Math.abs(connector.x - centerX) > Math.abs(connector.y - centerY)) {
            // Connector is on left or right side
            if (connector.x < centerX) {
                // Left side - approach from left
                return { x: connector.x - approachDistance, y: connector.y };
            } else {
                // Right side - approach from right
                return { x: connector.x + approachDistance, y: connector.y };
            }
        } else {
            // Connector is on top or bottom side
            if (connector.y < centerY) {
                // Top side - approach from top
                return { x: connector.x, y: connector.y - approachDistance };
            } else {
                // Bottom side - approach from bottom
                return { x: connector.x, y: connector.y + approachDistance };
            }
        }
    }

    drawConnectionPreview() {
        if (!this.connectingFrom) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;
        
        // Get current position of the starting connector
        const fromComponent = this.connectingFrom.component;
        const fromConnectors = this.getComponentConnectors(fromComponent);
        const fromConnector = fromConnectors.find(c => c.type === this.connectingFrom.connector.type);
        
        if (!fromConnector) return;
        
        // Use voltage-based color for preview wire
        const wireColor = fromConnector.voltage !== null ? 
            this.getConnectorColor(fromConnector.voltage) : '#3498db';
        
        this.ctx.strokeStyle = wireColor;
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([5, 5]);
        
        this.ctx.beginPath();
        this.ctx.moveTo(fromConnector.x, fromConnector.y);
        this.ctx.lineTo(mouseX, mouseY);
        this.ctx.stroke();
        
        this.ctx.setLineDash([]);
    }

    // API for external access
    getComponentVoltage(componentId, connectorType) {
        const component = this.components.find(c => c.id === componentId);
        if (!component) return null;
        
        const connectors = this.getComponentConnectors(component);
        const connector = connectors.find(c => c.type === connectorType);
        return connector ? connector.voltage : null;
    }

    getCircuitData() {
        return {
            components: this.components,
            connections: this.connections
        };
    }

    redoLayout() {
        if (this.components.length === 0) return;
        
        // Create a graph representation of the circuit
        const graph = this.buildCircuitGraph();
        
        // Use a layered layout algorithm
        const positions = this.calculateOptimalPositions(graph);
        
        // Apply the new positions
        this.applyLayoutPositions(positions);
        
        // Redraw the circuit
        this.runSimulation();
        this.draw();
    }

    buildCircuitGraph() {
        const graph = {
            nodes: [],
            edges: []
        };
        
        // Add all components as nodes
        for (const component of this.components) {
            graph.nodes.push({
                id: component.id,
                type: component.type,
                component: component
            });
        }
        
        // Add connections as edges
        for (const connection of this.connections) {
            graph.edges.push({
                from: connection.from.componentId,
                to: connection.to.componentId,
                connection: connection
            });
        }
        
        return graph;
    }

    calculateOptimalPositions(graph) {
        const positions = new Map();
        
        // Use a force-directed layout algorithm to minimize wire crossings
        const nodes = graph.nodes.map(node => ({
            ...node,
            x: Math.random() * (this.canvas.width - 200) + 100,
            y: Math.random() * (this.canvas.height - 200) + 100,
            vx: 0,
            vy: 0
        }));
        
        const edges = graph.edges;
        
        // Force-directed layout parameters
        const repulsionForce = 1000; // Repulsion between nodes
        const attractionForce = 0.1; // Attraction along edges
        const iterations = 100;
        const damping = 0.9;
        
        // Run force-directed layout
        for (let iteration = 0; iteration < iterations; iteration++) {
            // Reset forces
            for (const node of nodes) {
                node.fx = 0;
                node.fy = 0;
            }
            
            // Calculate repulsion forces between all nodes
            for (let i = 0; i < nodes.length; i++) {
                for (let j = i + 1; j < nodes.length; j++) {
                    const nodeA = nodes[i];
                    const nodeB = nodes[j];
                    
                    const dx = nodeB.x - nodeA.x;
                    const dy = nodeB.y - nodeA.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    if (distance > 0) {
                        const force = repulsionForce / (distance * distance);
                        const fx = (dx / distance) * force;
                        const fy = (dy / distance) * force;
                        
                        nodeA.fx -= fx;
                        nodeA.fy -= fy;
                        nodeB.fx += fx;
                        nodeB.fy += fy;
                    }
                }
            }
            
            // Calculate attraction forces along edges
            for (const edge of edges) {
                const nodeA = nodes.find(n => n.id === edge.from);
                const nodeB = nodes.find(n => n.id === edge.to);
                
                if (nodeA && nodeB) {
                    const dx = nodeB.x - nodeA.x;
                    const dy = nodeB.y - nodeA.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    if (distance > 0) {
                        const force = attractionForce * distance;
                        const fx = (dx / distance) * force;
                        const fy = (dy / distance) * force;
                        
                        nodeA.fx += fx;
                        nodeA.fy += fy;
                        nodeB.fx -= fx;
                        nodeB.fy -= fy;
                    }
                }
            }
            
            // Apply forces and update positions
            for (const node of nodes) {
                node.vx = (node.vx + node.fx) * damping;
                node.vy = (node.vy + node.fy) * damping;
                
                node.x += node.vx;
                node.y += node.vy;
                
                // Keep nodes within canvas bounds
                node.x = Math.max(50, Math.min(this.canvas.width - this.componentSize - 50, node.x));
                node.y = Math.max(50, Math.min(this.canvas.height - this.componentSize - 50, node.y));
            }
            
            // Prevent overlaps by applying additional repulsion
            for (let i = 0; i < nodes.length; i++) {
                for (let j = i + 1; j < nodes.length; j++) {
                    const nodeA = nodes[i];
                    const nodeB = nodes[j];
                    
                    const dx = nodeB.x - nodeA.x;
                    const dy = nodeB.y - nodeA.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    const minDistance = 120; // 120px minimum spacing between component centers
                    
                    if (distance < minDistance && distance > 0) {
                        // Push components apart to prevent overlap
                        const pushForce = (minDistance - distance) / distance;
                        const pushX = (dx / distance) * pushForce * 10;
                        const pushY = (dy / distance) * pushForce * 10;
                        
                        nodeA.x -= pushX;
                        nodeA.y -= pushY;
                        nodeB.x += pushX;
                        nodeB.y += pushY;
                        
                        // Keep within bounds after push
                        nodeA.x = Math.max(50, Math.min(this.canvas.width - this.componentSize - 50, nodeA.x));
                        nodeA.y = Math.max(50, Math.min(this.canvas.height - this.componentSize - 50, nodeA.y));
                        nodeB.x = Math.max(50, Math.min(this.canvas.width - this.componentSize - 50, nodeB.x));
                        nodeB.y = Math.max(50, Math.min(this.canvas.height - this.componentSize - 50, nodeB.y));
                    }
                }
            }
        }
        
        // Convert to positions map
        for (const node of nodes) {
            positions.set(node.id, { x: node.x, y: node.y });
        }
        
        return positions;
    }

    applyLayoutPositions(positions) {
        for (const component of this.components) {
            const position = positions.get(component.id);
            if (position) {
                component.x = position.x;
                component.y = position.y;
            }
        }
    }

    toggleComponentState(component) {
        if (component.type === 'switch') {
            component.state.closed = !component.state.closed;
        } else if (component.type === 'relay') {
            component.state.energized = !component.state.energized;
            component.state.position = component.state.energized ? 'B' : 'A';
        }
        
        // Run simulation to update voltages
        this.runSimulation();
        this.draw();
    }

    runSimulation() {
        // Run the circuit simulation
        const result = this.simulator.simulate(this.components, this.connections);
        
        // Update component states from simulation
        for (const [componentId, state] of result.componentStates) {
            const component = this.components.find(c => c.id === componentId);
            if (component) {
                component.state = { ...component.state, ...state };
            }
        }
        
        // Update connector voltages for display
        this.updateConnectorVoltages(result.nodes);
    }

    updateConnectorVoltages(nodes) {
        // Update the voltage values in component connectors for display
        for (const component of this.components) {
            const connectors = this.getComponentConnectors(component);
            for (const connector of connectors) {
                const nodeId = `${component.id}-${connector.type}`;
                connector.voltage = nodes.get(nodeId);
            }
        }
    }

    createConnection(from, to) {
        // Validate connection (input to output or output to input)
        if (from.connector.type === to.connector.type) {
            return "Cannot connect input to input or output to output";
        }

        const connection = {
            id: `conn-${this.connections.length + 1}`,
            from: {
                componentId: from.component.id,
                connectorType: from.connector.type
            },
            to: {
                componentId: to.component.id,
                connectorType: to.connector.type
            }
        };

        this.connections.push(connection);
        
        // Run simulation after adding connection
        this.runSimulation();
        this.draw();
        
        return `Connected ${from.component.label} ${from.connector.type} to ${to.component.label} ${to.connector.type}`;
    }
}
