class Circuit {
    constructor(messageDisplay) {
        this.gates = [];
        this.wires = [];
        this.maxIterations = 100; // Maximum number of iterations to prevent infinite loops
        this.showMessage = messageDisplay || (() => {}); // Default to no-op if no message display provided
    }

    // Set the circuit layout from the editor
    setLayout(gates, wires) {
        this.gates = gates;
        this.wires = wires;
    }

    // Update all wire values and gate states
    update() {
        // Reset all node source values and unstable states
        this.gates.forEach(gate => {
            gate.inputNodes.forEach(node => {
                node.sourceValue = undefined;
            });
            gate.outputNodes.forEach(node => {
                node.sourceValue = undefined;
            });
            gate.setUnstable(false); // Reset unstable state
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

        // Process all logic gates with iteration limit
        let iteration = 0;
        let changed;
        let lastState = this.getCircuitState();

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

            // Check if circuit has stabilized
            const currentState = this.getCircuitState();
            if (this.areStatesEqual(lastState, currentState)) {
                changed = false; // Circuit has stabilized
            }
            lastState = currentState;

            iteration++;
            if (iteration >= this.maxIterations) {
                // Track gates that change in additional iterations
                const unstableGates = new Set();
                const additionalIterations = 10;
                
                // Run additional iterations and track changes
                for (let i = 0; i < additionalIterations; i++) {
                    this.gates.forEach(gate => {
                        if (gate.type !== 'INPUT' && gate.type !== 'OUTPUT') {
                            const oldValue = gate.outputNodes[0]?.sourceValue;
                            const newValue = gate.evaluate();
                            if (oldValue !== newValue) {
                                console.log('Gate', gate.label, 'changed in additional iteration', i + 1);
                                unstableGates.add(gate);
                            }
                        }
                    });
                    
                    // Propagate values through wires
                    this.wires.forEach(wire => {
                        wire.end.sourceValue = wire.start.sourceValue;
                    });
                }
                
                // Log unstable gates
                console.log('Unstable gates:', unstableGates);
                
                // Mark unstable gates
                unstableGates.forEach(gate => {
                    gate.setUnstable(true);
                    if (gate.outputNodes[0]) {
                        gate.outputNodes[0].sourceValue = undefined;
                    }
                });
                
                break;
            }
        } while (changed); // Continue until no more changes occur or max iterations reached

        return this.getCircuitState();
    }

    // Compare two circuit states to check for stabilization
    areStatesEqual(state1, state2) {
        if (state1.gates.length !== state2.gates.length) return false;
        if (state1.wires.length !== state2.wires.length) return false;

        for (let i = 0; i < state1.gates.length; i++) {
            const gate1 = state1.gates[i];
            const gate2 = state2.gates[i];
            if (gate1.type !== gate2.type) return false;
            if (gate1.label !== gate2.label) return false;
            if (!this.arraysEqual(gate1.inputs, gate2.inputs)) return false;
            if (!this.arraysEqual(gate1.outputs, gate2.outputs)) return false;
        }

        for (let i = 0; i < state1.wires.length; i++) {
            const wire1 = state1.wires[i];
            const wire2 = state2.wires[i];
            if (wire1.start !== wire2.start) return false;
            if (wire1.end !== wire2.end) return false;
        }

        return true;
    }

    // Helper function to compare arrays
    arraysEqual(arr1, arr2) {
        if (arr1.length !== arr2.length) return false;
        for (let i = 0; i < arr1.length; i++) {
            if (arr1[i] !== arr2[i]) return false;
        }
        return true;
    }

    // Get the current state of the circuit
    getCircuitState() {
        const state = {
            gates: this.gates.map(gate => ({
                type: gate.type,
                label: gate.label,
                inputs: gate.inputNodes.map(n => n.sourceValue),
                outputs: gate.outputNodes.map(n => n.sourceValue)
            })),
            wires: this.wires.map(wire => ({
                start: wire.start.sourceValue,
                end: wire.end.sourceValue
            }))
        };
        return state;
    }

    // Log the current circuit state
    logState() {
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