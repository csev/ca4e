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
        this.inputs = [{ x: this.x, y: this.y + 20, name: 'input', voltage: 0 }];
        this.width = 30;
        this.height = 24;
        this.cornerRadius = 6;
    }

    // Helper function to get color based on voltage
    getVoltageColor(voltage) {
        // Ensure voltage is between 0 and 5
        const normalizedVoltage = Math.max(0, Math.min(5, voltage));
        
        // Calculate color components
        if (normalizedVoltage <= 2.5) {
            // Red (5V) to Yellow (2.5V)
            const ratio = normalizedVoltage / 2.5;
            const red = 255;
            const green = Math.round(255 * ratio);
            return `rgb(${red}, ${green}, 0)`;
        } else {
            // Yellow (2.5V) to Green (5V)
            const ratio = (normalizedVoltage - 2.5) / 2.5;
            const red = Math.round(255 * (1 - ratio));
            const green = 255;
            return `rgb(${red}, ${green}, 0)`;
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

        // Add slight inner shadow for depth
        ctx.save();
        ctx.clip();
        ctx.shadowBlur = 4;
        ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;
        ctx.fillStyle = 'rgba(0, 0, 0, 0)';
        ctx.fill();
        ctx.restore();

        // Draw voltage value with contrasting text color
        ctx.fillStyle = displayVoltage > 2.5 ? '#000000' : '#ffffff';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(displayVoltage.toFixed(1) + 'V', this.x, this.y);

        // Draw connection point
        ctx.beginPath();
        ctx.arc(this.inputs[0].x, this.inputs[0].y, 3, 0, Math.PI * 2);
        ctx.fillStyle = '#000000';
        ctx.fill();
        ctx.stroke();
    }

    updateConnectionPoints() {
        this.inputs[0] = { x: this.x, y: this.y + 20, name: 'input', voltage: this.inputs[0].voltage };
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
        this.outputs = [{ x: this.x, y: this.y + 20, voltage: this.voltage }];
        this.radius = 15; // Store radius for consistent size
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

        // Draw output connection point
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
        this.outputs[0] = { x: this.x, y: this.y + 20, voltage: this.voltage };
    }
}

// More component classes to be added (NMOS, PMOS, Probe) 