class CircuitEmulator {
    constructor() {
        this.components = [];
        this.connections = new Map();
        this.componentConnections = new Map();
        this.powerRails = {
            vcc: [1, 14], // Rows 1 and 14 are VCC
            gnd: [2, 13]  // Rows 2 and 13 are GND
        };
        this.voltages = new Map(); // Store voltages at each point
        this.currents = new Map(); // Store currents through components
        this.componentStates = new Map(); // Store component states (e.g., LED on/off, switch state)
        this.shortCircuits = new Set(); // Track components involved in short circuits
    }

    // Component characteristics
    static COMPONENT_CHARACTERISTICS = {
        resistor_1k: { resistance: 1000 },
        resistor_10k: { resistance: 10000 },
        led: {
            forwardVoltage: 2.0,
            maxCurrent: 0.020,
            internalResistance: 200
        },
        transistor: {
            vbesat: 0.7,  // Base-emitter saturation voltage
            beta: 100     // Current gain
        }
    };

    // Parse point label into row and column
    parsePoint(point) {
        // Remove parentheses and split by comma
        const [col, row] = point.slice(1, -1).split(',').map(n => parseInt(n.trim()));
        return { row, col };
    }

    // Check if a point is in a power rail
    isPowerRail(point) {
        const { row } = this.parsePoint(point);
        if (this.powerRails.vcc.includes(row)) return 'vcc';
        if (this.powerRails.gnd.includes(row)) return 'gnd';
        return null;
    }

    // Check if two points are in the same vertical column of the breadboard
    areVerticallyConnected(point1, point2) {
        const p1 = this.parsePoint(point1);
        const p2 = this.parsePoint(point2);

        // Same column
        if (p1.col !== p2.col) return false;

        // Check if both points are in the top half (rows 3-7)
        const inTopHalf = (row) => row >= 3 && row <= 7;
        // Check if both points are in the bottom half (rows 8-12)
        const inBottomHalf = (row) => row >= 8 && row <= 12;

        return (inTopHalf(p1.row) && inTopHalf(p2.row)) || 
               (inBottomHalf(p1.row) && inBottomHalf(p2.row));
    }

    // Initialize the emulator with circuit data
    loadCircuit(components, connections) {
        this.components = components;
        this.connections = connections;
        this.analyzeConnections();
        this.calculateCircuitState();
    }

    // Calculate voltage at a point
    calculatePointVoltage(point) {
        const rail = this.isPowerRail(point);
        if (rail === 'vcc') return 9.0;  // VCC voltage
        if (rail === 'gnd') return 0.0;  // Ground voltage

        // Get connected components
        const connectedComponents = this.getConnectedComponents(point);
        if (connectedComponents.length === 0) return null;

        // If any connected component has a known voltage, use that
        for (const comp of connectedComponents) {
            const voltage = this.voltages.get(comp.id);
            if (voltage !== undefined) return voltage;
        }

        return null;
    }

    // Get all components connected to a point
    getConnectedComponents(point) {
        const connected = [];
        this.components.forEach(comp => {
            if (comp.start === point || comp.end === point) {
                connected.push(comp);
            }
        });
        return connected;
    }

    // Calculate current through a component
    calculateComponentCurrent(component) {
        const startVoltage = this.calculatePointVoltage(component.start);
        const endVoltage = this.calculatePointVoltage(component.end);
        
        if (startVoltage === null || endVoltage === null) return 0;

        const voltageDiff = Math.abs(startVoltage - endVoltage);

        switch (component.type) {
            case 'resistor_1k':
            case 'resistor_10k':
                return voltageDiff / CircuitEmulator.COMPONENT_CHARACTERISTICS[component.type].resistance;
            
            case 'led':
                const ledChar = CircuitEmulator.COMPONENT_CHARACTERISTICS.led;
                if (voltageDiff < ledChar.forwardVoltage) return 0;
                return (voltageDiff - ledChar.forwardVoltage) / ledChar.internalResistance;
            
            case 'wire':
                return 0; // Wires have negligible resistance
            
            default:
                return 0;
        }
    }

    // Calculate transistor state
    calculateTransistorState(transistor) {
        if (!transistor.connections) return { conducting: false, baseCurrent: 0, collectorCurrent: 0 };

        const baseVoltage = this.calculatePointVoltage(transistor.connections.base);
        const emitterVoltage = this.calculatePointVoltage(transistor.connections.emitter);
        const collectorVoltage = this.calculatePointVoltage(transistor.connections.collector);

        if (baseVoltage === null || emitterVoltage === null || collectorVoltage === null) {
            return { conducting: false, baseCurrent: 0, collectorCurrent: 0 };
        }

        const vbe = baseVoltage - emitterVoltage;
        const conducting = vbe >= CircuitEmulator.COMPONENT_CHARACTERISTICS.transistor.vbesat;

        if (conducting) {
            const baseCurrent = (vbe - CircuitEmulator.COMPONENT_CHARACTERISTICS.transistor.vbesat) / 1000; // Assuming 1kΩ base resistor
            const collectorCurrent = baseCurrent * CircuitEmulator.COMPONENT_CHARACTERISTICS.transistor.beta;
            return { conducting: true, baseCurrent, collectorCurrent };
        }

        return { conducting: false, baseCurrent: 0, collectorCurrent: 0 };
    }

    // Check for short circuit between two points
    isShortCircuit(point1, point2) {
        const rail1 = this.isPowerRail(point1);
        const rail2 = this.isPowerRail(point2);
        
        // Short circuit if one point is VCC and the other is GND
        return (rail1 === 'vcc' && rail2 === 'gnd') || (rail1 === 'gnd' && rail2 === 'vcc');
    }

    // Check if a component creates a short circuit
    checkComponentShortCircuit(component) {
        if (component.type === 'wire') {
            return this.isShortCircuit(component.start, component.end);
        }
        return false;
    }

    // Calculate the state of the entire circuit
    calculateCircuitState() {
        // Reset all states
        this.voltages.clear();
        this.currents.clear();
        this.componentStates.clear();
        this.shortCircuits.clear();

        // First pass: Set power rail voltages and check for short circuits
        this.components.forEach(comp => {
            const startRail = this.isPowerRail(comp.start);
            const endRail = this.isPowerRail(comp.end);
            
            // Check for short circuits
            if (this.checkComponentShortCircuit(comp)) {
                this.shortCircuits.add(comp.id);
                console.warn(`%c Short Circuit Detected! Component ${comp.id} creates a direct connection between power rails.`, 
                    'color: #ff0000; font-weight: bold;');
            }
            
            // Set power rail voltages
            if (startRail === 'vcc') this.voltages.set(comp.start, 9.0);
            if (startRail === 'gnd') this.voltages.set(comp.start, 0.0);
            if (endRail === 'vcc') this.voltages.set(comp.end, 9.0);
            if (endRail === 'gnd') this.voltages.set(comp.end, 0.0);
        });

        // Second pass: Calculate component currents and states
        this.components.forEach(comp => {
            if (this.shortCircuits.has(comp.id)) {
                // Skip current calculations for short-circuited components
                this.currents.set(comp.id, 0);
                return;
            }

            if (comp.type === 'transistor') {
                const state = this.calculateTransistorState(comp);
                this.componentStates.set(comp.id, state);
                
                if (state.conducting && comp.connections.collector && comp.connections.emitter) {
                    // Connect collector and emitter when transistor is conducting
                    this.voltages.set(comp.connections.emitter, this.voltages.get(comp.connections.collector));
                }
            } else {
                const current = this.calculateComponentCurrent(comp);
                this.currents.set(comp.id, current);
                
                // Update component state
                if (comp.type === 'led') {
                    this.componentStates.set(comp.id, {
                        on: current >= 0.001, // LED is on if current >= 1mA
                        current: current
                    });
                }
            }
        });

        // Third pass: Calculate intermediate voltages
        let changed;
        do {
            changed = false;
            this.components.forEach(comp => {
                if (this.shortCircuits.has(comp.id)) return; // Skip short-circuited components
                
                if (comp.type === 'wire') {
                    const startVoltage = this.voltages.get(comp.start);
                    const endVoltage = this.voltages.get(comp.end);
                    
                    if (startVoltage !== undefined && endVoltage === undefined) {
                        this.voltages.set(comp.end, startVoltage);
                        changed = true;
                    } else if (endVoltage !== undefined && startVoltage === undefined) {
                        this.voltages.set(comp.start, endVoltage);
                        changed = true;
                    }
                }
            });
        } while (changed);
    }

    // Method to start the emulation
    start() {
        console.log('%c Starting Circuit Emulation', 'color: #4CAF50; font-size: 16px; font-weight: bold;');
        this.calculateCircuitState();
        this.logCircuitState();
    }

    // Log the current state of the circuit
    logCircuitState() {
        console.log('%c Circuit State:', 'color: #2196F3; font-weight: bold;');
        
        // Log short circuits first
        if (this.shortCircuits.size > 0) {
            console.log('%c WARNING: Short Circuits Detected!', 'color: #ff0000; font-weight: bold;');
            this.shortCircuits.forEach(compId => {
                const comp = this.components.find(c => c.id === compId);
                console.log(`  Short Circuit: ${compId} (${comp.type}) between ${comp.start} and ${comp.end}`);
            });
            console.log('------------------------');
        }
        
        // Log voltages
        console.log('\nVoltages:');
        this.voltages.forEach((voltage, point) => {
            console.log(`  ${point}: ${voltage.toFixed(2)}V`);
        });

        // Log currents
        console.log('\nCurrents:');
        this.currents.forEach((current, compId) => {
            const comp = this.components.find(c => c.id === compId);
            if (this.shortCircuits.has(compId)) {
                console.log(`  ${compId} (${comp.type}): SHORT CIRCUIT`);
            } else {
                console.log(`  ${compId} (${comp.type}): ${(current * 1000).toFixed(2)}mA`);
            }
        });

        // Log component states
        console.log('\nComponent States:');
        this.componentStates.forEach((state, compId) => {
            const comp = this.components.find(c => c.id === compId);
            if (this.shortCircuits.has(compId)) {
                console.log(`  ${compId} (${comp.type}): SHORT CIRCUIT`);
            } else if (comp.type === 'transistor') {
                console.log(`  ${compId} (Transistor): ${state.conducting ? 'ON' : 'OFF'}`);
                console.log(`    Base Current: ${(state.baseCurrent * 1000).toFixed(2)}mA`);
                console.log(`    Collector Current: ${(state.collectorCurrent * 1000).toFixed(2)}mA`);
            } else if (comp.type === 'led') {
                console.log(`  ${compId} (LED): ${state.on ? 'ON' : 'OFF'}`);
                console.log(`    Current: ${(state.current * 1000).toFixed(2)}mA`);
            }
        });
    }

    // Analyze connections between components
    analyzeConnections() {
        console.log('%c Circuit Analysis Results', 'color: #4CAF50; font-size: 16px; font-weight: bold;');
        console.log('------------------------');
        
        // Create a map to store component connections
        const connectionMap = new Map();

        // Helper function to add a connection to the map
        const addConnection = (comp1, comp2, points) => {
            if (!connectionMap.has(comp1.id)) {
                connectionMap.set(comp1.id, new Set());
            }
            connectionMap.get(comp1.id).add({
                component: comp2,
                points: points
            });
        };

        // First, log all components
        console.log('%c Components in Circuit:', 'color: #2196F3; font-weight: bold;');
        this.components.forEach((comp, index) => {
            comp.id = comp.id || `comp_${index}`;
            console.log(`  ${comp.id}: ${comp.type}`);
            console.log(`    Start: ${comp.start}`);
            console.log(`    End: ${comp.end}`);
        });
        console.log('------------------------');

        // Analyze each component's connections
        this.components.forEach((comp1) => {
            this.components.forEach((comp2) => {
                if (comp1 === comp2) return;

                // Check connections between components
                const connections = [];

                // Check start points
                if (this.areVerticallyConnected(comp1.start, comp2.start)) {
                    connections.push({ from: comp1.start, to: comp2.start });
                }
                if (this.areVerticallyConnected(comp1.start, comp2.end)) {
                    connections.push({ from: comp1.start, to: comp2.end });
                }
                if (this.areVerticallyConnected(comp1.end, comp2.start)) {
                    connections.push({ from: comp1.end, to: comp2.start });
                }
                if (this.areVerticallyConnected(comp1.end, comp2.end)) {
                    connections.push({ from: comp1.end, to: comp2.end });
                }

                // If there are connections, add them to the map
                if (connections.length > 0) {
                    addConnection(comp1, comp2, connections);
                }
            });
        });

        this.componentConnections = connectionMap;

        // Log power rail connections
        console.log('%c Power Rail Connections:', 'color: #FF5722; font-weight: bold;');
        this.components.forEach((comp) => {
            const startRail = this.isPowerRail(comp.start);
            const endRail = this.isPowerRail(comp.end);

            if (startRail) {
                console.log(`  ${comp.id} (${comp.type}): ${startRail.toUpperCase()} at ${comp.start}`);
            }
            if (endRail) {
                console.log(`  ${comp.id} (${comp.type}): ${endRail.toUpperCase()} at ${comp.end}`);
            }
        });
        console.log('------------------------');

        // Log vertical connections
        console.log('%c Vertical Connections:', 'color: #9C27B0; font-weight: bold;');
        this.componentConnections.forEach((connections, compId) => {
            const comp = this.components.find(c => c.id === compId);
            console.log(`\n  Component ${compId} (${comp.type}):`);
            connections.forEach(conn => {
                console.log(`    Connected to: ${conn.component.id} (${conn.component.type})`);
                conn.points.forEach(point => {
                    console.log(`      ${point.from} ↔ ${point.to}`);
                });
            });
        });
        console.log('------------------------');

        // Log a summary
        console.log('%c Circuit Summary:', 'color: #795548; font-weight: bold;');
        console.log(`  Total Components: ${this.components.length}`);
        console.log(`  Total Connections: ${Array.from(this.componentConnections.values()).reduce((acc, set) => acc + set.size, 0)}`);
        console.log('------------------------');
    }
}

// Create a global instance
window.circuitEmulator = new CircuitEmulator();

// Remove the startEmulation event listener since it's no longer needed
// document.getElementById('startEmulation').addEventListener('click', () => {
//     // Prepare circuit data for emulator
//     const circuitComponents = lines.map(line => ({
//         type: line.type,
//         start: getPointLabel(line.start),
//         end: getPointLabel(line.end),
//         transistorConnection: line.transistorConnection
//     }));
//     // ...
// }); 