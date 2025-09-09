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
    <title>WASM Editor - ES Module Example</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <div class="container">
        <header>
            <div class="header-content">
                <div class="title-section">
                    <h1>WASM Playground</h1>
                    <p>A teaching tool for learning WebAssembly Text (WAT) format - ES Module Version</p>
                </div>
                <div class="header-links">
<?php if ($USER && $USER->instructor) : ?>
                    <a href="<?php echo addSession('instructor.php'); ?>" class="instructor-button" title="Instructor Panel">Instructor</a>
<?php endif; ?>
                    <a href="../index.php" class="home-link" title="Go to Home">🏠</a>
                </div>
            </div>
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
    
    <script type="module">
        import { WasmEditor } from './script-esm.js';
        document.addEventListener('DOMContentLoaded', () => {
            new WasmEditor();
        });
    </script>
</body>
</html> 
