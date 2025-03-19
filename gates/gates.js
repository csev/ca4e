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
        this.isUnstable = false; // Add flag for unstable state
        
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
                this.inputNodes = [
                    { x: this.x - 25, y: this.y - 10, value: false, connected: false },
                    { x: this.x - 25, y: this.y + 10, value: false, connected: false }
                ];
                this.outputNodes = [
                    { x: this.x + 20, y: this.y, value: false, hasOutput: false }
                ];
                break;
            case 'NAND':
                this.inputNodes = [
                    { x: this.x - 25, y: this.y - 10, value: false, connected: false },
                    { x: this.x - 25, y: this.y + 10, value: false, connected: false }
                ];
                this.outputNodes = [
                    { x: this.x + 20, y: this.y, value: false, hasOutput: false }
                ];
                break;
            case 'OR':
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
        
        // Draw the NOT circle - adjusted position
        ctx.beginPath();
        ctx.arc(this.x + 20, this.y, 5, 0, Math.PI * 2);
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

        // Add NOT circle - adjusted position
        ctx.beginPath();
        ctx.arc(this.x + 20, this.y, 5, 0, Math.PI * 2);
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

        // Add NOT circle - adjusted position
        ctx.beginPath();
        ctx.arc(this.x + 20, this.y, 5, 0, Math.PI * 2);
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
        // Set fill color based on output state and unstable state
        if (this.isUnstable) {
            ctx.fillStyle = '#888888'; // Grey for unstable gates
        } else if (!hasAllInputs) {
            ctx.fillStyle = '#888888'; // Grey for unknown/unconnected
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
        if (this.isUnstable) {
            ctx.fillText('?', this.x, this.y);
        } else {
            ctx.fillText(hasAllInputs ? (outputValue ? '1' : '0') : '?', this.x, this.y);
        }

        // Draw gate label
        ctx.fillStyle = '#000';
        ctx.font = '12px Arial';
        ctx.fillText(this.label, this.x, this.y - 25);
    }

    // Add method to set label
    setLabel(newLabel) {
        this.label = newLabel || this.type; // If no label provided, use gate type
    }

    // Add method to set unstable state
    setUnstable(unstable) {
        this.isUnstable = unstable;
    }
}

class FullAdder extends Gate {
    constructor(x, y, editor) {
        super('FULL_ADDER', x, y, editor);
        this.label = 'FULL';
        
        // Override input/output nodes for full adder
        this.inputNodes = [
            { x: this.x - 20, y: this.y - 20, value: false, connected: false }, // Cin input (aligned with S)
            { x: this.x - 20, y: this.y, value: false, connected: false },      // A input (aligned with Cout)
            { x: this.x - 20, y: this.y + 20, value: false, connected: false }   // B input (below)
        ];
        this.outputNodes = [
            { x: this.x + 20, y: this.y - 20, value: false, hasOutput: false }, // Sum output
            { x: this.x + 20, y: this.y, value: false, hasOutput: false }       // Carry-out
        ];
    }

    draw(ctx) {
        // Draw full adder body
        ctx.beginPath();
        ctx.strokeStyle = this.selected ? '#ff0000' : '#000000';
        
        // Set fill color based on state
        if (this.isUnstable) {
            ctx.fillStyle = '#888888'; // Grey for unstable
        } else if (!this.inputNodes.every(node => node.connected)) {
            ctx.fillStyle = '#888888'; // Grey for unconnected
        } else {
            ctx.fillStyle = '#ffffff'; // White for normal state
        }
        
        // Draw main body as a rectangle
        ctx.moveTo(this.x - 20, this.y - 35);
        ctx.lineTo(this.x + 20, this.y - 35);
        ctx.lineTo(this.x + 20, this.y + 35);
        ctx.lineTo(this.x - 20, this.y + 35);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Draw input labels
        ctx.fillStyle = '#000';
        ctx.font = '12px Arial';
        ctx.textAlign = 'right';
        ctx.fillText('Cin', this.x - 25, this.y - 20); // Aligned with S
        ctx.fillText('A', this.x - 25, this.y);        // Aligned with Cout
        ctx.fillText('B', this.x - 25, this.y + 20);   // Below

        // Draw output labels
        ctx.textAlign = 'left';
        ctx.fillText('S', this.x + 25, this.y - 20);
        ctx.fillText('Cout', this.x + 25, this.y);

        // Draw component label
        ctx.textAlign = 'center';
        ctx.fillText(this.label, this.x, this.y - 40);

        // Draw input/output nodes
        this.drawNodes(ctx);
    }

    evaluate() {
        // Get input values
        const carryIn = this.inputNodes[0].connected ? this.inputNodes[0].sourceValue : false; // Default to false if not connected
        const inputA = this.inputNodes[1].sourceValue;  // A is second input
        const inputB = this.inputNodes[2].sourceValue;  // B is third input

        // Calculate outputs
        // Sum is XOR of all three inputs
        const sum = (inputA !== inputB) !== carryIn;
        
        // Carry-out is majority function (at least two inputs are 1)
        const carryOut = (inputA && inputB) || (inputB && carryIn) || (inputA && carryIn);

        // Update output nodes
        if (this.outputNodes[0]) this.outputNodes[0].sourceValue = sum;
        if (this.outputNodes[1]) this.outputNodes[1].sourceValue = carryOut;

        return sum; // Return sum as primary output
    }
}

class NixieDisplay extends Gate {
    constructor(x, y, editor) {
        super('NIXIE_DISPLAY', x, y, editor);
        this.label = 'Nixie';
        
        // Override input nodes for nixie display - moved outside the rectangle
        this.inputNodes = [
            { x: this.x - 35, y: this.y - 20, value: false, connected: false }, // 1s place
            { x: this.x - 35, y: this.y, value: false, connected: false },      // 2s place
            { x: this.x - 35, y: this.y + 20, value: false, connected: false }   // 4s place
        ];
        this.outputNodes = []; // No outputs needed for display
    }

    draw(ctx) {
        // Draw display body
        ctx.beginPath();
        ctx.strokeStyle = this.selected ? '#ff0000' : '#000000';
        
        // Set fill color based on state
        if (this.isUnstable) {
            ctx.fillStyle = '#000000'; // Black for unstable
        } else if (!this.inputNodes.every(node => node.connected)) {
            ctx.fillStyle = '#000000'; // Black for unconnected
        } else {
            ctx.fillStyle = '#1a1a2e'; // Dark blue background for normal state
        }
        
        // Draw organic rectangle shape with curved corners
        const radius = 15; // Corner radius
        
        // Start from top-left corner
        ctx.moveTo(this.x - 30 + radius, this.y - 40);
        
        // Top edge
        ctx.lineTo(this.x + 30 - radius, this.y - 40);
        // Top-right corner
        ctx.quadraticCurveTo(this.x + 30, this.y - 40, this.x + 30, this.y - 40 + radius);
        
        // Right edge
        ctx.lineTo(this.x + 30, this.y + 40 - radius);
        // Bottom-right corner
        ctx.quadraticCurveTo(this.x + 30, this.y + 40, this.x + 30 - radius, this.y + 40);
        
        // Bottom edge
        ctx.lineTo(this.x - 30 + radius, this.y + 40);
        // Bottom-left corner
        ctx.quadraticCurveTo(this.x - 30, this.y + 40, this.x - 30, this.y + 40 - radius);
        
        // Left edge
        ctx.lineTo(this.x - 30, this.y - 40 + radius);
        // Top-left corner
        ctx.quadraticCurveTo(this.x - 30, this.y - 40, this.x - 30 + radius, this.y - 40);
        
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Draw input labels - moved outside the rectangle
        ctx.fillStyle = '#000';
        ctx.font = '12px Arial';
        ctx.textAlign = 'right';
        ctx.fillText('1s', this.x - 40, this.y - 20);
        ctx.fillText('2s', this.x - 40, this.y);
        ctx.fillText('4s', this.x - 40, this.y + 20);

        // Draw component label inside the rectangle at the bottom
        ctx.textAlign = 'center';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(this.label, this.x, this.y + 35);

        // Draw input nodes
        this.drawNodes(ctx);

        // Draw the Nixie tube display
        this.drawNixieDisplay(ctx);
    }

    drawNixieDisplay(ctx) {
        // Calculate the octal value from inputs - treat non-connected inputs as zero
        const ones = this.inputNodes[0].connected ? (this.inputNodes[0].sourceValue ? 1 : 0) : 0;
        const twos = this.inputNodes[1].connected ? (this.inputNodes[1].sourceValue ? 2 : 0) : 0;
        const fours = this.inputNodes[2].connected ? (this.inputNodes[2].sourceValue ? 4 : 0) : 0;
        const value = ones + twos + fours;

        // Draw the outer glow for the entire tube
        const outerGlow = ctx.createRadialGradient(
            this.x, this.y - 5, 25,
            this.x, this.y - 5, 40
        );
        outerGlow.addColorStop(0, 'rgba(255, 165, 0, 0.4)');  // Stronger orange glow
        outerGlow.addColorStop(1, 'rgba(255, 165, 0, 0)');    // Fade to transparent
        
        ctx.beginPath();
        ctx.arc(this.x, this.y - 5, 40, 0, Math.PI * 2);
        ctx.fillStyle = outerGlow;
        ctx.fill();

        // Draw the main tube background
        ctx.beginPath();
        ctx.arc(this.x, this.y - 5, 25, 0, Math.PI * 2);
        ctx.fillStyle = '#1a1a2e'; // Darker blue background
        ctx.fill();
        
        // Add glass reflection effect
        const glassGradient = ctx.createRadialGradient(
            this.x - 5, this.y - 10, 0,
            this.x, this.y - 5, 25
        );
        glassGradient.addColorStop(0, 'rgba(255, 255, 255, 0.15)');
        glassGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = glassGradient;
        ctx.fill();
        
        // Draw the tube border
        ctx.strokeStyle = '#34495e';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Draw the glass nipple at the top
        ctx.beginPath();
        ctx.moveTo(this.x - 7, this.y - 40);
        ctx.lineTo(this.x + 7, this.y - 40);
        // Curved transition at the bottom
        ctx.quadraticCurveTo(this.x + 6, this.y - 42, this.x + 4, this.y - 43);
        // Main curved sides
        ctx.quadraticCurveTo(this.x + 4, this.y - 50, this.x, this.y - 55);
        ctx.quadraticCurveTo(this.x - 4, this.y - 50, this.x - 4, this.y - 43);
        // Curved transition at the bottom
        ctx.quadraticCurveTo(this.x - 6, this.y - 42, this.x - 7, this.y - 40);
        ctx.closePath();
        ctx.fillStyle = '#1a1a2e'; // Match the tube body color
        ctx.fill();
        ctx.stroke();

        // Add rounded top cap
        ctx.beginPath();
        ctx.arc(this.x, this.y - 55, 2, 0, Math.PI * 2);
        ctx.fillStyle = '#1a1a2e'; // Match the tube body color
        ctx.fill();
        ctx.stroke();

        // Draw the digit with enhanced glow effect
        ctx.shadowColor = 'rgba(255, 165, 0, 0.8)';
        ctx.shadowBlur = 15;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        
        ctx.fillStyle = '#ffa500'; // Orange color for the digit
        ctx.font = 'bold 32px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(value.toString(), this.x, this.y - 5);
        
        // Reset shadow
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
    }

    evaluate() {
        // Display components don't need to return a value
        return undefined;
    }
} 