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

function drawLine(startX, startY, endX, endY) {
    // Calculate the angle and length of the line
    const dx = endX - startX;
    const dy = endY - startY;
    const angle = Math.atan2(dy, dx);
    const length = Math.sqrt(dx * dx + dy * dy);
    
    // Resistor dimensions
    const bodyLength = Math.min(60, length * 0.6);
    const bodyWidth = 16;
    const bandWidth = 6;
    const bandGap = (bodyLength - 5 * bandWidth) / 4; // Space between bands
    
    // Calculate resistor position
    const startWireLength = (length - bodyLength) / 2;
    const resistorStartX = startX + Math.cos(angle) * startWireLength;
    const resistorStartY = startY + Math.sin(angle) * startWireLength;
    
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
    
    // Save the current context state
    ctx.save();
    
    // Translate and rotate the context to draw the resistor body
    ctx.translate(resistorStartX, resistorStartY);
    ctx.rotate(angle);
    
    // Draw resistor body (beige color with slight gradient for 3D effect)
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
    
    // Generate random 4-band color code (for demonstration)
    const bandPositions = [
        bandWidth/2,
        bandWidth/2 + bandWidth + bandGap,
        bandWidth/2 + 2 * (bandWidth + bandGap),
        bodyLength - bandWidth * 1.5
    ];
    
    // Draw the bands
    const bandValues = [
        Math.floor(Math.random() * 10),
        Math.floor(Math.random() * 10),
        Math.floor(Math.random() * 10),
        2  // Gold band for 5% tolerance
    ];
    
    bandPositions.forEach((pos, index) => {
        ctx.beginPath();
        ctx.rect(pos, -bodyWidth/2, bandWidth, bodyWidth);
        ctx.fillStyle = index === 3 ? '#FFD700' : RESISTOR_COLORS[bandValues[index]];
        ctx.fill();
    });
    
    // Restore the context state
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
    
    // Check if LED is properly connected through the breadboard
    const startIndex = dots.indexOf(startDot);
    const endIndex = dots.indexOf(endDot);
    const startConnections = connections.get(startIndex);
    const endConnections = connections.get(endIndex);
    
    const hasStartPower = Array.from(startConnections).some(i => dots[i].voltage === 9);
    const hasEndGround = Array.from(endConnections).some(i => dots[i].voltage === 0);
    
    const isProperlyConnected = hasStartPower && hasEndGround;
    
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
        -radius * 0.3, -radius * 0.3, radius * 0.1,  // Inner circle (highlight)
        0, 0, radius                                  // Outer circle
    );

    if (isProperlyConnected) {
        // Bright glowing LED when properly connected
        gradient.addColorStop(0, '#ffffff');    // Bright white center
        gradient.addColorStop(0.2, '#ffcccc');  // Very bright red
        gradient.addColorStop(0.7, '#ff3333');  // Bright red
        gradient.addColorStop(1, '#cc0000');    // Darker red edge
        
        // Add outer glow effect
        ctx.shadowColor = '#ff0000';
        ctx.shadowBlur = 15;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
    } else {
        // Regular unlit LED
        gradient.addColorStop(0, '#ff9999');    // Regular highlight
        gradient.addColorStop(0.3, '#ff0000');  // Main red color
        gradient.addColorStop(1, '#990000');    // Darker edge
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

// Modify the drawWire function to always draw the wire
function drawWire(startX, startY, endX, endY, startDot, endDot, isCurrentWire = false) {
    const startIndex = dots.indexOf(startDot);
    const endIndex = dots.indexOf(endDot);
    const startConnections = connections.get(startIndex);
    const endConnections = connections.get(endIndex);
    
    const hasStartPower = Array.from(startConnections).some(i => dots[i].voltage === 9);
    const hasStartGround = Array.from(startConnections).some(i => dots[i].voltage === 0);
    const hasEndPower = Array.from(endConnections).some(i => dots[i].voltage === 9);
    const hasEndGround = Array.from(endConnections).some(i => dots[i].voltage === 0);
    
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
        drawLine(startX, startY, endX, endY); // Original resistor drawing function
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
    ctx.rect(channelX, channelY + CENTER_GAP - 2, channelWidth, 2);
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
    
    // Draw existing lines
    lines.forEach(line => {
        drawComponent(line.start.x, line.start.y, line.end.x, line.end.y, line.type, line.start, line.end);
    });

    // Draw dots with their indices
    dots.forEach((dot, index) => {
        const isHighlighted = isDragging && isNearDot(currentMousePos.x, currentMousePos.y, dot);
        drawDot(dot.x, dot.y, isHighlighted, dot.voltage, index);
    });

    // Draw line being dragged
    if (isDragging && startDot) {
        const closestDot = findClosestDot(currentMousePos.x, currentMousePos.y);
        drawComponent(startDot.x, startDot.y, currentMousePos.x, currentMousePos.y, 
                     componentSelect.value, startDot, closestDot);
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
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const dot = findClosestDot(x, y);
    if (dot) {
        isDragging = true;
        startDot = dot;
    }
});

canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    currentMousePos.x = e.clientX - rect.left;
    currentMousePos.y = e.clientY - rect.top;
    
    if (isDragging) {
        drawGrid();
    }
});

// Modify the mouseup event listener to handle switches
canvas.addEventListener('mouseup', (e) => {
    if (isDragging) {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const endDot = findClosestDot(x, y);
        if (endDot && endDot !== startDot) {
            const startIndex = dots.indexOf(startDot);
            const endIndex = dots.indexOf(endDot);
            const startConnections = connections.get(startIndex);
            const endConnections = connections.get(endIndex);
            
            const hasStartPower = Array.from(startConnections).some(i => dots[i].voltage === 9);
            const hasStartGround = Array.from(startConnections).some(i => dots[i].voltage === 0);
            const hasEndPower = Array.from(endConnections).some(i => dots[i].voltage === 9);
            const hasEndGround = Array.from(endConnections).some(i => dots[i].voltage === 0);
            
            const isShortCircuit = (hasStartPower && hasEndGround) || (hasStartGround && hasEndPower);
            
            const newLine = {
                start: startDot,
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
                if (componentSelect.value === 'wire') {
                    connectDots(dots.indexOf(startDot), dots.indexOf(endDot));
                } else if (componentSelect.value === 'switch_nc') {
                    // For normally closed switch, connect dots initially
                    const switchId = getSwitchId(startDot, endDot);
                    switches.set(switchId, { pressed: false });
                    connectDots(dots.indexOf(startDot), dots.indexOf(endDot));
                } else if (componentSelect.value === 'switch_no') {
                    // For normally open switch, don't connect dots initially
                    const switchId = getSwitchId(startDot, endDot);
                    switches.set(switchId, { pressed: false });
                }
            }
        }
        
        isDragging = false;
        startDot = null;
        drawGrid();
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
            const switchState = switches.get(switchId);
            
            // Calculate switch center
            const dx = line.end.x - line.start.x;
            const dy = line.end.y - line.start.y;
            const length = Math.sqrt(dx * dx + dy * dy);
            const switchCenterX = line.start.x + dx/2;
            const switchCenterY = line.start.y + dy/2;
            
            // Check if click is near switch
            const clickDist = Math.sqrt((clickX - switchCenterX)**2 + (clickY - switchCenterY)**2);
            if (clickDist < 20) { // Click detection radius
                // Toggle switch state
                switchState.pressed = !switchState.pressed;
                
                // Update connections based on switch type and state
                const startIndex = dots.indexOf(line.start);
                const endIndex = dots.indexOf(line.end);
                
                if (line.type === 'switch_no') {
                    if (switchState.pressed) {
                        connectDots(startIndex, endIndex);
                    } else {
                        // Disconnect dots (recreate connections)
                        initializeConnections();
                        lines.forEach(l => {
                            if (l !== line && l.type === 'wire') {
                                connectDots(dots.indexOf(l.start), dots.indexOf(l.end));
                            } else if (l !== line && l.type === 'switch_nc' && !switches.get(getSwitchId(l.start, l.end)).pressed) {
                                connectDots(dots.indexOf(l.start), dots.indexOf(l.end));
                            } else if (l !== line && l.type === 'switch_no' && switches.get(getSwitchId(l.start, l.end)).pressed) {
                                connectDots(dots.indexOf(l.start), dots.indexOf(l.end));
                            }
                        });
                    }
                } else { // switch_nc
                    if (switchState.pressed) {
                        // Disconnect dots (recreate connections)
                        initializeConnections();
                        lines.forEach(l => {
                            if (l !== line && l.type === 'wire') {
                                connectDots(dots.indexOf(l.start), dots.indexOf(l.end));
                            } else if (l !== line && l.type === 'switch_nc' && !switches.get(getSwitchId(l.start, l.end)).pressed) {
                                connectDots(dots.indexOf(l.start), dots.indexOf(l.end));
                            } else if (l !== line && l.type === 'switch_no' && switches.get(getSwitchId(l.start, l.end)).pressed) {
                                connectDots(dots.indexOf(l.start), dots.indexOf(l.end));
                            }
                        });
                    } else {
                        connectDots(startIndex, endIndex);
                    }
                }
                
                drawGrid();
            }
        }
    });
});

function getPointLabel(dot) {
    const row = Math.round((dot.y - PADDING) / CELL_HEIGHT);
    const col = Math.round((dot.x - PADDING) / CELL_WIDTH);
    return `(${col + 1}, ${row + 1})`;
}

function getComponentInfo(line) {
    const startPoint = getPointLabel(line.start);
    const endPoint = getPointLabel(line.end);
    const type = line.type.charAt(0).toUpperCase() + line.type.slice(1);
    
    if (line.type === 'resistor') {
        return `${type} from ${startPoint} to ${endPoint}`;
    } else if (line.type === 'led') {
        return `${type} from ${startPoint} (anode/+) to ${endPoint} (cathode/-)`;
    }
    return '';
}

function showCircuitConnections() {
    const circuitInfo = document.getElementById('circuitInfo');
    
    if (lines.length === 0) {
        circuitInfo.innerHTML = '<p>No components in the circuit.</p>';
        circuitInfo.style.display = 'block';
        return;
    }
    
    let html = '<h3>Circuit Connections:</h3><ul>';
    lines.forEach((line, index) => {
        html += `<li>${getComponentInfo(line)}</li>`;
    });
    html += '</ul>';
    
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