// Circuit Simulator Module
// Handles all electrical calculations and circuit analysis

// Component characteristics
const LED_CHARACTERISTICS = {
    vf: 2.0,          // Forward voltage drop in volts (typical for red LED)
    minCurrent: 0.001, // Minimum visible current in amperes (1mA)
    maxCurrent: 0.020, // Maximum current in amperes (20mA)
    resistance: 100    // Series resistance after forward voltage drop (ohms)
};

const TRANSISTOR_CHARACTERISTICS = {
    nmos: {
        thresholdRatio: 0.5,  // Threshold as ratio of supply voltage
        onResistance: 1,      // Very low resistance when ON (ohms)
        offResistance: 1e6    // Very high resistance when OFF (mega ohm)
    },
    pmos: {
        thresholdRatio: 0.5,  // Threshold as ratio of supply voltage
        onResistance: 1,
        offResistance: 1e6
    },
    channelLength: 40,  // Visual length of the channel
    gateWidth: 30      // Visual width of the gate
};

class CircuitSimulator {
    constructor(gridCols, gridRows) {
        this.gridCols = gridCols;
        this.gridRows = gridRows;
        this.connections = new Map(); // Map of dot index to set of connected dot indices
        this.switches = new Map(); // Map to track switch states (pressed or not)
        this.transistors = new Map(); // Map to track transistor states (on or off)
        this.voltageSources = new Map(); // Map to track voltage source states (VCC or GND)
        this.nextSwitchId = 0;
        this.nextTransistorId = 0;
        
        // Power supply settings
        this.powerSupplyVoltage = 9; // Default voltage
        this.powerSupplyMode = 'DC'; // 'DC' or 'AC'
        this.powerSupplyFrequency = 1; // Frequency in Hz for AC mode
        this.simulationTime = 0; // Time for AC simulation
        this.lastUpdateTime = Date.now();
        
        // Oscilloscope settings
        this.oscilloscopeProbe = null; // Current probe position
        this.oscilloscopeData = []; // Array to store voltage history
        this.maxDataPoints = 200; // Maximum number of data points to store
    }

    // Initialize electrical connections for the breadboard
    initializeConnections(dots) {
        this.connections.clear();
        
        // Initialize empty sets for each dot
        for (let i = 0; i < dots.length; i++) {
            this.connections.set(i, new Set([i]));
        }
        
        // Connect power rails (rows 0 and 13)
        for (let col = 0; col < this.gridCols - 1; col++) {
            this.connectDots(this.getDotIndex(0, col), this.getDotIndex(0, col + 1));  // Top +
            this.connectDots(this.getDotIndex(this.gridRows - 1, col), this.getDotIndex(this.gridRows - 1, col + 1));  // Bottom +
        }
        
        // Connect ground rails (rows 1 and 12)
        for (let col = 0; col < this.gridCols - 1; col++) {
            this.connectDots(this.getDotIndex(1, col), this.getDotIndex(1, col + 1));  // Top ground
            this.connectDots(this.getDotIndex(this.gridRows - 2, col), this.getDotIndex(this.gridRows - 2, col + 1));  // Bottom ground
        }
        
        // Connect vertical columns in top half (rows a-e: 2-6)
        for (let col = 0; col < this.gridCols; col++) {
            for (let row = 2; row < 7 - 1; row++) {
                this.connectDots(this.getDotIndex(row, col), this.getDotIndex(row + 1, col));
            }
        }
        
        // Connect vertical columns in bottom half (rows f-j: 7-11)
        for (let col = 0; col < this.gridCols; col++) {
            for (let row = 7; row < 12 - 1; row++) {
                this.connectDots(this.getDotIndex(row, col), this.getDotIndex(row + 1, col));
            }
        }
    }

    // Helper function to get dot index from row and column
    getDotIndex(row, col) {
        return row * this.gridCols + col;
    }

    // Helper function to get row and column from dot index
    getRowCol(index) {
        const row = Math.floor(index / this.gridCols);
        const col = index % this.gridCols;
        return { row, col };
    }

    // Connect two dots electrically
    connectDots(index1, index2) {
        // Check if indices are valid
        if (index1 === -1 || index2 === -1) return;
        
        // Get the initial sets
        const set1 = this.connections.get(index1);
        const set2 = this.connections.get(index2);
        
        // If either set doesn't exist, we can't make a connection
        if (!set1 || !set2) return;
        
        // Get row and column for both dots
        const { row: row1, col: col1 } = this.getRowCol(index1);
        const { row: row2, col: col2 } = this.getRowCol(index2);
        
        // Create the merged set
        const mergedSet = new Set([...set1, ...set2]);
        
        // If either dot is in a breadboard row (not power rails), connect all dots in that column
        if ((row1 >= 2 && row1 <= 6) || (row1 >= 7 && row1 <= 11)) {
            // Add all dots in the same column for the first dot
            const startRow = row1 >= 7 ? 7 : 2;
            const endRow = row1 >= 7 ? 11 : 6;
            for (let r = startRow; r <= endRow; r++) {
                const columnDotIndex = this.getDotIndex(r, col1);
                mergedSet.add(columnDotIndex);
                const columnDotSet = this.connections.get(columnDotIndex);
                if (columnDotSet) {
                    for (const dotIndex of columnDotSet) {
                        mergedSet.add(dotIndex);
                    }
                }
            }
        }
        
        if ((row2 >= 2 && row2 <= 6) || (row2 >= 7 && row2 <= 11)) {
            // Add all dots in the same column for the second dot
            const startRow = row2 >= 7 ? 7 : 2;
            const endRow = row2 >= 7 ? 11 : 6;
            for (let r = startRow; r <= endRow; r++) {
                const columnDotIndex = this.getDotIndex(r, col2);
                mergedSet.add(columnDotIndex);
                const columnDotSet = this.connections.get(columnDotIndex);
                if (columnDotSet) {
                    for (const dotIndex of columnDotSet) {
                        mergedSet.add(dotIndex);
                    }
                }
            }
        }
        
        // Update all dots in the merged set to point to the new merged set
        for (const dotIndex of mergedSet) {
            this.connections.set(dotIndex, mergedSet);
        }
    }

    // Check if two dots are electrically connected
    areDotsConnected(dot1, dot2, dots) {
        const index1 = dots.indexOf(dot1);
        const index2 = dots.indexOf(dot2);
        if (index1 === -1 || index2 === -1) return false;
        
        const set1 = this.connections.get(index1);
        return set1.has(index2);
    }

    // Get switch ID
    getSwitchId(startDot, endDot, dots) {
        return `switch_${dots.indexOf(startDot)}_${dots.indexOf(endDot)}`;
    }

    // Set switch state
    setSwitchState(startDot, endDot, pressed, dots) {
        const switchId = this.getSwitchId(startDot, endDot, dots);
        this.switches.set(switchId, { pressed });
    }

    // Get switch state
    getSwitchState(startDot, endDot, dots) {
        const switchId = this.getSwitchId(startDot, endDot, dots);
        return this.switches.get(switchId)?.pressed || false;
    }

    // Set voltage source state
    setVoltageSource(dotIndex, isVcc) {
        const sourceId = `voltage_source_${dotIndex}`;
        this.voltageSources.set(sourceId, { isVcc });
    }

    // Get voltage source state
    getVoltageSource(dotIndex) {
        const sourceId = `voltage_source_${dotIndex}`;
        return this.voltageSources.get(sourceId);
    }

    // Add transistor
    addTransistor(x, y, type) {
        const id = this.nextTransistorId++;
        this.transistors.set(id, {
            x: x,
            y: y,
            type: type,
            conducting: false
        });
        return id;
    }

    // Remove transistor
    removeTransistor(id) {
        this.transistors.delete(id);
    }

    // Get transistor
    getTransistor(id) {
        return this.transistors.get(id);
    }

    // Get all transistors
    getAllTransistors() {
        return this.transistors;
    }

    // Calculate intermediate voltages
    calculateIntermediateVoltages(dots) {
        const voltageMap = new Map();
        
        // First pass: Set power rail and voltage source voltages
        dots.forEach((dot, index) => {
            const row = Math.floor(index / this.gridCols);
            if (row === 0 || row === this.gridRows - 1) {
                voltageMap.set(index, this.getPowerSupplyVoltage());  // VCC rails
            } else if (row === 1 || row === this.gridRows - 2) {
                voltageMap.set(index, 0);  // GND rails
            }
            
            // Check for voltage source
            const sourceId = `voltage_source_${index}`;
            if (this.voltageSources.has(sourceId)) {
                const source = this.voltageSources.get(sourceId);
                voltageMap.set(index, source.isVcc ? this.getPowerSupplyVoltage() : 0);
            }
        });
        
        // Second pass: Propagate voltages through connections
        let iterationCount = 0;
        const MAX_ITERATIONS = 250;
        
        while (iterationCount < MAX_ITERATIONS) {
            iterationCount++;
            let changesThisIteration = 0;
            
            // Handle regular connections
            this.connections.forEach((connectedDots, dotIndex) => {
                if (voltageMap.has(dotIndex)) return;
                
                for (const connectedIndex of connectedDots) {
                    if (voltageMap.has(connectedIndex)) {
                        const oldVoltage = voltageMap.get(dotIndex);
                        const newVoltage = voltageMap.get(connectedIndex);
                        
                        if (oldVoltage !== newVoltage) {
                            voltageMap.set(dotIndex, newVoltage);
                            changesThisIteration++;
                        }
                        break;
                    }
                }
            });
            
            // Handle transistor connections
            this.transistors.forEach((transistor, id) => {
                if (!transistor.conducting) return;
                
                let drainVoltage = null;
                let sourceVoltage = null;
                
                // This would need to be updated based on how transistor connections are stored
                // For now, we'll skip transistor voltage propagation
            });
            
            // If no changes this iteration, we're done
            if (changesThisIteration === 0) {
                break;
            }
        }
        
        return voltageMap;
    }

    // Get dot voltage
    getDotVoltage(dot, dots, voltageMap = null) {
        if (!dot) return null;
        const dotIndex = dots.indexOf(dot);
        if (dotIndex === -1) return null;
        
        // Check if there's a voltage source at this dot
        const sourceId = `voltage_source_${dotIndex}`;
        if (this.voltageSources.has(sourceId)) {
            const source = this.voltageSources.get(sourceId);
            if (source.isVcc) {
                return this.getPowerSupplyVoltage();
            } else {
                return 0; // GND is always 0V
            }
        }
        
        // Get row and column of the dot
        const { row } = this.getRowCol(dotIndex);
        
        // Check power rails first
        if (row === 0 || row === this.gridRows - 1) {
            return this.getPowerSupplyVoltage();  // VCC rails
        }
        if (row === 1 || row === this.gridRows - 2) return 0;  // GND rails
        
        // If a voltage map is provided, use it
        if (voltageMap && voltageMap.has(dotIndex)) {
            return voltageMap.get(dotIndex);
        }
        
        // Check connected dots for power/ground connections
        const connectedDots = this.connections.get(dotIndex);
        if (connectedDots) {
            for (const connectedIndex of connectedDots) {
                const connectedRow = Math.floor(connectedIndex / this.gridCols);
                if (connectedRow === 0 || connectedRow === this.gridRows - 1) {
                    return this.getPowerSupplyVoltage();  // VCC
                }
                if (connectedRow === 1 || connectedRow === this.gridRows - 2) return 0;  // GND
                
                // If voltage map exists, check voltages of connected dots
                if (voltageMap && voltageMap.has(connectedIndex)) {
                    return voltageMap.get(connectedIndex);
                }
            }
        }
        
        return null;
    }

    // Calculate circuit values
    calculateCircuitValues(dots, lines) {
        // Calculate intermediate voltages
        const voltageMap = this.calculateIntermediateVoltages(dots);
        
        // Update transistor states based on gate voltages
        for (const [id, transistor] of this.transistors) {
            let gateVoltage = null;
            
            // Find gate voltage from connected lines
            lines.forEach(line => {
                if (line.transistorConnection && 
                    line.transistorConnection.id === id && 
                    line.transistorConnection.type === 'gate') {
                    const otherEnd = line.start.isTransistorTerminal ? line.end : line.start;
                    gateVoltage = this.getDotVoltage(otherEnd, dots, voltageMap);
                }
            });
            
            // Simple relay-like behavior
            if (gateVoltage !== null) {
                const threshold = this.powerSupplyVoltage * TRANSISTOR_CHARACTERISTICS[transistor.type].thresholdRatio;
                
                if (transistor.type === 'nmos') {
                    // NMOS conducts when gate voltage is HIGH
                    transistor.conducting = gateVoltage >= threshold;
                } else if (transistor.type === 'pmos') {
                    // PMOS conducts when gate voltage is LOW
                    transistor.conducting = gateVoltage <= threshold;
                }
            } else {
                transistor.conducting = false;
            }
        }
        
        // Update all dots with their voltages from the voltage map
        dots.forEach((dot, index) => {
            if (voltageMap.has(index)) {
                dot.voltage = voltageMap.get(index);
            } else {
                // Reset voltage for dots not in the voltage map
                const { row } = this.getRowCol(index);
                if (row === 0 || row === this.gridRows - 1) {
                    dot.voltage = 9;  // VCC rails
                } else if (row === 1 || row === this.gridRows - 2) {
                    dot.voltage = 0;  // GND rails
                } else {
                    dot.voltage = null;  // Reset other dots
                }
            }
        });
        
        return voltageMap;
    }

    // Rebuild all connections based on current lines
    rebuildAllConnections(dots, lines) {
        // First clear all existing connections
        this.initializeConnections(dots);
        
        // Handle regular wire connections first
        lines.forEach(line => {
            if (line.type === 'wire') {
                const startIndex = line.start.isTransistorTerminal ? -1 : dots.indexOf(line.start);
                const endIndex = line.end.isTransistorTerminal ? -1 : dots.indexOf(line.end);
                
                // Only connect if both points are regular dots
                if (startIndex !== -1 && endIndex !== -1) {
                    this.connectDots(startIndex, endIndex);
                }
            }
        });
        
        // Handle switch connections
        lines.forEach(line => {
            if (line.type === 'switch_no' || line.type === 'switch_nc') {
                const startIndex = dots.indexOf(line.start);
                const endIndex = dots.indexOf(line.end);
                
                if (startIndex !== -1 && endIndex !== -1) {
                    const switchId = this.getSwitchId(line.start, line.end, dots);
                    const isPressed = this.switches.get(switchId)?.pressed || false;
                    
                    if (line.type === 'switch_nc' && !isPressed) {
                        this.connectDots(startIndex, endIndex);
                    } else if (line.type === 'switch_no' && isPressed) {
                        this.connectDots(startIndex, endIndex);
                    }
                }
            }
        });
    }

    // Check for short circuit
    isShortCircuit(startDot, endDot, dots) {
        if (!startDot || !endDot) return false;
        
        const startIndex = dots.indexOf(startDot);
        const endIndex = dots.indexOf(endDot);
        if (startIndex === -1 || endIndex === -1) return false;
        
        const startConnections = this.connections.get(startIndex);
        const endConnections = this.connections.get(endIndex);
        if (!startConnections || !endConnections) return false;
        
        // Check if one end is connected to VCC and the other to GND
        const hasStartVcc = Array.from(startConnections).some(i => {
            const row = Math.floor(i / this.gridCols);
            return row === 0 || row === this.gridRows - 1;  // VCC rows
        });
        
        const hasStartGnd = Array.from(startConnections).some(i => {
            const row = Math.floor(i / this.gridCols);
            return row === 1 || row === this.gridRows - 2;  // GND rows
        });
        
        const hasEndVcc = Array.from(endConnections).some(i => {
            const row = Math.floor(i / this.gridCols);
            return row === 0 || row === this.gridRows - 1;  // VCC rows
        });
        
        const hasEndGnd = Array.from(endConnections).some(i => {
            const row = Math.floor(i / this.gridCols);
            return row === 1 || row === this.gridRows - 2;  // GND rows
        });
        
        return (hasStartVcc && hasEndGnd) || (hasStartGnd && hasEndVcc);
    }

    // Get LED characteristics
    getLEDCharacteristics() {
        return LED_CHARACTERISTICS;
    }

    // Get transistor characteristics
    getTransistorCharacteristics() {
        return TRANSISTOR_CHARACTERISTICS;
    }

    // Power supply control methods
    setPowerSupplyVoltage(voltage) {
        this.powerSupplyVoltage = voltage;
    }
    
    setPowerSupplyMode(mode) {
        this.powerSupplyMode = mode;
        if (mode === 'AC') {
            this.simulationTime = 0;
            this.lastUpdateTime = Date.now();
        }
    }
    
    setPowerSupplyFrequency(frequency) {
        this.powerSupplyFrequency = frequency;
    }
    
    getPowerSupplyVoltage() {
        if (this.powerSupplyMode === 'DC') {
            return this.powerSupplyVoltage;
        } else {
            // AC mode - calculate current voltage based on time
            const currentTime = Date.now();
            const deltaTime = (currentTime - this.lastUpdateTime) / 1000; // Convert to seconds
            this.simulationTime += deltaTime;
            this.lastUpdateTime = currentTime;
            
            // Calculate AC voltage using sine wave
            const angularFrequency = 2 * Math.PI * this.powerSupplyFrequency;
            const acVoltage = this.powerSupplyVoltage * Math.sin(angularFrequency * this.simulationTime);
            
            // Ensure voltage doesn't go below 0 for visualization purposes
            return Math.max(0, acVoltage);
        }
    }
    
    // Get the peak voltage for display purposes
    getPeakVoltage() {
        return this.powerSupplyVoltage;
    }
    
    // Get current AC voltage for display (without clamping to 0)
    getCurrentACVoltage() {
        if (this.powerSupplyMode === 'DC') {
            return this.powerSupplyVoltage;
        } else {
            const currentTime = Date.now();
            const deltaTime = (currentTime - this.lastUpdateTime) / 1000;
            this.simulationTime += deltaTime;
            this.lastUpdateTime = currentTime;
            
            const angularFrequency = 2 * Math.PI * this.powerSupplyFrequency;
            return this.powerSupplyVoltage * Math.sin(angularFrequency * this.simulationTime);
        }
    }
    
    // Update simulation time for AC mode
    updateSimulationTime() {
        if (this.powerSupplyMode === 'AC') {
            const currentTime = Date.now();
            const deltaTime = (currentTime - this.lastUpdateTime) / 1000;
            this.simulationTime += deltaTime;
            this.lastUpdateTime = currentTime;
        }
    }
    
    // Oscilloscope methods
    setOscilloscopeProbe(dot) {
        this.oscilloscopeProbe = dot;
        this.oscilloscopeData = []; // Clear data when probe moves
    }
    
    getOscilloscopeProbe() {
        return this.oscilloscopeProbe;
    }
    
    updateOscilloscopeData(dots) {
        if (!this.oscilloscopeProbe) return;
        
        const voltage = this.getDotVoltage(this.oscilloscopeProbe, dots);
        const timestamp = Date.now();
        
        // Add new data point
        this.oscilloscopeData.push({
            voltage: voltage,
            timestamp: timestamp
        });
        
        // Keep only the last maxDataPoints
        if (this.oscilloscopeData.length > this.maxDataPoints) {
            this.oscilloscopeData.shift();
        }
    }
    
    getOscilloscopeData() {
        return this.oscilloscopeData;
    }
    
    getProbeVoltage(dots) {
        if (!this.oscilloscopeProbe) return null;
        return this.getDotVoltage(this.oscilloscopeProbe, dots);
    }
    
    getProbePosition(dots) {
        if (!this.oscilloscopeProbe) return "Not connected";
        
        // Find the dot index and convert to breadboard coordinates
        const dotIndex = dots ? dots.indexOf(this.oscilloscopeProbe) : -1;
        if (dotIndex === -1) return "Unknown";
        
        const { row, col } = this.getRowCol(dotIndex);
        
        // Convert to breadboard notation
        const rowLabels = ['VCC', 'GND', 'a', 'b', 'c', 'd', 'e', 'gap', 'f', 'g', 'h', 'i', 'j', 'GND', 'VCC'];
        const rowLabel = rowLabels[row];
        
        return `${rowLabel}${col + 1}`;
    }
    
    // Color interpolation for voltage visualization
    interpolateColor(voltage) {
        if (voltage === null) return '#333333';  // Default gray for no voltage
        
        const maxVoltage = this.powerSupplyVoltage;
        if (voltage === maxVoltage) return '#ff4444';     // VCC - red
        if (voltage === 0) return '#4444ff';     // GND - blue
        
        // Normalize voltage to 0-1 range
        const t = voltage / maxVoltage;
        
        // RGB components for interpolation
        const r = Math.round(68 + (255 - 68) * t);    // 68 to 255  (from blue to red)
        const g = Math.round(68 + (68 - 68) * t);     // 68 to 68   (keep green low)
        const b = Math.round(255 - (255 - 68) * t);   // 255 to 68  (from blue to red)
        
        return `rgb(${r}, ${g}, ${b})`;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CircuitSimulator;
} else {
    window.CircuitSimulator = CircuitSimulator;
}
