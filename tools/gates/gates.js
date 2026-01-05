class Gate {
    static twoInputSquareVeritcalOffset = 15;
    static squareFont = '12px Arial';
    static squareLabelOffset = 7;
    constructor(type, x, y, editor) {
        this.type = type;
        this._x = x;  // Use private variable
        this._y = y;  // Use private variable
        this.editor = editor;
        this.inputs = [];
        this.outputs = [];
        this.inputNodes = [];
        this.outputNodes = [];
        this.selected = false;
        this.label = type; // We'll update this when the ordinal is set
        this.isUnstable = false; // Add flag for unstable state
        
        // Add state for INPUT and OUTPUT types
        if (type === 'INPUT' || type === 'OUTPUT') {
            this.state = false;
        }
        
        // Initialize input/output nodes based on gate type
        this.initializeNodes();
    }

    initializeNodes() {
        switch(this.type) {
            case 'AND':
                this.inputNodes = [
                    { x: this._x - 25, y: this._y - 10, value: false, connected: false },
                    { x: this._x - 25, y: this._y + 10, value: false, connected: false }
                ];
                this.outputNodes = [
                    { x: this._x + 20, y: this._y, value: false, hasOutput: false }
                ];
                break;
            case 'NAND':
                this.inputNodes = [
                    { x: this._x - 25, y: this._y - 10, value: false, connected: false },
                    { x: this._x - 25, y: this._y + 10, value: false, connected: false }
                ];
                this.outputNodes = [
                    { x: this._x + 20, y: this._y, value: false, hasOutput: false }
                ];
                break;
            case 'OR':
            case 'NOR':
            case 'XOR':
                this.inputNodes = [
                    { x: this._x - 20, y: this._y - 10, value: false, connected: false },
                    { x: this._x - 20, y: this._y + 10, value: false, connected: false }
                ];
                this.outputNodes = [
                    { x: this._x + 20, y: this._y, value: false, hasOutput: false }
                ];
                break;
            case 'NOT':
                this.inputNodes = [
                    { x: this._x - 27, y: this._y, value: false, connected: false }
                ];
                this.outputNodes = [
                    { x: this._x + 27, y: this._y, value: false, hasOutput: false }
                ];
                break;
            case 'INPUT':
                this.outputNodes = [
                    { x: this._x + 20, y: this._y, value: false, hasOutput: false }
                ];
                break;
            case 'OUTPUT':
                this.inputNodes = [
                    { x: this._x - 20, y: this._y, value: false, connected: false }
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
                ctx.font = Gate.squareFont;
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
                ctx.font = Gate.squareFont;
                ctx.fillText('Output', node.x, node.y - 15);
            }
        });
    }

    drawAND(ctx) {
        const inputValues = this.inputNodes.map(node => node.sourceValue);
        const hasAllInputs = inputValues.every(val => val !== undefined);
        const outputValue = this.evaluate();

        this.drawGate(ctx, (ctx) => {
            ctx.moveTo(this._x - 20, this._y - 20);
            ctx.lineTo(this._x, this._y - 20);
            ctx.arc(this._x, this._y, 20, -Math.PI/2, Math.PI/2);
            ctx.lineTo(this._x - 20, this._y + 20);
            ctx.closePath();
        }, outputValue, hasAllInputs);
    }

    drawOR(ctx) {
        const inputValues = this.inputNodes.map(node => node.sourceValue);
        const hasAllInputs = inputValues.every(val => val !== undefined);
        const outputValue = this.evaluate();

        this.drawGate(ctx, (ctx) => {
            ctx.moveTo(this._x - 20, this._y - 20);
            ctx.quadraticCurveTo(this._x, this._y - 20, this._x + 20, this._y);
            ctx.quadraticCurveTo(this._x, this._y + 20, this._x - 20, this._y + 20);
            ctx.quadraticCurveTo(this._x - 10, this._y, this._x - 20, this._y - 20);
        }, outputValue, hasAllInputs);
    }

    drawNOT(ctx) {
        // Get the output value
        const inputNode = this.inputNodes[0];
        const hasInput = inputNode && inputNode.sourceValue !== undefined;
        const outputValue = hasInput ? !inputNode.sourceValue : undefined;

        // Draw NOT triangle
        ctx.beginPath();
        ctx.moveTo(this._x - 20, this._y - 20);
        ctx.lineTo(this._x + 20, this._y);
        ctx.lineTo(this._x - 20, this._y + 20);
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
        ctx.arc(this._x + 25, this._y, 3, 0, Math.PI * 2);
        ctx.stroke();
        
        // Draw value in center of triangle
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        if (hasInput) {
            ctx.fillText(outputValue ? '1' : '0', this._x - 5, this._y);
        } else {
            ctx.fillText('?', this._x - 5, this._y);
        }
        
        // Draw gate label
        ctx.fillStyle = '#000';
        ctx.font = Gate.squareFont;
        ctx.fillText(this.label, this._x, this._y - 25);
    }

    drawNAND(ctx) {
        const inputValues = this.inputNodes.map(node => node.sourceValue);
        const hasAllInputs = inputValues.every(val => val !== undefined);
        const outputValue = this.evaluate();

        this.drawGate(ctx, (ctx) => {
            ctx.moveTo(this._x - 20, this._y - 20);
            ctx.lineTo(this._x, this._y - 20);
            ctx.arc(this._x, this._y, 20, -Math.PI/2, Math.PI/2);
            ctx.lineTo(this._x - 20, this._y + 20);
            ctx.closePath();
        }, outputValue, hasAllInputs);

        // Add NOT circle - adjusted position
        ctx.beginPath();
        ctx.arc(this._x + 20, this._y, 5, 0, Math.PI * 2);
        ctx.stroke();
    }

    drawNOR(ctx) {
        const inputValues = this.inputNodes.map(node => node.sourceValue);
        const hasAllInputs = inputValues.every(val => val !== undefined);
        const outputValue = this.evaluate();

        this.drawGate(ctx, (ctx) => {
            ctx.moveTo(this._x - 20, this._y - 20);
            ctx.quadraticCurveTo(this._x, this._y - 20, this._x + 20, this._y);
            ctx.quadraticCurveTo(this._x, this._y + 20, this._x - 20, this._y + 20);
            ctx.quadraticCurveTo(this._x - 10, this._y, this._x - 20, this._y - 20);
        }, outputValue, hasAllInputs);

        // Add NOT circle - adjusted position
        ctx.beginPath();
        ctx.arc(this._x + 20, this._y, 5, 0, Math.PI * 2);
        ctx.stroke();
    }

    drawXOR(ctx) {
        const inputValues = this.inputNodes.map(node => node.sourceValue);
        const hasAllInputs = inputValues.every(val => val !== undefined);
        const outputValue = this.evaluate();

        this.drawGate(ctx, (ctx) => {
            ctx.moveTo(this._x - 20, this._y - 20);
            ctx.quadraticCurveTo(this._x, this._y - 20, this._x + 20, this._y);
            ctx.quadraticCurveTo(this._x, this._y + 20, this._x - 20, this._y + 20);
            ctx.quadraticCurveTo(this._x - 10, this._y, this._x - 20, this._y - 20);
        }, outputValue, hasAllInputs);

        // Add extra curve for XOR
        ctx.beginPath();
        ctx.moveTo(this._x - 25, this._y - 20);
        ctx.quadraticCurveTo(this._x - 15, this._y, this._x - 25, this._y + 20);
        ctx.stroke();
    }

    drawIO(ctx) {
        if (this.type === 'INPUT') {
            // Draw main circle
            ctx.beginPath();
            ctx.arc(this._x, this._y, 15, 0, Math.PI * 2);
            ctx.fillStyle = this.state ? '#4CAF50' : '#f44336';
            ctx.fill();
            ctx.strokeStyle = '#000';
            ctx.stroke();

            // Draw value text
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 14px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(this.state ? '1' : '0', this._x, this._y);

            // Draw label above (changed from "INPUT")
            ctx.fillStyle = '#000';
            ctx.font = Gate.squareFont;
            ctx.fillText(this.label, this._x, this._y - 25);
        } else if (this.type === 'OUTPUT') {
            // Get input value from connected wire
            const inputNode = this.inputNodes[0];
            const hasValue = inputNode && inputNode.sourceValue !== undefined;
            const value = hasValue ? inputNode.sourceValue : false;

            // Draw main circle
            ctx.beginPath();
            ctx.arc(this._x, this._y, 15, 0, Math.PI * 2);
            
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
                ctx.fillText(value ? '1' : '0', this._x, this._y);
            } else {
                ctx.fillText('?', this._x, this._y);
            }

            // Draw label above (changed from "OUTPUT")
            ctx.fillStyle = '#000';
            ctx.font = Gate.squareFont;
            ctx.fillText(this.label, this._x, this._y - 25);
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
            ctx.fillText('?', this._x, this._y);
        } else {
            ctx.fillText(hasAllInputs ? (outputValue ? '1' : '0') : '?', this._x, this._y);
        }

        // Draw gate label
        ctx.fillStyle = '#000';
        ctx.font = Gate.squareFont;
        ctx.fillText(this.label, this._x, this._y - 25);
    }

    // Add method to set label
    setLabel(newLabel) {
        this.label = newLabel || this.type; // If no label provided, use gate type
    }

    // Add method to set unstable state
    setUnstable(unstable) {
        this.isUnstable = unstable;
    }

    // Add getter/setter for x
    get x() {
        return this._x;
    }

    set x(value) {
        const dx = value - this._x;
        this._x = value;
        
        // Update all node positions
        this.inputNodes.forEach(node => {
            node.x += dx;
        });
        this.outputNodes.forEach(node => {
            node.x += dx;
        });
    }

    // Add getter/setter for y
    get y() {
        return this._y;
    }

    set y(value) {
        const dy = value - this._y;
        this._y = value;
        
        // Update all node positions
        this.inputNodes.forEach(node => {
            node.y += dy;
        });
        this.outputNodes.forEach(node => {
            node.y += dy;
        });
    }

    // Add default updateConnectionPoints method
    updateConnectionPoints() {
        if (this.type === 'OR' || this.type === 'NOR' || this.type === 'XOR') {
            // Update input nodes for curved gates
            this.inputNodes[0].x = this.x - 20;
            this.inputNodes[0].y = this.y - 10;
            this.inputNodes[1].x = this.x - 20;
            this.inputNodes[1].y = this.y + 10;
            
            // Update output nodes
            this.outputNodes[0].x = this.x + 20;
            this.outputNodes[0].y = this.y;
        } else {
            // Default implementation for other gates
            this.initializeNodes();
        }
    }

    // Add method to update label with ordinal
    updateLabelWithOrdinal() {
        if (!this.ordinal) return;
        
        let ordinalDisplay = '';
        if (this.ordinal <= 9) {
            ordinalDisplay = this.ordinal.toString();
        } else if (this.ordinal <= 35) {
            // Convert 10-35 to A-Z
            ordinalDisplay = String.fromCharCode(65 + (this.ordinal - 10));
        }
        
        // Only append ordinal if it's 35 or less
        if (this.ordinal <= 35) {
            this.label = `${this.label}${ordinalDisplay}`;
        } else {
            this.label = this.label;
        }
    }
}

class FullAdder extends Gate {
    constructor(x, y, editor) {
        super('FULL_ADDER', x, y, editor);
        this.label = 'FULL';
        
        // Override input/output nodes for full adder
        this.inputNodes = [
            { x: this.x - 25, y: this.y - 20, value: false, connected: false }, // Cin input (aligned with S)
            { x: this.x - 25, y: this.y, value: false, connected: false },      // A input (aligned with Cout)
            { x: this.x - 25, y: this.y + 20, value: false, connected: false }   // B input (below)
        ];
        this.outputNodes = [
            { x: this.x + 25, y: this.y - 20, value: false, hasOutput: false }, // Sum output
            { x: this.x + 25, y: this.y, value: false, hasOutput: false }       // Carry-out
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
        ctx.font = Gate.squareFont;
        ctx.textAlign = 'right';
        ctx.fillText('CIN', this.x - 35, this.y - 17); // Aligned with SUM
        ctx.fillText('A', this.x - 35, this.y + 3);        // Aligned with COUT
        ctx.fillText('B', this.x - 35, this.y + 23);   // Below

        // Draw output labels
        ctx.textAlign = 'left';
        ctx.fillText('SUM', this.x + 35, this.y - 17);
        ctx.fillText('COUT', this.x + 35, this.y + 3);

        // Draw component label
        ctx.textAlign = 'center';
        ctx.fillText(this.label, this.x, this.y - 40);

        // Draw input/output nodes
        this.drawNodes(ctx);
    }

    evaluate() {
        // Get input values
        const carryIn = this.inputNodes[0].sourceValue;
        const inputA = this.inputNodes[1].sourceValue;
        const inputB = this.inputNodes[2].sourceValue;

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
            { x: this.x - 37, y: this.y - 19, value: false, connected: false }, // 1s place
            { x: this.x - 37, y: this.y + 1, value: false, connected: false },      // 2s place
            { x: this.x - 37, y: this.y + 21, value: false, connected: false }   // 4s place
        ];

        // Add output nodes that mirror the inputs
        this.outputNodes = [
            { x: this.x + 37, y: this.y - 19, value: false, hasOutput: false }, // 1s place output
            { x: this.x + 37, y: this.y + 1, value: false, hasOutput: false },      // 2s place output
            { x: this.x + 37, y: this.y + 21, value: false, hasOutput: false }   // 4s place output
        ];
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
        ctx.font = Gate.squareFont;
        ctx.textAlign = 'right';
        ctx.fillText('I1', this.inputNodes[0].x - 7, this.inputNodes[0].y + 2);
        ctx.fillText('I2', this.inputNodes[1].x - 7, this.inputNodes[1].y + 2);
        ctx.fillText('I4', this.inputNodes[2].x - 7, this.inputNodes[2].y + 2);

        // Draw output labels
        ctx.textAlign = 'left';
        ctx.fillText('O1', this.outputNodes[0].x + 7, this.outputNodes[0].y + 2);
        ctx.fillText('O2', this.outputNodes[1].x + 7, this.outputNodes[1].y + 2);
        ctx.fillText('O4', this.outputNodes[2].x + 7, this.outputNodes[2].y + 2);

        // Draw component label inside the rectangle at the bottom
        ctx.textAlign = 'center';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(this.label, this.x, this.y + 35);

        // Draw input and output nodes
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
        // Copy input values to output nodes
        for (let i = 0; i < this.inputNodes.length; i++) {
            if (this.inputNodes[i].connected) {
                this.outputNodes[i].sourceValue = this.inputNodes[i].sourceValue;
            } else {
                this.outputNodes[i].sourceValue = undefined;
            }
        }
        
        // Display components don't need to return a value
        return undefined;
    }
}

class ThreeBitLatch extends Gate {
    constructor(x, y, editor) {
        super('THREE_BIT_LATCH', x, y, editor);
        this.label = 'Latch';
        this.width = 60;  
        this.height = 80; 
        this.storedValue = 0;
        
        // Define inputs and outputs with matching y-coordinates
        this.inputNodes = [
            // Clock at top center
            { x: x, y: y - this.height/2, name: 'clock', value: false, connected: false },
            // Data inputs on left side
            { x: x - this.width/2, y: y - Gate.twoInputSquareVeritcalOffset, name: 'bit1', value: false, connected: false },
            { x: x - this.width/2, y: y, name: 'bit2', value: false, connected: false },
            { x: x - this.width/2, y: y + Gate.twoInputSquareVeritcalOffset, name: 'bit4', value: false, connected: false }
        ];
        
        // Outputs aligned with corresponding inputs
        this.outputNodes = [
            { x: x + this.width/2, y: y - Gate.twoInputSquareVeritcalOffset, name: 'out1', value: false, hasOutput: false },
            { x: x + this.width/2, y: y, name: 'out2', value: false, hasOutput: false },
            { x: x + this.width/2, y: y + Gate.twoInputSquareVeritcalOffset, name: 'out4', value: false, hasOutput: false }
        ];

        this.sevenSegmentPatterns = [
            [1,1,1,1,1,1,0], // 0
            [0,1,1,0,0,0,0], // 1
            [1,1,0,1,1,0,1], // 2
            [1,1,1,1,0,0,1], // 3
            [0,1,1,0,0,1,1], // 4
            [1,0,1,1,0,1,1], // 5
            [1,0,1,1,1,1,1], // 6
            [1,1,1,0,0,0,0]  // 7
        ];

        this.lastClockState = false;

        // Add internal latch value storage separate from output value
        this.latchValue = 0;     // Internal stored value
        this.outputValue = 0;    // Current output value
    }

    draw(ctx) {
        // Draw main rectangle
        ctx.strokeStyle = this.selected ? '#ff0000' : '#000000';
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.rect(this.x - this.width/2, this.y - this.height/2, this.width, this.height);
        ctx.fill();
        ctx.stroke();

        // Draw component label above the seven segment display
        ctx.fillStyle = '#000000';
        ctx.font = Gate.squareFont;
        ctx.textAlign = 'center';
        ctx.fillText(this.label, this.x, this.y - this.height/2 + 12);

        // Draw seven segment display centered vertically
        this.drawSevenSegment(ctx, this.x, this.y, 38);

        // Draw input labels
        ctx.fillStyle = '#000000';
        ctx.font = Gate.squareFont;
        ctx.textAlign = 'right';
        ctx.fillText('I1', this.x - this.width/2 - 5, this.y - Gate.twoInputSquareVeritcalOffset);
        ctx.fillText('I2', this.x - this.width/2 - 5, this.y);
        ctx.fillText('I4', this.x - this.width/2 - 5, this.y + Gate.twoInputSquareVeritcalOffset);

        // Draw output labels
        ctx.textAlign = 'left';
        ctx.fillText('O1', this.x + this.width/2 + 5, this.y - Gate.twoInputSquareVeritcalOffset);
        ctx.fillText('O2', this.x + this.width/2 + 5, this.y);
        ctx.fillText('O4', this.x + this.width/2 + 5, this.y + Gate.twoInputSquareVeritcalOffset);

        // Draw clock label at top
        ctx.textAlign = 'center';
        ctx.fillText('CLK', this.x, this.y - this.height/2 - 10);

        // Draw nodes
        this.drawNodes(ctx);
    }

    drawSevenSegment(ctx, x, y, size) {
        const pattern = this.sevenSegmentPatterns[this.storedValue];
        const segmentWidth = size * 0.1;
        const segmentLength = size * 0.4;
        
        ctx.lineWidth = segmentWidth;
        ctx.lineCap = 'round';

        // Define segment positions
        const segments = [
            // A: top
            [x - segmentLength/2, y - segmentLength, x + segmentLength/2, y - segmentLength],
            // B: top right
            [x + segmentLength/2, y - segmentLength, x + segmentLength/2, y],
            // C: bottom right
            [x + segmentLength/2, y, x + segmentLength/2, y + segmentLength],
            // D: bottom
            [x - segmentLength/2, y + segmentLength, x + segmentLength/2, y + segmentLength],
            // E: bottom left
            [x - segmentLength/2, y, x - segmentLength/2, y + segmentLength],
            // F: top left
            [x - segmentLength/2, y - segmentLength, x - segmentLength/2, y],
            // G: middle
            [x - segmentLength/2, y, x + segmentLength/2, y]
        ];

        // Draw segments
        segments.forEach((segment, i) => {
            ctx.strokeStyle = pattern[i] ? '#ff0000' : '#dddddd';
            ctx.beginPath();
            ctx.moveTo(segment[0], segment[1]);
            ctx.lineTo(segment[2], segment[3]);
            ctx.stroke();
        });
        
        ctx.lineWidth = 1;
    }

    evaluate() {
        // Get clock state
        const clockState = this.inputNodes[0].sourceValue;
        
        if (clockState) {
            // When clock is HIGH, only update internal latch value
            const bit1 = this.inputNodes[1].sourceValue ? 1 : 0;
            const bit2 = this.inputNodes[2].sourceValue ? 2 : 0;
            const bit4 = this.inputNodes[3].sourceValue ? 4 : 0;
            
            // Store input values internally
            this.latchValue = bit1 + bit2 + bit4;
            
            // Update display to show stored value
            this.storedValue = this.latchValue;
        } else {
            // When clock is LOW, copy internal latch value to outputs
            this.outputValue = this.latchValue;
        }

        // Always output the current output value
        this.outputNodes[0].sourceValue = (this.outputValue & 1) !== 0;
        this.outputNodes[1].sourceValue = (this.outputValue & 2) !== 0;
        this.outputNodes[2].sourceValue = (this.outputValue & 4) !== 0;

        return this.outputValue;
    }

    updateConnectionPoints() {
        // Update input positions
        this.inputNodes[0].x = this.x;                    // Clock input
        this.inputNodes[0].y = this.y - this.height/2;
        
        this.inputNodes[1].x = this.x - this.width/2;    // Data inputs
        this.inputNodes[1].y = this.y - Gate.twoInputSquareVeritcalOffset;              // -spacing
        
        this.inputNodes[2].x = this.x - this.width/2;
        this.inputNodes[2].y = this.y;                   // center
        
        this.inputNodes[3].x = this.x - this.width/2;
        this.inputNodes[3].y = this.y + Gate.twoInputSquareVeritcalOffset;              // +spacing

        // Update output positions to match input heights exactly
        this.outputNodes[0].x = this.x + this.width/2;
        this.outputNodes[0].y = this.y - Gate.twoInputSquareVeritcalOffset;             // -spacing
        
        this.outputNodes[1].x = this.x + this.width/2;
        this.outputNodes[1].y = this.y;                  // center
        
        this.outputNodes[2].x = this.x + this.width/2;
        this.outputNodes[2].y = this.y + Gate.twoInputSquareVeritcalOffset;             // +spacing
    }
}

class ThreeBitAdder extends Gate {
    constructor(x, y, editor) {
        super('THREE_BIT_ADDER', x, y, editor);
        this.label = 'Adder';
        this.width = 60;
        this.height = 80;  // Reduced from 120 to 80
        this.sum = 0;
        this.overflow = false;
        
        const spacing = 15;
        this.inputNodes = [
            // A inputs (left side)
            { x: this.x - this.width/2, y: this.y - 25, name: 'A1', value: false, connected: false },
            { x: this.x - this.width/2, y: this.y, name: 'A2', value: false, connected: false },
            { x: this.x - this.width/2, y: this.y + 25, name: 'A4', value: false, connected: false },
            // B inputs (right side)
            { x: this.x + this.width/2, y: this.y - 25, name: 'B1', value: false, connected: false },
            { x: this.x + this.width/2, y: this.y, name: 'B2', value: false, connected: false },
            { x: this.x + this.width/2, y: this.y + 25, name: 'B4', value: false, connected: false }
        ];
        
        // Outputs at bottom and top
        this.outputNodes = [
            { x: this.x - spacing, y: this.y + this.height/2, name: 'S1', value: false, hasOutput: false },
            { x: this.x, y: this.y + this.height/2, name: 'S2', value: false, hasOutput: false },
            { x: this.x + spacing, y: this.y + this.height/2, name: 'S4', value: false, hasOutput: false },
            { x: this.x, y: this.y - this.height/2, name: 'OVF', value: false, hasOutput: false }
        ];

        this.sevenSegmentPatterns = [
            [1,1,1,1,1,1,0], // 0
            [0,1,1,0,0,0,0], // 1
            [1,1,0,1,1,0,1], // 2
            [1,1,1,1,0,0,1], // 3
            [0,1,1,0,0,1,1], // 4
            [1,0,1,1,0,1,1], // 5
            [1,0,1,1,1,1,1], // 6
            [1,1,1,0,0,0,0]  // 7
        ];
    }

    draw(ctx) {
        // Draw main rectangle
        ctx.strokeStyle = this.selected ? '#ff0000' : '#000000';
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.rect(this.x - this.width/2, this.y - this.height/2, this.width, this.height);
        ctx.fill();
        ctx.stroke();

        // Draw component label
        ctx.fillStyle = '#000000';
        ctx.font = Gate.squareFont;
        ctx.textAlign = 'center';
        ctx.fillText(this.label, this.x, this.y - this.height/2 + 12);

        // Draw seven segment display
        this.drawSevenSegment(ctx, this.x, this.y, 38);

        // Draw input labels
        ctx.font = Gate.squareFont;
        ctx.textAlign = 'right';
        
        // A inputs (left)
        ctx.fillText('A1', this.x - this.width/2 - 7, this.y - 25);
        ctx.fillText('A2', this.x - this.width/2 - 7, this.y);
        ctx.fillText('A4', this.x - this.width/2 - 7, this.y + 25);
        
        // B inputs (right)
        ctx.fillText('B1', this.x + this.width/2 + 20, this.y - 25);
        ctx.fillText('B2', this.x + this.width/2 + 20, this.y);
        ctx.fillText('B4', this.x + this.width/2 + 20, this.y + 25);

        // Draw output labels
        ctx.textAlign = 'center';
        ctx.fillText('S1', this.x - 15, this.y + this.height/2 + 15);
        ctx.fillText('S2', this.x, this.y + this.height/2 + 15);
        ctx.fillText('S4', this.x + 15, this.y + this.height/2 + 15);
        ctx.fillText('OVF', this.x, this.y - this.height/2 - 10);

        // Draw nodes
        this.drawNodes(ctx);

        // Draw overflow indicator if active
        if (this.overflow) {
            ctx.fillStyle = '#ff0000';
            ctx.font = 'bold 10px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('OVF', this.x, this.y - this.height/2 + 25);
        }
    }

    drawSevenSegment(ctx, x, y, size) {
        const pattern = this.sevenSegmentPatterns[this.sum > 7 ? 7 : this.sum];
        const segmentWidth = size * 0.1;
        const segmentLength = size * 0.4;
        
        ctx.lineWidth = segmentWidth;
        ctx.lineCap = 'round';

        // Define segment positions
        const segments = [
            // A: top
            [x - segmentLength/2, y - segmentLength, x + segmentLength/2, y - segmentLength],
            // B: top right
            [x + segmentLength/2, y - segmentLength, x + segmentLength/2, y],
            // C: bottom right
            [x + segmentLength/2, y, x + segmentLength/2, y + segmentLength],
            // D: bottom
            [x - segmentLength/2, y + segmentLength, x + segmentLength/2, y + segmentLength],
            // E: bottom left
            [x - segmentLength/2, y, x - segmentLength/2, y + segmentLength],
            // F: top left
            [x - segmentLength/2, y - segmentLength, x - segmentLength/2, y],
            // G: middle
            [x - segmentLength/2, y, x + segmentLength/2, y]
        ];

        // Draw segments
        segments.forEach((segment, i) => {
            ctx.strokeStyle = pattern[i] ? '#ff0000' : '#dddddd';
            ctx.beginPath();
            ctx.moveTo(segment[0], segment[1]);
            ctx.lineTo(segment[2], segment[3]);
            ctx.stroke();
        });
        
        ctx.lineWidth = 1;
    }

    evaluate() {
        // Calculate value for first number (A)
        const a1 = this.inputNodes[0].sourceValue ? 1 : 0;
        const a2 = this.inputNodes[1].sourceValue ? 2 : 0;
        const a3 = this.inputNodes[2].sourceValue ? 4 : 0;
        const valueA = a1 + a2 + a3;

        // Calculate value for second number (B)
        const b1 = this.inputNodes[3].sourceValue ? 1 : 0;
        const b2 = this.inputNodes[4].sourceValue ? 2 : 0;
        const b3 = this.inputNodes[5].sourceValue ? 4 : 0;
        const valueB = b1 + b2 + b3;

        // Calculate sum and check for overflow
        this.sum = valueA + valueB;
        this.overflow = this.sum > 7;

        // Set output values
        this.outputNodes[0].sourceValue = (this.sum & 1) !== 0;  // S1
        this.outputNodes[1].sourceValue = (this.sum & 2) !== 0;  // S2
        this.outputNodes[2].sourceValue = (this.sum & 4) !== 0;  // S4
        this.outputNodes[3].sourceValue = this.overflow;         // OVF - now properly set to true/false

        return this.sum;
    }

    updateConnectionPoints() {
        const spacing = 15;
        
        // Update A input positions (left side)
        this.inputNodes[0].x = this.x - this.width/2;
        this.inputNodes[0].y = this.y - 25;
        this.inputNodes[1].x = this.x - this.width/2;
        this.inputNodes[1].y = this.y;
        this.inputNodes[2].x = this.x - this.width/2;
        this.inputNodes[2].y = this.y + 25;
        
        // Update B input positions (right side)
        this.inputNodes[3].x = this.x + this.width/2;
        this.inputNodes[3].y = this.y - 25;
        this.inputNodes[4].x = this.x + this.width/2;
        this.inputNodes[4].y = this.y;
        this.inputNodes[5].x = this.x + this.width/2;
        this.inputNodes[5].y = this.y + 25;

        // Update sum output positions (bottom - exit downward)
        for (let i = 0; i < 3; i++) {
            this.outputNodes[i].x = this.x + (i - 1) * spacing;
            this.outputNodes[i].y = this.y + this.height/2; // Position at bottom edge of component
        }

        // Update overflow output position (top)
        this.outputNodes[3].x = this.x;
        this.outputNodes[3].y = this.y - this.height/2;
    }
}

class ClockPulse extends Gate {
    constructor(x, y, editor) {
        super('CLOCK_PULSE', x, y, editor);
        this.label = 'CLK';
        this.width = 60;
        this.height = 60;
        this.state = false;
        this.isRunning = false;  // Add running state flag
        
        this.outputNodes = [
            { x: x + this.width/2, y: y - Gate.twoInputSquareVeritcalOffset, name: 'high', value: false, hasOutput: false },
            { x: x + this.width/2, y: y + Gate.twoInputSquareVeritcalOffset, name: 'low', value: true, hasOutput: false }
        ];
        this.inputNodes = [];
    }

    draw(ctx) {
        // Draw the main rectangle
        ctx.fillStyle = 'white';
        ctx.strokeStyle = 'black';
        ctx.font = Gate.squareFont;
        ctx.beginPath();
        ctx.rect(this.x - this.width/2, this.y - this.height/2, this.width, this.height);
        ctx.fill();
        ctx.stroke();

        // Draw the clock icon in center - flipped based on state
        ctx.strokeStyle = 'black';
        ctx.beginPath();
        if (this.state) {
            // HIGH state - pulse goes up higher
            ctx.moveTo(this.x - 15, this.y-this.height/8);
            ctx.lineTo(this.x - 5, this.y-this.height/8);
            ctx.lineTo(this.x - 5, this.y + this.height/8);  // Move down 25% of height
            ctx.lineTo(this.x + 5, this.y + this.height/8);
            ctx.lineTo(this.x + 5, this.y-this.height/8);
            ctx.lineTo(this.x + 15, this.y-this.height/8);
        } else {
            // LOW state - pulse goes down lower
            ctx.moveTo(this.x - 15, this.y+this.height/8);
            ctx.lineTo(this.x - 5, this.y+this.height/8);
            ctx.lineTo(this.x - 5, this.y - this.height/8);  // Move up 25% of height
            ctx.lineTo(this.x + 5, this.y - this.height/8);
            ctx.lineTo(this.x + 5, this.y+this.height/8);
            ctx.lineTo(this.x + 15, this.y+this.height/8);
        }
        ctx.stroke();

        // Draw "CLK"
        ctx.fillStyle = 'black';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.label, this.x, this.y - 20);

        // Draw state text - show "Off" when not running
        ctx.fillText(this.isRunning ? (this.state ? "HIGH" : "LOW") : "OFF", this.x, this.y + 20);

        // Draw output labels
        ctx.fillStyle = '#000000';
        ctx.font = Gate.squareFont;
        ctx.textAlign = 'left';
        ctx.fillText('Hi', this.x + this.width/2 + 8, this.y - Gate.twoInputSquareVeritcalOffset + 2);
        ctx.fillText('Lo', this.x + this.width/2 + 8, this.y + Gate.twoInputSquareVeritcalOffset + 2);

        // Draw nodes with their colored circles
        this.drawNodes(ctx);
    }

    drawNodes(ctx) {
        // Draw output nodes with their colors based on values
        this.outputNodes.forEach((node, index) => {
            ctx.beginPath();
            ctx.arc(node.x, node.y, 5, 0, 2 * Math.PI);
            ctx.fillStyle = (index === 0 ? this.state : !this.state) ? '#4CAF50' : '#f44336';
            ctx.fill();
            ctx.stroke();
        });
    }

    toggleState() {
        this.state = !this.state;
        this.evaluate();
        return true;
    }

    evaluate() {
        // Set output values based on state
        this.outputNodes[0].sourceValue = this.state;      // High output
        this.outputNodes[1].sourceValue = !this.state;     // Low output
        return this.state;
    }

    updateConnectionPoints() {
        // Update output positions
        this.outputNodes[0].x = this.x + this.width/2;  // High output
        this.outputNodes[0].y = this.y - Gate.twoInputSquareVeritcalOffset;
        
        this.outputNodes[1].x = this.x + this.width/2;  // Low output
        this.outputNodes[1].y = this.y + Gate.twoInputSquareVeritcalOffset;
    }
}

class JKFlipFlop extends Gate {
    constructor(x, y, editor) {
        super('JK_FLIP_FLOP', x, y, editor);
        this.label = 'JK';
        this.width = 60;
        this.height = 60;
        this.state = false; // Internal state storage
        
        // Define inputs and outputs
        this.inputNodes = [
            { x: x - this.width/2 , y: y - Gate.twoInputSquareVeritcalOffset, name: 'J', value: false, connected: false },    // J input
            { x: x - this.width/2, y: y + Gate.twoInputSquareVeritcalOffset, name: 'K', value: false, connected: false },    // K input
            { x: x, y: y - this.height/2, name: 'CLK', value: false, connected: false }       // Clock input
        ];
        
        this.outputNodes = [
            { x: x + this.width/2, y: y - Gate.twoInputSquareVeritcalOffset, name: 'Q', value: false, hasOutput: false },    // Q output
            { x: x + this.width/2, y: y + Gate.twoInputSquareVeritcalOffset, name: 'Q_BAR', value: true, hasOutput: false }  // Q̄ output
        ];

        this.lastClockState = false; // Track clock transitions
    }

    draw(ctx) {
        // Draw main body
        ctx.beginPath();
        ctx.strokeStyle = this.selected ? '#ff0000' : '#000000';
        ctx.fillStyle = '#ffffff';
        ctx.rect(this.x - this.width/2, this.y - this.height/2, this.width, this.height);
        ctx.fill();
        ctx.stroke();

        // Draw component label
        ctx.fillStyle = '#000000';
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(this.label, this.x, this.y);

        // Draw input labels
        ctx.font = Gate.squareFont;
        ctx.textAlign = 'left';
        ctx.fillText('J', this.x - this.width/2 + Gate.squareLabelOffset, this.y - 10);
        ctx.fillText('K', this.x - this.width/2 + Gate.squareLabelOffset, this.y + 20);
        ctx.textAlign = 'center';
        ctx.fillText('CLK', this.x, this.y - this.height/2 - 10);

        // Draw output labels
        ctx.textAlign = 'right';
        ctx.fillText('Q', this.x + this.width/2 - Gate.squareLabelOffset, this.y - 10);
        ctx.fillText('Q̄', this.x + this.width/2 - Gate.squareLabelOffset, this.y + 20);

        // Draw nodes with colored outputs
        this.drawNodes(ctx);
    }

    drawNodes(ctx) {
        // Draw input nodes normally
        this.inputNodes.forEach(node => {
            ctx.beginPath();
            ctx.arc(node.x, node.y, 5, 0, Math.PI * 2);
            ctx.fillStyle = '#000000';
            ctx.fill();
            ctx.stroke();
        });

        // Draw output nodes with state colors
        this.outputNodes.forEach((node, index) => {
            ctx.beginPath();
            ctx.arc(node.x, node.y, 5, 0, Math.PI * 2);
            // Q output is colored based on state, Q̄ is opposite
            ctx.fillStyle = (index === 0 ? this.state : !this.state) ? '#4CAF50' : '#f44336';
            ctx.fill();
            ctx.stroke();
        });
    }

    evaluate() {
        const J = this.inputNodes[0].sourceValue;
        const K = this.inputNodes[1].sourceValue;
        const clockState = this.inputNodes[2].sourceValue;

        // Handle clock edge
        if (clockState && !this.lastClockState) { // Rising edge
            if (J && !K) {
                this.state = true;      // Set
            } else if (!J && K) {
                this.state = false;     // Reset
            } else if (J && K) {
                this.state = !this.state; // Toggle
            }
            // If both J and K are low, maintain current state
        }

        // Update last clock state
        this.lastClockState = clockState;

        // Update outputs
        this.outputNodes[0].sourceValue = this.state;      // Q
        this.outputNodes[1].sourceValue = !this.state;     // Q̄

        return this.state;
    }

    updateConnectionPoints() {
        // Update input positions
        this.inputNodes[0].x = this.x - this.width/2;    // J
        this.inputNodes[0].y = this.y - 20;
        this.inputNodes[1].x = this.x - this.width/2;    // K
        this.inputNodes[1].y = this.y + 20;
        this.inputNodes[2].x = this.x;                   // Clock
        this.inputNodes[2].y = this.y - this.height/2;

        // Update output positions
        this.outputNodes[0].x = this.x + this.width/2;   // Q
        this.outputNodes[0].y = this.y - 20;
        this.outputNodes[1].x = this.x + this.width/2;   // Q̄
        this.outputNodes[1].y = this.y + 20;
    }
}

class OneBitLatch extends Gate {
    constructor(x, y, editor) {
        super('ONE_BIT_LATCH', x, y, editor);
        this.width = 60;
        this.height = 60;
        this.internalState = false;
        this.lastClockState = false;
        this.label = 'BIT';
        
        // Initialize with 2 input nodes (data and clock) and 1 output node
        this.inputNodes = [
            { x: 0, y: 0, sourceValue: undefined, connected: false }, // Data input
            { x: 0, y: 0, sourceValue: undefined, connected: false }  // Clock input
        ];
        this.outputNodes = [
            { x: 0, y: 0, sourceValue: false, connected: false }      // Output
        ];
        
        this.updateConnectionPoints();
    }

    draw(ctx) {
        // Draw the latch body
        ctx.beginPath();
        ctx.rect(this.x - this.width/2, this.y - this.height/2, this.width, this.height);
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Draw label
        ctx.fillStyle = '#000';
        ctx.font = Gate.squareFont;
        ctx.textAlign = 'center';
        ctx.fillText(this.label, this.x, this.y);
        
        // Draw input labels
        ctx.font = Gate.squareFont;
        ctx.textAlign = 'left';
        ctx.fillText('D', this.x - this.width/2 + 7, this.y - Gate.twoInputSquareVeritcalOffset);  // Data input
        ctx.fillText('CLK', this.x - this.width/2 + 7, this.y + Gate.twoInputSquareVeritcalOffset); // Clock input
        
        // Draw nodes with colored output
        this.drawNodes(ctx);
    }

    drawNodes(ctx) {
        // Draw input nodes normally
        this.inputNodes.forEach(node => {
            ctx.beginPath();
            ctx.arc(node.x, node.y, 5, 0, Math.PI * 2);
            ctx.fillStyle = '#000000';
            ctx.fill();
            ctx.stroke();
        });

        // Draw output node with state color
        this.outputNodes.forEach(node => {
            ctx.beginPath();
            ctx.arc(node.x, node.y, 5, 0, Math.PI * 2);
            ctx.fillStyle = this.internalState ? '#4CAF50' : '#f44336';
            ctx.fill();
            ctx.stroke();
        });
    }

    evaluate() {
        const dataInput = this.inputNodes[0].sourceValue;
        const clockInput = this.inputNodes[1].sourceValue;
        
        // On rising edge of clock (clock transitions from low to high)
        if (clockInput && !this.lastClockState) {
            this.internalState = dataInput;
        }
        
        // Update output based on internal state
        this.outputNodes[0].sourceValue = this.internalState;
        
        // Store current clock state for edge detection
        this.lastClockState = clockInput;
        
        return this.outputNodes[0].sourceValue;
    }

    updateConnectionPoints() {
        // Data input on left side, upper position
        this.inputNodes[0].x = this.x - this.width/2;
        this.inputNodes[0].y = this.y - Gate.twoInputSquareVeritcalOffset;
        
        // Clock input on left side, lower position
        this.inputNodes[1].x = this.x - this.width/2;
        this.inputNodes[1].y = this.y + Gate.twoInputSquareVeritcalOffset;
        
        // Output on right side, center
        this.outputNodes[0].x = this.x + this.width/2;
        this.outputNodes[0].y = this.y;
    }
}

class SRFlipFlop extends Gate {
    constructor(x, y, editor) {
        super('SR_FLIP_FLOP', x, y, editor);
        this.width = 60;
        this.height = 60;
        this.state = false; // Q output state
        this.label = 'SR';
        
        // Initialize with 2 inputs (S and R) and 2 outputs (Q and Q̄)
        this.inputNodes = [
            { x: 0, y: 0, sourceValue: undefined, connected: false }, // S input
            { x: 0, y: 0, sourceValue: undefined, connected: false }  // R input
        ];
        
        this.outputNodes = [
            { x: 0, y: 0, sourceValue: undefined, connected: false }, // Q output
            { x: 0, y: 0, sourceValue: undefined, connected: false }  // Q̄ output
        ];
        
        this.updateConnectionPoints();
    }

    draw(ctx) {
        // Draw the main rectangle
        ctx.beginPath();
        ctx.rect(this.x - this.width/2, this.y - this.height/2, this.width, this.height);
        ctx.strokeStyle = '#000';
        ctx.stroke();
        
        // Draw labels
        ctx.font = Gate.squareFont;
        ctx.fillStyle = '#000';
        ctx.textAlign = 'left';
        ctx.fillText('S', this.x - this.width/2 + Gate.squareLabelOffset, this.y - 10);
        ctx.fillText('R', this.x - this.width/2 + Gate.squareLabelOffset, this.y + 20);
        
        ctx.textAlign = 'right';
        ctx.fillText('Q', this.x + this.width/2 - Gate.squareLabelOffset, this.y - 10);
        ctx.fillText('Q̄', this.x + this.width/2 - Gate.squareLabelOffset, this.y + 20);
        
        // Draw label in center
        ctx.textAlign = 'center';
        ctx.fillText(this.label, this.x, this.y);
        
        // Draw nodes
        this.drawNodes(ctx);
    }

    evaluate() {
        const S = this.inputNodes[0].sourceValue;
        const R = this.inputNodes[1].sourceValue;
        
        // SR Flip-flop logic
        if (S === undefined || R === undefined) {
            // If inputs are not connected, maintain current state
            this.outputNodes[0].sourceValue = this.state;
            this.outputNodes[1].sourceValue = !this.state;
            return;
        }
        
        if (S && R) {
            // Invalid state (both S and R high)
            this.outputNodes[0].sourceValue = undefined;
            this.outputNodes[1].sourceValue = undefined;
            return;
        }
        
        if (S) {
            // Set state
            this.state = true;
        } else if (R) {
            // Reset state
            this.state = false;
        }
        // else: maintain current state (when both S and R are low)
        
        this.outputNodes[0].sourceValue = this.state;
        this.outputNodes[1].sourceValue = !this.state;
        
        return this.state;
    }

    updateConnectionPoints() {
        // Set input positions (left side)
        this.inputNodes[0].x = this.x - this.width/2; // S input
        this.inputNodes[0].y = this.y - Gate.twoInputSquareVeritcalOffset;
        this.inputNodes[1].x = this.x - this.width/2; // R input
        this.inputNodes[1].y = this.y + Gate.twoInputSquareVeritcalOffset;
        
        // Set output positions (right side)
        this.outputNodes[0].x = this.x + this.width/2; // Q output
        this.outputNodes[0].y = this.y - Gate.twoInputSquareVeritcalOffset;
        this.outputNodes[1].x = this.x + this.width/2; // Q̄ output
        this.outputNodes[1].y = this.y + Gate.twoInputSquareVeritcalOffset;
    }
}

 
