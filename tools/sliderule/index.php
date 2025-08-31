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
    <title>Traditional Slide Rule</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <div class="container">
        <header>
            <div class="header-content">
                <div class="title-section">
                    <h1>Traditional Slide Rule</h1>
                    <p>For multiplication and division</p>
                </div>
                <a href="../index.php" class="home-link" title="Go to Home">🏠</a>
            </div>
        </header>
        
        <div class="slide-rule-container">
            <div class="slide-rule" id="slideRule">
                <!-- Fixed scale (A scale) -->
                <div class="scale fixed-scale" id="fixedScale">
                    <div class="scale-label">A</div>
                    <div class="scale-value" id="dValue">1.0</div>
                    <div class="scale-markings" id="fixedMarkings"></div>
                </div>
                
                <!-- Sliding scale (B scale) -->
                <div class="scale sliding-scale" id="slidingScale">
                    <div class="scale-label">B</div>
                    <div class="scale-value" id="cValue">1.0</div>
                    <div class="scale-markings" id="slidingMarkings"></div>
                </div>
                
                <!-- L scale (logarithmic scale) -->
                <div class="scale l-scale" id="lScale">
                    <div class="scale-label">Log<sub>10</sub> (A)</div>
                    <div class="scale-value" id="lValue">0.0</div>
                    <div class="scale-markings" id="lMarkings"></div>
                </div>
                
                <!-- Hairline cursor -->
                <div class="hairline" id="hairline"></div>
            </div>
        </div>
        
        <div class="controls">
            <div class="control-group">
                <label for="hairlinePosition">Move Hairline:</label>
                <input type="range" id="hairlinePosition" min="0" max="100" value="50" step="0.1">
            </div>
            
            <div class="control-group">
                <label for="slidingOffset">Move B:</label>
                <input type="range" id="slidingOffset" min="-1000" max="1000" value="0">
            </div>
        </div>
        
        <div class="info-panel">
            <h2>How to Use</h2>
            <ul>
                <li>Move the hairline to the first number (i.e 2.5) on the A scale</li>
                <li>Slide the B scale to align 1 with the hairline</li>
                <li>Move the hairline to the second number (i.e 3.2) on the B scale</li>
                <li>Read the result on the A scale</li>
            </ul>
        </div>
    </div>

<pre>
<?php
echo( $USER ? 'LTI Launch' : 'Anonymous Launch');
?>
</pre>
    
    <script src="script.js"></script>
</body>
</html> 

