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
let lines = [];
let isDragging = false;
let startDot = null;
let currentMousePos = { x: 0, y: 0 };
let warningTimeout = null;  // Add warning timeout variable here

// Component type selector
const componentSelect = document.getElementById('componentType');

// Track electrical connections
const connections = new Map(); // Map of dot index to set of connected dot indices

// Add after the component type selector
let meltingWire = null;
let meltingProgress = 0;
let meltingAnimationId = null;
let smokeParticles = [];


// Add this with other constants at the top of the file
const LED_CHARACTERISTICS = {
    vf: 2.0,          // Forward voltage drop in volts (typical for red LED)
    minCurrent: 0.001, // Minimum visible current in amperes (1mA)
    maxCurrent: 0.020, // Maximum current in amperes (20mA)
    resistance: 100    // Series resistance after forward voltage drop (ohms)
};

// Add switch states tracking
const switches = new Map(); // Map to track switch states (pressed or not)
let nextSwitchId = 0;

const transistors = new Map(); // Map to track transistor states (on or off)
let nextTransistorId = 0;

const transistorTerminals = new Map();

// Update transistor characteristics to focus on switching behavior
const TRANSISTOR_CHARACTERISTICS = {
    nmos: {
        vth: 2.0,          // Threshold voltage
        onResistance: 100, // Resistance when ON (ohms)
        offResistance: 1e6 // Resistance when OFF (mega ohm)
    },
    pmos: {
        vth: 7.0,          // Threshold voltage (for 9V system)
        onResistance: 100, 
        offResistance: 1e6
    },
    channelLength: 40,  // Visual length of the channel
    gateWidth: 30      // Visual width of the gate
};

// Add after the existing state variables at the top
let autoCompute = true; // Default to true for automatic computation

// Add after the existing HTML elements
const autoComputeToggle = document.createElement('button');
autoComputeToggle.textContent = 'Auto Compute: ON';
autoComputeToggle.style.marginLeft = '20px';  // Match existing button margin
autoComputeToggle.style.padding = '5px 10px';  // Match existing button padding
autoComputeToggle.style.backgroundColor = '#4CAF50';  // Match existing button color
autoComputeToggle.style.color = 'white';
autoComputeToggle.style.border = 'none';
autoComputeToggle.style.borderRadius = '3px';  // Match existing button border radius
autoComputeToggle.style.cursor = 'pointer';

// Add hover effects to match existing buttons
autoComputeToggle.addEventListener('mouseover', () => {
    autoComputeToggle.style.backgroundColor = '#45a049';
});

autoComputeToggle.addEventListener('mouseout', () => {
    autoComputeToggle.style.backgroundColor = autoCompute ? '#4CAF50' : '#f44336';
});

// Add toggle handler
autoComputeToggle.addEventListener('click', () => {
    autoCompute = !autoCompute;
    autoComputeToggle.textContent = `Auto Compute: ${autoCompute ? 'ON' : 'OFF'}`;
    autoComputeToggle.style.backgroundColor = autoCompute ? '#4CAF50' : '#f44336';
});

// Add the computation feedback element
const computationFeedback = document.createElement('div');
computationFeedback.style.position = 'fixed';
computationFeedback.style.top = '20px';
computationFeedback.style.right = '20px';
computationFeedback.style.padding = '10px 20px';
computationFeedback.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
computationFeedback.style.color = 'white';
computationFeedback.style.borderRadius = '4px';
computationFeedback.style.display = 'none';
computationFeedback.style.zIndex = '1000';
computationFeedback.textContent = 'Computing circuit...';
document.body.appendChild(computationFeedback);

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
    // Check if indices are valid
    if (index1 === -1 || index2 === -1) return;
    
    // Get the initial sets
    const set1 = connections.get(index1);
    const set2 = connections.get(index2);
    
    // If either set doesn't exist, we can't make a connection
    if (!set1 || !set2) return;
    
    // Get row and column for both dots
    const { row: row1, col: col1 } = getRowCol(index1);
    const { row: row2, col: col2 } = getRowCol(index2);
    
    // Create the merged set
    const mergedSet = new Set([...set1, ...set2]);
    
    // If either dot is in a breadboard row (not power rails), connect all dots in that column
    if ((row1 >= 2 && row1 <= 6) || (row1 >= 7 && row1 <= 11)) {
        // Add all dots in the same column for the first dot
        const startRow = row1 >= 7 ? 7 : 2;
        const endRow = row1 >= 7 ? 11 : 6;
        for (let r = startRow; r <= endRow; r++) {
            const columnDotIndex = getDotIndex(r, col1);
            mergedSet.add(columnDotIndex);
            const columnDotSet = connections.get(columnDotIndex);
            if (columnDotSet) {
                for (const dotIndex of columnDotSet) {
                    mergedSet.add(dotIndex);
                }
            }
        }
    }
    
    if ((row2 >= 2 && row2 <= 6) || (row2 >= 7 && row2 <= 11)) {
        // Add all dots in the same column for the second dot
        const startRow = row2 >= 7 ? 7 : 2;
        const endRow = row2 >= 7 ? 11 : 6;
        for (let r = startRow; r <= endRow; r++) {
            const columnDotIndex = getDotIndex(r, col2);
            mergedSet.add(columnDotIndex);
            const columnDotSet = connections.get(columnDotIndex);
            if (columnDotSet) {
                for (const dotIndex of columnDotSet) {
                    mergedSet.add(dotIndex);
                }
            }
        }
    }
    
    // Update all dots in the merged set to point to the new merged set
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
        dots.push({
            x: PADDING + col * CELL_WIDTH,
            y: PADDING + row * CELL_HEIGHT + extraGap
        });
    }
}

// Add to the end of the initialize dots section:
initializeConnections();

// Add helper function for color interpolation
function interpolateColor(voltage) {
    if (voltage === null) return '#333333';  // Default gray for no voltage
    if (voltage === 9) return '#ff4444';     // VCC - red
    if (voltage === 0) return '#4444ff';     // GND - blue
    
    // Normalize voltage to 0-1 range
    const t = voltage / 9;
    
    // RGB components for interpolation
    const r = Math.round(68 + (255 - 68) * t);    // 68 to 255  (from blue to red)
    const g = Math.round(68 + (68 - 68) * t);     // 68 to 68   (keep green low)
    const b = Math.round(255 - (255 - 68) * t);   // 255 to 68  (from blue to red)
    
    return `rgb(${r}, ${g}, ${b})`;
}

// Draw functions
function drawDot(x, y, isHighlighted = false) {
    ctx.beginPath();
    ctx.arc(x, y, DOT_RADIUS, 0, Math.PI * 2);
    
    // Get the dot from coordinates
    const dot = dots.find(d => d.x === x && d.y === y);
    if (dot) {
        // Get the dot's row
        const dotIndex = dots.indexOf(dot);
        const row = Math.floor(dotIndex / GRID_COLS);
        
        if (isHighlighted) {
            ctx.fillStyle = '#ff4444';  // Keep highlighted dots red
        } else if (row === 0 || row === GRID_ROWS - 1) {
            ctx.fillStyle = '#ff4444';  // VCC rails always red
        } else if (row === 1 || row === GRID_ROWS - 2) {
            ctx.fillStyle = '#4444ff';  // GND rails always blue
        } else {
            // For middle rows (a-j), only color if they have a voltage
            if (dot.voltage !== undefined && dot.voltage !== null) {
                ctx.fillStyle = interpolateColor(dot.voltage);
            } else {
                ctx.fillStyle = '#333333';  // Default gray for unconnected dots
            }
        }
    } else {
        ctx.fillStyle = isHighlighted ? '#ff4444' : '#333333';
    }
    
    ctx.fill();
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
    
    // Get voltage and current from voltage map
    let isProperlyConnected = false;
    let current = 0;
    let actualVoltage = 0;

    if (startDot && endDot) {
        const voltageMap = calculateIntermediateVoltages();
        const startVoltage = getDotVoltage(startDot, voltageMap);
        const endVoltage = getDotVoltage(endDot, voltageMap);
        
        if (startVoltage !== null && endVoltage !== null) {
            const voltageDiff = Math.abs(startVoltage - endVoltage);
            actualVoltage = voltageDiff;
            
            if (voltageDiff >= LED_CHARACTERISTICS.vf) {
                const remainingVoltage = voltageDiff - LED_CHARACTERISTICS.vf;
                current = remainingVoltage / LED_CHARACTERISTICS.resistance;
                isProperlyConnected = current >= LED_CHARACTERISTICS.minCurrent;
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
    
    // Save context for LED drawing
    ctx.save();
    
    // Translate to LED center and rotate
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
        const brightnessFactor = 0.3 + (0.7 * brightness);
        
        gradient.addColorStop(0, `rgba(255, 255, 255, ${brightnessFactor})`);
        gradient.addColorStop(0.2, `rgba(255, 204, 204, ${brightnessFactor})`);
        gradient.addColorStop(0.7, `rgba(255, 51, 51, ${brightnessFactor})`);
        gradient.addColorStop(1, `rgba(204, 0, 0, ${brightnessFactor})`);
        
        ctx.shadowColor = '#ff0000';
        ctx.shadowBlur = 15 * brightnessFactor;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
    } else {
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
    
    // Draw enhanced polarity indicators
    const symbolSize = radius * 0.6;
    ctx.strokeStyle = '#800000';
    ctx.fillStyle = '#800000';
    ctx.lineWidth = 2;
    ctx.shadowBlur = 0;
    
    // Plus symbol (anode)
    ctx.beginPath();
    ctx.arc(-radius * 1.6, 0, 8, 0, Math.PI * 2);
    ctx.fillStyle = 'white';
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-radius * 1.6 - 4, 0);
    ctx.lineTo(-radius * 1.6 + 4, 0);
    ctx.moveTo(-radius * 1.6, -4);
    ctx.lineTo(-radius * 1.6, 4);
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
    
    // Restore context
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
    // Clear the entire canvas first
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
        drawDot(dot.x, dot.y, isHighlighted);
    });
    
    // Draw existing lines 
    lines.forEach(line => {
        drawComponent(line.start.x, line.start.y, line.end.x, line.end.y, line.type, line.start, line.end);
    });
    
    // Draw line being dragged (always on top)
    if (isDragging) {
        if (startDot) {
            const closestDot = findClosestDot(currentMousePos.x, currentMousePos.y);
            drawComponent(startDot.x, startDot.y, currentMousePos.x, currentMousePos.y,
                         componentSelect.value, startDot, closestDot);
        }
    }
    
    // Draw transistors
    transistors.forEach((transistor, id) => {
        drawTransistor(transistor.x, transistor.y, id);
    });
}

function isNearDot(x, y, dot) {
    const distance = Math.sqrt((x - dot.x) ** 2 + (y - dot.y) ** 2);
    return distance < DOT_RADIUS * 3;
}

function findClosestDot(x, y) {
    return dots.find(dot => isNearDot(x, y, dot));
}

// Add this helper function to check if a point is near a switch
function isNearSwitch(x, y) {
    for (const line of lines) {
        if (line.type === 'switch_no' || line.type === 'switch_nc') {
            const switchCenterX = (line.start.x + line.end.x) / 2;
            const switchCenterY = (line.start.y + line.end.y) / 2;
            const distance = Math.sqrt((x - switchCenterX)**2 + (y - switchCenterY)**2);
            if (distance < 20) {
                return true;
            }
        }
    }
    return false;
}

// Add helper function to find closest transistor terminal
function findClosestTransistorTerminal(x, y) {
    const detectionRadius = 10; // Detection radius for terminals
    
    for (const [id, transistor] of transistors) {
        const terminals = transistorTerminals.get(id);
        if (!terminals) continue;
        
        // Check each terminal (gate, drain, source)
        for (const [type, pos] of Object.entries(terminals)) {
            const distance = Math.sqrt((x - pos.x) ** 2 + (y - pos.y) ** 2);
            if (distance < detectionRadius) {
                return { id, type, pos, transistor };
            }
        }
    }
    return null;
}

// Update the mousedown handler
canvas.addEventListener('mousedown', (e) => {
    if (e.button !== 0) return; // Only handle left clicks
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Handle delete mode first
    if (deleteMode) {
        // Check for transistors
        for (const [id, transistor] of transistors) {
            const centerDist = Math.sqrt((x - transistor.x) ** 2 + (y - transistor.y) ** 2);
            if (centerDist < 50) {
                // Remove all wires connected to this transistor
                for (let i = lines.length - 1; i >= 0; i--) {
                    if (lines[i].transistorConnection && lines[i].transistorConnection.id === id) {
                        lines.splice(i, 1);
                    }
                }
                // Delete the transistor
                transistors.delete(id);
                transistorTerminals.delete(id);
                initializeConnections();
                resetDotVoltages();
                rebuildAllConnections();
                drawGrid();
                // Turn off delete mode after successful deletion
                turnOffDeleteMode();
                return;
            }
        }

        // Check for other components
        for (let i = lines.length - 1; i >= 0; i--) {
            const line = lines[i];
            const centerX = (line.start.x + line.end.x) / 2;
            const centerY = (line.start.y + line.end.y) / 2;
            const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
            
            if (distance < 20) {
                lines.splice(i, 1);
                initializeConnections();
                resetDotVoltages();
                rebuildAllConnections();
                drawGrid();
                // Turn off delete mode after successful deletion
                turnOffDeleteMode();
                return;
            }
        }
        return;
    }

    // Check if we're clicking a switch first
    if (isNearSwitch(x, y)) {
        return;
    }

    // Handle transistor placement
    if (componentSelect.value === 'nmos' || componentSelect.value === 'pmos') {
        const id = nextTransistorId++;
        transistors.set(id, {
            x: x,
            y: y,
            type: componentSelect.value,
            conducting: false
        });
        
        // Calculate terminal positions correctly
        const { channelLength, gateWidth } = TRANSISTOR_CHARACTERISTICS;
        const circleRadius = Math.max(channelLength, gateWidth) * 0.7;
        
        // Set up the transistor terminals with correct positions
        transistorTerminals.set(id, {
            gate: { x: x - circleRadius, y: y },
            drain: { x: x, y: y - circleRadius },
            source: { x: x, y: y + circleRadius }
        });
        
        drawGrid();
        return;
    }

    // Check for transistor terminals when wire tool is selected
    if (componentSelect.value === 'wire') {
        const terminal = findClosestTransistorTerminal(x, y);
        if (terminal) {
            isDragging = true;
            startDot = {
                x: terminal.pos.x,
                y: terminal.pos.y,
                isTransistorTerminal: true,
                transistorConnection: { id: terminal.id, type: terminal.type }
            };
            return;
        }
    }

    // Handle regular dot connections
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
    
    // Only redraw if we're actually doing something
    if (isDragging && startDot ) {
        drawGrid();
    }
});

// Update the mouseup handler
canvas.addEventListener('mouseup', (e) => {
    const wasDragging = isDragging;
    const hadStartDot = startDot;
    
    isDragging = false;
    
    if (wasDragging && hadStartDot) {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // Check if we're ending on a transistor terminal
        const endTerminal = findClosestTransistorTerminal(x, y);
        let endDot;
        
        if (endTerminal) {
            endDot = {
                x: endTerminal.pos.x,
                y: endTerminal.pos.y,
                isTransistorTerminal: true,
                transistorConnection: { id: endTerminal.id, type: endTerminal.type }
            };
        } else {
            endDot = findClosestDot(x, y);
        }
        
        if (endDot && hadStartDot !== endDot) {
            const newLine = {
                start: hadStartDot,
                end: endDot,
                type: componentSelect.value
            };
            
            // Add transistor connection information
            if (hadStartDot.isTransistorTerminal) {
                newLine.transistorConnection = hadStartDot.transistorConnection;
            } else if (endDot.isTransistorTerminal) {
                newLine.transistorConnection = endDot.transistorConnection;
            }
            
            lines.push(newLine);
            initializeConnections();
            rebuildAllConnections();
            drawGrid();
        }
    }
    
    startDot = null;
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
            if (clickDist < 20) {
                // Toggle switch state
                switchState.pressed = !switchState.pressed;
                
                // Reinitialize all connections
                initializeConnections();
                
                // Rebuild all connections
                lines.forEach(l => {
                    const startIndex = dots.indexOf(l.start);
                    const endIndex = dots.indexOf(l.end);
                    
                    if (startIndex !== -1 && endIndex !== -1) {
                        if (l.type === 'wire') {
                            connectDots(startIndex, endIndex);
                        } else if (l.type === 'switch_nc' && !switches.get(getSwitchId(l.start, l.end))?.pressed) {
                            connectDots(startIndex, endIndex);
                        } else if (l.type === 'switch_no' && switches.get(getSwitchId(l.start, l.end))?.pressed) {
                            connectDots(startIndex, endIndex);
                        }
                    }
                });
                
                // Reset all dot voltages
                dots.forEach(dot => {
                    dot.voltage = null;
                });
                
                // Recalculate voltages
                calculateCircuitValues();
                
                // Redraw the grid
                drawGrid();
                return;
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
    
    // Check for transistors
    for (const [id, transistor] of transistors) {
        const centerDist = Math.sqrt((x - transistor.x) ** 2 + (y - transistor.y) ** 2);
        if (centerDist < 50) {
            // Remove all wires connected to this transistor
            for (let i = lines.length - 1; i >= 0; i--) {
                if (lines[i].transistorConnection && lines[i].transistorConnection.id === id) {
                    lines.splice(i, 1);
                }
            }
            // Delete the transistor
            transistors.delete(id);
            transistorTerminals.delete(id);
            initializeConnections();
            resetDotVoltages();
            rebuildAllConnections();
            drawGrid();
            // Turn off delete mode if it was on
            turnOffDeleteMode();
            return;
        }
    }

    // Check for other components
    for (let i = lines.length - 1; i >= 0; i--) {
        const line = lines[i];
        const centerX = (line.start.x + line.end.x) / 2;
        const centerY = (line.start.y + line.end.y) / 2;
        const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
        
        if (distance < 20) {
            lines.splice(i, 1);
            initializeConnections();
            resetDotVoltages();
            rebuildAllConnections();
            drawGrid();
            // Turn off delete mode if it was on
            turnOffDeleteMode();
            return;
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
    
    if (line.type === 'led') {
        return `LED from ${startPoint} (anode/+) to ${endPoint} (cathode/-)`;
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
    let html = '<h3>Circuit Connections:</h3>';
    
    // Show components
    if (lines.length > 0) {
        html += '<h4>Components:</h4><ul>';
        lines.forEach(line => {
            const info = getComponentInfo(line);
            if (info) {
                html += `<li>${info}</li>`;
            }
        });
        html += '</ul>';
    }
    
    if (lines.length === 0) {
        html += '<p>No components in the circuit.</p>';
    }
    
    circuitInfo.innerHTML = html;
    circuitInfo.style.display = 'block';
}

// Initial draw
drawGrid();

// Add warning message element
const warningMessage = document.createElement('div');
warningMessage.id = 'warningMessage';
warningMessage.style.position = 'fixed';
warningMessage.style.top = '20px';
warningMessage.style.left = '50%';
warningMessage.style.transform = 'translateX(-50%)';
warningMessage.style.backgroundColor = '#ff4444';
warningMessage.style.color = 'white';
warningMessage.style.padding = '10px 20px';
warningMessage.style.borderRadius = '4px';
warningMessage.style.opacity = '0';
warningMessage.style.transition = 'opacity 0.3s ease';
warningMessage.style.zIndex = '1000';
warningMessage.textContent = '⚠️ Warning: Short Circuit Detected!';
document.body.appendChild(warningMessage);

function showWarningMessage() {
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

// Update getDotVoltage to handle column connections
function getDotVoltage(dot, voltageMap = null) {
    if (!dot) return null;
    const dotIndex = dots.indexOf(dot);
    if (dotIndex === -1) return null;
    
    // Get row and column of the dot
    const { row } = getRowCol(dotIndex);
    
    // Check power rails first
    if (row === 0 || row === GRID_ROWS - 1) return 9;  // VCC rails
    if (row === 1 || row === GRID_ROWS - 2) return 0;  // GND rails
    
    // If a voltage map is provided, use it
    if (voltageMap && voltageMap.has(dotIndex)) {
        return voltageMap.get(dotIndex);
    }
    
    // Check connected dots for power/ground connections
    const connectedDots = connections.get(dotIndex);
    if (connectedDots) {
        for (const connectedIndex of connectedDots) {
            const connectedRow = Math.floor(connectedIndex / GRID_COLS);
            if (connectedRow === 0 || connectedRow === GRID_ROWS - 1) return 9;  // VCC
            if (connectedRow === 1 || connectedRow === GRID_ROWS - 2) return 0;  // GND
            
            // If voltage map exists, check voltages of connected dots
            if (voltageMap && voltageMap.has(connectedIndex)) {
                return voltageMap.get(connectedIndex);
            }
            }
        }

        return null;
    }


// Update rebuildAllConnections function
function rebuildAllConnections() {
    console.log('rebuildAllConnections');
    // First clear all existing connections
    initializeConnections();
    
    // Handle regular wire connections first
    lines.forEach(line => {
        if (line.type === 'wire') {
            const startIndex = line.start.isTransistorTerminal ? -1 : dots.indexOf(line.start);
            const endIndex = line.end.isTransistorTerminal ? -1 : dots.indexOf(line.end);
            
            // Only connect if both points are regular dots
            if (startIndex !== -1 && endIndex !== -1) {
                connectDots(startIndex, endIndex);
            }
        }
    });
    
    // Handle switch connections
    lines.forEach(line => {
        if (line.type === 'switch_no' || line.type === 'switch_nc') {
            const startIndex = dots.indexOf(line.start);
            const endIndex = dots.indexOf(line.end);
            
            if (startIndex !== -1 && endIndex !== -1) {
                if (line.type === 'switch_nc' && !switches.get(getSwitchId(line.start, line.end))?.pressed) {
                    connectDots(startIndex, endIndex);
                } else if (line.type === 'switch_no' && switches.get(getSwitchId(line.start, line.end))?.pressed) {
                    connectDots(startIndex, endIndex);
                }
            }
        }
    });
    
    calculateCircuitValues();
    
    // Redraw the grid to show updated values
    drawGrid();
}

// Add calculateCircuitValues function
function calculateCircuitValues() {
    console.log('calculateCircuitValues');
    // Reset all calculated values
    lines.forEach(line => {
        if (line.type === 'led') {
            line.voltage_drop = 0;
            line.current = 0;
        }
    });
    
    // Calculate intermediate voltages
    const voltageMap = calculateIntermediateVoltages();
    
    // First pass: Calculate LED voltage drops
    lines.forEach(line => {
        if (line.type === 'led') {
            const startVoltage = getDotVoltage(line.start, voltageMap);
            const endVoltage = getDotVoltage(line.end, voltageMap);
            
            if (startVoltage !== null && endVoltage !== null) {
                const voltageDiff = Math.abs(startVoltage - endVoltage);
                if (voltageDiff >= LED_CHARACTERISTICS.vf) {
                    line.voltage_drop = LED_CHARACTERISTICS.vf;
                    // If LED is connected to a transistor terminal, update the voltage map
                    if (line.start.isTransistorTerminal || line.end.isTransistorTerminal) {
                        const terminal = line.start.isTransistorTerminal ? line.start : line.end;
                        const otherEnd = line.start.isTransistorTerminal ? line.end : line.start;
                        const otherEndVoltage = getDotVoltage(otherEnd, voltageMap);
                        
                        // Create a virtual voltage point for the transistor terminal
                        if (otherEndVoltage === 0) { // If connected to ground
                            voltageMap.set(`transistor_${terminal.transistorConnection.id}_${terminal.transistorConnection.type}`, LED_CHARACTERISTICS.vf);
                        } else if (otherEndVoltage === 9) { // If connected to VCC
                            voltageMap.set(`transistor_${terminal.transistorConnection.id}_${terminal.transistorConnection.type}`, 9 - LED_CHARACTERISTICS.vf);
                        }
                    }
                }
            }
        }
    });

    // Debug header for transistor calculations
    console.log('\nTransistor State Calculations:');
    console.log('------------------------------');
    
    // Update transistor states based on gate voltages
    for (const [id, transistor] of transistors) {
        console.log(`\nTransistor #${id} (${transistor.type.toUpperCase()}):`);
        
        const terminals = transistorTerminals.get(id);
        if (!terminals) {
            console.log('  No terminals found for transistor');
            continue;
        }
        
        let gateVoltage = null;
        let sourceVoltage = null;
        let drainVoltage = null;
        
        // Find wires connected to terminals and check for LED-modified voltages
        lines.forEach(line => {
            if (line.transistorConnection && line.transistorConnection.id === id) {
                const terminal = line.transistorConnection.type;
                const virtualVoltage = voltageMap.get(`transistor_${id}_${terminal}`);
                const otherEnd = line.start.isTransistorTerminal ? line.end : line.start;
                let voltage;
                
                // If this is an LED connection
                if (line.type === 'led') {
                    const otherEndVoltage = getDotVoltage(otherEnd, voltageMap);
                    if (otherEndVoltage === 0) { // LED to ground
                        voltage = LED_CHARACTERISTICS.vf;
                    } else if (otherEndVoltage === 9) { // LED to VCC
                        voltage = 9 - LED_CHARACTERISTICS.vf;
                    } else {
                        voltage = otherEndVoltage;
                    }
                } else {
                    // For regular wires, use virtual voltage or get from other end
                    voltage = virtualVoltage !== undefined ? virtualVoltage : getDotVoltage(otherEnd, voltageMap);
                }
                
                switch(terminal) {
                    case 'gate':
                        gateVoltage = voltage;
                        console.log(`  Gate voltage: ${voltage !== null ? voltage.toFixed(1) + 'V' : 'disconnected'}`);
                        break;
                    case 'source':
                        sourceVoltage = voltage;
                        console.log(`  Source voltage: ${voltage !== null ? voltage.toFixed(1) + 'V' : 'disconnected'} ${line.type === 'led' ? '(LED)' : ''}`);
                        break;
                    case 'drain':
                        drainVoltage = voltage;
                        console.log(`  Drain voltage: ${voltage !== null ? voltage.toFixed(1) + 'V' : 'disconnected'}`);
                        break;
                }
            }
        });
        
        // Determine if transistor is conducting based on type and voltages
        const characteristics = TRANSISTOR_CHARACTERISTICS[transistor.type];
        const oldState = transistor.conducting;
        
        if (gateVoltage !== null && sourceVoltage !== null) {
            if (transistor.type === 'nmos') {
                // NMOS logic stays the same
                const threshold = sourceVoltage + characteristics.vth;
                transistor.conducting = gateVoltage > threshold;
                console.log(`  NMOS threshold: ${threshold.toFixed(1)}V`);
                console.log(`  Gate voltage must be > threshold to conduct`);
            } else if (transistor.type === 'pmos') {
                // Fix PMOS logic - it should conduct when gate is lower than source - threshold
                const threshold = characteristics.vth;  // 2.0V
                console.log('threshold', threshold, 'gate', gateVoltage, 'source', sourceVoltage, 'drain', drainVoltage);
                transistor.conducting = gateVoltage < threshold;
                console.log(`  PMOS threshold: Vg < ${sourceVoltage.toFixed(1)}V - ${threshold.toFixed(1)}V = ${(sourceVoltage - threshold).toFixed(1)}V`);
                console.log(`  Gate voltage: ${gateVoltage !== null ? gateVoltage.toFixed(1) + 'V' : 'disconnected'}`);
                console.log(`  Source voltage: ${sourceVoltage.toFixed(1)}V`);
            }
            
            console.log(`  Conducting: ${transistor.conducting} (${oldState === transistor.conducting ? 'unchanged' : 'changed'})`);
            
            if (transistor.conducting) {
                console.log(`  Channel resistance: ${characteristics.onResistance}Ω`);
            } else {
                console.log(`  Channel resistance: ${characteristics.offResistance}Ω`);
            }
        } else {
            transistor.conducting = false;
            console.log('  Not conducting: Missing gate or source voltage');
        }
        
        // Log voltage drop across transistor if both drain and source are connected
        if (drainVoltage !== null && sourceVoltage !== null) {
            const vds = Math.abs(drainVoltage - sourceVoltage);
            console.log(`  Drain-Source voltage: ${vds.toFixed(1)}V`);
        }
    }
    
    // Update all dots with their voltages from the voltage map
    dots.forEach((dot, index) => {
        if (voltageMap.has(index)) {
            dot.voltage = voltageMap.get(index);
        }
    });
    
    // Redraw to show updated transistor states
    drawGrid();
}

// Add calculateIntermediateVoltages function
function calculateIntermediateVoltages() {
    const voltageMap = new Map();
    
    // First pass: Set power rail voltages
    dots.forEach((dot, index) => {
        const row = Math.floor(index / GRID_COLS);
        if (row === 0 || row === GRID_ROWS - 1) {
            voltageMap.set(index, 9);  // VCC rails
        } else if (row === 1 || row === GRID_ROWS - 2) {
            voltageMap.set(index, 0);  // GND rails
        }
    });
    
    // Second pass: Propagate voltages through connections
    let changed = true;
    while (changed) {
        changed = false;
        connections.forEach((connectedDots, dotIndex) => {
            // Skip if this dot already has a voltage
            if (voltageMap.has(dotIndex)) return;
            
            // Check connected dots for a known voltage
            for (const connectedIndex of connectedDots) {
                if (voltageMap.has(connectedIndex)) {
                    voltageMap.set(dotIndex, voltageMap.get(connectedIndex));
                    changed = true;
                    break;
                }
            }
        });
    }
    
    return voltageMap;
}

// Add delete mode state variable
let deleteMode = false;

// Add delete mode button
const deleteModeButton = document.createElement('button');
deleteModeButton.innerHTML = '<i class="fas fa-trash"></i>';  // Using Font Awesome trash icon
deleteModeButton.style.marginLeft = '20px';
deleteModeButton.style.padding = '5px 10px';  // Match other buttons
deleteModeButton.style.backgroundColor = '#4CAF50';  // Green when off
deleteModeButton.style.color = 'white';
deleteModeButton.style.border = 'none';
deleteModeButton.style.borderRadius = '3px';
deleteModeButton.style.cursor = 'pointer';
deleteModeButton.style.display = 'inline-flex';
deleteModeButton.style.alignItems = 'center';
deleteModeButton.style.justifyContent = 'center';
deleteModeButton.style.width = 'auto';  // Let width be determined by content
deleteModeButton.style.height = 'auto';  // Let height be determined by content
deleteModeButton.title = 'Delete Mode (Off)';  // Tooltip

// Function to turn off delete mode
function turnOffDeleteMode() {
    if (deleteMode) {
        deleteMode = false;
        deleteModeButton.style.backgroundColor = '#4CAF50';
        deleteModeButton.title = 'Delete Mode (Off)';
        canvas.style.cursor = 'default';
    }
}

// Add escape key listener
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        turnOffDeleteMode();
    }
});

// Add hover effects
deleteModeButton.addEventListener('mouseover', () => {
    deleteModeButton.style.backgroundColor = deleteMode ? '#d32f2f' : '#45a049';
});

deleteModeButton.addEventListener('mouseout', () => {
    deleteModeButton.style.backgroundColor = deleteMode ? '#f44336' : '#4CAF50';
});

// Add toggle handler
deleteModeButton.addEventListener('click', () => {
    deleteMode = !deleteMode;
    deleteModeButton.style.backgroundColor = deleteMode ? '#f44336' : '#4CAF50';
    deleteModeButton.title = `Delete Mode (${deleteMode ? 'On' : 'Off'})`;
    canvas.style.cursor = deleteMode ? 'crosshair' : 'default';
    
    // Add shake animation when activated
    if (deleteMode) {
        deleteModeButton.style.animation = 'shake 0.5s';
        setTimeout(() => {
            deleteModeButton.style.animation = '';
        }, 500);
    }
});

// Add to DOM after auto-compute toggle
document.addEventListener('DOMContentLoaded', () => {
    // Add Font Awesome CSS
    const fontAwesome = document.createElement('link');
    fontAwesome.rel = 'stylesheet';
    fontAwesome.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css';
    document.head.appendChild(fontAwesome);
    
    // Add shake animation keyframes
    const style = document.createElement('style');
    style.textContent = `
        @keyframes shake {
            0% { transform: rotate(0deg); }
            25% { transform: rotate(-10deg); }
            50% { transform: rotate(10deg); }
            75% { transform: rotate(-5deg); }
            100% { transform: rotate(0deg); }
        }
    `;
    document.head.appendChild(style);
    
    const controls = document.querySelector('.controls');
    if (controls) {
        controls.appendChild(deleteModeButton);
    }
});

function areDotsConnectedInBreadboard(dot1, dot2) {
    // If dots are the same, they're connected
    if (dot1 === dot2) return true;
    
    // If either dot is not in the breadboard, they're only connected if they're the same dot
    if (!dot1.breadboardPosition || !dot2.breadboardPosition) return false;
    
    // Check if dots are in the same column
    return dot1.breadboardPosition.row === dot2.breadboardPosition.row &&
           dot1.breadboardPosition.col === dot2.breadboardPosition.col;
}

function findConnectedComponents(dot) {
    // Find all components connected to this dot or its breadboard column
    return lines.filter(line => {
        // if (!line.type.startsWith('resistor_')) return false;
        return areDotsConnectedInBreadboard(line.start, dot) || 
               areDotsConnectedInBreadboard(line.end, dot);
    });
}

// Add short circuit detection function
function isShortCircuit(startDot, endDot) {
    if (!startDot || !endDot) return false;
    
    const startIndex = dots.indexOf(startDot);
    const endIndex = dots.indexOf(endDot);
    if (startIndex === -1 || endIndex === -1) return false;
    
    const startConnections = connections.get(startIndex);
    const endConnections = connections.get(endIndex);
    if (!startConnections || !endConnections) return false;
    
    // Check if one end is connected to VCC and the other to GND
    const hasStartVcc = Array.from(startConnections).some(i => {
        const row = Math.floor(i / GRID_COLS);
        return row === 0 || row === GRID_ROWS - 1;  // VCC rows
    });
    
    const hasStartGnd = Array.from(startConnections).some(i => {
        const row = Math.floor(i / GRID_COLS);
        return row === 1 || row === GRID_ROWS - 2;  // GND rows
    });
    
    const hasEndVcc = Array.from(endConnections).some(i => {
        const row = Math.floor(i / GRID_COLS);
        return row === 0 || row === GRID_ROWS - 1;  // VCC rows
    });
    
    const hasEndGnd = Array.from(endConnections).some(i => {
        const row = Math.floor(i / GRID_COLS);
        return row === 1 || row === GRID_ROWS - 2;  // GND rows
    });
    
    return (hasStartVcc && hasEndGnd) || (hasStartGnd && hasEndVcc);
}

// Add debug display element after other UI elements
const debugDisplay = document.createElement('div');
debugDisplay.style.position = 'fixed';
debugDisplay.style.bottom = '20px';
debugDisplay.style.left = '20px';
debugDisplay.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
debugDisplay.style.color = 'white';
debugDisplay.style.padding = '10px';
debugDisplay.style.borderRadius = '4px';
debugDisplay.style.fontFamily = 'monospace';
debugDisplay.style.fontSize = '12px';
debugDisplay.style.maxWidth = '400px';
debugDisplay.style.maxHeight = '200px';
debugDisplay.style.overflowY = 'auto';
debugDisplay.style.display = 'none';  // Keep this as 'none'
debugDisplay.style.visibility = 'hidden';  // Add visibility hidden to ensure it's not visible
document.body.appendChild(debugDisplay);

// Add drawTransistor function
function drawTransistor(x, y, id) {
    const { channelLength, gateWidth } = TRANSISTOR_CHARACTERISTICS;
    const transistor = transistors.get(id);
    const isConnecting = transistor?.conducting;
    const isPMOS = transistor?.type === 'pmos';
    
    // Save context
    ctx.save();
    
    // Translate to transistor center
    ctx.translate(x, y);

    // Add opaque background circle
    const circleRadius = Math.max(channelLength, gateWidth) * 0.7;
    ctx.beginPath();
    ctx.arc(0, 0, circleRadius, 0, Math.PI * 2);
    if (isPMOS) {
        ctx.fillStyle = '#3CB371'; // Solid green
    } else {
        ctx.fillStyle = '#FFA500'; // Solid Orange
    }
    ctx.fill();
    
    // Add connection points on the circle edge
    const connectionRadius = 4;
    
    // Draw Drain connection point (top)
    ctx.beginPath();
    ctx.arc(0, -circleRadius, connectionRadius, 0, Math.PI * 2);
    ctx.fillStyle = '#000';
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Draw Source connection point (bottom)
    ctx.beginPath();
    ctx.arc(0, circleRadius, connectionRadius, 0, Math.PI * 2);
    ctx.fillStyle = '#000';
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Draw Gate connection point (left)
    ctx.beginPath();
    ctx.arc(-circleRadius, 0, connectionRadius, 0, Math.PI * 2);
    ctx.fillStyle = '#000';
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1;
    ctx.stroke();
    
    // Continue with existing transistor drawing code
    ctx.beginPath();
    ctx.moveTo(0, -channelLength/2-5);
    ctx.lineTo(0, -channelLength/6);
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Draw source (bottom)
    ctx.beginPath();
    ctx.moveTo(0, channelLength/6);
    ctx.lineTo(0, channelLength/2+5);
    ctx.stroke();
    
    // Draw upper left leg
    ctx.beginPath();
    ctx.moveTo(0, -channelLength/6);
    ctx.lineTo(-channelLength/6, -channelLength/6);
    ctx.lineWidth = 3;
    ctx.stroke();

    // Draw lower left leg
    ctx.beginPath();
    ctx.moveTo(0, channelLength/6);
    ctx.lineTo(-channelLength/6, channelLength/6);
    ctx.lineWidth = 3;
    ctx.stroke();

    // Draw connected gate with indication of conducting state
    ctx.beginPath();
    ctx.moveTo(-channelLength/6, -channelLength/6);
    ctx.lineTo(-channelLength/6, channelLength/6);
    ctx.strokeStyle = isConnecting ? '#4CAF50' : '#666';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Draw  gate connection
    ctx.beginPath();
    ctx.moveTo((-channelLength/6)-5, -channelLength/6);
    ctx.lineTo((-channelLength/6)-5, channelLength/6);
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw gate
    ctx.beginPath();
    ctx.moveTo((-channelLength/6)-15, 0);
    ctx.lineTo((-channelLength/6)-5, 0);
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Draw gate terminal
    ctx.beginPath();
    ctx.moveTo(-gateWidth/2, 0);
    ctx.lineTo(-gateWidth+5, 0);
    ctx.stroke();
    
    // Add PMOS circle at gate if PMOS
    if (isPMOS) {
        ctx.beginPath();
        ctx.arc(-gateWidth/2, 0, 3, 0, Math.PI * 2);
        ctx.fillStyle = '#000';
        ctx.fill();
    }
    
    // Add terminal indicators
    ctx.fillStyle = '#000';
    ctx.font = '10px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('G', -gateWidth+7, -7);
    ctx.fillText('D', 5, -channelLength/3);
    ctx.fillText('S', 5, channelLength/3 + 5);
    
    // Add type and state indicator
    if (transistor?.conducting) {
        ctx.fillStyle = '#FF0000';
        ctx.fillText('ON', 8, 3);
    }
    ctx.fillStyle = '#000';
    ctx.fillText(isPMOS ? 'P' : 'N', -3, 3.5);
    
    // Restore context
    ctx.restore();
}

// Add this helper function to reset all dot voltages
function resetDotVoltages() {
    dots.forEach(dot => {
        const dotIndex = dots.indexOf(dot);
        const { row } = getRowCol(dotIndex);
        
        // Keep power rails at their fixed voltages
        if (row === 0 || row === GRID_ROWS - 1) {
            dot.voltage = 9;  // VCC rails
        } else if (row === 1 || row === GRID_ROWS - 2) {
            dot.voltage = 0;  // GND rails
        } else {
            dot.voltage = null;  // Reset all other dots
        }
    });
}



