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
                
                // Handle voltage sources and transistor connections
                if (startComponent.type === 'VDD_BAR' || 
                    startComponent.type === 'SWITCH' || 
                    startComponent.type === 'NMOS' || 
                    startComponent.type === 'PMOS') {
                    
                    let sourceVoltage;
                    if (startComponent.type === 'VDD_BAR' || startComponent.type === 'SWITCH') {
                        sourceVoltage = startComponent.voltage;
                    } else {
                        // For transistors, get the specific pin voltage
                        const output = startComponent.inputs.find(input => 
                            input.x === wire.startPoint.x && input.y === wire.startPoint.y
                        );
                        sourceVoltage = output ? output.voltage : null;
                    }

                    if (sourceVoltage !== null) {
                        wire.voltage = sourceVoltage;
                        
                        // Update the endpoint
                        if (endComponent.type === 'NMOS' || endComponent.type === 'PMOS') {
                            const input = endComponent.inputs.find(input => 
                                input.x === wire.endPoint.x && input.y === wire.endPoint.y
                            );
                            if (input && input.voltage !== sourceVoltage) {
                                input.voltage = sourceVoltage;
                                changed = true;
                            }
                        } else if (endComponent.type === 'PROBE') {
                            if (endComponent.voltage !== sourceVoltage) {
                                endComponent.voltage = sourceVoltage;
                                endComponent.inputs[0].voltage = sourceVoltage;
                                endComponent.outputs[0].voltage = sourceVoltage; // Propagate to output
                                changed = true;
                            }
                        } else if (endComponent.voltage !== sourceVoltage) {
                            endComponent.voltage = sourceVoltage;
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
                    
                    const isNMOS = component.type === 'NMOS';
                    const conducting = isNMOS ? 
                        gate.voltage >= 2.5 : 
                        gate.voltage < 2.5;

                    if (conducting && drain.voltage !== source.voltage) {
                        source.voltage = drain.voltage;
                        changed = true;
                        
                        // Update any wires and components connected to the source
                        this.wires.forEach(wire => {
                            if (wire.startComponent === component && 
                                wire.startPoint.x === source.x && 
                                wire.startPoint.y === source.y) {
                                wire.voltage = source.voltage;
                                
                                // Update connected component
                                if (wire.endComponent.type === 'PROBE') {
                                    wire.endComponent.voltage = source.voltage;
                                    wire.endComponent.inputs[0].voltage = source.voltage;
                                    wire.endComponent.outputs[0].voltage = source.voltage;
                                } else {
                                    wire.endComponent.voltage = source.voltage;
                                }
                                changed = true;
                            }
                        });
                    }
                }
            });

            // Third pass: Propagate probe outputs
            this.components.forEach(component => {
                if (component.type === 'PROBE' && component.outputs[0].voltage !== null) {
                    this.wires.forEach(wire => {
                        if (wire.startComponent === component) {
                            wire.voltage = component.outputs[0].voltage;
                            if (wire.endComponent) {
                                if (wire.endComponent.type === 'NMOS' || 
                                    wire.endComponent.type === 'PMOS') {
                                    const input = wire.endComponent.inputs.find(input => 
                                        input.x === wire.endPoint.x && 
                                        input.y === wire.endPoint.y
                                    );
                                    if (input) {
                                        input.voltage = wire.voltage;
                                        changed = true;
                                    }
                                } else {
                                    wire.endComponent.voltage = wire.voltage;
                                    changed = true;
                                }
                            }
                        }
                    });
                }
            });

            if (!changed) break;
        }
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