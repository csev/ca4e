const canvas = document.getElementById('gridCanvas');
const ctx = canvas.getContext('2d');

// Grid configuration
const GRID_COLS = 30;  // Swapped with rows
const GRID_ROWS = 14;  // Swapped with cols
const DOT_RADIUS = 4;
const PADDING = 40;

// Calculate canvas size and grid spacing
const CANVAS_WIDTH = 900;  // Swapped with height
const CANVAS_HEIGHT = 504; // Swapped with width
canvas.width = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;

const CELL_WIDTH = (CANVAS_WIDTH - 2 * PADDING) / (GRID_COLS - 1);
const CELL_HEIGHT = (CANVAS_HEIGHT - 2 * PADDING) / (GRID_ROWS - 1);

// Store dots and lines
const dots = [];
const lines = [];
let isDragging = false;
let startDot = null;
let currentMousePos = { x: 0, y: 0 };

// Component type selector
const componentSelect = document.getElementById('componentType');

// Initialize dots
for (let row = 0; row < GRID_ROWS; row++) {
    for (let col = 0; col < GRID_COLS; col++) {
        dots.push({
            x: PADDING + col * CELL_WIDTH,
            y: PADDING + row * CELL_HEIGHT
        });
    }
}

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
function drawDot(x, y, isHighlighted = false) {
    ctx.beginPath();
    ctx.arc(x, y, DOT_RADIUS, 0, Math.PI * 2);
    ctx.fillStyle = isHighlighted ? '#ff4444' : '#333';
    ctx.fill();
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

function drawLED(startX, startY, endX, endY) {
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
    
    // Draw LED body (main circle)
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    
    // Create radial gradient for 3D effect
    const gradient = ctx.createRadialGradient(
        -radius * 0.3, -radius * 0.3, radius * 0.1,  // Inner circle (highlight)
        0, 0, radius                                  // Outer circle
    );
    gradient.addColorStop(0, '#ff9999');    // Bright highlight
    gradient.addColorStop(0.3, '#ff0000');  // Main red color
    gradient.addColorStop(1, '#990000');    // Darker edge
    
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

function drawComponent(startX, startY, endX, endY, type) {
    if (type === 'led') {
        drawLED(startX, startY, endX, endY);
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
        const symbolWidth = 12;  // Increased width
        const lineSpacing = 4;   // Increased spacing
        
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

function drawGrid() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw power rails first
    drawPowerRails();
    
    // Draw existing lines
    lines.forEach(line => {
        drawComponent(line.start.x, line.start.y, line.end.x, line.end.y, line.type);
    });

    // Draw dots
    dots.forEach(dot => {
        const isHighlighted = isDragging && isNearDot(currentMousePos.x, currentMousePos.y, dot);
        drawDot(dot.x, dot.y, isHighlighted);
    });

    // Draw line being dragged
    if (isDragging && startDot) {
        drawComponent(startDot.x, startDot.y, currentMousePos.x, currentMousePos.y, componentSelect.value);
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

canvas.addEventListener('mouseup', (e) => {
    if (isDragging) {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const endDot = findClosestDot(x, y);
        if (endDot && endDot !== startDot) {
            lines.push({
                start: startDot,
                end: endDot,
                type: componentSelect.value
            });
        }
        
        isDragging = false;
        startDot = null;
        drawGrid();
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