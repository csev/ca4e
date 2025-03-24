class Circuit {
    constructor() {
        this.components = [];
        this.wires = [];
        this.maxIterations = 100;
    }

    addComponent(component) {
        this.components.push(component);
    }

    removeComponent(component) {
        const index = this.components.indexOf(component);
        if (index > -1) {
            this.components.splice(index, 1);
            // Remove associated wires
            this.wires = this.wires.filter(wire => 
                wire.startComponent !== component && wire.endComponent !== component
            );
        }
    }

    addWire(wire) {
        this.wires.push(wire);
    }

    removeWire(wire) {
        const index = this.wires.indexOf(wire);
        if (index > -1) {
            this.wires.splice(index, 1);
        }
    }

    clear() {
        this.components = [];
        this.wires = [];
    }

    // Basic voltage propagation (to be expanded)
    simulate() {
        // Reset all voltages except sources and switches
        this.components.forEach(component => {
            if (component.type !== 'VDD' && 
                component.type !== 'GND' && 
                component.type !== 'SWITCH' &&
                component.type !== 'VDD_BAR') {
                component.voltage = 0;
            }
        });

        // Ensure VDD_BAR voltage is set
        this.components.forEach(component => {
            if (component.type === 'VDD_BAR') {
                component.voltage = Component.VDD_VOLTAGE;
                component.outputs.forEach(output => {
                    output.voltage = Component.VDD_VOLTAGE;
                });
            }
        });

        // Propagate voltages through the circuit
        for (let i = 0; i < this.maxIterations; i++) {
            let changed = false;
            
            // Process each wire
            this.wires.forEach(wire => {
                const startComponent = wire.startComponent;
                const endComponent = wire.endComponent;
                
                // Special handling for VDD_BAR connections
                if (startComponent.type === 'VDD_BAR') {
                    wire.voltage = Component.VDD_VOLTAGE;
                    if (endComponent.voltage !== Component.VDD_VOLTAGE) {
                        endComponent.voltage = Component.VDD_VOLTAGE;
                        changed = true;
                    }
                    return;
                }
                
                // Handle other components
                if (typeof startComponent.voltage === 'number') {
                    wire.voltage = startComponent.voltage;
                    if (endComponent.voltage !== startComponent.voltage) {
                        endComponent.voltage = startComponent.voltage;
                        changed = true;
                    }
                }
            });

            if (!changed) break;
        }

        // Update probe readings
        this.components.forEach(component => {
            if (component.type === 'PROBE') {
                const connectedWire = this.wires.find(wire => 
                    wire.endComponent === component || wire.startComponent === component
                );
                if (connectedWire) {
                    // Set probe voltage from wire
                    component.voltage = connectedWire.voltage;
                    // Also update the probe's inputs
                    if (component.inputs && component.inputs.length > 0) {
                        component.inputs[0].voltage = connectedWire.voltage;
                    }
                }
            }
        });
    }
} 