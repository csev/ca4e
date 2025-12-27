<?php

require_once "../config.php";

use \Tsugi\Core\LTIX;

// Initialize LTI if we received a launch.  If this was a non-LTI GET,
// then $USER will be null (i.e. anonymous)
$LTI = LTIX::session_start();
?><!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Analog Circuit Layout Board</title>
    <style>
        body {
            display: flex;
            flex-direction: row;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            margin: 0;
            background-color: #f0f0f0;
            font-family: Arial, sans-serif;
        }
        
        .voltage-control-panel {
            background-color: white;
            border-radius: 10px;
            box-shadow: 0 0 20px rgba(0,0,0,0.1);
            padding: 20px;
            margin-right: 20px;
            width: 200px;
            height: 400px;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
        }
        
        .voltage-control-panel h3 {
            margin: 0 0 20px 0;
            color: #333;
            text-align: center;
            font-size: 18px;
        }
        
        .voltage-display {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 15px;
            border-radius: 8px;
            text-align: center;
            margin-bottom: 20px;
            position: relative;
            overflow: hidden;
        }
        
        .sine-wave-canvas {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            opacity: 0.3;
        }
        
        .voltage-value {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 5px;
        }
        
        .voltage-type {
            font-size: 14px;
            opacity: 0.9;
        }
        
        .slider-container {
            margin-bottom: 20px;
        }
        
        .slider-container label {
            display: block;
            margin-bottom: 10px;
            font-weight: bold;
            color: #555;
        }
        
        .voltage-slider {
            width: 100%;
            height: 8px;
            border-radius: 4px;
            background: #ddd;
            outline: none;
            -webkit-appearance: none;
        }
        
        .voltage-slider::-webkit-slider-thumb {
            -webkit-appearance: none;
            appearance: none;
            width: 20px;
            height: 20px;
            border-radius: 50%;
            background: #667eea;
            cursor: pointer;
            box-shadow: 0 2px 6px rgba(0,0,0,0.2);
        }
        
        .voltage-slider::-moz-range-thumb {
            width: 20px;
            height: 20px;
            border-radius: 50%;
            background: #667eea;
            cursor: pointer;
            border: none;
            box-shadow: 0 2px 6px rgba(0,0,0,0.2);
        }
        
        .toggle-container {
            margin-bottom: 20px;
        }
        
        .toggle-container label {
            display: block;
            margin-bottom: 10px;
            font-weight: bold;
            color: #555;
        }
        
        .toggle-switch {
            position: relative;
            display: inline-block;
            width: 60px;
            height: 34px;
        }
        
        .toggle-switch input {
            opacity: 0;
            width: 0;
            height: 0;
        }
        
        .toggle-slider {
            position: absolute;
            cursor: pointer;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: #ccc;
            transition: .4s;
            border-radius: 34px;
        }
        
        .toggle-slider:before {
            position: absolute;
            content: "";
            height: 26px;
            width: 26px;
            left: 4px;
            bottom: 4px;
            background-color: white;
            transition: .4s;
            border-radius: 50%;
        }
        
        input:checked + .toggle-slider {
            background-color: #667eea;
        }
        
        input:checked + .toggle-slider:before {
            transform: translateX(26px);
        }
        
        .frequency-container {
            margin-bottom: 20px;
        }
        
        .frequency-container label {
            display: block;
            margin-bottom: 10px;
            font-weight: bold;
            color: #555;
        }
        
        .frequency-input {
            width: 100%;
            padding: 8px;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-size: 14px;
        }
        
        .main-content {
            display: flex;
            flex-direction: column;
            align-items: center;
        }
        
        .oscilloscope-panel {
            background-color: white;
            border-radius: 10px;
            box-shadow: 0 0 20px rgba(0,0,0,0.1);
            padding: 20px;
            margin-left: 20px;
            width: 300px;
            height: 400px;
            display: flex;
            flex-direction: column;
        }
        
        .oscilloscope-panel h3 {
            margin: 0 0 20px 0;
            color: #333;
            text-align: center;
            font-size: 18px;
        }
        
        .oscilloscope-display {
            background-color: #000;
            border: 2px solid #333;
            border-radius: 5px;
            margin-bottom: 20px;
            position: relative;
            flex-grow: 1;
        }
        
        .oscilloscope-canvas {
            width: 100%;
            height: 100%;
            display: block;
        }
        
        .probe-info {
            background-color: #f5f5f5;
            padding: 10px;
            border-radius: 5px;
            margin-bottom: 15px;
        }
        
        .probe-info div {
            margin-bottom: 5px;
            font-size: 14px;
        }
        
        .probe-instructions {
            font-size: 12px;
            color: #666;
            text-align: center;
            line-height: 1.4;
        }
        
        .controls {
            margin-bottom: 20px;
            padding: 10px;
            background-color: white;
            border-radius: 5px;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
            position: relative;
            z-index: 2;
        }
        .controls label {
            margin-right: 10px;
        }
        .controls select {
            padding: 5px;
            border-radius: 3px;
            border: 1px solid #ccc;
        }
        .controls select option {
            padding: 5px;
        }
        canvas {
            background-color: white;
            border: 1px solid #ccc;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
        }
    </style>
</head>
<body>
    <div class="voltage-control-panel">
        <h3>Power Supply</h3>
        
        <div class="voltage-display">
            <canvas id="sineWaveCanvas" class="sine-wave-canvas"></canvas>
            <div class="voltage-value" id="voltageDisplay">0.0V</div>
            <div class="voltage-type" id="voltageType">DC</div>
        </div>
        
        <div class="slider-container">
            <label for="voltageSlider">Voltage (0-24V)</label>
            <input type="range" id="voltageSlider" class="voltage-slider" min="0" max="24" step="0.1" value="9">
        </div>
        
        <div class="toggle-container">
            <label for="acdcToggle">AC/DC Mode</label>
            <label class="toggle-switch">
                <input type="checkbox" id="acdcToggle">
                <span class="toggle-slider"></span>
            </label>
            <div style="margin-top: 5px; font-size: 12px; color: #666;">
                <span id="toggleLabel">DC</span> Mode
            </div>
        </div>
        
        <div class="frequency-container" id="frequencyContainer" style="display: none;">
            <label for="frequencyInput">Frequency (Hz)</label>
            <input type="number" id="frequencyInput" class="frequency-input" min="0.1" max="1000" step="0.1" value="1">
        </div>
    </div>

    <div class="main-content">
        <div class="controls">
            <label>Component:</label>
            <select id="componentType">
                <option value="wire">Wire</option>
                <option value="led">LED</option>
                <option value="switch_no">Switch (Normally Open)</option>
                <option value="switch_nc">Switch (Normally Closed)</option>
                <option value="nmos">NMOS Transistor</option>
                <option value="pmos">PMOS Transistor</option>
                <option value="voltage_indicator">Voltage Indicator</option>
                <option value="voltage_source">Voltage Source (VCC/GND)</option>
            </select>
        </div>

        <canvas id="gridCanvas"></canvas>
    </div>

    <div class="oscilloscope-panel">
        <h3>Oscilloscope</h3>
        
        <div class="oscilloscope-display">
            <canvas id="oscilloscopeCanvas" class="oscilloscope-canvas"></canvas>
        </div>
        
        <div class="probe-info">
            <div><strong>Probe Position:</strong> <span id="probePosition">Not connected</span></div>
            <div><strong>Voltage:</strong> <span id="probeVoltage">--V</span></div>
            <div><strong>Mode:</strong> <span id="probeMode">--</span></div>
        </div>
        
        <div class="probe-instructions">
            Click and drag on the breadboard to move the probe.<br>
            The oscilloscope ground is connected to GND.
        </div>
    </div>
    
    <!-- Load the circuit simulator first -->
    <script src="circuit-simulator.js"></script>
    <!-- Load the layout editor second -->
    <script src="layout-editor.js"></script>
    <!-- Initialize the application -->
    <script>
        // Initialize the circuit simulator
        const simulator = new CircuitSimulator(15, 14);
        
        // Initialize the breadboard editor
        const canvas = document.getElementById('gridCanvas');
        const editor = new BreadboardEditor(canvas, simulator);
        
        // Initialize voltage control panel
        const voltageSlider = document.getElementById('voltageSlider');
        const voltageDisplay = document.getElementById('voltageDisplay');
        const voltageType = document.getElementById('voltageType');
        const acdcToggle = document.getElementById('acdcToggle');
        const toggleLabel = document.getElementById('toggleLabel');
        const frequencyContainer = document.getElementById('frequencyContainer');
        const frequencyInput = document.getElementById('frequencyInput');
        const sineWaveCanvas = document.getElementById('sineWaveCanvas');
        const sineWaveCtx = sineWaveCanvas.getContext('2d');
        const oscilloscopeCanvas = document.getElementById('oscilloscopeCanvas');
        const oscilloscopeCtx = oscilloscopeCanvas.getContext('2d');
        const probePosition = document.getElementById('probePosition');
        const probeVoltage = document.getElementById('probeVoltage');
        const probeMode = document.getElementById('probeMode');
        
        // Update voltage display
        function updateVoltageDisplay() {
            const voltage = parseFloat(voltageSlider.value);
            const isAC = acdcToggle.checked;
            
            if (isAC) {
                // For AC, show current voltage in real-time
                const currentVoltage = simulator.getCurrentACVoltage();
                voltageDisplay.textContent = `${currentVoltage.toFixed(1)}V`;
            } else {
                voltageDisplay.textContent = `${voltage.toFixed(1)}V`;
            }
            
            voltageType.textContent = isAC ? 'AC' : 'DC';
            toggleLabel.textContent = isAC ? 'AC' : 'DC';
            
            // Show/hide frequency input for AC mode
            frequencyContainer.style.display = isAC ? 'block' : 'none';
            
            // Update simulator with new voltage settings
            simulator.setPowerSupplyVoltage(voltage);
            simulator.setPowerSupplyMode(isAC ? 'AC' : 'DC');
            if (isAC) {
                simulator.setPowerSupplyFrequency(parseFloat(frequencyInput.value));
                // Start AC simulation animation
                editor.startACSimulation();
            }
            
            // Rebuild circuit with new settings
            editor.rebuildCircuit();
        }
        
        // Initialize sine wave canvas
        function initSineWaveCanvas() {
            const rect = sineWaveCanvas.getBoundingClientRect();
            sineWaveCanvas.width = rect.width * window.devicePixelRatio;
            sineWaveCanvas.height = rect.height * window.devicePixelRatio;
            sineWaveCtx.scale(window.devicePixelRatio, window.devicePixelRatio);
        }
        
        // Draw animated sine wave
        function drawSineWave() {
            if (!acdcToggle.checked) {
                sineWaveCtx.clearRect(0, 0, sineWaveCanvas.width, sineWaveCanvas.height);
                return;
            }
            
            const rect = sineWaveCanvas.getBoundingClientRect();
            const width = rect.width;
            const height = rect.height;
            
            // Clear canvas
            sineWaveCtx.clearRect(0, 0, width, height);
            
            // Set up drawing
            sineWaveCtx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
            sineWaveCtx.lineWidth = 2;
            sineWaveCtx.beginPath();
            
            // Calculate wave parameters
            const frequency = parseFloat(frequencyInput.value);
            const amplitude = height * 0.3;
            const centerY = height / 2;
            const time = Date.now() / 1000; // Current time in seconds
            const wavelength = width / 2; // Show 2 cycles
            
            // Draw sine wave
            for (let x = 0; x <= width; x++) {
                const phase = (x / wavelength) * 2 * Math.PI;
                const waveTime = time * 2 * Math.PI * frequency;
                const y = centerY + amplitude * Math.sin(phase - waveTime);
                sineWaveCtx.lineTo(x, y);
            }
            
            sineWaveCtx.stroke();
            
            // Continue animation
            requestAnimationFrame(drawSineWave);
        }
        
        // Initialize oscilloscope canvas
        function initOscilloscopeCanvas() {
            const rect = oscilloscopeCanvas.getBoundingClientRect();
            oscilloscopeCanvas.width = rect.width * window.devicePixelRatio;
            oscilloscopeCanvas.height = rect.height * window.devicePixelRatio;
            oscilloscopeCtx.scale(window.devicePixelRatio, window.devicePixelRatio);
        }
        
        // Draw oscilloscope trace
        function drawOscilloscope() {
            const rect = oscilloscopeCanvas.getBoundingClientRect();
            const width = rect.width;
            const height = rect.height;
            
            // Clear canvas
            oscilloscopeCtx.fillStyle = '#000';
            oscilloscopeCtx.fillRect(0, 0, width, height);
            
            // Draw grid
            oscilloscopeCtx.strokeStyle = '#333';
            oscilloscopeCtx.lineWidth = 1;
            
            // Vertical grid lines
            for (let x = 0; x <= width; x += width / 10) {
                oscilloscopeCtx.beginPath();
                oscilloscopeCtx.moveTo(x, 0);
                oscilloscopeCtx.lineTo(x, height);
                oscilloscopeCtx.stroke();
            }
            
            // Horizontal grid lines
            for (let y = 0; y <= height; y += height / 8) {
                oscilloscopeCtx.beginPath();
                oscilloscopeCtx.moveTo(0, y);
                oscilloscopeCtx.lineTo(width, y);
                oscilloscopeCtx.stroke();
            }
            
            // Get oscilloscope data
            const data = simulator.getOscilloscopeData();
            if (data.length < 2) return;
            
            // Draw trace
            oscilloscopeCtx.strokeStyle = '#00ff00';
            oscilloscopeCtx.lineWidth = 2;
            oscilloscopeCtx.beginPath();
            
            const maxVoltage = simulator.getPeakVoltage();
            const timeWindow = 2000; // 2 seconds
            const currentTime = Date.now();
            
            data.forEach((point, index) => {
                const x = (width * (currentTime - point.timestamp)) / timeWindow;
                const y = height - (height * (point.voltage || 0)) / maxVoltage;
                
                if (index === 0) {
                    oscilloscopeCtx.moveTo(x, y);
                } else {
                    oscilloscopeCtx.lineTo(x, y);
                }
            });
            
            oscilloscopeCtx.stroke();
            
            // Update probe info
            const probeVoltageValue = simulator.getProbeVoltage(editor.dots);
            const probePositionValue = simulator.getProbePosition(editor.dots);
            
            if (probeVoltageValue !== null) {
                probeVoltage.textContent = `${probeVoltageValue.toFixed(1)}V`;
                probePosition.textContent = probePositionValue;
                probeMode.textContent = acdcToggle.checked ? 'AC' : 'DC';
            } else {
                probeVoltage.textContent = '--V';
                probePosition.textContent = 'Not connected';
                probeMode.textContent = '--';
            }
            
            // Continue animation
            requestAnimationFrame(drawOscilloscope);
        }
        
        // Update AC voltage display in real-time
        function updateACDisplay() {
            if (acdcToggle.checked) {
                const currentVoltage = simulator.getCurrentACVoltage();
                voltageDisplay.textContent = `${currentVoltage.toFixed(1)}V`;
                requestAnimationFrame(updateACDisplay);
            }
        }
        
        // Event listeners
        voltageSlider.addEventListener('input', updateVoltageDisplay);
        acdcToggle.addEventListener('change', updateVoltageDisplay);
        frequencyInput.addEventListener('input', updateVoltageDisplay);
        
        // Initialize display
        updateVoltageDisplay();
        
        // Initialize sine wave canvas
        initSineWaveCanvas();
        initOscilloscopeCanvas();
        
        // Start animations
        updateACDisplay();
        drawSineWave();
        drawOscilloscope();
        
        // Handle window resize
        window.addEventListener('resize', () => {
            initSineWaveCanvas();
            initOscilloscopeCanvas();
        });
    </script>
</body>
</html> 
