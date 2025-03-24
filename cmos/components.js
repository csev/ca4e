class Component {
    // Add static color properties
    static get VDD_COLOR() { return '#ff0000'; }  // Red
    static get GND_COLOR() { return '#0000ff'; }  // Blue
    static get NEUTRAL_COLOR() { return '#000000'; } // Black
    static get VDD_VOLTAGE() { return 5; }  // Add VDD voltage constant

    constructor(type, x, y) {
        this.type = type;
        this.x = x;
        this.y = y;
        this.selected = false;
        this.inputs = [];
        this.outputs = [];
        this.voltage = 0;
        this.dragging = false;
        this.dragOffset = { x: 0, y: 0 };
    }

    draw(ctx) {
        // Base drawing method to be overridden
    }

    isPointInside(x, y) {
        // Basic hit detection - override in specific components
        const bounds = 20;
        return x >= this.x - bounds && 
               x <= this.x + bounds && 
               y >= this.y - bounds && 
               y <= this.y + bounds;
    }

    startDrag(mouseX, mouseY) {
        this.dragging = true;
        this.dragOffset.x = mouseX - this.x;
        this.dragOffset.y = mouseY - this.y;
    }

    drag(mouseX, mouseY) {
        if (this.dragging) {
            // Update component position
            this.x = mouseX - this.dragOffset.x;
            this.y = mouseY - this.dragOffset.y;
            
            // Update connection points
            this.updateConnectionPoints();
        }
    }

    endDrag() {
        this.dragging = false;
    }

    updateConnectionPoints() {
        // This should be implemented by each component type
        // Base implementation does nothing
    }
}

class MOSTransistor extends Component {
    constructor(type, x, y) {
        super(type, x, y);
        this.gate_con_x = - 22;
        this.gate_con_y = 0;
        this.source_con_x = 8;
        this.source_con_y = 25;
        this.drain_con_x = this.source_con_x;
        this.drain_con_y = - this.source_con_y;
        
        this.gate_label_x = -20;
        this.gate_label_y = 13;
        this.source_label_x = -6;
        this.source_label_y = 25;
        this.drain_label_x = this.source_label_x;
        this.drain_label_y = - this.source_label_y;

        this.inputs = [
            { x: this.x + this.gate_con_x, y: this.y + this.gate_con_y, name: 'gate', voltage: 0 },     // Gate
            { x: this.x + this.drain_con_x, y: this.y + this.drain_con_y, name: 'drain', voltage: 0 },    // Drain
            { x: this.x + this.source_con_x, y: this.y + this.source_con_y, name: 'source', voltage: 0 }    // Source
        ];
        this.width = 40;
        this.height = 60;
        this.conducting = false;
    }

    draw(ctx) {
        this.updateConductingState();
        
        ctx.strokeStyle = this.selected ? '#ff0000' : '#000000';
        ctx.fillStyle = '#ffffff';
        
        // Draw gate line
        ctx.beginPath();
        ctx.moveTo(this.x - 20, this.y);
        ctx.lineTo(this.x - 5, this.y);
        ctx.stroke();

        // Draw vertical channel line with conducting indicator
        ctx.beginPath();
        if (this.conducting) {
            ctx.strokeStyle = '#00ff00'; // Green for conducting
            ctx.lineWidth = 3; // Thicker line when conducting
        }
        ctx.moveTo(this.x, this.y - 15);
        ctx.lineTo(this.x, this.y + 15);
        ctx.stroke();
        ctx.strokeStyle = this.selected ? '#ff0000' : '#000000'; // Reset stroke style
        ctx.lineWidth = 1; // Reset line width

        // Draw drain and source connections
        ctx.beginPath();
        ctx.moveTo(this.x, this.y - 15);
        ctx.lineTo(this.x + 7, this.y - 15);
        ctx.lineTo(this.x + 7, this.y - 20);
        ctx.moveTo(this.x, this.y + 15);
        ctx.lineTo(this.x + 7, this.y + 15);
        ctx.lineTo(this.x + 7, this.y + 20);
        ctx.stroke();

        // Draw gate symbol (vertical lines)
        ctx.beginPath();
        ctx.moveTo(this.x - 5, this.y - 10);
        ctx.lineTo(this.x - 5, this.y + 10);
        ctx.stroke();

        // Draw type-specific symbol (arrow or circle)
        this.drawTypeSymbol(ctx);

        // Draw connection points
        this.inputs.forEach(input => {
            ctx.beginPath();
            ctx.arc(input.x, input.y, 4, 0, Math.PI * 2);
            ctx.fillStyle = '#ffffff';
            ctx.fill();
            ctx.stroke();
            
            ctx.beginPath();
            ctx.arc(input.x, input.y, 2.5, 0, Math.PI * 2);
            ctx.fillStyle = '#000000';
            ctx.fill();
        });

        // Draw labels
        ctx.fillStyle = '#000000';
        ctx.font = '10px Arial';
        ctx.textAlign = 'right';
        ctx.fillText('G', this.x + this.gate_label_x, this.y + this.gate_label_y);
        ctx.textAlign = 'left';
        ctx.fillText('D', this.x + this.drain_label_x, this.y + this.drain_label_y);
        ctx.fillText('S', this.x + this.source_label_x, this.y + this.source_label_y);

        // Add conducting indicator text
        if (this.conducting) {
            ctx.fillStyle = '#00aa00';
            ctx.font = 'bold 10px Arial';
            ctx.textAlign = 'left';
            ctx.fillText('ON', this.x + 15, this.y);
        }
    }

    updateConnectionPoints() {
        this.inputs[0] = { x: this.x + this.gate_con_x, y: this.y + this.gate_con_y, name: 'gate', value: this.inputs[0].value };
        this.inputs[1] = { x: this.x + this.drain_con_x, y: this.y + this.drain_con_y, name: 'drain', value: this.inputs[1].value };
        this.inputs[2] = { x: this.x + this.source_con_x, y: this.y + this.source_con_y, name: 'source', value: this.inputs[2].value };
    }

    isPointInside(x, y) {
        return x >= this.x - this.width/2 && 
               x <= this.x + this.width/2 && 
               y >= this.y - this.height/2 && 
               y <= this.y + this.height/2;
    }

    // These methods must be implemented by subclasses
    updateConductingState() { }
    drawTypeSymbol(ctx) { }
}

class NMOS extends MOSTransistor {
    constructor(x, y) {
        super('NMOS', x, y);
    }

    updateConductingState() {
        const gateVoltage = this.inputs[0].voltage;
        this.conducting = gateVoltage >= 2.5;
        
        console.log('NMOS State:', {
            gateVoltage: gateVoltage,
            conducting: this.conducting,
            inputs: this.inputs.map(input => ({
                name: input.name,
                voltage: input.voltage
            }))
        });
    }

    drawTypeSymbol(ctx) {
        // Draw arrow (for NMOS)
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.x - 8, this.y + 5);
        ctx.lineTo(this.x - 8, this.y - 5);
        ctx.closePath();
        ctx.fill();
    }
}

class PMOS extends MOSTransistor {
    constructor(x, y) {
        super('PMOS', x, y);
    }

    updateConductingState() {
        this.conducting = this.inputs[0].voltage < 2.5;
    }

    drawTypeSymbol(ctx) {
        // Draw circle (for PMOS)
        ctx.beginPath();
        ctx.arc(this.x - 8, this.y, 5, 0, Math.PI * 2);
        ctx.stroke();
    }
}

class VoltageSource extends Component {
    constructor(x, y, voltage = 5) {
        super('VDD', x, y);
        this.voltage = voltage;
        this.outputs = [{ x: this.x, y: this.y + 20, voltage: this.voltage }];
    }

    draw(ctx) {
        ctx.beginPath();
        ctx.strokeStyle = this.selected ? '#ff0000' : '#000000';
        ctx.fillStyle = '#ffffff';
        
        // Draw circle
        ctx.arc(this.x, this.y, 15, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Draw voltage label
        ctx.fillStyle = '#000000';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.voltage + 'V', this.x, this.y);

        // Draw output connection point
        ctx.beginPath();
        ctx.arc(this.outputs[0].x, this.outputs[0].y, 3, 0, Math.PI * 2);
        ctx.fill();
    }

    updateConnectionPoints() {
        this.outputs[0] = { x: this.x, y: this.y + 20, voltage: this.voltage };
    }
}

class Ground extends Component {
    constructor(x, y) {
        super('GND', x, y);
        this.voltage = 0;
        this.inputs = [{ x: this.x, y: this.y - 20, voltage: this.voltage }];
    }

    draw(ctx) {
        ctx.beginPath();
        ctx.strokeStyle = this.selected ? '#ff0000' : '#000000';
        
        // Draw ground symbol
        ctx.moveTo(this.x - 15, this.y);
        ctx.lineTo(this.x + 15, this.y);
        ctx.moveTo(this.x - 10, this.y + 5);
        ctx.lineTo(this.x + 10, this.y + 5);
        ctx.moveTo(this.x - 5, this.y + 10);
        ctx.lineTo(this.x + 5, this.y + 10);
        ctx.stroke();

        // Draw input connection point
        ctx.beginPath();
        ctx.arc(this.inputs[0].x, this.inputs[0].y, 3, 0, Math.PI * 2);
        ctx.fill();
    }

    updateConnectionPoints() {
        this.inputs[0] = { x: this.x, y: this.y - 20, voltage: this.voltage };
    }
}

class Probe extends Component {
    constructor(x, y) {
        super('PROBE', x, y);
        this.size = 30;
        this.width = this.size;
        this.height = this.size;
        this.voltage = 0;
        this.cornerRadius = 6;
        // Add both input and output
        this.inputs = [{ x: this.x - this.width/2 - 5, y: this.y, name: 'input', voltage: 0 }];
        this.outputs = [{ x: this.x + this.width/2 + 5, y: this.y, name: 'output', voltage: 0 }];
        this.label = "";
    }

    getVoltageColor(voltage) {
        const normalizedVoltage = Math.max(0, Math.min(Component.VDD_VOLTAGE, voltage));
        const midpoint = Component.VDD_VOLTAGE / 2;
        
        if (normalizedVoltage >= midpoint) {
            // Scale from neutral to VDD color (red)
            const ratio = (normalizedVoltage - midpoint) / midpoint;
            return `rgb(${Math.round(255 * ratio)}, 0, 0)`;
        } else {
            // Scale from GND color (blue) to neutral
            const ratio = normalizedVoltage / midpoint;
            return `rgb(0, 0, ${Math.round(255 * (1 - ratio))})`;
        }
    }

    draw(ctx) {
        ctx.strokeStyle = this.selected ? '#ff0000' : '#000000';
        
        // Get background color based on voltage
        const displayVoltage = typeof this.voltage === 'number' ? this.voltage : 0;
        ctx.fillStyle = this.getVoltageColor(displayVoltage);
        
        // Draw rounded rectangle probe body
        ctx.beginPath();
        ctx.moveTo(this.x - this.width/2 + this.cornerRadius, this.y - this.height/2);
        // Top right corner
        ctx.lineTo(this.x + this.width/2 - this.cornerRadius, this.y - this.height/2);
        ctx.arcTo(
            this.x + this.width/2, this.y - this.height/2,
            this.x + this.width/2, this.y - this.height/2 + this.cornerRadius,
            this.cornerRadius
        );
        // Bottom right corner
        ctx.lineTo(this.x + this.width/2, this.y + this.height/2 - this.cornerRadius);
        ctx.arcTo(
            this.x + this.width/2, this.y + this.height/2,
            this.x + this.width/2 - this.cornerRadius, this.y + this.height/2,
            this.cornerRadius
        );
        // Bottom left corner
        ctx.lineTo(this.x - this.width/2 + this.cornerRadius, this.y + this.height/2);
        ctx.arcTo(
            this.x - this.width/2, this.y + this.height/2,
            this.x - this.width/2, this.y + this.height/2 - this.cornerRadius,
            this.cornerRadius
        );
        // Top left corner
        ctx.lineTo(this.x - this.width/2, this.y - this.height/2 + this.cornerRadius);
        ctx.arcTo(
            this.x - this.width/2, this.y - this.height/2,
            this.x - this.width/2 + this.cornerRadius, this.y - this.height/2,
            this.cornerRadius
        );
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Draw the label if it exists
        if (this.label) {
            ctx.save();
            ctx.font = '12px Arial';
            ctx.fillStyle = '#000000';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'bottom';
            ctx.fillText(this.label, this.x, this.y - this.height/2 - 5);
            ctx.restore();
        }

        // Draw voltage display
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(this.voltage.toFixed(1) + 'V', this.x, this.y);

        // Draw both input and output connection points
        ctx.beginPath();
        ctx.arc(this.inputs[0].x, this.inputs[0].y, 3, 0, Math.PI * 2);
        ctx.fillStyle = '#000000';
        ctx.fill();
        ctx.stroke();

        // Draw output connection point
        ctx.beginPath();
        ctx.arc(this.outputs[0].x, this.outputs[0].y, 3, 0, Math.PI * 2);
        ctx.fillStyle = '#000000';
        ctx.fill();
        ctx.stroke();
    }

    updateConnectionPoints() {
        // Update input position to left side
        this.inputs[0] = { 
            x: this.x - this.width/2 - 5, 
            y: this.y, 
            name: 'input', 
            voltage: this.inputs[0].voltage 
        };
        // Update output position to right side
        this.outputs[0] = {
            x: this.x + this.width/2 + 5,
            y: this.y,
            name: 'output',
            voltage: this.inputs[0].voltage // Copy input voltage to output
        };
    }

    isPointInside(x, y) {
        return x >= this.x - this.width/2 && 
               x <= this.x + this.width/2 && 
               y >= this.y - this.height/2 && 
               y <= this.y + this.height/2;
    }
}

class Wire {
    constructor(startComponent, startPoint, endComponent, endPoint) {
        this.startComponent = startComponent;
        this.startPoint = startPoint;
        this.endComponent = endComponent;
        this.endPoint = endPoint;
        this.selected = false;
        this.voltage = 0;
    }

    draw(ctx) {
        // Determine wire color based on voltage
        ctx.strokeStyle = this.voltage >= 2.5 ? Component.VDD_COLOR : Component.GND_COLOR;
        ctx.lineWidth = 2;
        
        ctx.beginPath();
        ctx.moveTo(this.startPoint.x, this.startPoint.y);
        ctx.lineTo(this.endPoint.x, this.endPoint.y);
        ctx.stroke();
        ctx.lineWidth = 1;
    }

    isPointNear(x, y, threshold = 5) {
        const A = this.startPoint;
        const B = this.endPoint;
        
        // Calculate distance from point to line segment
        const dx = B.x - A.x;
        const dy = B.y - A.y;
        const len = Math.sqrt(dx * dx + dy * dy);
        const dot = (((x - A.x) * dx) + ((y - A.y) * dy)) / (len * len);
        
        if (dot < 0 || dot > 1) return false;
        
        const closestX = A.x + (dot * dx);
        const closestY = A.y + (dot * dy);
        const distance = Math.sqrt((x - closestX) * (x - closestX) + (y - closestY) * (y - closestY));
        
        return distance <= threshold;
    }
}

class Switch extends Component {
    constructor(x, y) {
        super('SWITCH', x, y);
        this.voltage = Component.VDD_VOLTAGE;
        this.isOn = true;
        this.radius = 15;
        this.outputs = [{ 
            x: this.x + this.radius + 5, 
            y: this.y, 
            voltage: this.voltage 
        }];
        this.isDragging = false; // Add dragging flag
        this.label = "";
    }

    draw(ctx) {
        // Update color based on state
        if (this.isOn) {
            ctx.strokeStyle = Component.VDD_COLOR;
            ctx.fillStyle = Component.VDD_COLOR;
        } else {
            ctx.strokeStyle = Component.GND_COLOR;
            ctx.fillStyle = Component.GND_COLOR;
        }

        // Draw the circle
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Draw the label if it exists
        if (this.label) {
            ctx.save();
            ctx.font = '12px Arial';
            ctx.fillStyle = '#000000';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'bottom';
            ctx.fillText(this.label, this.x, this.y - this.radius - 10);
            ctx.restore();
        }

        // Draw voltage text
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.isOn ? '5V' : '0V', this.x, this.y);

        // Draw small "double-click" hint
        ctx.font = '8px Arial';
        ctx.fillText('(dbl-click)', this.x, this.y + this.radius + 10);

        // Draw output connection point
        ctx.beginPath();
        ctx.arc(this.outputs[0].x, this.outputs[0].y, 3, 0, Math.PI * 2);
        ctx.fillStyle = '#000000';
        ctx.fill();
        ctx.stroke();
    }

    toggle() {
        this.isOn = !this.isOn;
        this.voltage = this.isOn ? Component.VDD_VOLTAGE : 0;
        // Update output voltage
        if (this.outputs && this.outputs.length > 0) {
            this.outputs[0].voltage = this.voltage;
        }
        console.log('Switch toggled:', {
            isOn: this.isOn,
            voltage: this.voltage,
            outputVoltage: this.outputs[0].voltage
        });
    }

    updateConnectionPoints() {
        this.outputs[0] = { 
            x: this.x + this.radius + 5, 
            y: this.y, 
            voltage: this.voltage 
        };
    }

    startDrag(mouseX, mouseY) {
        super.startDrag(mouseX, mouseY);
        this.isDragging = false; // Reset drag flag
    }

    endDrag() {
        super.endDrag();
        this.isDragging = false;
    }

    isPointInside(x, y) {
        const dx = x - this.x;
        const dy = y - this.y;
        return dx * dx + dy * dy <= this.radius * this.radius;
    }
}

class VDDBar extends Component {
    constructor(canvasWidth) {
        super('VDD_BAR', 0, 40);
        this.numPoints = 10; // Fixed number of points
        this.voltage = Component.VDD_VOLTAGE; // Explicitly set voltage
        this.updateDimensions(canvasWidth);
    }

    updateDimensions(canvasWidth) {
        this.margin = Math.max(80, canvasWidth * 0.1); // Responsive margin, minimum 80px
        this.width = canvasWidth - (this.margin * 2);
        this.height = 30;
        
        // Recalculate connection points
        this.outputs = [];
        const totalSpace = this.width - 40; // Leave a bit of space from edges of bar
        const spacing = totalSpace / (this.numPoints - 1); // Space between points
        
        for (let i = 0; i < this.numPoints; i++) {
            const relativePosition = i / (this.numPoints - 1); // Position from 0 to 1
            this.outputs.push({
                x: this.margin + 20 + (i * spacing),
                y: this.y + this.height/2,
                voltage: Component.VDD_VOLTAGE, // Explicitly set voltage for each output
                relativePosition: relativePosition // Store relative position
            });
        }
    }

    draw(ctx) {
        ctx.beginPath();
        ctx.strokeStyle = Component.NEUTRAL_COLOR;
        ctx.fillStyle = Component.VDD_COLOR; // Use VDD color
        
        // Draw bar with rounded corners
        const radius = 10;
        ctx.beginPath();
        ctx.moveTo(this.margin + radius, this.y - this.height/2);
        // Top right corner
        ctx.lineTo(this.margin + this.width - radius, this.y - this.height/2);
        ctx.arcTo(
            this.margin + this.width, this.y - this.height/2,
            this.margin + this.width, this.y - this.height/2 + radius,
            radius
        );
        // Bottom right corner
        ctx.lineTo(this.margin + this.width, this.y + this.height/2 - radius);
        ctx.arcTo(
            this.margin + this.width, this.y + this.height/2,
            this.margin + this.width - radius, this.y + this.height/2,
            radius
        );
        // Bottom left corner
        ctx.lineTo(this.margin + radius, this.y + this.height/2);
        ctx.arcTo(
            this.margin, this.y + this.height/2,
            this.margin, this.y + this.height/2 - radius,
            radius
        );
        // Top left corner
        ctx.lineTo(this.margin, this.y - this.height/2 + radius);
        ctx.arcTo(
            this.margin, this.y - this.height/2,
            this.margin + radius, this.y - this.height/2,
            radius
        );
        
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Draw VDD label
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(`VDD (${Component.VDD_VOLTAGE}V)`, this.margin + 20, this.y);

        // Draw connection points
        this.outputs.forEach(output => {
            // Draw white background circle
            ctx.beginPath();
            ctx.arc(output.x, output.y, 4, 0, Math.PI * 2);
            ctx.fillStyle = '#ffffff';
            ctx.fill();
            ctx.stroke();
            
            // Draw smaller filled black circle
            ctx.beginPath();
            ctx.arc(output.x, output.y, 2.5, 0, Math.PI * 2);
            ctx.fillStyle = '#000000';
            ctx.fill();
        });
    }

    // Override these methods to prevent movement
    startDrag() { }
    drag() { }
    endDrag() { }
    
    // The bar can't be selected
    isPointInside() {
        return false;
    }
}

class GNDBar extends Component {
    constructor(canvasWidth, canvasHeight) {
        super('GND_BAR', 0, canvasHeight - 40); // Position from bottom
        this.numPoints = 10;
        this.updateDimensions(canvasWidth, canvasHeight);
    }

    updateDimensions(canvasWidth, canvasHeight) {
        this.margin = Math.max(80, canvasWidth * 0.1); // Responsive margin
        this.width = canvasWidth - (this.margin * 2);
        this.height = 30;
        this.y = canvasHeight - 40; // Update vertical position
        this.voltage = 0;
        
        // Recalculate connection points
        this.inputs = []; // Using inputs instead of outputs for GND
        const totalSpace = this.width - 40;
        const spacing = totalSpace / (this.numPoints - 1);
        
        for (let i = 0; i < this.numPoints; i++) {
            const relativePosition = i / (this.numPoints - 1);
            this.inputs.push({
                x: this.margin + 20 + (i * spacing),
                y: this.y - this.height/2, // Connect from top of bar
                voltage: this.voltage,
                relativePosition: relativePosition
            });
        }
    }

    draw(ctx) {
        ctx.beginPath();
        ctx.strokeStyle = Component.NEUTRAL_COLOR;
        ctx.fillStyle = Component.GND_COLOR; // Use GND color
        
        // Draw bar with rounded corners
        const radius = 10;
        ctx.beginPath();
        ctx.moveTo(this.margin + radius, this.y - this.height/2);
        // Top right corner
        ctx.lineTo(this.margin + this.width - radius, this.y - this.height/2);
        ctx.arcTo(
            this.margin + this.width, this.y - this.height/2,
            this.margin + this.width, this.y - this.height/2 + radius,
            radius
        );
        // Bottom right corner
        ctx.lineTo(this.margin + this.width, this.y + this.height/2 - radius);
        ctx.arcTo(
            this.margin + this.width, this.y + this.height/2,
            this.margin + this.width - radius, this.y + this.height/2,
            radius
        );
        // Bottom left corner
        ctx.lineTo(this.margin + radius, this.y + this.height/2);
        ctx.arcTo(
            this.margin, this.y + this.height/2,
            this.margin, this.y + this.height/2 - radius,
            radius
        );
        // Top left corner
        ctx.lineTo(this.margin, this.y - this.height/2 + radius);
        ctx.arcTo(
            this.margin, this.y - this.height/2,
            this.margin + radius, this.y - this.height/2,
            radius
        );
        
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Draw GND label
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText('GND (0V)', this.margin + 20, this.y);

        // Draw connection points
        this.inputs.forEach(input => {
            // Draw white background circle
            ctx.beginPath();
            ctx.arc(input.x, input.y, 4, 0, Math.PI * 2);
            ctx.fillStyle = '#ffffff';
            ctx.fill();
            ctx.stroke();
            
            // Draw smaller filled black circle
            ctx.beginPath();
            ctx.arc(input.x, input.y, 2.5, 0, Math.PI * 2);
            ctx.fillStyle = '#000000';
            ctx.fill();
        });
    }

    // Override these methods to prevent movement
    startDrag() { }
    drag() { }
    endDrag() { }
    
    // The bar can't be selected
    isPointInside() {
        return false;
    }
}

class BatterySymbol {
    constructor(vddBar, gndBar) {
        this.vddBar = vddBar;
        this.gndBar = gndBar;
        this.updatePosition();
    }

    updatePosition() {
        // Position battery to the right of the bars
        this.rightMargin = 40;
        this.width = 30;
        this.x = this.vddBar.margin + this.vddBar.width + 40;
        
        // Calculate vertical positions
        this.topY = this.vddBar.y;
        this.bottomY = this.gndBar.y;
        
        // Battery cell dimensions
        this.cellSpacing = 10;  // Doubled from 5 to 10 (space between + and - terminals within each cell)
        this.cellGap = 10;      // Doubled from 5 to 10 (gap between the two cells)
        this.cellY = (this.topY + this.bottomY) / 2; // Center point of battery
        this.longLineLength = 40;
        this.shortLineLength = 20;

        // Calculate positions for each cell relative to center
        this.upperCellBottom = this.cellY - this.cellGap/2;
        this.lowerCellTop = this.cellY + this.cellGap/2;
    }

    draw(ctx) {
        ctx.strokeStyle = Component.NEUTRAL_COLOR;
        ctx.lineWidth = 2;

        // Draw horizontal lines from bars to battery with colors
        ctx.beginPath();
        ctx.strokeStyle = Component.VDD_COLOR; // VDD connection
        ctx.moveTo(this.vddBar.margin + this.vddBar.width, this.vddBar.y);
        ctx.lineTo(this.x, this.vddBar.y);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.strokeStyle = Component.GND_COLOR; // GND connection
        ctx.moveTo(this.vddBar.margin + this.vddBar.width, this.gndBar.y);
        ctx.lineTo(this.x, this.gndBar.y);
        ctx.stroke();

        // Draw vertical lines connecting to battery with colors
        ctx.beginPath();
        ctx.strokeStyle = Component.VDD_COLOR; // VDD side
        ctx.moveTo(this.x, this.vddBar.y);
        ctx.lineTo(this.x, this.upperCellBottom - this.cellSpacing);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.strokeStyle = Component.GND_COLOR; // GND side
        ctx.moveTo(this.x, this.gndBar.y);
        ctx.lineTo(this.x, this.lowerCellTop + this.cellSpacing);
        ctx.stroke();

        // Battery symbol in neutral color
        ctx.strokeStyle = Component.NEUTRAL_COLOR;
        
        // Draw upper cell
        ctx.beginPath();
        ctx.moveTo(this.x - this.longLineLength/2, this.upperCellBottom - this.cellSpacing);
        ctx.lineTo(this.x + this.longLineLength/2, this.upperCellBottom - this.cellSpacing);
        ctx.stroke();

        // Positive terminal (longer line)
        ctx.beginPath();
        ctx.moveTo(this.x - this.longLineLength/2, this.upperCellBottom - this.cellSpacing);
        ctx.lineTo(this.x + this.longLineLength/2, this.upperCellBottom - this.cellSpacing);
        ctx.stroke();

        // Negative terminal (shorter line)
        ctx.beginPath();
        ctx.moveTo(this.x - this.shortLineLength/2, this.upperCellBottom);
        ctx.lineTo(this.x + this.shortLineLength/2, this.upperCellBottom);
        ctx.stroke();

        // Draw lower cell
        // Positive terminal (longer line)
        ctx.beginPath();
        ctx.moveTo(this.x - this.longLineLength/2, this.lowerCellTop);
        ctx.lineTo(this.x + this.longLineLength/2, this.lowerCellTop);
        ctx.stroke();

        // Negative terminal (shorter line)
        ctx.beginPath();
        ctx.moveTo(this.x - this.shortLineLength/2, this.lowerCellTop + this.cellSpacing);
        ctx.lineTo(this.x + this.shortLineLength/2, this.lowerCellTop + this.cellSpacing);
        ctx.stroke();

        // Draw vertical connection between cells
        ctx.beginPath();
        ctx.moveTo(this.x, this.upperCellBottom);
        ctx.lineTo(this.x, this.lowerCellTop);
        ctx.stroke();

        // Draw + and - symbols and voltage label
        ctx.fillStyle = Component.VDD_COLOR;
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'left';
        
        // Calculate position for + symbol
        const symbolX = this.x + this.longLineLength/2 + 5;
        
        // Draw voltage value and + symbol in VDD color
        ctx.fillText(`${Component.VDD_VOLTAGE}V`, symbolX, this.upperCellBottom - this.cellSpacing - 20);
        ctx.font = 'bold 16px Arial';
        ctx.fillText('+', symbolX, this.upperCellBottom - this.cellSpacing);
        
        // Draw - symbol in GND color
        ctx.fillStyle = Component.GND_COLOR;
        ctx.fillText('−', symbolX, this.lowerCellTop + this.cellSpacing);

        ctx.lineWidth = 1; // Reset line width
    }
}

// More component classes to be added (NMOS, PMOS, Probe) 