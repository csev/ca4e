<?php
// WAT to WASM compiler service
// Takes WAT source as POST data, compiles it with wat2wasm, and returns WASM binary

header('Content-Type: application/wasm');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo "Method not allowed. Use POST to send WAT source code.";
    exit;
}

// Get WAT source from POST data
$wat = file_get_contents('php://input');
if (empty($wat)) {
    http_response_code(400);
    echo "No WAT source code provided. Send WAT source in POST body.";
    exit;
}

try {
    // Create temporary files
    $tempDir = sys_get_temp_dir();
    $watFile = tempnam($tempDir, 'wat_') . '.wat';
    $wasmFile = tempnam($tempDir, 'wasm_') . '.wasm';
    
    // Write WAT to temporary file
    if (file_put_contents($watFile, $wat) === false) {
        throw new Exception('Failed to write WAT file');
    }
    
    // Find wat2wasm executable
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

    $wat2wasmPath = '/opt/homebrew/bin/wat2wasm';
    
    if (empty($wat2wasmPath)) {
        throw new Exception('wat2wasm command not found. Please install WebAssembly Binary Toolkit (wabt).');
    }
    
    // Compile WAT to WASM using wat2wasm
    $command = escapeshellcmd($wat2wasmPath) . ' ' . 
               escapeshellarg($watFile) . ' -o ' . 
               escapeshellarg($wasmFile) . ' 2>&1';
    
    $commandOutput = [];
    $returnCode = 0;
    exec($command, $commandOutput, $returnCode);
    
    if ($returnCode !== 0) {
        throw new Exception('wat2wasm compilation failed: ' . implode("\n", $commandOutput));
    }
    
    // Check if WASM file was created
    if (!file_exists($wasmFile)) {
        throw new Exception('WASM file was not created by wat2wasm');
    }
    
    // Read and output the WASM binary
    $wasmBytes = file_get_contents($wasmFile);
    if ($wasmBytes === false) {
        throw new Exception('Failed to read generated WASM file');
    }
    
    // Set content length header
    header('Content-Length: ' . strlen($wasmBytes));
    
    // Output the WASM binary
    echo $wasmBytes;
    
    // Clean up temporary files
    unlink($watFile);
    unlink($wasmFile);
    
} catch (Exception $e) {
    // Clean up temporary files on error
    if (isset($watFile) && file_exists($watFile)) {
        unlink($watFile);
    }
    if (isset($wasmFile) && file_exists($wasmFile)) {
        unlink($wasmFile);
    }
    
    // Return error as WASM (empty module that will fail to instantiate)
    http_response_code(500);
    header('Content-Type: text/plain');
    echo "Compilation error: " . $e->getMessage();
}
?> 