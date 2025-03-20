class CircuitEmulator {
    constructor() {
        this.components = [];
        this.connections = new Map();
        this.componentConnections = new Map();
        this.powerRails = {
            vcc: [1, 14], // Rows 1 and 14 are VCC
            gnd: [2, 13]  // Rows 2 and 13 are GND
        };
    }

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

    // Method to start the emulation
    start() {
        console.log('%c Starting Circuit Emulation', 'color: #4CAF50; font-size: 16px; font-weight: bold;');
        // We'll add actual emulation logic later
    }
}

// Create a global instance
window.circuitEmulator = new CircuitEmulator();

document.getElementById('startEmulation').addEventListener('click', () => {
    // Prepare circuit data for emulator
    const circuitComponents = lines.map(line => ({
        type: line.type,
        start: getPointLabel(line.start),
        end: getPointLabel(line.end),
        transistorConnection: line.transistorConnection
    }));
    // ...
}); 