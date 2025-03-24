class Circuit {
    constructor() {
        this.components = [];
        this.wires = [];
        this.maxIterations = 100;
        this.convergenceThreshold = 0.1; // Voltage difference threshold for convergence
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
        // Keep VDD and GND bars, remove everything else
        this.components = this.components.filter(component => 
            component.type === 'VDD_BAR' || component.type === 'GND_BAR'
        );
        this.wires = [];
    }

    fullRecompute() {
        console.log('Starting full recomputation');
        
        // Reset ALL voltages except VDD/GND bars
        this.components.forEach(component => {
            if (component.type !== 'VDD_BAR' && component.type !== 'GND_BAR') {
                // Reset component voltage
                component.voltage = 0;
                
                // Reset all connection points
                if (component.inputs) {
                    component.inputs.forEach(input => {
                        input.voltage = 0;
                    });
                }
                if (component.outputs) {
                    component.outputs.forEach(output => {
                        output.voltage = 0;
                    });
                }
            }
        });

        // Reset all wire voltages
        this.wires.forEach(wire => {
            wire.voltage = 0;
        });

        // Restore switch states
        this.components.forEach(component => {
            if (component.type === 'SWITCH') {
                component.voltage = component.isOn ? Component.VDD_VOLTAGE : 0;
                if (component.outputs && component.outputs.length > 0) {
                    component.outputs[0].voltage = component.voltage;
                }
            }
        });

        // Run simulation
        this.simulate();
    }

    simulate() {
        console.log('Starting circuit simulation');
        
        // Reset all voltages except sources and switches
        this.components.forEach(component => {
            if (component.type !== 'VDD' && 
                component.type !== 'GND' && 
                component.type !== 'SWITCH' &&
                component.type !== 'VDD_BAR') {
                component.voltage = 0;
                // Only reset drain and source, preserve gate voltage
                if (component.inputs) {
                    component.inputs.forEach(input => {
                        if (input.name === 'drain' || input.name === 'source') {
                            input.voltage = 0;
                        }
                    });
                }
            }
        });

        // Propagate voltages through the circuit
        for (let i = 0; i < this.maxIterations; i++) {
            let changed = false;
            
            // First pass: Propagate voltages from sources through wires
            for (const wire of this.wires) {
                const startComponent = wire.startComponent;
                const endComponent = wire.endComponent;
                
                // Handle voltage sources (VDD_BAR and Switch)
                if (startComponent.type === 'VDD_BAR' || startComponent.type === 'SWITCH') {
                    const sourceVoltage = startComponent.voltage;
                    wire.voltage = sourceVoltage;
                    
                    // Update the endpoint
                    if (endComponent.type === 'NMOS' || endComponent.type === 'PMOS') {
                        const input = endComponent.inputs.find(input => 
                            input.x === wire.endPoint.x && input.y === wire.endPoint.y
                        );
                        if (input && input.voltage !== sourceVoltage) {
                            input.voltage = sourceVoltage;
                            changed = true;
                            console.log(`Updated ${endComponent.type} ${input.name} to ${sourceVoltage}V`);
                        }
                    } else if (endComponent.voltage !== sourceVoltage) {
                        endComponent.voltage = sourceVoltage;
                        changed = true;
                    }
                }

                // Handle transistor outputs
                if (startComponent.type === 'NMOS' || startComponent.type === 'PMOS') {
                    const output = startComponent.inputs.find(input => 
                        input.x === wire.startPoint.x && input.y === wire.startPoint.y
                    );
                    if (output && output.voltage !== wire.voltage) {
                        wire.voltage = output.voltage;
                        if (endComponent.type === 'NMOS' || endComponent.type === 'PMOS') {
                            const input = endComponent.inputs.find(input => 
                                input.x === wire.endPoint.x && input.y === wire.endPoint.y
                            );
                            if (input) {
                                input.voltage = output.voltage;
                                changed = true;
                            }
                        } else {
                            endComponent.voltage = output.voltage;
                            changed = true;
                        }
                    }
                }
            }

            // Second pass: Update transistor states and propagate through conducting channels
            this.components.forEach(component => {
                if (component.type === 'NMOS' || component.type === 'PMOS') {
                    const gate = component.inputs.find(input => input.name === 'gate');
                    const drain = component.inputs.find(input => input.name === 'drain');
                    const source = component.inputs.find(input => input.name === 'source');
                    
                    // Check if transistor is conducting
                    const isNMOS = component.type === 'NMOS';
                    const conducting = isNMOS ? 
                        gate.voltage >= 2.5 :  // NMOS conducts when gate is high
                        gate.voltage < 2.5;    // PMOS conducts when gate is low

                    console.log(`${component.type} state:`, {
                        gate: gate.voltage,
                        drain: drain.voltage,
                        source: source.voltage,
                        conducting
                    });

                    // If conducting, propagate drain voltage to source
                    if (conducting && drain.voltage !== source.voltage) {
                        source.voltage = drain.voltage;
                        changed = true;
                        
                        // Update any wires connected to the source
                        this.wires.forEach(wire => {
                            if (wire.startComponent === component && 
                                wire.startPoint.x === source.x && 
                                wire.startPoint.y === source.y) {
                                wire.voltage = source.voltage;
                                wire.endComponent.voltage = source.voltage;
                                changed = true;
                            }
                        });
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
                    component.voltage = connectedWire.voltage;
                    console.log('Probe update:', {
                        wireVoltage: connectedWire.voltage,
                        probeVoltage: component.voltage
                    });
                }
            }
        });
    }

    getOutputVoltage(component, point) {
        if (!component) return null;

        // Handle voltage sources
        if (component.type === 'VDD_BAR') return Component.VDD_VOLTAGE;
        if (component.type === 'GND_BAR') return 0;
        if (component.type === 'SWITCH') return component.voltage;

        // Handle transistors
        if (component.type === 'NMOS' || component.type === 'PMOS') {
            const matchingInput = component.inputs.find(input => 
                input.x === point.x && input.y === point.y
            );
            if (matchingInput) return matchingInput.voltage;
        }

        return component.voltage;
    }

    applyVoltageToComponent(component, point, voltage) {
        if (!component) return;

        // Find matching input/output point
        if (component.inputs) {
            const input = component.inputs.find(input => 
                input.x === point.x && input.y === point.y
            );
            if (input) input.voltage = voltage;
        }
        if (component.outputs) {
            const output = component.outputs.find(output => 
                output.x === point.x && output.y === point.y
            );
            if (output) output.voltage = voltage;
        }

        // Update component voltage if necessary
        if (component.type !== 'VDD_BAR' && 
            component.type !== 'GND_BAR' && 
            component.type !== 'SWITCH') {
            component.voltage = voltage;
        }
    }
} 