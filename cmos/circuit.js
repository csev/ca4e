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
        console.log('Starting circuit simulation');
        
        // Reset all voltages except sources and switches
        this.components.forEach(component => {
            if (component.type !== 'VDD' && 
                component.type !== 'GND' && 
                component.type !== 'SWITCH' &&
                component.type !== 'VDD_BAR') {
                component.voltage = 0;
                // Reset transistor input voltages except gate
                if (component.inputs) {
                    component.inputs.forEach(input => {
                        if (input.name !== 'gate') {
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
            }

            // Second pass: Handle transistor conduction
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
                    if (conducting) {
                        if (source.voltage !== drain.voltage) {
                            source.voltage = drain.voltage;
                            component.voltage = drain.voltage; // Update component voltage too
                            changed = true;
                            console.log(`${component.type} conducting: D->S = ${drain.voltage}V`);
                            
                            // Update any wires connected to the source
                            this.wires.forEach(wire => {
                                if (wire.startComponent === component && 
                                    wire.startPoint.x === source.x && 
                                    wire.startPoint.y === source.y) {
                                    wire.voltage = source.voltage;
                                    wire.endComponent.voltage = source.voltage;
                                    changed = true;
                                    console.log(`Updated wire and connected component to ${source.voltage}V`);
                                }
                            });
                        }
                    }
                }
            });

            // Third pass: Update components connected to transistor outputs
            this.wires.forEach(wire => {
                const startComponent = wire.startComponent;
                const endComponent = wire.endComponent;

                if (startComponent.type === 'NMOS' || startComponent.type === 'PMOS') {
                    const sourcePin = startComponent.inputs.find(input => 
                        input.name === 'source' &&
                        input.x === wire.startPoint.x &&
                        input.y === wire.startPoint.y
                    );
                    
                    if (sourcePin && wire.voltage !== sourcePin.voltage) {
                        wire.voltage = sourcePin.voltage;
                        endComponent.voltage = sourcePin.voltage;
                        changed = true;
                        console.log(`Updated component connected to ${startComponent.type} source: ${sourcePin.voltage}V`);
                    }
                }
            });

            if (!changed) break;
        }

        // Final pass: Update probe readings
        this.components.forEach(component => {
            if (component.type === 'PROBE') {
                const connectedWire = this.wires.find(wire => 
                    wire.endComponent === component || wire.startComponent === component
                );
                if (connectedWire) {
                    const sourceComponent = wire.startComponent === component ? 
                        wire.endComponent : wire.startComponent;
                    component.voltage = connectedWire.voltage;
                    console.log('Probe update:', {
                        sourceComponent: sourceComponent.type,
                        wireVoltage: connectedWire.voltage,
                        probeVoltage: component.voltage
                    });
                }
            }
        });

        // Log component states for debugging
        this.components.forEach(component => {
            console.log(`Component ${component.type} state:`, {
                voltage: component.voltage,
                inputs: component.inputs ? component.inputs.map(i => ({
                    name: i.name,
                    voltage: i.voltage
                })) : 'no inputs',
                outputs: component.outputs ? component.outputs.map(o => ({
                    voltage: o.voltage
                })) : 'no outputs'
            });
        });
    }
} 