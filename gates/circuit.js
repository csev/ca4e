class Circuit {
    constructor() {
        this.gates = [];
        this.wires = [];
    }

    // Set the circuit layout from the editor
    setLayout(gates, wires) {
        this.gates = gates;
        this.wires = wires;
    }

    // Update all wire values and gate states
    update() {
        // Reset all node source values
        this.gates.forEach(gate => {
            gate.inputNodes.forEach(node => {
                node.sourceValue = undefined;
            });
            gate.outputNodes.forEach(node => {
                node.sourceValue = undefined;
            });
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

        // Process all logic gates
        let changed;
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
        } while (changed); // Continue until no more changes occur

        return this.getCircuitState();
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