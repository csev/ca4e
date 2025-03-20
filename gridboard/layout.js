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
    vf: 2.0,          // Forward voltage drop in volts (typical for red LED)
    minCurrent: 0.001, // Minimum visible current in amperes (1mA)
    maxCurrent: 0.020, // Maximum current in amperes (20mA)
    resistance: 100    // Series resistance after forward voltage drop (ohms)
};

// Add after LED_CHARACTERISTICS
const TRANSISTOR_CHARACTERISTICS = {
    vbesat: 0.7        // Base-emitter saturation voltage
};

// Add after the existing state variables at the top
let isComputing = false;
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

// Add after the existing HTML elements
const showVoltagesButton = document.createElement('button');
showVoltagesButton.textContent = 'Show Voltages';
showVoltagesButton.style.marginLeft = '20px';  // Match existing button margin
showVoltagesButton.style.padding = '5px 10px';  // Match existing button padding
showVoltagesButton.style.backgroundColor = '#4CAF50';  // Match existing button color
showVoltagesButton.style.color = 'white';
showVoltagesButton.style.border = 'none';
showVoltagesButton.style.borderRadius = '3px';  // Match existing button border radius
showVoltagesButton.style.cursor = 'pointer';

// Add hover effects to match existing buttons
showVoltagesButton.addEventListener('mouseover', () => {
    showVoltagesButton.style.backgroundColor = '#45a049';
});

showVoltagesButton.addEventListener('mouseout', () => {
    showVoltagesButton.style.backgroundColor = '#4CAF50';
});

// Add the voltages display element
const voltagesDisplay = document.createElement('div');
voltagesDisplay.style.position = 'fixed';
voltagesDisplay.style.top = '50%';
voltagesDisplay.style.left = '50%';
voltagesDisplay.style.transform = 'translate(-50%, -50%)';
voltagesDisplay.style.backgroundColor = 'white';
voltagesDisplay.style.padding = '20px';
voltagesDisplay.style.borderRadius = '8px';
voltagesDisplay.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
voltagesDisplay.style.display = 'none';
voltagesDisplay.style.zIndex = '1000';
voltagesDisplay.style.maxHeight = '80vh';
voltagesDisplay.style.overflow = 'auto';

// Add close button
const closeVoltagesButton = document.createElement('button');
closeVoltagesButton.textContent = '×';
closeVoltagesButton.style.position = 'absolute';
closeVoltagesButton.style.top = '10px';
closeVoltagesButton.style.right = '10px';
closeVoltagesButton.style.border = 'none';
closeVoltagesButton.style.background = 'none';
closeVoltagesButton.style.fontSize = '20px';
closeVoltagesButton.style.cursor = 'pointer';
closeVoltagesButton.style.color = '#666';
voltagesDisplay.appendChild(closeVoltagesButton);

// Add title
const voltagesTitle = document.createElement('h3');
voltagesTitle.textContent = 'Voltages at Each Point';
voltagesTitle.style.marginTop = '0';
voltagesTitle.style.marginBottom = '15px';
voltagesTitle.style.color = '#333';
voltagesDisplay.appendChild(voltagesTitle);

// Add the table container
const voltagesTable = document.createElement('div');
voltagesTable.style.overflow = 'auto';
voltagesDisplay.appendChild(voltagesTable);

document.body.appendChild(voltagesDisplay);

// Wait for DOM to be fully loaded before adding the button
document.addEventListener('DOMContentLoaded', () => {
    const controls = document.querySelector('.controls');
    if (controls) {
        // Add auto-compute toggle
        controls.appendChild(autoComputeToggle);
        
        // Add show voltages button
        controls.appendChild(showVoltagesButton);
        
        // Add event listeners
        showVoltagesButton.addEventListener('click', showVoltages);
        closeVoltagesButton.addEventListener('click', () => {
            voltagesDisplay.style.display = 'none';
        });
    } else {
        console.warn('Controls element not found. Buttons not added.');
    }
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

// Add button handlers
showVoltagesButton.addEventListener('click', showVoltages);
closeVoltagesButton.addEventListener('click', () => {
    voltagesDisplay.style.display = 'none';
});

// Add function to show voltages
function showVoltages() {
    console.log('Starting showVoltages function');
    
    // Force a circuit computation to get latest voltages
    console.log('Forcing circuit computation...');
    updateCircuitEmulator();
    
    // Wait for computation to complete before showing voltages
    setTimeout(() => {
        console.log('Circuit computation complete, creating voltage table');
        
        // Create table
        const table = document.createElement('table');
        table.style.borderCollapse = 'collapse';
        table.style.width = '100%';
        table.style.minWidth = '800px';
        table.style.marginTop = '20px';
        
        // Add header row with column numbers
        const header = table.insertRow();
        header.style.backgroundColor = '#f5f5f5';
        header.style.fontWeight = 'bold';
        
        // Add empty cell for row labels
        const emptyCell = document.createElement('th');
        emptyCell.textContent = '';
        emptyCell.style.padding = '8px';
        emptyCell.style.textAlign = 'center';
        emptyCell.style.borderBottom = '2px solid #ddd';
        emptyCell.style.borderRight = '2px solid #ddd';
        header.appendChild(emptyCell);
        
        // Add column numbers
        for (let col = 1; col <= 30; col++) {
            const th = document.createElement('th');
            th.textContent = col;
            th.style.padding = '8px';
            th.style.textAlign = 'center';
            th.style.borderBottom = '2px solid #ddd';
            th.style.minWidth = '30px';
            header.appendChild(th);
        }
        
        // Add data rows (a-j)
        const rowLabels = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'];
        rowLabels.forEach((label, rowIndex) => {
            const row = table.insertRow();
            
            // Add row label
            const labelCell = row.insertCell();
            labelCell.textContent = label;
            labelCell.style.padding = '8px';
            labelCell.style.textAlign = 'center';
            labelCell.style.fontWeight = 'bold';
            labelCell.style.borderRight = '2px solid #ddd';
            labelCell.style.backgroundColor = '#f5f5f5';
            
            // Add voltage cells for each column
            for (let col = 0; col < 30; col++) {
                const cell = row.insertCell();
                const dotIndex = (rowIndex + 2) * 30 + col; // +2 because first two rows are power rails
                const dot = dots[dotIndex];
                
                // Get the voltage directly from the dot
                const voltage = dot.voltage;
                console.log(`Dot at row ${label}, col ${col + 1}: voltage = ${voltage}`);
                
                if (voltage === 9) {
                    cell.textContent = 'VCC';
                    cell.style.color = '#ff4444';
                    cell.style.backgroundColor = '#ffeeee';
                } else if (voltage === 0) {
                    cell.textContent = 'GND';
                    cell.style.color = '#4444ff';
                    cell.style.backgroundColor = '#eeeeff';
                } else if (voltage !== null) {
                    cell.textContent = voltage.toFixed(1);
                    cell.style.color = '#000000';
                } else {
                    cell.textContent = '-';
                    cell.style.color = '#999';
                }
                
                cell.style.padding = '8px';
                cell.style.textAlign = 'center';
                cell.style.border = '1px solid #eee';
            }
        });
        
        // Clear and update table
        console.log('Updating voltage table in DOM');
        voltagesTable.innerHTML = '';
        voltagesTable.appendChild(table);
        
        // Show the display
        console.log('Showing voltage display');
        voltagesDisplay.style.display = 'block';
    }, 600); // Wait for computation to complete
}

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
    // Get row and column for both dots
    const { row: row1, col: col1 } = getRowCol(index1);
    const { row: row2, col: col2 } = getRowCol(index2);
    
    // Get the initial sets
    const set1 = connections.get(index1);
    const set2 = connections.get(index2);
    
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

function drawLine(startX, startY, endX, endY, type = 'resistor_1k') {
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
    
    // Define color bands based on resistor value
    let bandColors;
    if (type === 'resistor_1k') {
        bandColors = [
            '#964B00', // Brown (1)
            '#000000', // Black (0)
            '#FF0000', // Red (2 zeros = 100)
            '#FFD700'  // Gold (5% tolerance)
        ];
    } else if (type === 'resistor_10k') {
        bandColors = [
            '#964B00', // Brown (1)
            '#000000', // Black (0)
            '#FFA500', // Orange (3 zeros = 1000)
            '#FFD700'  // Gold (5% tolerance)
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
            
            // Check if voltage is sufficient to overcome forward voltage
            if (voltageDiff >= LED_CHARACTERISTICS.vf) {
                // Calculate current based on remaining voltage after Vf
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
    
    // Draw polarity symbols
    const symbolSize = radius * 0.6;
    ctx.strokeStyle = '#800000';
    ctx.lineWidth = 2;
    ctx.shadowBlur = 0;
    
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
    
    // Add electrical values display with background
    if (isProperlyConnected) {
        // Add white background for better visibility
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.fillRect(-20, -radius - 25, 40, 20);
        
        ctx.fillStyle = '#000000';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`${(current * 1000).toFixed(1)}mA`, 0, -radius - 15);
        ctx.fillText(`Vf=${LED_CHARACTERISTICS.vf}V`, 0, -radius - 5);
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
    // Calculate voltage across component
    let voltage = 0;
    if (startDot && endDot) {
        const startVoltage = getDotVoltage(startDot);
        const endVoltage = getDotVoltage(endDot);
        if (startVoltage !== null && endVoltage !== null) {
            voltage = Math.abs(startVoltage - endVoltage);
        }
    }

    if (type === 'led') {
        drawLED(startX, startY, endX, endY, startDot, endDot);
    } else if (type === 'wire') {
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.stroke();
        return;
    } else if (type === 'switch_no' || type === 'switch_nc') {
        const switchId = getSwitchId(startDot, endDot);
        const isPressed = switches.get(switchId)?.pressed || false;
        drawSwitch(startX, startY, endX, endY, type, startDot, endDot, isPressed);
        return; // Skip voltage indicator for switches
    } else if (type === 'resistor_1k' || type === 'resistor_10k') {
        drawLine(startX, startY, endX, endY, type);
    }

    // Draw voltage indicator
    if (voltage > 0) {
        const centerX = (startX + endX) / 2;
        const centerY = (startY + endY) / 2;
        
        // Calculate angle of the component
        const dx = endX - startX;
        const dy = endY - startY;
        const angle = Math.atan2(dy, dx);
        
        // Save context
        ctx.save();
        
        // Translate to component center and rotate, then move up by 15 pixels
        ctx.translate(centerX, centerY);
        ctx.rotate(angle);
        ctx.translate(0, -20); // Move up by 15 pixels
        
        // Draw background for voltage text
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.fillRect(-20, -10, 40, 20);
        
        // Draw voltage text
        ctx.fillStyle = '#000000';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`${voltage.toFixed(1)}V`, 0, 4);
        
        // Restore context
        ctx.restore();
    }

    // Check if component is short-circuited
    const isShortCircuit = window.circuitEmulator.shortCircuits.has(getSwitchId(startDot, endDot));

    // Draw short circuit warning indicator
    if (isShortCircuit) {
        ctx.restore();
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(angle);
        ctx.translate(0, -25); // Position warning above voltage indicator

        // Draw warning triangle
        ctx.beginPath();
        ctx.moveTo(0, -10);
        ctx.lineTo(8, 10);
        ctx.lineTo(-8, 10);
        ctx.closePath();
        ctx.fillStyle = '#ff0000';
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Draw exclamation mark
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('!', 0, 0);
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

    // Draw computation overlay only if computing
    if (isComputing) {
        // Save the current context state
        ctx.save();
        
        // Add semi-transparent overlay
        ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw loading spinner
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const radius = 20;
        const startAngle = (Date.now() / 1000) % (2 * Math.PI);
        
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, startAngle, startAngle + Math.PI * 1.5);
        ctx.strokeStyle = '#4CAF50';
        ctx.lineWidth = 3;
        ctx.stroke();
        
        // Restore the context state
        ctx.restore();
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
    
    if (deleteMode) {
        let componentDeleted = false;
        
        // Check for transistors first with a larger detection radius
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
                componentDeleted = true;
                break;
            }
        }
        
        // If no transistor was deleted, check for other components
        if (!componentDeleted) {
            for (let i = lines.length - 1; i >= 0; i--) {
                const line = lines[i];
                // Calculate center point of the component
                const centerX = (line.start.x + line.end.x) / 2;
                const centerY = (line.start.y + line.end.y) / 2;
                
                // Calculate distance from click to component center
                const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
                
                // If click is close enough to component, delete it
                if (distance < 20) {
                    lines.splice(i, 1);
                    componentDeleted = true;
                    break;
                }
            }
        }
        
        // If we deleted something, turn off delete mode and update UI
        if (componentDeleted) {
            deleteMode = false;
            deleteModeButton.style.backgroundColor = '#4CAF50';
            deleteModeButton.title = 'Delete Mode (Off)';
            canvas.style.cursor = 'default';
            
            // Reinitialize connections and update display
            initializeConnections();
            rebuildAllConnections();
            drawGrid();
            updateCircuitEmulator();
        }
        return;
    }
    
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
        updateCircuitEmulator();
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
                updateCircuitEmulator();
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
                        updateCircuitEmulator();
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
                drawGrid();
                updateCircuitEmulator();
            }
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
            if (clickDist < 20) {
                // Toggle switch state
                switchState.pressed = !switchState.pressed;
                
                // Reinitialize all connections
                initializeConnections();
                
                // Rebuild all connections
                lines.forEach(l => {
                    if (!l.transistorConnection) {
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
                    }
                });
                
                // Handle transistor connections after regular connections are established
                rebuildAllConnections();
                
                drawGrid();
                updateCircuitEmulator();
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
            updateCircuitEmulator();
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
            updateCircuitEmulator();
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
    
    if (line.type === 'resistor_1k') {
        return `1kΩ Resistor from ${startPoint} to ${endPoint}`;
    } else if (line.type === 'resistor_10k') {
        return `10kΩ Resistor from ${startPoint} to ${endPoint}`;
    } else if (line.type === 'led') {
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
    const circuitInfo = document.getElementById('circuitInfo');
    let html = '<h3>Circuit Connections:</h3>';
    
    // Show regular components
    if (lines.length > 0) {
        html += '<h4>Components:</h4><ul>';
        lines.forEach((line, index) => {
            if (!line.transistorConnection) {
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
            html += `<li>2N3904 NPN Transistor<ul>`;
            
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
    const { row, col } = getRowCol(dotIndex);
    
    // Get all dots in the same column if this is a breadboard row (not power rails)
    let dotsToCheck = new Set([dotIndex]);
    if (row >= 2 && row <= 6) {  // Top half of breadboard
        for (let r = 2; r <= 6; r++) {
            dotsToCheck.add(getDotIndex(r, col));
        }
    } else if (row >= 7 && row <= 11) {  // Bottom half of breadboard
        for (let r = 7; r <= 11; r++) {
            dotsToCheck.add(getDotIndex(r, col));
        }
    }
    
    // Check all relevant dots for power/ground connections
    for (const checkDotIndex of dotsToCheck) {
        const connectedDots = connections.get(checkDotIndex);
        if (!connectedDots) continue;
        
        // Check for VCC or GND connections
        for (const connectedIndex of connectedDots) {
            const connectedRow = Math.floor(connectedIndex / GRID_COLS);
            if (connectedRow === 0 || connectedRow === GRID_ROWS - 1) {  // VCC rows
                return 9;
            }
            if (connectedRow === 1 || connectedRow === GRID_ROWS - 2) {  // GND rows
                return 0;
            }
        }
    }
    
    // If a voltage map is provided, use it
    if (voltageMap) {
        // First check the dot itself
        if (voltageMap.has(dotIndex)) {
            return voltageMap.get(dotIndex);
        }
        
        // Then check all dots in the same column
        for (const checkDotIndex of dotsToCheck) {
            if (voltageMap.has(checkDotIndex)) {
                return voltageMap.get(checkDotIndex);
            }
            
            // Check connected dots
            const connectedDots = connections.get(checkDotIndex);
            if (connectedDots) {
                for (const connectedIndex of connectedDots) {
                    if (voltageMap.has(connectedIndex)) {
                        return voltageMap.get(connectedIndex);
                    }
                }
            }
        }
    }
    
    return null;
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
    const conducting = vbe >= TRANSISTOR_CHARACTERISTICS.vbesat;
    
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

// Modify the updateCircuitEmulator function
function updateCircuitEmulator() {
    if (!autoCompute) return;
    
    isComputing = true;
    computationFeedback.style.display = 'block';
    
    // Prepare circuit data for emulator
    const circuitComponents = lines.map(line => ({
        type: line.type,
        start: getPointLabel(line.start),
        end: getPointLabel(line.end),
        transistorConnection: line.transistorConnection
    }));

    // Add transistors to components
    transistors.forEach((transistor, id) => {
        circuitComponents.push({
            type: 'transistor',
            id: id,
            connections: {
                collector: transistor.connections.collector ? getPointLabel(transistor.connections.collector) : null,
                base: transistor.connections.base ? getPointLabel(transistor.connections.base) : null,
                emitter: transistor.connections.emitter ? getPointLabel(transistor.connections.emitter) : null
            }
        });
    });

    // Pass the circuit data to the emulator and start computation
    window.circuitEmulator.loadCircuit(circuitComponents, connections);
    window.circuitEmulator.start();
    
    // Rebuild all connections and recalculate voltages
    rebuildAllConnections();
    
    // Calculate and store voltages for all dots
    const voltageMap = calculateIntermediateVoltages();
    dots.forEach((dot, index) => {
        dot.voltage = getDotVoltage(dot, voltageMap);
    });
    
    // Reset computing state and hide feedback immediately
    isComputing = false;
    computationFeedback.style.display = 'none';
    
    // Force a final redraw to clear the overlay
    drawGrid();
}

// Add calculateCircuitValues function
function calculateCircuitValues() {
    // Reset all calculated values
    lines.forEach(line => {
        if (line.type.startsWith('resistor_') || line.type === 'led') {
            line.voltage_drop = 0;
            line.current = 0;
        }
    });
    
    // Calculate intermediate voltages
    const voltageMap = calculateIntermediateVoltages();
    
    // Calculate for each component
    lines.forEach(line => {
        if (line.type.startsWith('resistor_') || line.type === 'led') {
            const startVoltage = getDotVoltage(line.start, voltageMap);
            const endVoltage = getDotVoltage(line.end, voltageMap);
            
            if (startVoltage !== null && endVoltage !== null) {
                const voltageDiff = Math.abs(startVoltage - endVoltage);
                
                if (line.type === 'led') {
                    // LED calculations
                    if (voltageDiff >= LED_CHARACTERISTICS.vf) {
                        line.voltage_drop = LED_CHARACTERISTICS.vf;
                        const remainingVoltage = voltageDiff - LED_CHARACTERISTICS.vf;
                        line.current = remainingVoltage / LED_CHARACTERISTICS.resistance;
                    }
                } else {
                    // Resistor calculations
                    const resistance = RESISTOR_VALUES[line.type];
                    line.voltage_drop = voltageDiff;
                    line.current = voltageDiff / resistance;
                }
            }
        }
    });
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
    
    // Handle transistor conduction
    transistors.forEach((transistor, id) => {
        const state = getTransistorState(transistor);
        if (state.conducting) {
            // If transistor is conducting, collector and emitter should have same voltage
            const collectorIndex = dots.indexOf(transistor.connections.collector);
            const emitterIndex = dots.indexOf(transistor.connections.emitter);
            
            if (collectorIndex !== -1 && emitterIndex !== -1) {
                const collectorVoltage = voltageMap.get(collectorIndex);
                const emitterVoltage = voltageMap.get(emitterIndex);
                
                // If either has a voltage, propagate it
                if (collectorVoltage !== undefined) {
                    voltageMap.set(emitterIndex, collectorVoltage);
                } else if (emitterVoltage !== undefined) {
                    voltageMap.set(collectorIndex, emitterVoltage);
                }
            }
        }
    });
    
    return voltageMap;
}

// Add delete mode state variable
let deleteMode = false;

// Add delete mode button
const deleteModeButton = document.createElement('button');
deleteModeButton.innerHTML = '<i class="fas fa-trash"></i>';  // Using Font Awesome trash icon
deleteModeButton.style.marginLeft = '20px';
deleteModeButton.style.padding = '8px 12px';
deleteModeButton.style.backgroundColor = '#4CAF50';  // Green when off
deleteModeButton.style.color = 'white';
deleteModeButton.style.border = 'none';
deleteModeButton.style.borderRadius = '3px';
deleteModeButton.style.cursor = 'pointer';
deleteModeButton.style.display = 'inline-flex';
deleteModeButton.style.alignItems = 'center';
deleteModeButton.style.justifyContent = 'center';
deleteModeButton.style.width = '40px';
deleteModeButton.style.height = '40px';
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