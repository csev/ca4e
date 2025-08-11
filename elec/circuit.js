class CircuitSimulator {
    constructor() {
        this.nodes = new Map(); // Map of node IDs to voltage values
        this.nodeConnections = new Map(); // Map of node IDs to connected components
        this.componentStates = new Map(); // Map of component IDs to their states
    }

    clear() {
        this.nodes.clear();
        this.nodeConnections.clear();
        this.componentStates.clear();
    }

    // Main simulation method
    simulate(components, connections) {
        this.clear();
        
        // Build node network
        this.buildNodeNetwork(components, connections);
        
        // Initialize voltages from batteries
        this.initializeBatteryVoltages(components);
        
        // Propagate voltages through the circuit
        this.propagateVoltages(components, connections);
        
        // Update component states based on voltages
        this.updateComponentStates(components);
        
        return {
            nodes: this.nodes,
            componentStates: this.componentStates
        };
    }

    buildNodeNetwork(components, connections) {
        // Create nodes for each component connector
        for (const component of components) {
            const connectors = this.getComponentConnectors(component);
            for (const connector of connectors) {
                const nodeId = `${component.id}-${connector.type}`;
                this.nodes.set(nodeId, null);
                this.nodeConnections.set(nodeId, []);
            }
        }

        // Connect nodes based on connections
        for (const connection of connections) {
            const fromNodeId = `${connection.from.componentId}-${connection.from.connectorType}`;
            const toNodeId = `${connection.to.componentId}-${connection.to.connectorType}`;
            
            if (this.nodeConnections.has(fromNodeId) && this.nodeConnections.has(toNodeId)) {
                this.nodeConnections.get(fromNodeId).push(toNodeId);
                this.nodeConnections.get(toNodeId).push(fromNodeId);
            }
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
            connectors.push({
                type: 'input',
                x: x + w/2,
                y: y,
                voltage: null
            });
            connectors.push({
                type: 'output',
                x: x + w/2,
                y: y + h + 8, // Move outside the component boundary
                voltage: null
            });
        }

        return connectors;
    }

    initializeBatteryVoltages(components) {
        for (const component of components) {
            if (component.type === 'battery') {
                const outputNodeId = `${component.id}-output`;
                const inputNodeId = `${component.id}-input`;
                
                this.nodes.set(outputNodeId, 6); // 6V output
                this.nodes.set(inputNodeId, 0);  // 0V input (ground)
            }
        }
    }

    propagateVoltages(components, connections) {
        let changed = true;
        let iterations = 0;
        const maxIterations = 100; // Prevent infinite loops

        while (changed && iterations < maxIterations) {
            changed = false;
            iterations++;

            // Propagate through each connection
            for (const connection of connections) {
                const fromNodeId = `${connection.from.componentId}-${connection.from.connectorType}`;
                const toNodeId = `${connection.to.componentId}-${connection.to.connectorType}`;
                
                const fromVoltage = this.nodes.get(fromNodeId);
                const toVoltage = this.nodes.get(toNodeId);

                // If one node has a voltage and the other doesn't, propagate it
                if (fromVoltage !== null && toVoltage === null) {
                    this.nodes.set(toNodeId, fromVoltage);
                    changed = true;
                } else if (toVoltage !== null && fromVoltage === null) {
                    this.nodes.set(fromNodeId, toVoltage);
                    changed = true;
                }
            }

            // Handle component-specific voltage propagation
            for (const component of components) {
                if (component.type !== 'battery') {
                    changed = this.propagateComponentVoltages(component) || changed;
                }
            }
        }
    }

    propagateComponentVoltages(component) {
        let changed = false;
        const connectors = this.getComponentConnectors(component);
        
        if (component.type === 'switch') {
            // Switch: if closed, propagate voltage from input to output
            if (component.state.closed) {
                const inputNodeId = `${component.id}-input`;
                const outputNodeId = `${component.id}-output`;
                
                const inputVoltage = this.nodes.get(inputNodeId);
                const outputVoltage = this.nodes.get(outputNodeId);
                
                if (inputVoltage !== null && outputVoltage === null) {
                    this.nodes.set(outputNodeId, inputVoltage);
                    changed = true;
                }
            }
        } else if (component.type === 'light') {
            // Light: propagate voltage from input to output if there's voltage
            const inputNodeId = `${component.id}-input`;
            const outputNodeId = `${component.id}-output`;
            
            const inputVoltage = this.nodes.get(inputNodeId);
            const outputVoltage = this.nodes.get(outputNodeId);
            
            if (inputVoltage !== null && outputVoltage === null) {
                this.nodes.set(outputNodeId, inputVoltage);
                changed = true;
            }
        } else if (component.type === 'relay') {
            // Relay: if energized, connect A to B, otherwise A to C
            const inputNodeId = `${component.id}-input`;
            const outputANodeId = `${component.id}-output`;
            const outputBNodeId = `${component.id}-output-b`;
            
            const inputVoltage = this.nodes.get(inputNodeId);
            
            if (component.state.energized) {
                // Connect A to B
                if (inputVoltage !== null) {
                    this.nodes.set(outputANodeId, inputVoltage);
                    this.nodes.set(outputBNodeId, inputVoltage);
                    changed = true;
                }
            } else {
                // Connect A to C (ground)
                if (inputVoltage !== null) {
                    this.nodes.set(outputANodeId, inputVoltage);
                    this.nodes.set(outputBNodeId, 0);
                    changed = true;
                }
            }
        }

        return changed;
    }

    updateComponentStates(components) {
        for (const component of components) {
            if (component.type === 'light') {
                // Light turns on if it has voltage
                const inputNodeId = `${component.id}-input`;
                const voltage = this.nodes.get(inputNodeId);
                component.state.on = voltage !== null && voltage > 0;
                this.componentStates.set(component.id, component.state);
            } else if (component.type === 'switch') {
                // Switch state is controlled by user interaction
                this.componentStates.set(component.id, component.state);
            } else if (component.type === 'relay') {
                // Relay state is controlled by user interaction
                this.componentStates.set(component.id, component.state);
            }
        }
    }

    // Toggle switch state
    toggleSwitch(componentId) {
        const component = this.componentStates.get(componentId);
        if (component && component.hasOwnProperty('closed')) {
            component.closed = !component.closed;
            this.componentStates.set(componentId, component);
            return true;
        }
        return false;
    }

    // Toggle relay state
    toggleRelay(componentId) {
        const component = this.componentStates.get(componentId);
        if (component && component.hasOwnProperty('energized')) {
            component.energized = !component.energized;
            component.position = component.energized ? 'B' : 'A';
            this.componentStates.set(componentId, component);
            return true;
        }
        return false;
    }

    // Get voltage at a specific node
    getNodeVoltage(nodeId) {
        return this.nodes.get(nodeId);
    }

    // Get all node voltages
    getAllNodeVoltages() {
        const result = {};
        for (const [nodeId, voltage] of this.nodes) {
            result[nodeId] = voltage;
        }
        return result;
    }

    // Get component state
    getComponentState(componentId) {
        return this.componentStates.get(componentId);
    }

    // Get all component states
    getAllComponentStates() {
        const result = {};
        for (const [componentId, state] of this.componentStates) {
            result[componentId] = state;
        }
        return result;
    }

    // Check if a circuit is complete (has a path from battery to ground)
    isCircuitComplete(components, connections) {
        // Find all batteries
        const batteries = components.filter(c => c.type === 'battery');
        if (batteries.length === 0) return false;

        // Check if there's a path from any battery output to any battery input
        for (const battery of batteries) {
            const outputNodeId = `${battery.id}-output`;
            const inputNodeId = `${battery.id}-input`;
            
            if (this.hasPath(outputNodeId, inputNodeId)) {
                return true;
            }
        }
        
        return false;
    }

    // Simple path finding using BFS
    hasPath(startNodeId, endNodeId) {
        if (!this.nodeConnections.has(startNodeId) || !this.nodeConnections.has(endNodeId)) {
            return false;
        }

        const visited = new Set();
        const queue = [startNodeId];
        visited.add(startNodeId);

        while (queue.length > 0) {
            const currentNode = queue.shift();
            
            if (currentNode === endNodeId) {
                return true;
            }

            const neighbors = this.nodeConnections.get(currentNode) || [];
            for (const neighbor of neighbors) {
                if (!visited.has(neighbor)) {
                    visited.add(neighbor);
                    queue.push(neighbor);
                }
            }
        }

        return false;
    }

    // Calculate power consumption (simplified)
    calculatePower(components) {
        let totalPower = 0;
        
        for (const component of components) {
            if (component.type === 'light' && component.state.on) {
                // Assume 1W per light when on
                totalPower += 1;
            }
        }
        
        return totalPower;
    }

    // Validate circuit connections
    validateCircuit(components, connections) {
        const errors = [];
        
        // Check for duplicate connections
        const connectionSet = new Set();
        for (const conn of connections) {
            const key = `${conn.from.componentId}-${conn.from.connectorType}-${conn.to.componentId}-${conn.to.connectorType}`;
            const reverseKey = `${conn.to.componentId}-${conn.to.connectorType}-${conn.from.componentId}-${conn.from.connectorType}`;
            
            if (connectionSet.has(key) || connectionSet.has(reverseKey)) {
                errors.push(`Duplicate connection: ${conn.from.componentId} to ${conn.to.componentId}`);
            }
            connectionSet.add(key);
        }
        
        // Check for self-connections
        for (const conn of connections) {
            if (conn.from.componentId === conn.to.componentId) {
                errors.push(`Self-connection: ${conn.from.componentId}`);
            }
        }
        
        // Check for invalid connector types
        for (const conn of connections) {
            if (conn.from.connectorType === conn.to.connectorType) {
                errors.push(`Invalid connection: ${conn.from.connectorType} to ${conn.to.connectorType}`);
            }
        }
        
        return errors;
    }
}
