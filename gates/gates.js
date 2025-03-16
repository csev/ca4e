class Gate {
    constructor(type, x, y, editor) {
        this.type = type;
        this.x = x;
        this.y = y;
        this.editor = editor;
        this.inputs = [];
        this.outputs = [];
        this.inputNodes = [];
        this.outputNodes = [];
        this.selected = false;
        this.label = type; // Initialize with default label
        
        // Add state for INPUT and OUTPUT types
        if (type === 'INPUT') {
            this.state = false;
        } else if (type === 'OUTPUT') {
            this.state = false;
        }
        
        // Initialize input/output nodes based on gate type
        this.initializeNodes();
    }

    initializeNodes() {
        switch(this.type) {
            case 'AND':
            case 'OR':
            case 'NAND':
            case 'NOR':
            case 'XOR':
                this.inputNodes = [
                    { x: this.x - 20, y: this.y - 10, value: false, connected: false },
                    { x: this.x - 20, y: this.y + 10, value: false, connected: false }
                ];
                this.outputNodes = [
                    { x: this.x + 20, y: this.y, value: false, hasOutput: false }
                ];
                break;
            case 'NOT':
                this.inputNodes = [
                    { x: this.x - 20, y: this.y, value: false, connected: false }
                ];
                this.outputNodes = [
                    { x: this.x + 20, y: this.y, value: false, hasOutput: false }
                ];
                break;
            case 'INPUT':
                this.outputNodes = [
                    { x: this.x + 20, y: this.y, value: false, hasOutput: false }
                ];
                break;
            case 'OUTPUT':
                this.inputNodes = [
                    { x: this.x - 20, y: this.y, value: false, connected: false }
                ];
                break;
        }
    }

    draw(ctx) {
        // Gate body
        ctx.beginPath();
        ctx.strokeStyle = this.selected ? '#ff0000' : '#000000';
        ctx.fillStyle = '#ffffff';
        
        // Draw different shapes based on gate type
        switch(this.type) {
            case 'AND':
                this.drawAND(ctx);
                break;
            case 'OR':
                this.drawOR(ctx);
                break;
            case 'NOT':
                this.drawNOT(ctx);
                break;
            case 'NAND':
                this.drawNAND(ctx);
                break;
            case 'NOR':
                this.drawNOR(ctx);
                break;
            case 'XOR':
                this.drawXOR(ctx);
                break;
            case 'INPUT':
            case 'OUTPUT':
                this.drawIO(ctx);
                break;
        }

        // Draw input/output nodes
        this.drawNodes(ctx);
    }

    drawNodes(ctx) {
        // Draw input nodes
        this.inputNodes.forEach(node => {
            ctx.beginPath();
            ctx.arc(node.x, node.y, 5, 0, Math.PI * 2);
            
            // Determine node color based on state
            let isHovered = this.editor?.hoveredNode?.node === node;
            
            if (isHovered) {
                ctx.fillStyle = '#2196F3'; // Blue when hovered
            } else if (node.connected) {
                ctx.fillStyle = '#4CAF50'; // Green when connected
            } else {
                ctx.fillStyle = '#000000'; // Black when disconnected
            }
            
            ctx.fill();
            
            // Draw hover effect
            if (isHovered) {
                ctx.beginPath();
                ctx.arc(node.x, node.y, 8, 0, Math.PI * 2);
                ctx.strokeStyle = '#2196F3';
                ctx.stroke();
                
                // Show connection type tooltip
                ctx.fillStyle = '#000000';
                ctx.font = '12px Arial';
                ctx.fillText('Input', node.x, node.y - 15);
            }
        });

        // Draw output nodes
        this.outputNodes.forEach(node => {
            ctx.beginPath();
            ctx.arc(node.x, node.y, 5, 0, Math.PI * 2);
            
            // Determine node color based on state
            let isHovered = this.editor?.hoveredNode?.node === node;
            
            if (isHovered) {
                ctx.fillStyle = '#2196F3'; // Blue when hovered
            } else if (node.hasOutput) {
                ctx.fillStyle = '#4CAF50'; // Green when connected
            } else {
                ctx.fillStyle = '#000000'; // Black when disconnected
            }
            
            ctx.fill();
            
            // Draw hover effect
            if (isHovered) {
                ctx.beginPath();
                ctx.arc(node.x, node.y, 8, 0, Math.PI * 2);
                ctx.strokeStyle = '#2196F3';
                ctx.stroke();
                
                // Show connection type tooltip
                ctx.fillStyle = '#000000';
                ctx.font = '12px Arial';
                ctx.fillText('Output', node.x, node.y - 15);
            }
        });
    }

    drawAND(ctx) {
        const inputValues = this.inputNodes.map(node => node.sourceValue);
        const hasAllInputs = inputValues.every(val => val !== undefined);
        const outputValue = this.evaluate();

        this.drawGate(ctx, (ctx) => {
            ctx.moveTo(this.x - 20, this.y - 20);
            ctx.lineTo(this.x, this.y - 20);
            ctx.arc(this.x, this.y, 20, -Math.PI/2, Math.PI/2);
            ctx.lineTo(this.x - 20, this.y + 20);
            ctx.closePath();
        }, outputValue, hasAllInputs);
    }

    drawOR(ctx) {
        const inputValues = this.inputNodes.map(node => node.sourceValue);
        const hasAllInputs = inputValues.every(val => val !== undefined);
        const outputValue = this.evaluate();

        this.drawGate(ctx, (ctx) => {
            ctx.moveTo(this.x - 20, this.y - 20);
            ctx.quadraticCurveTo(this.x, this.y - 20, this.x + 20, this.y);
            ctx.quadraticCurveTo(this.x, this.y + 20, this.x - 20, this.y + 20);
            ctx.quadraticCurveTo(this.x - 10, this.y, this.x - 20, this.y - 20);
        }, outputValue, hasAllInputs);
    }

    drawNOT(ctx) {
        // Get the output value
        const inputNode = this.inputNodes[0];
        const hasInput = inputNode && inputNode.sourceValue !== undefined;
        const outputValue = hasInput ? !inputNode.sourceValue : undefined;

        // Draw NOT triangle
        ctx.beginPath();
        ctx.moveTo(this.x - 20, this.y - 20);
        ctx.lineTo(this.x + 10, this.y);
        ctx.lineTo(this.x - 20, this.y + 20);
        ctx.closePath();
        
        // Color based on output state
        if (hasInput) {
            ctx.fillStyle = outputValue ? '#4CAF50' : '#f44336'; // Green for 1, Red for 0
        } else {
            ctx.fillStyle = '#888888'; // Gray for unknown/unconnected
        }
        ctx.fill();
        ctx.strokeStyle = '#000';
        ctx.stroke();
        
        // Draw the NOT circle
        ctx.beginPath();
        ctx.arc(this.x + 15, this.y, 5, 0, Math.PI * 2);
        ctx.stroke();
        
        // Draw value in center of triangle (moved 5px left)
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        if (hasInput) {
            ctx.fillText(outputValue ? '1' : '0', this.x - 10, this.y); // Changed from x-5 to x-10
        } else {
            ctx.fillText('?', this.x - 10, this.y); // Changed from x-5 to x-10
        }
        
        // Draw gate label
        ctx.fillStyle = '#000';
        ctx.font = '12px Arial';
        ctx.fillText('NOT', this.x, this.y - 25);
    }

    drawNAND(ctx) {
        const inputValues = this.inputNodes.map(node => node.sourceValue);
        const hasAllInputs = inputValues.every(val => val !== undefined);
        const outputValue = this.evaluate();

        this.drawGate(ctx, (ctx) => {
            ctx.moveTo(this.x - 20, this.y - 20);
            ctx.lineTo(this.x, this.y - 20);
            ctx.arc(this.x, this.y, 20, -Math.PI/2, Math.PI/2);
            ctx.lineTo(this.x - 20, this.y + 20);
            ctx.closePath();
        }, outputValue, hasAllInputs);

        // Add NOT circle
        ctx.beginPath();
        ctx.arc(this.x + 25, this.y, 5, 0, Math.PI * 2);
        ctx.stroke();
    }

    drawNOR(ctx) {
        const inputValues = this.inputNodes.map(node => node.sourceValue);
        const hasAllInputs = inputValues.every(val => val !== undefined);
        const outputValue = this.evaluate();

        this.drawGate(ctx, (ctx) => {
            ctx.moveTo(this.x - 20, this.y - 20);
            ctx.quadraticCurveTo(this.x, this.y - 20, this.x + 20, this.y);
            ctx.quadraticCurveTo(this.x, this.y + 20, this.x - 20, this.y + 20);
            ctx.quadraticCurveTo(this.x - 10, this.y, this.x - 20, this.y - 20);
        }, outputValue, hasAllInputs);

        // Add NOT circle
        ctx.beginPath();
        ctx.arc(this.x + 25, this.y, 5, 0, Math.PI * 2);
        ctx.stroke();
    }

    drawXOR(ctx) {
        const inputValues = this.inputNodes.map(node => node.sourceValue);
        const hasAllInputs = inputValues.every(val => val !== undefined);
        const outputValue = this.evaluate();

        this.drawGate(ctx, (ctx) => {
            ctx.moveTo(this.x - 20, this.y - 20);
            ctx.quadraticCurveTo(this.x, this.y - 20, this.x + 20, this.y);
            ctx.quadraticCurveTo(this.x, this.y + 20, this.x - 20, this.y + 20);
            ctx.quadraticCurveTo(this.x - 10, this.y, this.x - 20, this.y - 20);
        }, outputValue, hasAllInputs);

        // Add extra curve for XOR
        ctx.beginPath();
        ctx.moveTo(this.x - 25, this.y - 20);
        ctx.quadraticCurveTo(this.x - 15, this.y, this.x - 25, this.y + 20);
        ctx.stroke();
    }

    drawIO(ctx) {
        if (this.type === 'INPUT') {
            // Draw main circle
            ctx.beginPath();
            ctx.arc(this.x, this.y, 15, 0, Math.PI * 2);
            ctx.fillStyle = this.state ? '#4CAF50' : '#f44336';
            ctx.fill();
            ctx.strokeStyle = '#000';
            ctx.stroke();

            // Draw value text
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 14px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(this.state ? '1' : '0', this.x, this.y);

            // Draw label above (changed from "INPUT")
            ctx.fillStyle = '#000';
            ctx.font = '12px Arial';
            ctx.fillText(this.label, this.x, this.y - 25);
        } else if (this.type === 'OUTPUT') {
            // Get input value from connected wire
            const inputNode = this.inputNodes[0];
            const hasValue = inputNode && inputNode.sourceValue !== undefined;
            const value = hasValue ? inputNode.sourceValue : false;

            // Draw main circle
            ctx.beginPath();
            ctx.arc(this.x, this.y, 15, 0, Math.PI * 2);
            
            if (hasValue) {
                ctx.fillStyle = value ? '#4CAF50' : '#f44336';
            } else {
                ctx.fillStyle = '#888888';
            }
            ctx.fill();
            ctx.strokeStyle = '#000';
            ctx.stroke();

            // Draw value text
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 14px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            if (hasValue) {
                ctx.fillText(value ? '1' : '0', this.x, this.y);
            } else {
                ctx.fillText('?', this.x, this.y);
            }

            // Draw label above (changed from "OUTPUT")
            ctx.fillStyle = '#000';
            ctx.font = '12px Arial';
            ctx.fillText(this.label, this.x, this.y - 25);
        }
    }

    isInput() {
        return this.type === 'INPUT';
    }

    isOutput() {
        return this.type === 'OUTPUT';
    }

    // Check if a node can accept more connections
    canAcceptConnection(node, isInput) {
        if (isInput) {
            return this.inputNodes.includes(node) && !node.connected;
        } else {
            return this.outputNodes.includes(node) && !node.hasOutput;
        }
    }

    // Update node states when connected
    connectNode(node, isInput) {
        if (isInput) {
            node.connected = true;
        } else {
            node.hasOutput = true;
        }
    }

    // Update node states when disconnected
    disconnectNode(node, isInput) {
        if (isInput) {
            node.connected = false;
        } else {
            node.hasOutput = false;
        }
    }

    // Add method to toggle input state
    toggleInput() {
        if (this.type === 'INPUT') {
            this.state = !this.state;
            // Update output node value
            if (this.outputNodes.length > 0) {
                this.outputNodes[0].value = this.state;
            }
            return true; // Return true if toggle was successful
        }
        return false; // Return false if not an input
    }

    // Add method to evaluate gate output
    evaluate() {
        let outputValue;

        switch(this.type) {
            case 'AND':
                const inputValues = this.inputNodes.map(node => node.sourceValue);
                outputValue = inputValues.every(val => val === true);
                break;
            case 'OR':
                outputValue = this.inputNodes.map(node => node.sourceValue).some(val => val === true);
                break;
            case 'NOT':
                outputValue = this.inputNodes[0]?.sourceValue !== undefined ? !this.inputNodes[0].sourceValue : undefined;
                break;
            case 'NAND':
                outputValue = !this.inputNodes.map(node => node.sourceValue).every(val => val === true);
                break;
            case 'NOR':
                outputValue = !this.inputNodes.map(node => node.sourceValue).some(val => val === true);
                break;
            case 'XOR':
                const xorInputs = this.inputNodes.map(node => node.sourceValue);
                outputValue = xorInputs.reduce((a, b) => a !== b);
                break;
            case 'INPUT':
                outputValue = this.state;
                break;
        }

        // Update output node value
        if (this.outputNodes[0]) {
            this.outputNodes[0].sourceValue = outputValue;
        }
        return outputValue;
    }

    drawGate(ctx, shape, outputValue, hasAllInputs) {
        // Set fill color based on output state
        if (!hasAllInputs) {
            ctx.fillStyle = '#888888'; // Gray for unknown/unconnected
        } else {
            ctx.fillStyle = outputValue ? '#4CAF50' : '#f44336'; // Green for 1, Red for 0
        }
        
        // Draw gate shape
        ctx.beginPath();
        shape(ctx); // Call the provided shape drawing function
        ctx.fill();
        ctx.strokeStyle = '#000';
        ctx.stroke();

        // Draw state value in center
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(hasAllInputs ? (outputValue ? '1' : '0') : '?', this.x, this.y);

        // Draw gate label
        ctx.fillStyle = '#000';
        ctx.font = '12px Arial';
        ctx.fillText(this.type, this.x, this.y - 25);
    }

    // Add method to set label
    setLabel(newLabel) {
        this.label = newLabel || this.type; // If no label provided, use gate type
    }
} 