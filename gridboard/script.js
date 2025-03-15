const canvas = document.getElementById('gridCanvas');
const ctx = canvas.getContext('2d');

// Grid configuration
const GRID_COLS = 30;  // Swapped with rows
const GRID_ROWS = 14;  // Swapped with cols
const DOT_RADIUS = 4;
const PADDING = 40;
const CENTER_GAP = 30; // Gap between rows 7 and 8

// Calculate canvas size and grid spacing
const CANVAS_WIDTH = 900;  // Swapped with height
const CANVAS_HEIGHT = 504 + CENTER_GAP; // Added CENTER_GAP to total height
canvas.width = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;

const CELL_WIDTH = (CANVAS_WIDTH - 2 * PADDING) / (GRID_COLS - 1);
const CELL_HEIGHT = (CANVAS_HEIGHT - 2 * PADDING - CENTER_GAP) / (GRID_ROWS - 1);

// Store dots and lines
const dots = [];
const lines = [];
let isDragging = false;
let startDot = null;
let currentMousePos = { x: 0, y: 0 };

// Component type selector
const componentSelect = document.getElementById('componentType');

// Track electrical connections
const connections = new Map(); // Map of dot index to set of connected dot indices

// Add after the component type selector
let meltingWire = null;
let meltingProgress = 0;
let meltingAnimationId = null;
let smokeParticles = [];

// Add switch states tracking
const switches = new Map(); // Map to track switch states (pressed or not)
let nextSwitchId = 0;

// Remove transistor tracking variables
const transistors = new Map(); // Map to track transistor instances
let placingTransistor = false;
let currentTransistor = null;

// Add transistor connection tracking
let pendingTransistor = null;
let transistorConnections = new Map();

// Add this variable near the top with other state variables
let selectedTransistorPoint = null;

// Add after the RESISTOR_COLORS constant
const RESISTOR_VALUES = {
    'resistor_1k': 1000,    // 1kΩ
    'resistor_10k': 10000   // 10kΩ
};

// Add LED electrical characteristics near RESISTOR_VALUES
const LED_CHARACTERISTICS = {
    forwardVoltage: 2.0,    // Forward voltage drop in volts
    maxCurrent: 0.020,      // Maximum current in amperes (20mA)
    minCurrent: 0.001       // Minimum visible current in amperes (1mA)
};

class SmokeParticle {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.alpha = 1;
        this.radius = Math.random() * 3 + 2;
        this.vx = (Math.random() - 0.5) * 2;
        this.vy = -Math.random() * 2 - 1;
        this.life = 1;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy *= 0.95; // Slow down vertical movement
        this.life -= 0.02;
        this.alpha = this.life;
        this.radius += 0.1;
    }

    draw(ctx) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(100, 100, 100, ${this.alpha})`;
        ctx.fill();
    }
}

let warningTimeout = null;

// Helper function to get dot index from row and column
function getDotIndex(row, col) {
    return row * GRID_COLS + col;
}

// Helper function to get row and column from dot index
function getRowCol(index) {
    const row = Math.floor(index / GRID_COLS);
    const col = index % GRID_COLS;
    return { row, col };
}

// Initialize electrical connections for the breadboard
function initializeConnections() {
    connections.clear();
    
    // Initialize empty sets for each dot
    for (let i = 0; i < dots.length; i++) {
        connections.set(i, new Set([i]));
    }
    
    // Connect power rails (rows 0 and 13)
    for (let col = 0; col < GRID_COLS - 1; col++) {
        connectDots(getDotIndex(0, col), getDotIndex(0, col + 1));  // Top +
        connectDots(getDotIndex(GRID_ROWS - 1, col), getDotIndex(GRID_ROWS - 1, col + 1));  // Bottom +
    }
    
    // Connect ground rails (rows 1 and 12)
    for (let col = 0; col < GRID_COLS - 1; col++) {
        connectDots(getDotIndex(1, col), getDotIndex(1, col + 1));  // Top ground
        connectDots(getDotIndex(GRID_ROWS - 2, col), getDotIndex(GRID_ROWS - 2, col + 1));  // Bottom ground
    }
    
    // Connect vertical columns in top half (rows a-e: 2-6)
    for (let col = 0; col < GRID_COLS; col++) {
        for (let row = 2; row < 7 - 1; row++) {
            connectDots(getDotIndex(row, col), getDotIndex(row + 1, col));
        }
    }
    
    // Connect vertical columns in bottom half (rows f-j: 7-11)
    for (let col = 0; col < GRID_COLS; col++) {
        for (let row = 7; row < 12 - 1; row++) {
            connectDots(getDotIndex(row, col), getDotIndex(row + 1, col));
        }
    }
}

// Connect two dots electrically
function connectDots(index1, index2) {
    const set1 = connections.get(index1);
    const set2 = connections.get(index2);
    
    // Merge the two sets
    const mergedSet = new Set([...set1, ...set2]);
    
    // Update all dots in both sets to point to the merged set
    for (const dotIndex of mergedSet) {
        connections.set(dotIndex, mergedSet);
    }
}

// Check if two dots are electrically connected
function areDotsConnected(dot1, dot2) {
    const index1 = dots.indexOf(dot1);
    const index2 = dots.indexOf(dot2);
    if (index1 === -1 || index2 === -1) return false;
    
    const set1 = connections.get(index1);
    return set1.has(index2);
}

// Initialize dots
dots.length = 0; // Clear existing dots
for (let row = 0; row < GRID_ROWS; row++) {
    for (let col = 0; col < GRID_COLS; col++) {
        // Add CENTER_GAP to y position for rows 8 and beyond
        const extraGap = row >= 7 ? CENTER_GAP : 0;
        // Determine voltage based on row position
        let voltage = null;
        if (row === 0 || row === GRID_ROWS - 1) voltage = 9;  // VCC rows
        if (row === 1 || row === GRID_ROWS - 2) voltage = 0;  // GND rows
        
        dots.push({
            x: PADDING + col * CELL_WIDTH,
            y: PADDING + row * CELL_HEIGHT + extraGap,
            voltage: voltage
        });
    }
}

// Add to the end of the initialize dots section:
initializeConnections();

// Resistor color codes
const RESISTOR_COLORS = {
    0: '#000000', // Black
    1: '#964B00', // Brown
    2: '#FF0000', // Red
    3: '#FFA500', // Orange
    4: '#FFFF00', // Yellow
    5: '#00FF00', // Green
    6: '#0000FF', // Blue
    7: '#800080', // Violet
    8: '#808080', // Gray
    9: '#FFFFFF'  // White
};

// Draw functions
function drawDot(x, y, isHighlighted = false, voltage = null, dotIndex = null) {
    // Get connection status if dotIndex is provided
    let isPowered = false;
    let isGrounded = false;
    
    if (dotIndex !== null) {
        const connectedDots = connections.get(dotIndex);
        if (connectedDots) {
            isPowered = Array.from(connectedDots).some(i => dots[i].voltage === 9);
            isGrounded = Array.from(connectedDots).some(i => dots[i].voltage === 0);
        }
    }
    
    // Determine the dot's effective voltage status
    const effectiveVoltage = voltage || (isPowered ? 9 : (isGrounded ? 0 : null));
    
    ctx.beginPath();
    ctx.arc(x, y, DOT_RADIUS, 0, Math.PI * 2);
    
    // Set fill color based on voltage/connection status
    if (effectiveVoltage === 9 || isPowered) {
        ctx.fillStyle = isHighlighted ? '#ff6666' : '#ff4444';  // Red for VCC
    } else if (effectiveVoltage === 0 || isGrounded) {
        ctx.fillStyle = isHighlighted ? '#6666ff' : '#4444ff';  // Blue for GND
    } else {
        ctx.fillStyle = isHighlighted ? '#ff4444' : '#333';     // Original colors
    }
    
    ctx.fill();
    
    // Add glow effect for powered or grounded dots
    if (effectiveVoltage !== null || isPowered || isGrounded) {
        ctx.beginPath();
        ctx.arc(x, y, DOT_RADIUS * 1.5, 0, Math.PI * 2);
        if (effectiveVoltage === 9 || isPowered) {
            ctx.fillStyle = 'rgba(255,0,0,0.1)';  // Red glow
        } else {
            ctx.fillStyle = 'rgba(0,0,255,0.1)';  // Blue glow
        }
        ctx.fill();
    }
}

function drawLine(startX, startY, endX, endY, type = 'resistor', startDot = null, endDot = null) {
    // Calculate the angle and length of the line
    const dx = endX - startX;
    const dy = endY - startY;
    const angle = Math.atan2(dy, dx);
    const length = Math.sqrt(dx * dx + dy * dy);
    
    // Resistor dimensions
    const bodyLength = Math.min(60, length * 0.6);
    const bodyWidth = 16;
    const bandWidth = 6;
    const bandGap = (bodyLength - 5 * bandWidth) / 4;
    
    // Calculate resistor position
    const startWireLength = (length - bodyLength) / 2;
    const resistorStartX = startX + Math.cos(angle) * startWireLength;
    const resistorStartY = startY + Math.sin(angle) * startWireLength;
    
    // Calculate electrical values for resistors
    let voltage_drop = 0;
    let current = 0;
    
    if (type.startsWith('resistor_') && startDot && endDot) {
        const startVoltage = getDotVoltage(startDot);
        const endVoltage = getDotVoltage(endDot);
        
        if (startVoltage !== null && endVoltage !== null) {
            voltage_drop = Math.abs(startVoltage - endVoltage);
            const resistance = RESISTOR_VALUES[type];
            current = voltage_drop / resistance; // Calculate current in amperes
        }
    }
    
    // Draw connecting wires
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(resistorStartX, resistorStartY);
    ctx.moveTo(endX, endY);
    ctx.lineTo(resistorStartX + Math.cos(angle) * bodyLength, 
               resistorStartY + Math.sin(angle) * bodyLength);
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Save context state
    ctx.save();
    
    // Translate and rotate for resistor body
    ctx.translate(resistorStartX, resistorStartY);
    ctx.rotate(angle);
    
    // Draw resistor body with gradient
    const gradient = ctx.createLinearGradient(0, -bodyWidth/2, 0, bodyWidth/2);
    gradient.addColorStop(0, '#e6d5b8');
    gradient.addColorStop(0.5, '#f4e4cb');
    gradient.addColorStop(1, '#e6d5b8');
    
    ctx.beginPath();
    ctx.roundRect(0, -bodyWidth/2, bodyLength, bodyWidth, bodyWidth/2);
    ctx.fillStyle = gradient;
    ctx.fill();
    ctx.strokeStyle = '#d4c4a8';
    ctx.lineWidth = 1;
    ctx.stroke();
    
    // Define color bands based on resistor type
    let bandColors;
    let resistanceLabel = '';
    if (type === 'resistor_1k') {
        bandColors = ['#964B00', '#000000', '#FF0000', '#FFD700'];
        resistanceLabel = '1kΩ';
    } else if (type === 'resistor_10k') {
        bandColors = ['#964B00', '#000000', '#FFA500', '#FFD700'];
        resistanceLabel = '10kΩ';
    } else {
        bandColors = [
            RESISTOR_COLORS[Math.floor(Math.random() * 10)],
            RESISTOR_COLORS[Math.floor(Math.random() * 10)],
            RESISTOR_COLORS[Math.floor(Math.random() * 10)],
            '#FFD700'
        ];
    }
    
    // Draw color bands
    const bandPositions = [
        bandWidth/2,
        bandWidth/2 + bandWidth + bandGap,
        bandWidth/2 + 2 * (bandWidth + bandGap),
        bodyLength - bandWidth * 1.5
    ];
    
    bandPositions.forEach((pos, index) => {
        ctx.beginPath();
        ctx.rect(pos, -bodyWidth/2, bandWidth, bodyWidth);
        ctx.fillStyle = bandColors[index];
        ctx.fill();
    });
    
    // Draw resistance label
    if (resistanceLabel) {
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Add white background for better visibility
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.fillRect(bodyLength/2 - 20, -bodyWidth - 8, 40, 16);
        
        // Draw resistance value
        ctx.fillStyle = '#000000';
        ctx.fillText(resistanceLabel, bodyLength/2, -bodyWidth);
    }
    
    // Draw electrical values if they exist
    if (type.startsWith('resistor_') && voltage_drop > 0) {
        ctx.font = '10px Arial';
        ctx.fillStyle = '#000000';
        ctx.textAlign = 'center';
        
        // Add white background for better visibility
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.fillRect(-20, -bodyWidth - 20, 80, 16);
        
        // Draw voltage and current values
        ctx.fillStyle = '#000000';
        ctx.fillText(`${voltage_drop.toFixed(1)}V ${(current * 1000).toFixed(1)}mA`, bodyLength/2, -bodyWidth - 10);
    }
    
    // Restore context
    ctx.restore();
}

function drawLED(startX, startY, endX, endY, startDot, endDot) {
    // Calculate the angle and length of the line
    const dx = endX - startX;
    const dy = endY - startY;
    const angle = Math.atan2(dy, dx);
    const length = Math.sqrt(dx * dx + dy * dy);
    
    // LED dimensions
    const diameter = Math.min(30, length * 0.3);
    const radius = diameter / 2;
    
    // Calculate LED position
    const startWireLength = (length - diameter) / 2;
    const ledStartX = startX + Math.cos(angle) * startWireLength;
    const ledStartY = startY + Math.sin(angle) * startWireLength;
    const ledCenterX = ledStartX + Math.cos(angle) * radius;
    const ledCenterY = ledStartY + Math.sin(angle) * radius;
    
    // Calculate LED electrical values
    let isProperlyConnected = false;
    let current = 0;
    let actualVoltage = 0;
    let isReverse = false;

    if (startDot && endDot) {
        const startIndex = dots.indexOf(startDot);
        const endIndex = dots.indexOf(endDot);
        
        if (startIndex !== -1 && endIndex !== -1) {
            const startConnections = connections.get(startIndex);
            const endConnections = connections.get(endIndex);
            
            if (startConnections && endConnections) {
                const startVoltage = getDotVoltage(startDot);
                const endVoltage = getDotVoltage(endDot);
                
                if (startVoltage !== null && endVoltage !== null) {
                    const voltageDiff = startVoltage - endVoltage;
                    isReverse = voltageDiff < 0;
                    
                    if (!isReverse && voltageDiff > LED_CHARACTERISTICS.forwardVoltage) {
                        // LED is forward biased and has enough voltage
                        actualVoltage = LED_CHARACTERISTICS.forwardVoltage;
                        // Calculate current (simplified model)
                        current = Math.min(
                            (voltageDiff - LED_CHARACTERISTICS.forwardVoltage) / 1000, // Assume 1kΩ internal resistance
                            LED_CHARACTERISTICS.maxCurrent
                        );
                        isProperlyConnected = current >= LED_CHARACTERISTICS.minCurrent;
                    }
                }
            }
        }
    }
    
    // Draw connecting wires
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(ledStartX, ledStartY);
    ctx.moveTo(endX, endY);
    ctx.lineTo(ledStartX + Math.cos(angle) * diameter, 
               ledStartY + Math.sin(angle) * diameter);
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Save the current context state
    ctx.save();
    
    // Translate to LED center
    ctx.translate(ledCenterX, ledCenterY);
    ctx.rotate(angle);
    
    // Draw LED body (main circle)
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    
    // Create radial gradient for 3D effect
    const gradient = ctx.createRadialGradient(
        -radius * 0.3, -radius * 0.3, radius * 0.1,
        0, 0, radius
    );

    if (isProperlyConnected) {
        // Calculate brightness based on current
        const brightness = Math.min(1, current / LED_CHARACTERISTICS.maxCurrent);
        const brightnessFactor = 0.3 + (0.7 * brightness); // Scale from 30% to 100%
        
        // Bright glowing LED with brightness based on current
        gradient.addColorStop(0, `rgba(255, 255, 255, ${brightnessFactor})`);
        gradient.addColorStop(0.2, `rgba(255, 204, 204, ${brightnessFactor})`);
        gradient.addColorStop(0.7, `rgba(255, 51, 51, ${brightnessFactor})`);
        gradient.addColorStop(1, `rgba(204, 0, 0, ${brightnessFactor})`);
        
        // Add outer glow effect scaled with brightness
        ctx.shadowColor = '#ff0000';
        ctx.shadowBlur = 15 * brightnessFactor;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
    } else {
        // Regular unlit LED
        gradient.addColorStop(0, '#ff9999');
        gradient.addColorStop(0.3, '#ff0000');
        gradient.addColorStop(1, '#990000');
    }
    
    ctx.fillStyle = gradient;
    ctx.fill();
    
    // Add rim lighting effect
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 1;
    ctx.stroke();
    
    // Draw polarity symbols
    const symbolSize = radius * 0.6;
    ctx.strokeStyle = '#800000';
    ctx.lineWidth = 2;
    ctx.shadowBlur = 0;  // Reset shadow for symbols
    
    // Plus symbol
    ctx.beginPath();
    ctx.moveTo(-radius * 1.4, 0);
    ctx.lineTo(-radius * 1.8, 0);
    ctx.moveTo(-radius * 1.6, -symbolSize * 0.2);
    ctx.lineTo(-radius * 1.6, symbolSize * 0.2);
    ctx.stroke();
    
    // Minus symbol
    ctx.beginPath();
    ctx.moveTo(radius * 1.4, 0);
    ctx.lineTo(radius * 1.8, 0);
    ctx.stroke();
    
    // Add electrical values display
    if (startDot && endDot) {
        ctx.font = '10px Arial';
        ctx.fillStyle = '#000000';
        ctx.textAlign = 'center';
        
        if (isReverse) {
            ctx.fillText('Reverse', 0, -radius - 15);
        } else if (isProperlyConnected) {
            ctx.fillText(`${(current * 1000).toFixed(1)}mA`, 0, -radius - 15);
            ctx.fillText(`${actualVoltage.toFixed(1)}V`, 0, -radius - 5);
        }
    }
    
    // Add a subtle inner shadow
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.9, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.lineWidth = radius * 0.2;
    ctx.stroke();
    
    // Restore the context state
    ctx.restore();
}

// Replace the animateWireMelting function
function animateWireMelting(wireIndex) {
    if (meltingAnimationId) {
        cancelAnimationFrame(meltingAnimationId);
    }
    
    meltingWire = lines[wireIndex];
    meltingProgress = 0;
    smokeParticles = [];
    
    // Create initial smoke particles
    const startX = meltingWire.start.x;
    const startY = meltingWire.start.y;
    const endX = meltingWire.end.x;
    const endY = meltingWire.end.y;
    
    // Add particles along the wire
    for (let i = 0; i < 20; i++) {
        const t = i / 19;
        const x = startX + (endX - startX) * t;
        const y = startY + (endY - startY) * t;
        smokeParticles.push(new SmokeParticle(x, y));
    }
    
    function animate() {
        meltingProgress += 0.02;
        
        // Update existing particles
        smokeParticles = smokeParticles.filter(particle => particle.life > 0);
        smokeParticles.forEach(particle => particle.update());
        
        // Add new particles while the wire is "burning"
        if (meltingProgress < 0.7) {
            const t = Math.random();
            const x = startX + (endX - startX) * t;
            const y = startY + (endY - startY) * t;
            if (Math.random() < 0.3) {
                smokeParticles.push(new SmokeParticle(x, y));
            }
        }
        
        drawGrid();
        
        // Draw smoke particles
        smokeParticles.forEach(particle => particle.draw(ctx));
        
        if (meltingProgress >= 1) {
            // Remove the wire
            lines.splice(wireIndex, 1);
            meltingWire = null;
            meltingProgress = 0;
            smokeParticles = [];
            drawGrid();
            return;
        }
        
        meltingAnimationId = requestAnimationFrame(animate);
    }
    
    animate();
}

// Modify the drawWire function to handle undefined dots and connections safely
function drawWire(startX, startY, endX, endY, startDot, endDot, isCurrentWire = false) {
    // Handle case where dots might be undefined
    let startIndex = startDot ? dots.indexOf(startDot) : -1;
    let endIndex = endDot ? dots.indexOf(endDot) : -1;
    
    let startConnections = startIndex !== -1 ? connections.get(startIndex) : new Set();
    let endConnections = endIndex !== -1 ? connections.get(endIndex) : new Set();
    
    // Default to no power/ground if connections aren't available
    const hasStartPower = startConnections ? Array.from(startConnections).some(i => dots[i].voltage === 9) : false;
    const hasStartGround = startConnections ? Array.from(startConnections).some(i => dots[i].voltage === 0) : false;
    const hasEndPower = endConnections ? Array.from(endConnections).some(i => dots[i].voltage === 9) : false;
    const hasEndGround = endConnections ? Array.from(endConnections).some(i => dots[i].voltage === 0) : false;
    
    // Check for direct power to ground connection
    const isShortCircuit = (hasStartPower && hasEndGround) || (hasStartGround && hasEndPower);
    
    // Always draw the wire
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    
    if (hasStartPower || hasEndPower) {
        ctx.strokeStyle = '#ff4444';  // Red for power
    } else if (hasStartGround || hasEndGround) {
        ctx.strokeStyle = '#4444ff';  // Blue for ground
    } else {
        ctx.strokeStyle = '#000000';  // Black for other connections
    }
    
    ctx.lineWidth = 2;
    ctx.stroke();
    
    return isShortCircuit;
}

function drawSwitch(startX, startY, endX, endY, type, startDot, endDot, isPressed = false) {
    // Calculate the angle and length of the line
    const dx = endX - startX;
    const dy = endY - startY;
    const angle = Math.atan2(dy, dx);
    const length = Math.sqrt(dx * dx + dy * dy);
    
    // Switch dimensions
    const switchWidth = Math.min(40, length * 0.4);
    const switchHeight = 20;
    
    // Calculate switch position
    const startWireLength = (length - switchWidth) / 2;
    const switchStartX = startX + Math.cos(angle) * startWireLength;
    const switchStartY = startY + Math.sin(angle) * startWireLength;
    
    // Draw connecting wires
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(switchStartX, switchStartY);
    ctx.moveTo(endX, endY);
    ctx.lineTo(switchStartX + Math.cos(angle) * switchWidth, 
               switchStartY + Math.sin(angle) * switchWidth);
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Save context
    ctx.save();
    
    // Translate and rotate for switch drawing
    ctx.translate(switchStartX + Math.cos(angle) * (switchWidth/2), 
                 switchStartY + Math.sin(angle) * (switchWidth/2));
    ctx.rotate(angle);
    
    // Draw switch base (rectangle)
    ctx.beginPath();
    ctx.rect(-switchWidth/2, -switchHeight/2, switchWidth, switchHeight);
    ctx.fillStyle = '#e0e0e0';
    ctx.fill();
    ctx.strokeStyle = '#666666';
    ctx.lineWidth = 1;
    ctx.stroke();
    
    // Draw switch lever
    ctx.beginPath();
    if (type === 'switch_no') {
        // Normally Open: disconnected unless pressed
        if (isPressed) {
            // Connected position
            ctx.moveTo(-switchWidth/4, -switchHeight/4);
            ctx.lineTo(switchWidth/4, -switchHeight/4);
        } else {
            // Disconnected position
            ctx.moveTo(-switchWidth/4, -switchHeight/4);
            ctx.lineTo(switchWidth/4, switchHeight/4);
        }
    } else {
        // Normally Closed: connected unless pressed
        if (isPressed) {
            // Disconnected position
            ctx.moveTo(-switchWidth/4, -switchHeight/4);
            ctx.lineTo(switchWidth/4, switchHeight/4);
        } else {
            // Connected position
            ctx.moveTo(-switchWidth/4, -switchHeight/4);
            ctx.lineTo(switchWidth/4, -switchHeight/4);
        }
    }
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Draw connection points
    ctx.beginPath();
    ctx.arc(-switchWidth/4, -switchHeight/4, 3, 0, Math.PI * 2);
    ctx.arc(switchWidth/4, -switchHeight/4, 3, 0, Math.PI * 2);
    ctx.fillStyle = '#000000';
    ctx.fill();
    
    // Restore context
    ctx.restore();
}

function drawComponent(startX, startY, endX, endY, type, startDot = null, endDot = null) {
    if (type === 'led') {
        drawLED(startX, startY, endX, endY, startDot, endDot);
    } else if (type === 'wire') {
        drawWire(startX, startY, endX, endY, startDot, endDot);
    } else if (type === 'switch_no' || type === 'switch_nc') {
        const switchId = getSwitchId(startDot, endDot);
        const isPressed = switches.get(switchId)?.pressed || false;
        drawSwitch(startX, startY, endX, endY, type, startDot, endDot, isPressed);
    } else {
        drawLine(startX, startY, endX, endY, type, startDot, endDot);
    }
}

function drawPowerRails() {
    const railHeight = CELL_HEIGHT * 0.6;
    const lineWidth = 2;
    const labelPadding = 35;
    
    // Top VCC rail (first row)
    ctx.beginPath();
    ctx.rect(PADDING - labelPadding, PADDING - railHeight/2, 
             CANVAS_WIDTH - 2 * (PADDING - labelPadding), railHeight);
    ctx.fillStyle = '#ffeeee';
    ctx.fill();
    ctx.strokeStyle = '#ff0000';
    ctx.lineWidth = 1;
    ctx.stroke();
    
    // Top GND rail (second row)
    const topGndY = PADDING + CELL_HEIGHT;
    ctx.beginPath();
    ctx.rect(PADDING - labelPadding, topGndY - railHeight/2,
             CANVAS_WIDTH - 2 * (PADDING - labelPadding), railHeight);
    ctx.fillStyle = '#eeeeff';
    ctx.fill();
    ctx.strokeStyle = '#0000ff';
    ctx.lineWidth = 1;
    ctx.stroke();
    
    // Bottom VCC rail (last row)
    const bottomVccY = CANVAS_HEIGHT - PADDING;
    ctx.beginPath();
    ctx.rect(PADDING - labelPadding, bottomVccY - railHeight/2,
             CANVAS_WIDTH - 2 * (PADDING - labelPadding), railHeight);
    ctx.fillStyle = '#ffeeee';
    ctx.fill();
    ctx.strokeStyle = '#ff0000';
    ctx.lineWidth = 1;
    ctx.stroke();
    
    // Bottom GND rail (second to last row)
    const bottomGndY = CANVAS_HEIGHT - PADDING - CELL_HEIGHT;
    ctx.beginPath();
    ctx.rect(PADDING - labelPadding, bottomGndY - railHeight/2,
             CANVAS_WIDTH - 2 * (PADDING - labelPadding), railHeight);
    ctx.fillStyle = '#eeeeff';
    ctx.fill();
    ctx.strokeStyle = '#0000ff';
    ctx.lineWidth = 1;
    ctx.stroke();
    
    // Add labels
    ctx.font = 'bold 20px Arial';  // Increased font size
    ctx.textAlign = 'center';
    
    // Function to draw ground symbol
    function drawGroundSymbol(x, y) {
        const symbolWidth = 8;   // Reduced from 12
        const lineSpacing = 3;   // Reduced from 4
        
        ctx.beginPath();
        // Horizontal line (moved up by lineSpacing)
        ctx.moveTo(x - symbolWidth, y - lineSpacing);
        ctx.lineTo(x + symbolWidth, y - lineSpacing);
        // Medium line (centered on dot)
        ctx.moveTo(x - symbolWidth * 0.7, y);
        ctx.lineTo(x + symbolWidth * 0.7, y);
        // Shortest line (moved down by lineSpacing)
        ctx.moveTo(x - symbolWidth * 0.4, y + lineSpacing);
        ctx.lineTo(x + symbolWidth * 0.4, y + lineSpacing);
        ctx.strokeStyle = '#0000ff';
        ctx.lineWidth = 2;  // Increased line width
        ctx.stroke();
    }
    
    // Left edge position
    const leftX = PADDING - labelPadding + 15;
    // Right edge position
    const rightX = CANVAS_WIDTH - PADDING + labelPadding - 15;
    
    // Draw VCC symbols (+)
    ctx.fillStyle = '#ff0000';
    // Top rail - align with first row of dots
    ctx.fillText('+', leftX, PADDING + 6);
    ctx.fillText('+', rightX, PADDING + 6);
    // Bottom rail - align with last row of dots
    ctx.fillText('+', leftX, bottomVccY + 6);
    ctx.fillText('+', rightX, bottomVccY + 6);
    
    // Draw GND symbols - align with second row and second-to-last row of dots
    drawGroundSymbol(leftX, topGndY);
    drawGroundSymbol(rightX, topGndY);
    drawGroundSymbol(leftX, bottomGndY);
    drawGroundSymbol(rightX, bottomGndY);
}

function drawCenterChannel() {
    // Calculate the y position for the center channel
    const row7Y = PADDING + 7 * CELL_HEIGHT;
    const channelX = PADDING - 25;
    const channelY = row7Y + CELL_HEIGHT/2 - 35;
    const channelWidth = CANVAS_WIDTH - 2 * (PADDING - 25);
    
    // Create gradient for 3D effect
    const gradient = ctx.createLinearGradient(0, channelY, 0, channelY + CENTER_GAP);
    gradient.addColorStop(0, '#e8e8e8');    // Lighter at top
    gradient.addColorStop(0.1, '#f8f8f8');  // Main color
    gradient.addColorStop(0.9, '#f8f8f8');  // Main color
    gradient.addColorStop(1, '#e0e0e0');    // Darker at bottom
    
    // Draw main channel with gradient
    ctx.beginPath();
    ctx.rect(channelX, channelY, channelWidth, CENTER_GAP);
    ctx.fillStyle = gradient;
    ctx.fill();
    
    // Add inner shadow at the top
    ctx.beginPath();
    ctx.rect(channelX, channelY, channelWidth, 2);
    ctx.fillStyle = 'rgba(0,0,0,0.1)';
    ctx.fill();
    
    // Add highlight at the bottom
    ctx.beginPath();
    ctx.rect(channelX, channelY, channelWidth, 2);
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.fill();
    
    // Add subtle side shadows
    ctx.beginPath();
    ctx.rect(channelX, channelY, 1, CENTER_GAP);
    ctx.rect(channelX + channelWidth - 1, channelY, 1, CENTER_GAP);
    ctx.fillStyle = 'rgba(0,0,0,0.05)';
    ctx.fill();
}

function drawRowLabels() {
    const labelPadding = 35;
    ctx.font = 'bold 14px Arial';  // Made font bold
    ctx.fillStyle = '#666666';
    
    // Letters for labels
    const letters = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'];
    
    // Calculate center positions for labels
    const leftLabelX = PADDING - labelPadding/2;
    const rightLabelX = CANVAS_WIDTH - PADDING + labelPadding/2;
    
    // Draw labels for rows 3-6 (before gap)
    for (let row = 2; row < 7; row++) {
        const y = PADDING + row * CELL_HEIGHT + 5;
        const letter = letters[row - 2];
        
        // Left side label
        ctx.textAlign = 'center';
        ctx.fillText(letter, leftLabelX, y);
        
        // Right side label
        ctx.fillText(letter, rightLabelX, y);
    }
    
    // Draw labels for rows 8-13 (after gap)
    for (let row = 7; row < 12; row++) {
        const y = PADDING + row * CELL_HEIGHT + CENTER_GAP + 5;
        const letter = letters[row - 2];
        
        // Left side label
        ctx.textAlign = 'center';
        ctx.fillText(letter, leftLabelX, y);
        
        // Right side label
        ctx.fillText(letter, rightLabelX, y);
    }
}

function drawColumnLabels() {
    ctx.font = 'bold 12px Arial';
    ctx.fillStyle = '#666666';
    ctx.textAlign = 'center';
    
    // Calculate vertical positions to center between dots and edge
    const topLabelY = PADDING - 20;  // Moved down 5px (from -25 to -20)
    const bottomLabelY = CANVAS_HEIGHT - PADDING + 30;
    
    // Draw numbers for each column
    for (let col = 0; col < GRID_COLS; col++) {
        const x = PADDING + col * CELL_WIDTH;
        const number = col + 1;
        
        // Top numbers
        ctx.fillText(number, x, topLabelY);
        
        // Bottom numbers
        ctx.fillText(number, x, bottomLabelY);
    }
}

function drawGrid() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw power rails first
    drawPowerRails();
    
    // Draw center channel
    drawCenterChannel();
    
    // Draw row labels
    drawRowLabels();
    
    // Draw column labels
    drawColumnLabels();
    
    // Draw dots with their indices FIRST
    dots.forEach((dot, index) => {
        const isHighlighted = isDragging && isNearDot(currentMousePos.x, currentMousePos.y, dot);
        drawDot(dot.x, dot.y, isHighlighted, dot.voltage, index);
    });
    
    // Draw placed transistors SECOND (moved up before lines)
    transistors.forEach((transistor, id) => {
        drawTransistor(transistor.x, transistor.y);
    });
    
    // Draw existing lines THIRD (after transistors)
    lines.forEach(line => {
        if (line.transistorConnection) {
            // Draw wire to/from transistor connection point
            ctx.beginPath();
            ctx.moveTo(line.start.x, line.start.y);
            ctx.lineTo(line.end.x, line.end.y);
            
            // Get the voltage of the connected dot
            const connectedDot = line.end;
            const voltage = getDotVoltage(connectedDot);
            
            // Set wire color based on voltage
            if (voltage === 9) {
                ctx.strokeStyle = '#ff4444';  // Red for VCC
            } else if (voltage === 0) {
                ctx.strokeStyle = '#4444ff';  // Blue for GND
            } else {
                ctx.strokeStyle = '#000000';  // Black for no voltage
            }
            
            ctx.lineWidth = 2;
            ctx.stroke();
        } else {
            drawComponent(line.start.x, line.start.y, line.end.x, line.end.y, 
                        line.type, line.start, line.end);
        }
    });
    
    // Draw transistor being placed LAST
    if (placingTransistor && currentTransistor) {
        drawTransistor(currentTransistor.x, currentTransistor.y, true);
    }
    
    // Draw line being dragged (always on top)
    if (isDragging) {
        if (selectedTransistorPoint) {
            const closestDot = findClosestDot(currentMousePos.x, currentMousePos.y);
            ctx.beginPath();
            ctx.moveTo(selectedTransistorPoint.x, selectedTransistorPoint.y);
            ctx.lineTo(currentMousePos.x, currentMousePos.y);
            
            // Color the wire being dragged based on the closest dot's voltage
            if (closestDot) {
                const voltage = getDotVoltage(closestDot);
                if (voltage === 9) {
                    ctx.strokeStyle = '#ff4444';  // Red for VCC
                } else if (voltage === 0) {
                    ctx.strokeStyle = '#4444ff';  // Blue for GND
                } else {
                    ctx.strokeStyle = '#000000';  // Black for no voltage
                }
            } else {
                ctx.strokeStyle = '#000000';  // Black when not near a dot
            }
            
            ctx.lineWidth = 2;
            ctx.stroke();
        } else if (startDot) {
            const closestDot = findClosestDot(currentMousePos.x, currentMousePos.y);
            drawComponent(startDot.x, startDot.y, currentMousePos.x, currentMousePos.y,
                         componentSelect.value, startDot, closestDot);
        }
    }
}

function isNearDot(x, y, dot) {
    const distance = Math.sqrt((x - dot.x) ** 2 + (y - dot.y) ** 2);
    return distance < DOT_RADIUS * 3;
}

function findClosestDot(x, y) {
    return dots.find(dot => isNearDot(x, y, dot));
}

// Event listeners
canvas.addEventListener('mousedown', (e) => {
    // Only handle left clicks
    if (e.button !== 0) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // First check if we clicked on a switch
    let clickedSwitch = false;
    lines.forEach(line => {
        if (line.type === 'switch_no' || line.type === 'switch_nc') {
            // Calculate switch center
            const dx = line.end.x - line.start.x;
            const dy = line.end.y - line.start.y;
            const switchCenterX = line.start.x + dx/2;
            const switchCenterY = line.start.y + dy/2;
            
            // Check if click is near switch
            const clickDist = Math.sqrt((x - switchCenterX)**2 + (y - switchCenterY)**2);
            if (clickDist < 20) { // Click detection radius
                clickedSwitch = true;
            }
        }
    });

    // If we clicked a switch, don't handle transistor placement
    if (clickedSwitch) {
        return;
    }
    
    if (componentSelect.value === 'transistor' && !currentTransistor) {
        // Start placing a transistor
        placingTransistor = true;
        currentTransistor = { x, y };
        drawGrid();
        return;
    }
    
    // Check for transistor connection points first
    selectedTransistorPoint = null;
    transistors.forEach((transistor, id) => {
        const points = {
            collector: { x: transistor.x, y: transistor.y - 20 },
            base: { x: transistor.x - 20, y: transistor.y },
            emitter: { x: transistor.x, y: transistor.y + 20 }
        };
        
        for (const [type, point] of Object.entries(points)) {
            const distance = Math.sqrt((x - point.x) ** 2 + (y - point.y) ** 2);
            if (distance < DOT_RADIUS * 2) {
                selectedTransistorPoint = { id, type, x: point.x, y: point.y };
                isDragging = true;
                return;
            }
        }
    });
    
    // If no transistor point was clicked, check for dots
    if (!selectedTransistorPoint) {
        const dot = findClosestDot(x, y);
        if (dot) {
            isDragging = true;
            startDot = dot;
        }
    }
});

canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    currentMousePos.x = e.clientX - rect.left;
    currentMousePos.y = e.clientY - rect.top;
    
    // Only redraw if we're actually doing something
    if (placingTransistor) {
        currentTransistor = { 
            x: currentMousePos.x, 
            y: currentMousePos.y 
        };
        drawGrid();
    } else if (isDragging && (startDot || selectedTransistorPoint)) {
        // Only draw dragging line if we have a valid start point
        drawGrid();
    }
});

// Modify the mouseup event listener
canvas.addEventListener('mouseup', (e) => {
    // Store current states before resetting
    const wasDragging = isDragging;
    const hadStartDot = startDot;
    const hadTransistorPoint = selectedTransistorPoint;
    
    // Reset all dragging states immediately
    isDragging = false;
    startDot = null;
    selectedTransistorPoint = null;

    if (placingTransistor) {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // Add transistor to the map
        const transistorId = `transistor_${Date.now()}`;
        transistors.set(transistorId, { 
            x, 
            y, 
            connections: { collector: null, base: null, emitter: null }
        });
        
        placingTransistor = false;
        currentTransistor = null;
        drawGrid();
        return;
    }
    
    if (wasDragging) {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const endDot = findClosestDot(x, y);
        
        // Handle connections between dots and transistor points
        if (hadTransistorPoint && endDot) {
            // Connect from transistor to dot
            const transistor = transistors.get(hadTransistorPoint.id);
            if (transistor) {
                // Check if there's already a connection to this terminal
                const existingLineIndex = lines.findIndex(line => 
                    line.transistorConnection &&
                    line.transistorConnection.id === hadTransistorPoint.id &&
                    line.transistorConnection.type === hadTransistorPoint.type
                );
                
                // Remove existing connection if there is one
                if (existingLineIndex !== -1) {
                    lines.splice(existingLineIndex, 1);
                }
                
                const newLine = {
                    start: { x: hadTransistorPoint.x, y: hadTransistorPoint.y },
                    end: endDot,
                    type: 'wire',
                    transistorConnection: {
                        id: hadTransistorPoint.id,
                        type: hadTransistorPoint.type
                    }
                };
                lines.push(newLine);
                transistor.connections[hadTransistorPoint.type] = endDot;
                
                // Only rebuild regular connections, not transistor ones
                initializeConnections();
                lines.forEach(line => {
                    if (!line.transistorConnection && line.type === 'wire') {
                        connectDots(dots.indexOf(line.start), dots.indexOf(line.end));
                    }
                });
                drawGrid();
            }
        } else if (hadStartDot && endDot && hadStartDot !== endDot) {
            // Original dot-to-dot connection logic
            const startIndex = dots.indexOf(hadStartDot);
            const endIndex = dots.indexOf(endDot);
            const startConnections = connections.get(startIndex);
            const endConnections = connections.get(endIndex);
            
            const hasStartPower = Array.from(startConnections).some(i => dots[i].voltage === 9);
            const hasStartGround = Array.from(startConnections).some(i => dots[i].voltage === 0);
            const hasEndPower = Array.from(endConnections).some(i => dots[i].voltage === 9);
            const hasEndGround = Array.from(endConnections).some(i => dots[i].voltage === 0);
            
            const isShortCircuit = (hasStartPower && hasEndGround) || (hasStartGround && hasEndPower);
            
            const newLine = {
                start: hadStartDot,
                end: endDot,
                type: componentSelect.value
            };
            
            if (componentSelect.value === 'wire' && isShortCircuit) {
                showWarningMessage();
                lines.push(newLine);
                setTimeout(() => {
                    const index = lines.indexOf(newLine);
                    if (index > -1) {
                        lines.splice(index, 1);
                        drawGrid();
                    }
                }, 1000);
            } else {
                lines.push(newLine);
                
                // Reinitialize and rebuild all connections
                initializeConnections();
                lines.forEach(line => {
                    if (!line.transistorConnection && line.type === 'wire') {
                        connectDots(dots.indexOf(line.start), dots.indexOf(line.end));
                    }
                });
            }
            drawGrid();
        }
    }
});

// Add click handler for switches
canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    
    // Check if click is near any switch
    lines.forEach(line => {
        if (line.type === 'switch_no' || line.type === 'switch_nc') {
            const switchId = getSwitchId(line.start, line.end);
            
            // Initialize switch state if it doesn't exist
            if (!switches.has(switchId)) {
                switches.set(switchId, { pressed: false });
            }
            
            const switchState = switches.get(switchId);
            
            // Calculate switch center
            const dx = line.end.x - line.start.x;
            const dy = line.end.y - line.start.y;
            const switchCenterX = line.start.x + dx/2;
            const switchCenterY = line.start.y + dy/2;
            
            // Check if click is near switch
            const clickDist = Math.sqrt((clickX - switchCenterX)**2 + (clickY - switchCenterY)**2);
            if (clickDist < 20) { // Click detection radius
                // Toggle switch state
                switchState.pressed = !switchState.pressed;
                
                // Reinitialize all connections
                initializeConnections();
                
                // Rebuild all connections
                lines.forEach(l => {
                    if (!l.transistorConnection) {  // Skip transistor connections
                        const startIndex = dots.indexOf(l.start);
                        const endIndex = dots.indexOf(l.end);
                        
                        // Only connect if both dots exist
                        if (startIndex !== -1 && endIndex !== -1) {
                            if (l.type === 'wire') {
                                connectDots(startIndex, endIndex);
                            } else if (l.type === 'switch_nc' && !switches.get(getSwitchId(l.start, l.end))?.pressed) {
                                connectDots(startIndex, endIndex);
                            } else if (l.type === 'switch_no' && switches.get(getSwitchId(l.start, l.end))?.pressed) {
                                connectDots(startIndex, endIndex);
                            }
                        }
                    }
                });
                
                // Handle transistor connections after regular connections are established
                rebuildAllConnections();
                
                drawGrid();
                return; // Exit after handling the clicked switch
            }
        }
    });
});

// Prevent default context menu and handle deletion
canvas.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    console.log('Right click at:', x, y);
    console.log('Number of transistors:', transistors.size);
    
    // Check for transistors first with a larger detection radius
    for (const [id, transistor] of transistors) {
        console.log('Checking transistor:', id, 'at', transistor.x, transistor.y);
        const centerDist = Math.sqrt((x - transistor.x) ** 2 + (y - transistor.y) ** 2);
        console.log('Distance to transistor:', centerDist);
        
        if (centerDist < 50) { // Much larger radius for testing
            console.log('Deleting transistor:', id);
            // Remove all wires connected to this transistor
            for (let i = lines.length - 1; i >= 0; i--) {
                if (lines[i].transistorConnection && lines[i].transistorConnection.id === id) {
                    lines.splice(i, 1);
                }
            }
            // Delete the transistor
            transistors.delete(id);
            // Reinitialize connections after deleting
            initializeConnections();
            rebuildAllConnections();
            drawGrid();
            return;
        }
    }
    
    // Check for other components (wires, resistors, LEDs, switches)
    for (let i = lines.length - 1; i >= 0; i--) {
        const line = lines[i];
        // Calculate center point of the component
        const centerX = (line.start.x + line.end.x) / 2;
        const centerY = (line.start.y + line.end.y) / 2;
        
        // Calculate distance from click to component center
        const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
        
        // If click is close enough to component, delete it
        if (distance < 20) { // Detection radius for components
            lines.splice(i, 1);
            // Reinitialize connections after deleting a component
            initializeConnections();
            rebuildAllConnections();
            drawGrid();
            break;
        }
    }
});

function getPointLabel(dot) {
    const row = Math.round((dot.y - PADDING) / CELL_HEIGHT);
    const col = Math.round((dot.x - PADDING) / CELL_WIDTH);
    return `(${col + 1}, ${row + 1})`;
}

function getComponentInfo(line) {
    const startPoint = getPointLabel(line.start);
    const endPoint = getPointLabel(line.end);
    
    if (line.type.startsWith('resistor_')) {
        const resistance = RESISTOR_VALUES[line.type] / 1000; // Convert to kΩ
        let info = `${resistance}kΩ Resistor from ${startPoint} to ${endPoint}`;
        if (line.voltage_drop !== undefined && line.current !== undefined) {
            info += ` (${line.voltage_drop.toFixed(1)}V, ${(line.current * 1000).toFixed(1)}mA)`;
        }
        return info;
    } else if (line.type === 'led') {
        let info = `LED from ${startPoint} (anode/+) to ${endPoint} (cathode/-)`;
        if (line.voltage_drop !== undefined && line.current !== undefined) {
            info += ` (${line.voltage_drop.toFixed(1)}V, ${(line.current * 1000).toFixed(1)}mA)`;
        }
        return info;
    } else if (line.type === 'wire') {
        return `Wire from ${startPoint} to ${endPoint}`;
    } else if (line.type === 'switch_no' || line.type === 'switch_nc') {
        const switchId = getSwitchId(line.start, line.end);
        const isPressed = switches.get(switchId)?.pressed || false;
        const switchType = line.type === 'switch_no' ? 'Normally Open' : 'Normally Closed';
        return `${switchType} Switch from ${startPoint} to ${endPoint} (${isPressed ? 'Pressed' : 'Released'})`;
    }
    return '';
}

function showCircuitConnections() {
    const circuitInfo = document.getElementById('circuitInfo');
    let html = '<h3>Circuit Connections:</h3>';
    
    // Show regular components
    if (lines.length > 0) {
        html += '<h4>Components:</h4><ul>';
        lines.forEach((line, index) => {
            if (!line.transistorConnection) {  // Skip transistor connections here
                const info = getComponentInfo(line);
                if (info) {
                    html += `<li>${info}</li>`;
                }
            }
        });
        html += '</ul>';
    }
    
    // Show transistors and their connections
    if (transistors.size > 0) {
        html += '<h4>Transistors:</h4><ul>';
        transistors.forEach((transistor, id) => {
            const state = getTransistorState(transistor);
            html += `<li>2N3904 NPN Transistor (${state.conducting ? 'ON' : 'OFF'}, Vbe: ${state.baseEmitterVoltage.toFixed(2)}V)<ul>`;
            
            // Show collector connection
            if (transistor.connections.collector) {
                html += `<li>Collector: Connected to ${getPointLabel(transistor.connections.collector)}</li>`;
            } else {
                html += '<li>Collector: Not connected</li>';
            }
            
            // Show base connection
            if (transistor.connections.base) {
                html += `<li>Base: Connected to ${getPointLabel(transistor.connections.base)}</li>`;
            } else {
                html += '<li>Base: Not connected</li>';
            }
            
            // Show emitter connection
            if (transistor.connections.emitter) {
                html += `<li>Emitter: Connected to ${getPointLabel(transistor.connections.emitter)}</li>`;
            } else {
                html += '<li>Emitter: Not connected</li>';
            }
            
            html += '</ul></li>';
        });
        html += '</ul>';
    }
    
    // Show power and ground connections
    html += '<h4>Power Connections:</h4><ul>';
    let powerConnections = 0;
    dots.forEach((dot, index) => {
        const voltage = getDotVoltage(dot);
        if (voltage === 9) {
            html += `<li>VCC (9V) at ${getPointLabel(dot)}</li>`;
            powerConnections++;
        } else if (voltage === 0) {
            html += `<li>GND (0V) at ${getPointLabel(dot)}</li>`;
            powerConnections++;
        }
    });
    if (powerConnections === 0) {
        html += '<li>No power or ground connections</li>';
    }
    html += '</ul>';
    
    if (lines.length === 0 && transistors.size === 0) {
        html += '<p>No components in the circuit.</p>';
    }
    
    circuitInfo.innerHTML = html;
    circuitInfo.style.display = 'block';
}

// Add button event listener
const showCircuitButton = document.getElementById('showCircuit');
showCircuitButton.addEventListener('click', showCircuitConnections);

// Initial draw
drawGrid();

function showWarningMessage() {
    const warningMessage = document.getElementById('warningMessage');
    
    // Clear any existing timeout
    if (warningTimeout) {
        clearTimeout(warningTimeout);
        warningMessage.style.opacity = '0';
    }
    
    // Show the warning
    warningMessage.style.opacity = '1';
    
    // Hide after 3 seconds
    warningTimeout = setTimeout(() => {
        warningMessage.style.opacity = '0';
    }, 3000);
}

function getSwitchId(startDot, endDot) {
    return `switch_${dots.indexOf(startDot)}_${dots.indexOf(endDot)}`;
}

// Update getDotVoltage to use the voltage map
function getDotVoltage(dot, voltageMap = null) {
    if (!dot) return null;
    const dotIndex = dots.indexOf(dot);
    if (dotIndex === -1) return null;
    
    const connectedDots = connections.get(dotIndex);
    if (!connectedDots) return null;
    
    // First check direct power/ground connections
    const hasVcc = Array.from(connectedDots).some(i => dots[i].voltage === 9);
    const hasGnd = Array.from(connectedDots).some(i => dots[i].voltage === 0);
    
    if (hasVcc) return 9;
    if (hasGnd) return 0;
    
    // If a voltage map is provided, use it
    if (voltageMap) {
        if (voltageMap.has(dotIndex)) {
            return voltageMap.get(dotIndex);
        }
        
        // Check connected dots for intermediate voltages
        for (const connectedDot of connectedDots) {
            if (voltageMap.has(connectedDot)) {
                return voltageMap.get(connectedDot);
            }
        }
    }
    
    return null;
}

// Add this function to calculate intermediate voltages for series components
function calculateIntermediateVoltages() {
    const voltageMap = new Map();
    const processedComponents = new Set();

    // Helper function to get all dots in a column
    function getColumnDots(dot) {
        const dotIndex = dots.indexOf(dot);
        if (dotIndex === -1) return new Set([dot]);
        
        const { row, col } = getRowCol(dotIndex);
        const columnDots = new Set([dot]);
        
        // If dot is in top half of breadboard (rows 2-6)
        if (row >= 2 && row <= 6) {
            for (let r = 2; r <= 6; r++) {
                const connectedDotIndex = getDotIndex(r, col);
                if (connectedDotIndex >= 0) {
                    columnDots.add(dots[connectedDotIndex]);
                }
            }
        }
        // If dot is in bottom half of breadboard (rows 7-11)
        else if (row >= 7 && row <= 11) {
            for (let r = 7; r <= 11; r++) {
                const connectedDotIndex = getDotIndex(r, col);
                if (connectedDotIndex >= 0) {
                    columnDots.add(dots[connectedDotIndex]);
                }
            }
        }
        
        return columnDots;
    }

    // First identify power and ground connections
    dots.forEach((dot, index) => {
        const connectedDots = connections.get(index);
        if (!connectedDots) return;
        
        const hasVcc = Array.from(connectedDots).some(i => dots[i].voltage === 9);
        const hasGnd = Array.from(connectedDots).some(i => dots[i].voltage === 0);
        
        if (hasVcc) {
            voltageMap.set(index, 9);
            // Set voltage for all dots in the same column
            getColumnDots(dot).forEach(columnDot => {
                voltageMap.set(dots.indexOf(columnDot), 9);
            });
        }
        else if (hasGnd) {
            voltageMap.set(index, 0);
            // Set voltage for all dots in the same column
            getColumnDots(dot).forEach(columnDot => {
                voltageMap.set(dots.indexOf(columnDot), 0);
            });
        }
    });

    // Helper function to find all components connected to a dot or its column
    function findConnectedComponents(dot) {
        const columnDots = getColumnDots(dot);
        return lines.filter(line => 
            !processedComponents.has(line) && 
            (columnDots.has(line.start) || columnDots.has(line.end))
        );
    }

    // Helper function to get the other end of a component
    function getOtherEnd(component, dot) {
        const columnDots = getColumnDots(dot);
        return columnDots.has(component.start) ? component.end : component.start;
    }

    // Helper function to trace path to ground
    function tracePath(startDot, pathSoFar = [], visited = new Set()) {
        const startColumnDots = getColumnDots(startDot);
        for (const dot of startColumnDots) {
            if (visited.has(dot)) return null;
            visited.add(dot);
        }

        // Check if we've reached ground
        const startVoltage = getDotVoltage(startDot, voltageMap);
        if (startVoltage === 0) {
            return pathSoFar;
        }

        // Find all unprocessed components connected to this dot or its column
        const connectedComponents = findConnectedComponents(startDot);
        
        for (const component of connectedComponents) {
            const otherEnd = getOtherEnd(component, startDot);
            const newPath = [...pathSoFar, { component, startDot, endDot: otherEnd }];
            const result = tracePath(otherEnd, newPath, visited);
            if (result) return result;
        }

        return null;
    }

    // Process each power connection
    dots.forEach((dot, index) => {
        if (getDotVoltage(dot, voltageMap) === 9) {
            const path = tracePath(dot);
            if (!path) return;

            // Calculate total resistance and fixed voltage drops
            let totalResistance = 0;
            let fixedVoltageDrops = 0;

            path.forEach(({ component }) => {
                if (component.type.startsWith('resistor_')) {
                    totalResistance += RESISTOR_VALUES[component.type];
                } else if (component.type === 'led') {
                    totalResistance += 1000; // LED internal resistance
                    fixedVoltageDrops += LED_CHARACTERISTICS.forwardVoltage;
                }
                processedComponents.add(component);
            });

            // Calculate current and voltage drops
            const availableVoltage = 9 - fixedVoltageDrops;
            if (availableVoltage <= 0) return;

            const current = Math.min(
                availableVoltage / totalResistance,
                LED_CHARACTERISTICS.maxCurrent
            );

            if (current < LED_CHARACTERISTICS.minCurrent) return;

            // Apply voltage drops along the path
            let currentVoltage = 9;
            path.forEach(({ component, startDot, endDot }) => {
                let voltageDrop;
                if (component.type === 'led') {
                    voltageDrop = LED_CHARACTERISTICS.forwardVoltage;
                    component.current = current;
                } else if (component.type.startsWith('resistor_')) {
                    voltageDrop = current * RESISTOR_VALUES[component.type];
                    component.current = current;
                }

                component.voltage_drop = voltageDrop;
                currentVoltage -= voltageDrop;

                // Store intermediate voltage for all dots in the column
                const endColumnDots = getColumnDots(endDot);
                endColumnDots.forEach(columnDot => {
                    voltageMap.set(dots.indexOf(columnDot), currentVoltage);
                });
            });
        }
    });

    return voltageMap;
}

// Update calculateCircuitValues to use the new voltage calculations
function calculateCircuitValues() {
    // Reset all calculated values
    lines.forEach(line => {
        if (line.type.startsWith('resistor_')) {
            line.voltage_drop = 0;
            line.current = 0;
        }
    });
    
    // Calculate intermediate voltages
    const voltageMap = calculateIntermediateVoltages();
    
    // Calculate for each resistor
    lines.forEach(line => {
        if (line.type.startsWith('resistor_')) {
            const startIndex = dots.indexOf(line.start);
            const endIndex = dots.indexOf(line.end);
            
            if (startIndex !== -1 && endIndex !== -1) {
                const startVoltage = getDotVoltage(line.start, voltageMap);
                const endVoltage = getDotVoltage(line.end, voltageMap);
                
                if (startVoltage !== null && endVoltage !== null) {
                    const resistance = RESISTOR_VALUES[line.type];
                    line.voltage_drop = Math.abs(startVoltage - endVoltage);
                    line.current = line.voltage_drop / resistance;
                }
            }
        }
    });
}

function getTransistorState(transistor) {
    // Get voltages at each terminal
    const collectorVoltage = transistor.connections.collector ? getDotVoltage(transistor.connections.collector) : null;
    const baseVoltage = transistor.connections.base ? getDotVoltage(transistor.connections.base) : null;
    const emitterVoltage = transistor.connections.emitter ? getDotVoltage(transistor.connections.emitter) : null;
    
    // Check if we have all necessary voltages
    if (baseVoltage === null || emitterVoltage === null) {
        return { conducting: false, baseEmitterVoltage: 0 };
    }
    
    // Calculate base-emitter voltage
    const vbe = baseVoltage - emitterVoltage;
    
    // Transistor conducts when Vbe > 0.7V
    const conducting = vbe >= 0.7;
    
    return { conducting, baseEmitterVoltage: vbe };
}

function drawTransistor(x, y, isPlacing = false) {
    const size = 40; // Size of the transistor symbol
    const backgroundSize = size * 1.8; // Larger background to include labels
    
    // Get transistor instance if this isn't a new placement
    let transistorState = { conducting: false, baseEmitterVoltage: 0 };
    if (!isPlacing) {
        const transistorId = Array.from(transistors.keys()).find(id => 
            transistors.get(id).x === x && transistors.get(id).y === y);
        if (transistorId) {
            transistorState = getTransistorState(transistors.get(transistorId));
        }
    }
    
    // Save context
    ctx.save();
    ctx.translate(x, y);
    
    // Draw large background circle with color based on conduction state
    ctx.beginPath();
    ctx.arc(0, 0, backgroundSize/2, 0, Math.PI * 2);
    ctx.fillStyle = transistorState.conducting ? '#e6ffe6' : '#ffe6e6';  // Green when conducting, red when off
    ctx.fill();
    
    // Draw transistor symbol circle
    ctx.beginPath();
    ctx.arc(0, 0, size/2, 0, Math.PI * 2);
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Get transistor connections and their voltages
    const transistorId = Array.from(transistors.keys()).find(id => 
        transistors.get(id).x === x && transistors.get(id).y === y);
    const transistor = transistors.get(transistorId);
    const connections = transistor ? transistor.connections : { collector: null, base: null, emitter: null };
    
    // Function to determine connection point color
    function getConnectionColor(connectedDot) {
        if (!connectedDot) return isPlacing ? '#ff4444' : '#000000';
        const voltage = getDotVoltage(connectedDot);
        if (voltage === 9) return '#ff4444';  // Red for VCC
        if (voltage === 0) return '#4444ff';  // Blue for GND
        return '#000000';  // Black for no voltage
    }
    
    // Draw connection points as small circles with appropriate colors
    const connectionRadius = 4;
    
    // Collector connection point (top)
    ctx.beginPath();
    ctx.arc(0, -size/2, connectionRadius, 0, Math.PI * 2);
    ctx.fillStyle = getConnectionColor(connections.collector);
    ctx.fill();
    
    // Base connection point (left)
    ctx.beginPath();
    ctx.arc(-size/2, 0, connectionRadius, 0, Math.PI * 2);
    ctx.fillStyle = getConnectionColor(connections.base);
    ctx.fill();
    
    // Emitter connection point (bottom)
    ctx.beginPath();
    ctx.arc(0, size/2, connectionRadius, 0, Math.PI * 2);
    ctx.fillStyle = getConnectionColor(connections.emitter);
    ctx.fill();
    
    // Draw arrow for NPN
    const arrowSize = 10;
    ctx.beginPath();
    ctx.moveTo(0, size/4);
    ctx.lineTo(-arrowSize/2, size/4 - arrowSize);
    ctx.moveTo(0, size/4);
    ctx.lineTo(arrowSize/2, size/4 - arrowSize);
    ctx.strokeStyle = '#000000';
    ctx.stroke();
    
    // Add labels
    ctx.font = '12px Arial';
    ctx.fillStyle = '#000000';
    ctx.textAlign = 'center';
    
    // Position labels closer to their connection points
    const labelOffset = 8; // Reduced from 15
    ctx.fillText('C', 0, -size/2 - labelOffset + 3); // Collector (moved down 3px)
    ctx.fillText('B', -size/2 - labelOffset - 2, 0 + 5); // Base (moved down 5px and left 2px)
    ctx.fillText('E', 0, size/2 + labelOffset + 6); // Emitter (moved down 6px total)
    
    // Add model number
    ctx.font = '10px Arial';
    ctx.fillText('2N3904', 0, 0);
    
    // Add conduction state and Vbe
    ctx.font = '10px Arial';
    ctx.fillStyle = '#000000';
    if (!isPlacing) {
        ctx.fillText(`Vbe: ${transistorState.baseEmitterVoltage.toFixed(1)}V`, 0, size/2 + 15);
        ctx.fillText(transistorState.conducting ? 'ON' : 'OFF', 0, -size/2 - 15);
    }
    
    // Restore context
    ctx.restore();
    
    // Return connection points coordinates
    return {
        collector: { x: x, y: y - size/2 },
        base: { x: x - size/2, y: y },
        emitter: { x: x, y: y + size/2 }
    };
}

// Update rebuildAllConnections function
function rebuildAllConnections() {
    // First clear all existing connections
    initializeConnections();
    
    // Handle regular wire connections first
    lines.forEach(line => {
        if (!line.transistorConnection && line.type === 'wire') {
            connectDots(dots.indexOf(line.start), dots.indexOf(line.end));
        }
    });
    
    // Handle switch connections
    lines.forEach(line => {
        if (!line.transistorConnection) {
            if (line.type === 'switch_nc' && !switches.get(getSwitchId(line.start, line.end))?.pressed) {
                connectDots(dots.indexOf(line.start), dots.indexOf(line.end));
            } else if (line.type === 'switch_no' && switches.get(getSwitchId(line.start, line.end))?.pressed) {
                connectDots(dots.indexOf(line.start), dots.indexOf(line.end));
            }
        }
    });
    
    // Handle transistor conduction
    transistors.forEach((transistor, id) => {
        const state = getTransistorState(transistor);
        if (state.conducting && transistor.connections.collector && transistor.connections.emitter) {
            const collectorDotIndex = dots.indexOf(transistor.connections.collector);
            const emitterDotIndex = dots.indexOf(transistor.connections.emitter);
            if (collectorDotIndex !== -1 && emitterDotIndex !== -1) {
                connectDots(collectorDotIndex, emitterDotIndex);
            }
        }
    });
    
    // Calculate voltage drops and currents for resistors and LEDs
    calculateCircuitValues();
    
    // Redraw the grid to show updated values
    drawGrid();
} 