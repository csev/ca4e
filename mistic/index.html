<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Mistic VLSI Layout</title>
        <style>
            h1 {
                font-size: 1.5em;
                margin-bottom: 10px;
            }

            #toolbar {
                margin-bottom: 10px;
                display: flex;
                gap: 6px;
                flex-wrap: wrap;
                justify-content: center;
                padding: 8px;
            }

            #toolbar button {
                font-size: 14px;
                padding: 8px 15px;
                border-radius: 6px;
                border: 1px solid #ccc;
                cursor: pointer;
                min-width: 60px;
                transition: all 0.2s ease;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }

            #toolbar button:hover {
                transform: translateY(-1px);
                box-shadow: 0 4px 8px rgba(0,0,0,0.15);
            }

            #toolbar button:active {
                transform: translateY(1px);
                box-shadow: 0 1px 2px rgba(0,0,0,0.1);
            }
            
            .layer-modal {
                position: absolute;
                background: #fff;
                border: 1px solid #000;
                box-shadow: 0 6px 18px rgba(0,0,0,0.2);
                z-index: 1000;
                user-select: none;
            }
            .layer-modal.hidden { display: none; }
            .layer-modal .modal-header {
                display: flex;
                align-items: center;
                gap: 6px;
                padding: 6px 10px;
                background: #f7f7f7;
                border-bottom: 1px solid #ddd;
                cursor: grab;
                font-weight: bold;
            }
        </style>
    </head>
    <body>
        <center>
            <h1>Mistic VLSI Layout</h1>
            <div id="toolbar">
                <button onclick="setLayer('polysilicon')" style="background-color: rgba(255, 0, 0, 0.2);">Poly</button>
                <button onclick="setLayer('N+ diffusion')" style="background-color: rgba(0, 255, 0, 0.3);">N+</button>
                <button onclick="setLayer('P+ diffusion')" style="background-color: rgba(255, 165, 0, 0.5);">P+</button>
                <button onclick="setLayer('contact')" style="background-color: rgba(0, 0, 0, 0.3); color: white;">Via</button>
                <button onclick="setLayer('metal')" style="background-color: rgba(0, 0, 255, 0.3);">Metal</button>
                <button onclick="setLayer('VCC')" style="background-color: #f0f0f0;">VCC</button>
                <button onclick="setLayer('GND')" style="background-color: #f0f0f0;">GND</button>
                <button onclick="setLayer('erase')" style="background-color: rgba(255, 255, 255, 1);">🧽</button>
                <button onclick="confirmClear()" style="background-color: #ffe6e6;">🗑️</button>
                <button id="toggleLayersBtn" style="background-color:#eef7ff;">Layers</button>
            </div>
            <div id="canvasContainer" style="position:relative; display:inline-block;">
                <canvas id="vlsiCanvas" width="600" height="600" style="border:1px solid #000000; display:block;"></canvas>
                <div id="layerModal" class="layer-modal hidden">
                    <div id="layerModalHeader" class="modal-header" title="Drag to move">
                        <span>✋</span>
                        <span>Layers</span>
                    </div>
                    <div style="padding:8px;">
                        <canvas id="layerCanvas" width="220" height="240" style="border:1px solid #000000;"></canvas>
                    </div>
                </div>
            </div>

            <script>
                const canvas = document.getElementById('vlsiCanvas');
                const ctx = canvas.getContext('2d');
                const layerCanvas = document.getElementById('layerCanvas');
                const lctx = layerCanvas ? layerCanvas.getContext('2d') : null;
                const layerModal = document.getElementById('layerModal');
                const layerModalHeader = document.getElementById('layerModalHeader');
                const toggleLayersBtn = document.getElementById('toggleLayersBtn');
                const canvasContainer = document.getElementById('canvasContainer');
                let modalUserMoved = false; // if user drags, we keep their position
                let tileSize = 30; // fixed pixel size per grid tile (finger-friendly)
                let gridSize = 30;
                const MAX_GRID_SIZE = 60;
                const layers = {
                    'polysilicon': 'rgba(255, 0, 0, 0.2)',
                    'N+ diffusion': 'rgba(0, 255, 0, 0.3)',
                    'P+ diffusion': 'rgba(255, 165, 0, 0.5)',
                    'contact': 'rgba(0, 0, 0, 0.3)',
                    'metal': 'rgba(0, 0, 255, 0.3)',
                    'VCC': 'rgba(0, 0, 0, 0)',
                    'GND': 'rgba(0, 0, 0, 0)'
                };

                const layerPolysilicon = 0;
                const layerNPlus = 1;
                const layerPPlus = 2;
                const layerContact = 3;
                const layerMetal = 4;
                const layerVCC = 5;
                const layerGND = 6;

                let currentLayer = '';
                let isDrawing = false;
                let startX, startY;
                let grid = Array(gridSize).fill().map(() => Array(gridSize).fill().map(() => Array(7).fill(false)));
                let volts = Array(gridSize).fill().map(() => Array(gridSize).fill().map(() => Array(7).fill(0)));

                function createGrid(size) {
                    return Array(size).fill().map(() => Array(size).fill().map(() => Array(7).fill(false)));
                }

                function createVolts(size) {
                    return Array(size).fill().map(() => Array(size).fill().map(() => Array(7).fill(0)));
                }

                function resizeGrid(newSize) {
                    const oldGrid = grid;
                    const oldSize = gridSize;
                    const newGrid = createGrid(newSize);
                    const newVolts = createVolts(newSize);
                    const copy = Math.min(oldSize, newSize);
                    for (let i = 0; i < copy; i++) {
                        for (let j = 0; j < copy; j++) {
                            for (let l = 0; l < 7; l++) {
                                newGrid[i][j][l] = oldGrid[i][j][l];
                            }
                        }
                    }
                    grid = newGrid;
                    volts = newVolts; // will be recomputed
                    gridSize = newSize;
                }

                function setLayer(layer) {
                    currentLayer = layer;
                }

                function clearCanvas() {
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    grid.forEach(row => row.forEach(col => col.fill(false)));
                }

                function confirmClear() {
                    if (confirm("Are you sure you want to clear the entire canvas? This action cannot be undone.")) {
                        clearCanvas();
                    }
                }

                function getEventCoordinates(event) {
                    const rect = canvas.getBoundingClientRect();
                    let clientX, clientY;
                    
                    if (event.touches) {
                        clientX = event.touches[0].clientX;
                        clientY = event.touches[0].clientY;
                    } else {
                        clientX = event.clientX;
                        clientY = event.clientY;
                    }
                    
                    return {
                        x: Math.floor((clientX - rect.left) / tileSize),
                        y: Math.floor((clientY - rect.top) / tileSize)
                    };
                }

                function handleStart(event) {
                    event.preventDefault();
                    isDrawing = true;
                    const coords = getEventCoordinates(event);
                    startX = coords.x;
                    startY = coords.y;
                    
                    if (['contact', 'VCC', 'GND'].includes(currentLayer)) {
                        grid[startY][startX][getLayerIndex('contact')] = false;
                        grid[startY][startX][getLayerIndex('VCC')] = false;
                        grid[startY][startX][getLayerIndex('GND')] = false;

                        grid[startY][startX][getLayerIndex(currentLayer)] = true;
                        redrawTile(startX, startY);
                        isDrawing = false;
                        redrawAllTiles();
                        drawLayerView(startX, startY);
                        return;
                    }
                }

                function handleMove(event) {
                    if (!isDrawing || ['contact', 'VCC', 'GND'].includes(currentLayer)) return;
                    event.preventDefault();
                    const coords = getEventCoordinates(event);
                    drawRubberBand(startX, startY, coords.x, coords.y);
                }

                function handleEnd(event) {
                    if (!isDrawing) return;
                    event.preventDefault();
                    
                    if (currentLayer !== 'contact' && currentLayer !== 'VCC' && currentLayer !== 'GND') {
                        const coords = getEventCoordinates(event.changedTouches ? event.changedTouches[0] : event);
                        fillTiles(startX, startY, coords.x, coords.y);
                    }
                    isDrawing = false;
                    ctx.beginPath();
                }

                canvas.addEventListener('touchstart', handleStart, { passive: false });
                canvas.addEventListener('touchmove', handleMove, { passive: false });
                canvas.addEventListener('touchend', handleEnd, { passive: false });
                canvas.addEventListener('touchcancel', handleEnd, { passive: false });

                canvas.addEventListener('mousedown', handleStart);
                canvas.addEventListener('mousemove', handleMove);
                canvas.addEventListener('mouseup', handleEnd);

                // Hover preview for mouse
                canvas.addEventListener('mousemove', function(evt) {
                    const coords = getEventCoordinates(evt);
                    drawLayerView(coords.x, coords.y);
                });
                canvas.addEventListener('mouseleave', function() {
                    clearLayerView();
                });

                // Hover preview for touch
                canvas.addEventListener('touchstart', function(evt) {
                    const coords = getEventCoordinates(evt);
                    drawLayerView(coords.x, coords.y);
                }, { passive: false });
                canvas.addEventListener('touchmove', function(evt) {
                    const coords = getEventCoordinates(evt);
                    drawLayerView(coords.x, coords.y);
                }, { passive: false });

                // Toggle modal visibility
                toggleLayersBtn.addEventListener('click', function() {
                    if (layerModal.classList.contains('hidden')) {
                        layerModal.classList.remove('hidden');
                        modalUserMoved = false;
                        centerModalTopCentered();
                    } else {
                        layerModal.classList.add('hidden');
                    }
                });

                // Drag handling for the modal (mouse + touch)
                (function enableDrag() {
                    if (!layerModal || !layerModalHeader) return;
                    let dragging = false;
                    let startClientX = 0, startClientY = 0;
                    let startLeft = 0, startTop = 0;

                    function onPointerDown(e) {
                        e.preventDefault();
                        dragging = true;
                        const rect = layerModal.getBoundingClientRect();
                        const containerRect = canvasContainer.getBoundingClientRect();
                        startLeft = rect.left - containerRect.left;
                        startTop = rect.top - containerRect.top;
                        if (e.touches) {
                            startClientX = e.touches[0].clientX;
                            startClientY = e.touches[0].clientY;
                        } else {
                            startClientX = e.clientX;
                            startClientY = e.clientY;
                        }
                        layerModalHeader.style.cursor = 'grabbing';
                        window.addEventListener('mousemove', onPointerMove, { passive: false });
                        window.addEventListener('mouseup', onPointerUp, { passive: false });
                        window.addEventListener('touchmove', onPointerMove, { passive: false });
                        window.addEventListener('touchend', onPointerUp, { passive: false });
                    }

                    function onPointerMove(e) {
                        if (!dragging) return;
                        e.preventDefault();
                        let clientX, clientY;
                        if (e.touches) {
                            clientX = e.touches[0].clientX;
                            clientY = e.touches[0].clientY;
                        } else {
                            clientX = e.clientX;
                            clientY = e.clientY;
                        }
                        const dx = clientX - startClientX;
                        const dy = clientY - startClientY;
                        const containerRect = canvasContainer.getBoundingClientRect();
                        const maxLeft = containerRect.width - layerModal.offsetWidth;
                        const maxTop = containerRect.height - layerModal.offsetHeight;
                        const newLeft = Math.max(0, Math.min(maxLeft, startLeft + dx));
                        const newTop = Math.max(0, Math.min(maxTop, startTop + dy));
                        layerModal.style.left = newLeft + 'px';
                        layerModal.style.top = newTop + 'px';
                        modalUserMoved = true;
                    }

                    function onPointerUp(e) {
                        dragging = false;
                        layerModalHeader.style.cursor = 'grab';
                        window.removeEventListener('mousemove', onPointerMove);
                        window.removeEventListener('mouseup', onPointerUp);
                        window.removeEventListener('touchmove', onPointerMove);
                        window.removeEventListener('touchend', onPointerUp);
                    }

                    layerModalHeader.addEventListener('mousedown', onPointerDown);
                    layerModalHeader.addEventListener('touchstart', onPointerDown, { passive: false });
                })();

                // Responsive canvas sizing: scale with window, keep square
                function resizeCanvasToContainer() {
                    const horizontalPadding = 40; // breathing room around canvas in layout
                    // Use 80% of viewport width on large screens (width-driven sizing)
                    const targetWidth = Math.floor(window.innerWidth * 0.8);
                    const maxWidth = Math.max(320, Math.min(targetWidth, window.innerWidth - horizontalPadding));
                    // Fixed tile size; compute how many tiles fit horizontally only
                    const fitCols = Math.floor(maxWidth / tileSize);
                    const newGridSize = Math.min(MAX_GRID_SIZE, Math.max(5, fitCols));
                    const pixelSize = newGridSize * tileSize;
                    if (newGridSize !== gridSize) {
                        resizeGrid(newGridSize);
                    }
                    canvas.width = pixelSize;
                    canvas.height = pixelSize;
                    // Redraw grid according to new canvas size
                    redrawAllTiles();
                    // Keep modal near the top and horizontally centered while resizing if visible
                    if (!layerModal.classList.contains('hidden')) {
                        centerModalTopCentered();
                    }
                }

                function centerModalOverCanvas() {
                    const containerRect = canvasContainer.getBoundingClientRect();
                    const modalW = layerModal.offsetWidth;
                    const modalH = layerModal.offsetHeight;
                    const left = Math.max(0, Math.floor((containerRect.width - modalW) / 2));
                    const top = Math.max(0, Math.floor((containerRect.height - modalH) / 2));
                    layerModal.style.left = left + 'px';
                    layerModal.style.top = top + 'px';
                }

                function centerModalTopCentered() {
                    const containerRect = canvasContainer.getBoundingClientRect();
                    const modalW = layerModal.offsetWidth;
                    const left = Math.max(0, Math.floor((containerRect.width - modalW) / 2));
                    const top = 8; // keep near top during resizing
                    layerModal.style.left = left + 'px';
                    layerModal.style.top = top + 'px';
                }

                window.addEventListener('resize', resizeCanvasToContainer);
                // Initial sizing
                resizeCanvasToContainer();

                function drawRubberBand(startX, startY, endX, endY) {
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    redrawAllTiles();

                    const x1 = Math.min(startX, endX);
                    const y1 = Math.min(startY, endY);
                    const x2 = Math.max(startX, endX);
                    const y2 = Math.max(startY, endY);
                    ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
                    ctx.lineWidth = 2;
                    ctx.strokeRect(x1 * tileSize, y1 * tileSize, (x2 - x1 + 1) * tileSize, (y2 - y1 + 1) * tileSize);
                }

                function fillTiles(startX, startY, endX, endY) {
                    const x1 = Math.min(startX, endX);
                    const y1 = Math.min(startY, endY);
                    const x2 = Math.max(startX, endX);
                    const y2 = Math.max(startY, endY);

                    for (let i = y1; i <= y2; i++) {
                        for (let j = x1; j <= x2; j++) {
                            const layerIndex = getLayerIndex(currentLayer);
                            if (currentLayer === 'erase') {
                                for (let k = 0; k < 7; k++) {
                                    grid[i][j][k] = false;
                                }
                            } else if (layerIndex !== -1) {
                                grid[i][j][layerIndex] = true;
                            }
                        }
                    }
                    redrawAllTiles();
                }

                function redrawAllTiles() {
                    compute();
                    for (let i = 0; i < grid.length; i++) {
                        for (let j = 0; j < grid[i].length; j++) {
                            redrawTile(j, i);
                        }
                    }
                }

                function redrawTile(x, y) {
                    ctx.clearRect(x * tileSize, y * tileSize, tileSize, tileSize);
                    let voltage = 0;
                    for (let i = 0; i < 7; i++) {
                        if (grid[y][x][i]) {
                            if (volts[y][x][i] == 1) {
                                voltage = 1;
                            } else if (volts[y][x][i] == -1) {
                                voltage = -1;
                            }
                            if (i === 3) {
                                drawContactLines(x, y);
                            } else if (i === 5) {
                                if ( volts[y][x][i] == 100 ) {
                                    drawText(x, y, '🔥');
                                } else {
                                    drawRectangle(x, y, 0);
                                    drawText(x, y, 'V');
                                }
                            } else if (i === 6) {
                                if ( volts[y][x][i] == 100 ) {
                                    drawText(x, y, '🔥');
                                } else {
                                    drawRectangle(x, y, 0);
                                    drawText(x, y, 'G');
                                }
                            } else {
                                ctx.fillStyle = Object.values(layers)[i];
                                ctx.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);
                                if (grid[y][x][layerContact] || grid[y][x][layerVCC] || grid[y][x][layerGND]) {
                                    // No voltage
                                } else {
                                    if ( i == layerNPlus && grid[y][x][layerPolysilicon] && volts[y][x][layerPolysilicon] == -1) {
                                        drawText(x, y, '🚫');
                                    } else if (i == layerPPlus && grid[y][x][layerPolysilicon] && volts[y][x][layerPolysilicon] == 1) {
                                        drawText(x, y, '🚫');
                                    } else if (voltage == 1) {
                                        drawText(x, y, '+');
                                    } else if (voltage == -1) {
                                        drawText(x, y, '-');
                                    }
                                }
                            }
                        }
                    }
                }

                function drawRectangle(x, y, inset) {
                    ctx.strokeStyle = 'black';
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.strokeRect(x * tileSize + inset, y * tileSize + inset, tileSize - inset * 2, tileSize - inset * 2);
                    ctx.stroke();
                }

                function drawContactLines(x, y) {
                    const inset = tileSize / 4;
                    drawRectangle(x, y, inset);
                    ctx.strokeStyle = 'black';
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.moveTo(x * tileSize + inset, y * tileSize + inset);
                    ctx.lineTo((x + 1) * tileSize - inset, (y + 1) * tileSize - inset);
                    ctx.moveTo((x + 1) * tileSize - inset, y * tileSize + inset);
                    ctx.lineTo(x * tileSize + inset, (y + 1) * tileSize - inset);
                    ctx.stroke();
                }

                function drawText(x, y, text) {
                    ctx.fillStyle = 'black';
                    ctx.font = 'bold 12px Arial';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(text, x * tileSize + tileSize / 2, y * tileSize + tileSize / 2);
                }

                // Draws the vertical layer stack preview for a given grid cell
                function drawLayerView(gridX, gridY) {
                    if (!lctx || !layerCanvas) return;
                    lctx.clearRect(0, 0, layerCanvas.width, layerCanvas.height);

                    if (gridX < 0 || gridX >= gridSize || gridY < 0 || gridY >= gridSize) return;

                    // Header
                    lctx.fillStyle = 'black';
                    lctx.font = '12px Arial';
                    lctx.textAlign = 'left';
                    lctx.textBaseline = 'alphabetic';
                    lctx.fillText('(' + gridX + ', ' + gridY + ')', 8, 16);

                    const padding = 12;
                    const labelGutter = 70; // reserved space on the left for text labels
                    const left = padding + labelGutter;
                    const top = 28;
                    const width = layerCanvas.width - padding * 2 - labelGutter;
                    const layerHeight = 30;
                    const gapHeight = 12; // gap between metal and P+

                    // Top to bottom visual order: N+, Poly, P+, gap, Metal (metal is bottom)
                    const presentN = grid[gridY][gridX][layerNPlus];
                    const presentP = grid[gridY][gridX][layerPPlus];
                    const presentPoly = grid[gridY][gridX][layerPolysilicon];
                    const presentMetal = grid[gridY][gridX][layerMetal];
                    const viaPresent = grid[gridY][gridX][layerContact] || grid[gridY][gridX][layerVCC] || grid[gridY][gridX][layerGND];

                    const slots = [
                        { name: 'N+ diffusion', color: layers['N+ diffusion'], present: presentN, height: layerHeight },
                        { name: 'polysilicon', color: layers['polysilicon'], present: presentPoly, height: layerHeight },
                        { name: 'P+ diffusion', color: layers['P+ diffusion'], present: presentP, height: layerHeight },
                        { name: 'gap', color: 'rgba(0,0,0,0)', present: true, height: gapHeight },
                        { name: 'metal', color: layers['metal'], present: presentMetal, height: layerHeight }
                    ];

                    const viaWidth = Math.max(12, Math.floor(width * 0.4));
                    const viaX = left + Math.floor((width - viaWidth) / 2);

                    let yPos = top;
                    for (let s of slots) {
                        // outline
                        lctx.strokeStyle = '#333';
                        lctx.lineWidth = 1;
                        lctx.strokeRect(left, yPos, width, s.height);

                        if (s.name !== 'gap' && s.present) {
                            lctx.fillStyle = s.color;
                            lctx.fillRect(left, yPos, width, s.height);
                        }

                        if (viaPresent) {
                            // drill a hole through every layer slot
                            lctx.clearRect(viaX, yPos, viaWidth, s.height);
                        }

                        // Label (accessibility): draw to the left of the bar, vertically centered
                        lctx.fillStyle = '#000';
                        lctx.font = '12px Arial';
                        lctx.textAlign = 'right';
                        lctx.textBaseline = 'middle';
                        const labelX = left - 6; // small gap from bar
                        const labelY = yPos + s.height / 2;
                        const labelText = s.name === 'gap' ? 'gap' : s.name;
                        lctx.fillText(labelText, labelX, labelY);

                        yPos += s.height;
                    }

                    if (viaPresent) {
                        // Fill the drilled center with metal (same as layer metal color)
                        lctx.fillStyle = layers['metal'];
                        lctx.fillRect(viaX, top, viaWidth, yPos - top);
                        lctx.strokeStyle = '#000';
                        lctx.strokeRect(viaX, top, viaWidth, yPos - top);
                    }
                }

                function clearLayerView() {
                    if (!lctx || !layerCanvas) return;
                    lctx.clearRect(0, 0, layerCanvas.width, layerCanvas.height);
                }

                function getLayerIndex(layer) {
                    switch (layer) {
                        case 'polysilicon': return layerPolysilicon;
                        case 'N+ diffusion': return layerNPlus;
                        case 'P+ diffusion': return layerPPlus;
                        case 'contact': return layerContact;
                        case 'metal': return layerMetal;
                        case 'VCC': return layerVCC;
                        case 'GND': return layerGND;
                        case 'erase': return -1;
                        default: return -1;
                    }
                }

                function compute() {
                    for (let i = 0; i < grid.length; i++) {
                        for (let j = 0; j < grid[i].length; j++) {
                            for (let l = 0; l < 7; l++) {
                                volts[i][j][l] = 0;
                            }
                        }
                    }

                    for (let i = 0; i < grid.length; i++) {
                        for (let j = 0; j < grid[i].length; j++) {
                            if (grid[i][j][layerVCC]) {
                                for (let l = 0; l < 7; l++) {
                                    volts[i][j][l] = 1;
                                }
                            }
                            if (grid[i][j][layerGND]) {
                                for (let l = 0; l < 7; l++) {
                                    volts[i][j][l] = -1;
                                }
                            }
                        }
                    }

                    let changed = true;
                    for (let phase = 0; phase < 5; phase++) {
                        try {
                            changed = false;
                            for (let i = 0; i < grid.length; i++) {
                                for (let j = 0; j < grid[i].length; j++) {
                                    for (let l = 0; l < 7; l++) {
                                        if (grid[i][j][l] && volts[i][j][l] != 0) {
                                            changed = changed | propogateVoltage(volts[i][j][l], i-1, j, l);
                                            changed = changed | propogateVoltage(volts[i][j][l], i, j-1, l);
                                            changed = changed | propogateVoltage(volts[i][j][l], i+1, j, l);
                                            changed = changed | propogateVoltage(volts[i][j][l], i, j+1, l);
                                        }
                                    }
                                }
                            }

                            for (let i = 0; i < grid.length; i++) {
                                for (let j = 0; j < grid[i].length; j++) {
                                    if (grid[i][j][layerContact]) {
                                        voltage = 0;
                                        for (let l = 0; l < 7; l++) {
                                            if (volts[i][j][l] != 0) voltage = volts[i][j][l];
                                        }
                                        for (let l = 0; l < 7; l++) {
                                            if (volts[i][j][l] != voltage) {
                                                changed = true;
                                                volts[i][j][l] = voltage;
                                            }
                                        }
                                    }
                                }
                            }
                            if (!changed) break;
                        } catch (e) {
                            break;
                        }
                    }
                }

                function propogateVoltage(voltage, i, j, l) {
                    if (i < 0 || i+1 > grid.length) return false;
                    if (j < 0 || j+1 > grid.length) return false;

                    if (!grid[i][j][l]) return false;
                    if (volts[i][j][l] == -1*voltage && voltage != 0) {
                        console.log('short detected', i, j, l);
                        for ( let ll = 0; ll < 7; ll++) volts[i][j][ll] = 100;
                        throw new Error('short detected');
                    }
                    if (volts[i][j][l] == voltage) return false;

                    if (l == layerNPlus && grid[i][j][layerPolysilicon] && volts[i][j][layerPolysilicon] != 1) return;
                    if (l == layerPPlus && grid[i][j][layerPolysilicon] && volts[i][j][layerPolysilicon] != -1) return;

                    volts[i][j][l] = voltage;

                    if (i > 0) propogateVoltage(voltage, i-1, j, l);
                    if (j > 0) propogateVoltage(voltage, i, j-1, l);
                    if (i < grid.length-1) propogateVoltage(voltage, i+1, j, l);
                    if (j < grid.length-1) propogateVoltage(voltage, i, j+1, l);
                    return true;
                }
            </script>
        </center>
    </body>
</html>
