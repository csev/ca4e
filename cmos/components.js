class Component {
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
        // Update positions of input and output connection points
        // To be implemented in specific component classes
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

class NMOS extends Component {
    constructor(x, y) {
        super('NMOS', x, y);
        this.inputs = [
            { x: this.x - 20, y: this.y, name: 'gate', value: 0 },     // Gate
            { x: this.x, y: this.y - 20, name: 'drain', value: 0 },    // Drain
            { x: this.x, y: this.y + 20, name: 'source', value: 0 }    // Source
        ];
        this.width = 40;
        this.height = 60;
    }

    draw(ctx) {
        ctx.strokeStyle = this.selected ? '#ff0000' : '#000000';
        ctx.fillStyle = '#ffffff';
        
        // Draw gate line
        ctx.beginPath();
        ctx.moveTo(this.x - 20, this.y);
        ctx.lineTo(this.x - 5, this.y);
        ctx.stroke();

        // Draw vertical channel line
        ctx.beginPath();
        ctx.moveTo(this.x, this.y - 15);
        ctx.lineTo(this.x, this.y + 15);
        ctx.stroke();

        // Draw drain connection (with horizontal segment)
        ctx.beginPath();
        ctx.moveTo(this.x, this.y - 15);
        ctx.lineTo(this.x + 7, this.y - 15);  // Horizontal segment
        ctx.lineTo(this.x + 7, this.y - 20);  // Vertical segment
        ctx.stroke();

        // Draw source connection (with horizontal segment)
        ctx.beginPath();
        ctx.moveTo(this.x, this.y + 15);
        ctx.lineTo(this.x + 7, this.y + 15);  // Horizontal segment
        ctx.lineTo(this.x + 7, this.y + 20);  // Vertical segment
        ctx.stroke();

        // Draw gate symbol (vertical lines)
        ctx.beginPath();
        ctx.moveTo(this.x - 5, this.y - 10);
        ctx.lineTo(this.x - 5, this.y + 10);
        ctx.stroke();

        // Draw arrow (for NMOS)
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.x - 8, this.y + 5);
        ctx.lineTo(this.x - 8, this.y - 5);
        ctx.closePath();
        ctx.fill();

        // Update connection point positions to match new geometry
        this.inputs[1].x = this.x + 7;  // Update drain x position
        this.inputs[2].x = this.x + 7;  // Update source x position

        // Draw connection points with filled circles
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

        // Draw labels
        ctx.fillStyle = '#000000';
        ctx.font = '10px Arial';
        ctx.textAlign = 'right';
        ctx.fillText('G', this.x - 25, this.y + 4);
        ctx.textAlign = 'left';
        ctx.fillText('D', this.x + 12, this.y - 25);
        ctx.fillText('S', this.x + 12, this.y + 25);
    }

    updateConnectionPoints() {
        this.inputs[0] = { x: this.x - 20, y: this.y, name: 'gate', value: this.inputs[0].value };
        this.inputs[1] = { x: this.x + 7, y: this.y - 20, name: 'drain', value: this.inputs[1].value };
        this.inputs[2] = { x: this.x + 7, y: this.y + 20, name: 'source', value: this.inputs[2].value };
    }

    isPointInside(x, y) {
        return x >= this.x - this.width/2 && 
               x <= this.x + this.width/2 && 
               y >= this.y - this.height/2 && 
               y <= this.y + this.height/2;
    }
}

class PMOS extends Component {
    constructor(x, y) {
        super('PMOS', x, y);
        this.inputs = [
            { x: this.x - 20, y: this.y, name: 'gate', value: 0 },     // Gate
            { x: this.x, y: this.y - 20, name: 'drain', value: 0 },    // Drain
            { x: this.x, y: this.y + 20, name: 'source', value: 0 }    // Source
        ];
        this.width = 40;
        this.height = 60;
    }

    draw(ctx) {
        ctx.strokeStyle = this.selected ? '#ff0000' : '#000000';
        ctx.fillStyle = '#ffffff';
        
        // Draw gate line
        ctx.beginPath();
        ctx.moveTo(this.x - 20, this.y);
        ctx.lineTo(this.x - 5, this.y);
        ctx.stroke();

        // Draw vertical channel line
        ctx.beginPath();
        ctx.moveTo(this.x, this.y - 15);
        ctx.lineTo(this.x, this.y + 15);
        ctx.stroke();

        // Draw drain connection (with horizontal segment)
        ctx.beginPath();
        ctx.moveTo(this.x, this.y - 15);
        ctx.lineTo(this.x + 7, this.y - 15);  // Horizontal segment
        ctx.lineTo(this.x + 7, this.y - 20);  // Vertical segment
        ctx.stroke();

        // Draw source connection (with horizontal segment)
        ctx.beginPath();
        ctx.moveTo(this.x, this.y + 15);
        ctx.lineTo(this.x + 7, this.y + 15);  // Horizontal segment
        ctx.lineTo(this.x + 7, this.y + 20);  // Vertical segment
        ctx.stroke();

        // Draw gate symbol (vertical lines)
        ctx.beginPath();
        ctx.moveTo(this.x - 5, this.y - 10);
        ctx.lineTo(this.x - 5, this.y + 10);
        ctx.stroke();

        // Draw circle (for PMOS)
        ctx.beginPath();
        ctx.arc(this.x - 8, this.y, 5, 0, Math.PI * 2);
        ctx.stroke();

        // Update connection point positions to match new geometry
        this.inputs[1].x = this.x + 7;  // Update drain x position
        this.inputs[2].x = this.x + 7;  // Update source x position

        // Draw connection points with filled circles
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

        // Draw labels
        ctx.fillStyle = '#000000';
        ctx.font = '10px Arial';
        ctx.textAlign = 'right';
        ctx.fillText('G', this.x - 25, this.y + 4);
        ctx.textAlign = 'left';
        ctx.fillText('D', this.x + 12, this.y - 25);
        ctx.fillText('S', this.x + 12, this.y + 25);
    }

    updateConnectionPoints() {
        this.inputs[0] = { x: this.x - 20, y: this.y, name: 'gate', value: this.inputs[0].value };
        this.inputs[1] = { x: this.x + 7, y: this.y - 20, name: 'drain', value: this.inputs[1].value };
        this.inputs[2] = { x: this.x + 7, y: this.y + 20, name: 'source', value: this.inputs[2].value };
    }

    isPointInside(x, y) {
        return x >= this.x - this.width/2 && 
               x <= this.x + this.width/2 && 
               y >= this.y - this.height/2 && 
               y <= this.y + this.height/2;
    }
}

class Probe extends Component {
    constructor(x, y) {
        super('PROBE', x, y);
        this.voltage = 0;
        this.width = 30;
        this.height = 24;
        this.cornerRadius = 6;
        // Move input to left side instead of bottom
        this.inputs = [{ x: this.x - this.width/2 - 5, y: this.y, name: 'input', voltage: 0 }];
    }

    // Helper function to get color based on voltage
    getVoltageColor(voltage) {
        // Update color scheme to use red for high voltage and blue for low voltage
        const normalizedVoltage = Math.max(0, Math.min(5, voltage));
        
        if (normalizedVoltage >= 2.5) {
            // Scale from neutral to red
            const ratio = (normalizedVoltage - 2.5) / 2.5;
            return `rgb(${Math.round(255 * ratio)}, 0, 0)`;
        } else {
            // Scale from blue to neutral
            const ratio = normalizedVoltage / 2.5;
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

        // Draw voltage value
        ctx.fillStyle = displayVoltage > 2.5 ? '#000000' : '#ffffff';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(displayVoltage.toFixed(1) + 'V', this.x, this.y);

        // Draw connection point on left side
        ctx.beginPath();
        ctx.arc(this.inputs[0].x, this.inputs[0].y, 3, 0, Math.PI * 2);
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
        ctx.beginPath();
        ctx.strokeStyle = this.selected ? '#ff0000' : '#000000';
        ctx.lineWidth = 2;
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
        this.voltage = 5; // Start at 5V
        this.isVDD = true; // Track state
        this.radius = 15; // Store radius for consistent size
        // Move output to right side instead of bottom
        this.outputs = [{ x: this.x + this.radius + 5, y: this.y, voltage: this.voltage }];
    }

    draw(ctx) {
        ctx.strokeStyle = this.selected ? '#ff0000' : '#000000';
        
        // Draw switch body with full color
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.isVDD ? '#4CAF50' : '#f44336'; // Green for 5V, Red for 0V
        ctx.fill();
        ctx.stroke();

        // Draw text
        ctx.fillStyle = '#ffffff'; // White text
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.isVDD ? '5V' : '0V', this.x, this.y);

        // Draw output connection point on right side
        ctx.beginPath();
        ctx.arc(this.outputs[0].x, this.outputs[0].y, 3, 0, Math.PI * 2);
        ctx.fillStyle = '#000000';
        ctx.fill();
        ctx.stroke();
    }

    toggle() {
        this.isVDD = !this.isVDD;
        this.voltage = this.isVDD ? 5 : 0;
        this.outputs[0].voltage = this.voltage;
    }

    updateConnectionPoints() {
        // Update output position to right side
        this.outputs[0] = { x: this.x + this.radius + 5, y: this.y, voltage: this.voltage };
    }
}

class VDDBar extends Component {
    constructor(canvasWidth) {
        super('VDD_BAR', 0, 40);
        this.numPoints = 10; // Fixed number of points
        this.updateDimensions(canvasWidth);
    }

    updateDimensions(canvasWidth) {
        this.margin = Math.max(80, canvasWidth * 0.1); // Responsive margin, minimum 80px
        this.width = canvasWidth - (this.margin * 2);
        this.height = 30;
        this.voltage = 5;
        
        // Recalculate connection points
        this.outputs = [];
        const totalSpace = this.width - 40; // Leave a bit of space from edges of bar
        const spacing = totalSpace / (this.numPoints - 1); // Space between points
        
        for (let i = 0; i < this.numPoints; i++) {
            const relativePosition = i / (this.numPoints - 1); // Position from 0 to 1
            this.outputs.push({
                x: this.margin + 20 + (i * spacing),
                y: this.y + this.height/2,
                voltage: this.voltage,
                relativePosition: relativePosition // Store relative position
            });
        }
    }

    draw(ctx) {
        // Draw the VDD bar
        ctx.beginPath();
        ctx.strokeStyle = '#000000';
        ctx.fillStyle = '#ff0000'; // Changed to red (from green)
        
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
        ctx.fillText('VDD (5V)', this.margin + 20, this.y);

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
        // Draw the GND bar
        ctx.beginPath();
        ctx.strokeStyle = '#000000';
        ctx.fillStyle = '#0000ff'; // Changed to blue (from red)
        
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
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;

        // Draw horizontal lines from bars to battery with colors
        ctx.beginPath();
        ctx.strokeStyle = '#ff0000'; // VDD connection in red
        ctx.moveTo(this.vddBar.margin + this.vddBar.width, this.vddBar.y);
        ctx.lineTo(this.x, this.vddBar.y);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.strokeStyle = '#0000ff'; // GND connection in blue
        ctx.moveTo(this.vddBar.margin + this.vddBar.width, this.gndBar.y);
        ctx.lineTo(this.x, this.gndBar.y);
        ctx.stroke();

        // Draw vertical lines connecting to battery with colors
        ctx.beginPath();
        ctx.strokeStyle = '#ff0000'; // VDD side in red
        ctx.moveTo(this.x, this.vddBar.y);
        ctx.lineTo(this.x, this.upperCellBottom - this.cellSpacing);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.strokeStyle = '#0000ff'; // GND side in blue
        ctx.moveTo(this.x, this.gndBar.y);
        ctx.lineTo(this.x, this.lowerCellTop + this.cellSpacing);
        ctx.stroke();

        // Battery symbol in black
        ctx.strokeStyle = '#000000';
        
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
        ctx.fillStyle = '#ff0000'; // VDD voltage and + symbol in red
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'left';
        
        // Calculate position for + symbol
        const symbolX = this.x + this.longLineLength/2 + 5;
        
        // Draw voltage value and + symbol in red
        ctx.fillText('5V', symbolX, this.upperCellBottom - this.cellSpacing - 20);
        ctx.font = 'bold 16px Arial';
        ctx.fillText('+', symbolX, this.upperCellBottom - this.cellSpacing);
        
        // Draw - symbol in blue
        ctx.fillStyle = '#0000ff';
        ctx.fillText('−', symbolX, this.lowerCellTop + this.cellSpacing);

        ctx.lineWidth = 1; // Reset line width
    }
}

// More component classes to be added (NMOS, PMOS, Probe) 