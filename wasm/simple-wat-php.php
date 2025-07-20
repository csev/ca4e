<?php
// Simple WAT to WASM converter using system wat2wasm command
header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>PHP WAT to WASM Converter</title>
    <style>
        body { 
            font-family: Arial, sans-serif; 
            margin: 40px; 
            background: #f0f0f0;
        }
        .container {
            max-width: 900px;
            margin: 0 auto;
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        button {
            background: #007bff;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 16px;
            margin: 10px 0;
        }
        button:hover {
            background: #0056b3;
        }
        .output {
            background: #f8f9fa;
            border: 1px solid #dee2e6;
            border-radius: 5px;
            padding: 15px;
            margin: 15px 0;
            font-family: monospace;
            white-space: pre-wrap;
        }
        .wat-code {
            background: #f8f9fa;
            border: 1px solid #dee2e6;
            border-radius: 5px;
            padding: 15px;
            margin: 15px 0;
            font-family: 'Courier New', monospace;
            font-size: 14px;
            overflow-x: auto;
        }
        .success { color: #28a745; }
        .error { color: #dc3545; }
        .info { color: #17a2b8; }
        .warning { color: #ffc107; }
        .hex-output {
            background: #000;
            color: #0f0;
            padding: 10px;
            border-radius: 5px;
            font-family: monospace;
            font-size: 12px;
            overflow-x: auto;
            max-height: 200px;
            overflow-y: auto;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>PHP WAT to WASM Converter</h1>
        <p>This example uses PHP to call the system's <code>wat2wasm</code> command to convert WebAssembly Text format to binary WASM.</p>
        
        <h3>WAT Source Code:</h3>
        <div class="wat-code" id="watSource">
(module
  ;; Import console.log from JavaScript
  (import "console" "log" (func $log (param i32 i32)))
  
  ;; Memory section - 1 page (64KB)
  (memory 1)
  
  ;; Data section - store "Hello, World!" string at offset 0
  (data (i32.const 0) "Hello, World!")
  
  ;; Export memory so JavaScript can access it
  (export "memory" (memory 0))
  
  ;; Main function that calls console.log
  (func $main
    ;; Call console.log with pointer 0 and length 13
    (call $log (i32.const 0) (i32.const 13))
  )
  
  ;; Export main function
  (export "main" (func $main))
)
        </div>
        
        <button onclick="runWasm()">Convert WAT to WASM and Run</button>
        
        <div id="output" class="output">Click the button to convert WAT to WASM and run it...</div>
        
        <h3>What this does:</h3>
        <ul>
            <li>Defines WASM module in human-readable WAT format</li>
            <li>Uses PHP to call system <code>wat2wasm</code> command</li>
            <li>Converts WAT to binary WASM using official tool</li>
            <li>Imports console.log from JavaScript</li>
            <li>Stores "Hello, World!" string in memory</li>
            <li>Exports a main function that calls console.log</li>
            <li>Executes the WASM module</li>
        </ul>
    </div>

    <script>
        async function runWasm() {
            const output = document.getElementById('output');
            output.textContent = 'Converting WAT to WASM using PHP...\n';
            
            // WAT source code
            const watSource = `(module
  ;; Import console.log from JavaScript
  (import "console" "log" (func $log (param i32 i32)))
  
  ;; Memory section - 1 page (64KB)
  (memory 1)
  
  ;; Data section - store "Hello, World!" string at offset 0
  (data (i32.const 0) "Hello, World!")
  
  ;; Export memory so JavaScript can access it
  (export "memory" (memory 0))
  
  ;; Main function that calls console.log
  (func $main
    ;; Call console.log with pointer 0 and length 13
    (call $log (i32.const 0) (i32.const 13))
  )
  
  ;; Export main function
  (export "main" (func $main))
)`;
            
            try {
                // Send WAT to PHP for conversion
                const formData = new FormData();
                formData.append('wat', watSource);
                
                const response = await fetch('?action=convert', {
                    method: 'POST',
                    body: formData
                });
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const result = await response.json();
                
                if (result.error) {
                    throw new Error(result.error);
                }
                
                output.textContent += '✅ WAT converted to WASM successfully!\n';
                output.textContent += `✅ WASM binary size: ${result.wasmBytes.length} bytes\n`;
                output.textContent += `✅ Command output: ${result.commandOutput}\n`;
                
                // Convert hex string back to Uint8Array
                const wasmBytes = new Uint8Array(result.wasmBytes);
                
                // Import object that provides console.log to WASM
                const importObject = {
                    console: {
                        log: (ptr, len) => {
                            // Read the string from memory starting at pointer
                            const memory = module.instance.exports.memory;
                            const bytes = new Uint8Array(memory.buffer, ptr, len);
                            let str = '';
                            for (let i = 0; i < len; i++) {
                                str += String.fromCharCode(bytes[i]);
                            }
                            output.textContent += `✅ WASM called console.log with: "${str}"\n`;
                            console.log('WASM says:', str);
                        }
                    }
                };
                
                // Instantiate and run the WASM module
                output.textContent += '✅ Loading WASM module...\n';
                const module = await WebAssembly.instantiate(wasmBytes, importObject);
                output.textContent += '✅ WASM module loaded successfully!\n';
                output.textContent += '✅ Calling main function...\n';
                
                // Call the main function exported by WASM
                const wasmResult = module.instance.exports.main();
                output.textContent += `✅ Main function executed. Result: ${wasmResult}\n`;
                output.textContent += '🎉 WAT to WASM conversion and execution completed successfully!\n';
                
            } catch (error) {
                output.textContent += `❌ Error: ${error.message}\n`;
                console.error('WASM Error:', error);
            }
        }
    </script>

<?php
// Handle AJAX requests
if (isset($_GET['action']) && $_GET['action'] === 'convert') {
    header('Content-Type: application/json');
    
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
        exit;
    }
    
    $wat = $_POST['wat'] ?? '';
    if (empty($wat)) {
        echo json_encode(['error' => 'No WAT source provided']);
        exit;
    }
    
    try {
        // Create temporary files
        $tempDir = sys_get_temp_dir();
        $watFile = tempnam($tempDir, 'wat_') . '.wat';
        $wasmFile = tempnam($tempDir, 'wasm_') . '.wasm';
        
        // Write WAT to temporary file
        file_put_contents($watFile, $wat);
        
        // Check if wat2wasm is available
        $wat2wasmPath = '';
        $possiblePaths = [
            'wat2wasm',
            '/usr/local/bin/wat2wasm',
            '/usr/bin/wat2wasm',
            '/opt/homebrew/bin/wat2wasm'
        ];
        
        foreach ($possiblePaths as $path) {
            $output = [];
            $returnCode = 0;
            exec("which $path 2>/dev/null", $output, $returnCode);
            if ($returnCode === 0) {
                $wat2wasmPath = $path;
                break;
            }
        }
        
        if (empty($wat2wasmPath)) {
            throw new Exception('wat2wasm command not found. Please install WebAssembly Binary Toolkit (wabt).');
        }
        
        // Convert WAT to WASM using wat2wasm
        $command = escapeshellcmd($wat2wasmPath) . ' ' . 
                   escapeshellarg($watFile) . ' -o ' . 
                   escapeshellarg($wasmFile) . ' 2>&1';
        
        $commandOutput = [];
        $returnCode = 0;
        exec($command, $commandOutput, $returnCode);
        
        if ($returnCode !== 0) {
            throw new Exception('wat2wasm conversion failed: ' . implode("\n", $commandOutput));
        }
        
        // Read the generated WASM file
        if (!file_exists($wasmFile)) {
            throw new Exception('WASM file was not created');
        }
        
        $wasmBytes = file_get_contents($wasmFile);
        if ($wasmBytes === false) {
            throw new Exception('Failed to read generated WASM file');
        }
        
        // Convert to hex array for JavaScript
        $hexArray = [];
        for ($i = 0; $i < strlen($wasmBytes); $i++) {
            $hexArray[] = ord($wasmBytes[$i]);
        }
        
        // Clean up temporary files
        unlink($watFile);
        unlink($wasmFile);
        
        echo json_encode([
            'success' => true,
            'wasmBytes' => $hexArray,
            'commandOutput' => implode("\n", $commandOutput),
            'binarySize' => strlen($wasmBytes)
        ]);
        
    } catch (Exception $e) {
        // Clean up temporary files on error
        if (isset($watFile) && file_exists($watFile)) {
            unlink($watFile);
        }
        if (isset($wasmFile) && file_exists($wasmFile)) {
            unlink($wasmFile);
        }
        
        echo json_encode(['error' => $e->getMessage()]);
    }
    
    exit;
}
?>
</body>
</html> 