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
    <title>E6B Wind Calculator</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <div class="container">
        <header>
            <div class="header-content">
                <div class="title-section">
                    <h1>E6B Wind Calculator</h1>
                    <p>Calculate wind correction angle and ground speed</p>
                </div>
                <a href="../index.php" class="home-link" title="Go to Home">🏠</a>
            </div>
        </header>
        
        <main>
            <!-- Three Column Layout: Input, Visualization, Results -->
            <div class="main-flex-container">
                <!-- Input Section -->
                <div class="input-section">
                    <h2>Flight Data</h2>
                    
                    <div class="input-group">
                        <label for="trueCourse">Desired Course (°)</label>
                        <input type="number" id="trueCourse" min="0" max="359" value="360" step="1">
                    </div>
                    
                    <div class="input-group">
                        <label for="trueAirspeed">True Airspeed (kts)</label>
                        <input type="number" id="trueAirspeed" min="50" max="500" value="120" step="5">
                    </div>
                    
                    <div class="input-group">
                        <label for="windDirection">Wind Direction (°)</label>
                        <input type="number" id="windDirection" min="0" max="359" value="270" step="1">
                    </div>
                    
                    <div class="input-group">
                        <label for="windSpeed">Wind Speed (kts)</label>
                        <input type="number" id="windSpeed" min="0" max="100" value="20" step="5">
                    </div>
                    
                    <button id="calculateBtn" class="calculate-btn">Calculate</button>
                </div>
                
                <!-- Visual Wind Triangle -->
                <div class="wind-triangle-section">
                    <h2>Wind Triangle Visualization</h2>
                    <canvas id="windTriangle" width="300" height="300"></canvas>
                    <div class="triangle-legend">
                        <div class="legend-item">
                            <span class="legend-color" style="background: #e74c3c;"></span>
                            <span>Wind Vector</span>
                        </div>
                        <div class="legend-item">
                            <span class="legend-color" style="background: #3498db;"></span>
                            <span>Heading to Fly and True Air Speed</span>
                        </div>
                        <div class="legend-item">
                            <span class="legend-color" style="background: #2ecc71;"></span>
                            <span>Desired Course and Ground Speed</span>
                        </div>
                    </div>
                </div>
                
                <!-- Results Section -->
                <div class="results-section">
                    <h2>Results</h2>
                    
                    <div class="result-item">
                        <label>Wind Correction Angle:</label>
                        <span id="wca" class="result-value">--</span>
                        <span class="unit">°</span>
                    </div>
                    
                    <div class="result-item">
                        <label>Ground Speed:</label>
                        <span id="groundSpeed" class="result-value">--</span>
                        <span class="unit">kts</span>
                    </div>
                    
                    <div class="result-item">
                        <label>Heading to Fly:</label>
                        <span id="heading" class="result-value">--</span>
                        <span class="unit">°</span>
                    </div>
                    
                    <div class="result-item">
                        <label>Wind Angle:</label>
                        <span id="windAngle" class="result-value">--</span>
                        <span class="unit">°</span>
                    </div>
                    

                </div>
            </div>
            
            <!-- Instructions -->
            <div class="instructions">
                <h2>How to Use</h2>
                <ol>
                    <li>Enter your <strong>Desired Course</strong> (the direction you want to fly)</li>
                    <li>Enter your <strong>True Airspeed</strong> (your aircraft's speed through the air)</li>
                    <li>Enter the <strong>Wind Direction</strong> (where the wind is coming from)</li>
                    <li>Enter the <strong>Wind Speed</strong> (how fast the wind is blowing)</li>
                    <li>Click <strong>Calculate</strong> to see your results</li>
                </ol>
                
                <div class="formula">
                    <h3>Formula Used</h3>
                    <p><strong>Wind Triangle Solution using Law of Sines:</strong></p>
                    <p>1. <strong>Wind Correction Angle (WCA):</strong></p>
                    <p>WCA = arcsin(wind speed × sin(wind angle) ÷ true airspeed)</p>
                    <p>2. <strong>Ground Speed Angle (GSA):</strong></p>
                    <p>GSA = 180° - (wind angle % 180° + WCA)</p>
                    <p>3. <strong>Ground Speed:</strong></p>
                    <p>GS = |(wind speed × sin(GSA)) ÷ sin(WCA)|</p>
                    <p><em>Note: For headwind (180°) and tailwind (0°) cases, simple addition/subtraction is used.</em></p>
                </div>
            </div>
        </main>
    </div>
    
    <script type="module" src="script.js"></script>
    <script type="module" src="test.js"></script>
</body>
</html> 
