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
            }
        });

        // Process each wire
        this.wires.forEach(wire => {
            const startComponent = wire.startComponent;
            const endComponent = wire.endComponent;
            
            console.log('Wire connection:', {
                from: startComponent.type,
                to: endComponent.type,
                startVoltage: startComponent.voltage,
                wireVoltage: wire.voltage
            });

            // If this is a connection to a transistor's input
            if (endComponent.type === 'NMOS' || endComponent.type === 'PMOS') {
                // Find which input this wire connects to
                const connectionPoint = wire.endPoint;
                const input = endComponent.inputs.find(input => 
                    input.x === connectionPoint.x && input.y === connectionPoint.y
                );
                
                if (input) {
                    input.voltage = startComponent.voltage;
                    console.log('Updating transistor input:', {
                        transistorType: endComponent.type,
                        inputName: input.name,
                        newVoltage: input.voltage
                    });
                }
            }
        });

        // Update probe readings
        this.components.forEach(component => {
            if (component.type === 'PROBE') {
                const connectedWire = this.wires.find(wire => 
                    wire.endComponent === component || wire.startComponent === component
                );
                if (connectedWire) {
                    component.voltage = connectedWire.voltage;
                    console.log('Probe reading:', component.voltage);
                }
            }
        });
    }
} 