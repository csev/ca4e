<?php
// Future LTI/Tsugi integration point
// $CFG = new stdClass();
// $CFG->wwwroot = 'http://localhost/tsugi';
// require_once "tsugi/lib/lms_lib.php";
// require_once "tsugi/lib/lti_util.php";

// For now, just basic PHP setup
session_start();
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>WASM Editor & Execution Environment</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <div class="container">
        <?php
        // Future LTI/Tsugi integration - user info, course context, etc.
        // if (isset($USER)) {
        //     echo '<div class="lti-info">';
        //     echo '<p>Welcome, ' . htmlspecialchars($USER->displayname) . '</p>';
        //     echo '<p>Course: ' . htmlspecialchars($CONTEXT->title) . '</p>';
        //     echo '</div>';
        // }
        ?>
        <header>
            <h1>WAT Editor & WASM Execution Environment</h1>
            <p>A teaching tool for learning WebAssembly Text (WAT) format</p>
        </header>
        
        <main>
            <div class="editor-section">
                <h2>WAT Code Editor</h2>
                <div class="editor-controls">
                    <button id="clearEditor" class="btn">Clear</button>
                    <button id="runWasm" class="btn btn-primary">Compile & Run WAT</button>
                </div>
                <textarea id="wasmEditor" placeholder="Enter your WAT (WebAssembly Text) code here..."></textarea>
            </div>
            
            <div class="output-section">
                <div class="output-header">
                    <h2>Output</h2>
                    <button id="showWasm" class="btn btn-secondary hidden">Show WASM</button>
                </div>
                <div id="output" class="output-area">
                    <p class="placeholder">Output will appear here when you run your WASM code...</p>
                </div>
                <div id="errorOutput" class="error-area hidden"></div>
            </div>
        </main>
        
        <!-- WASM Hex Modal -->
        <div id="wasmModal" class="modal hidden">
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Compiled WASM Binary (Hex)</h3>
                    <span class="close">&times;</span>
                </div>
                <div class="modal-body">
                    <div class="hex-info">
                        <p><strong>Size:</strong> <span id="wasmSize">0</span> bytes</p>
                        <p><strong>Magic Number:</strong> <span id="wasmMagic">00 61 73 6d</span> (WASM)</p>
                    </div>
                    <div class="hex-container">
                        <pre id="wasmHex"></pre>
                    </div>
                </div>
            </div>
        </div>

    </div>
    
    <script src="wasm-executor.js"></script>
    <script src="script.js"></script>
</body>
</html> 