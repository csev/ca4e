class WasmEditor {
    constructor() {
        this.editor = document.getElementById('wasmEditor');
        this.output = document.getElementById('output');
        this.errorOutput = document.getElementById('errorOutput');
        this.runButton = document.getElementById('runWasm');
        this.executor = new WasmExecutor();
        
        this.examples = {
            'hello-world': this.getHelloWorldExample(),
            'string-copy': this.getStringCopyExample()
        };
        
        this.initializeEventListeners();
        this.loadDefaultExample();
    }
    
    initializeEventListeners() {
        // Run WASM button
        this.runButton.addEventListener('click', () => this.runWasm());
        
        // Clear editor button
        document.getElementById('clearEditor').addEventListener('click', () => this.clearEditor());
        
        // Load example button
        document.getElementById('loadExample').addEventListener('click', () => this.showExampleSelector());
        
        // Example buttons
        document.querySelectorAll('.example-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const exampleName = e.target.dataset.example;
                this.loadExample(exampleName);
            });
        });
        
        // Keyboard shortcuts
        this.editor.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'Enter') {
                e.preventDefault();
                this.runWasm();
            }
        });
    }
    
    loadDefaultExample() {
        this.loadExample('hello-world');
    }
    
    loadExample(exampleName) {
        if (this.examples[exampleName]) {
            this.editor.value = this.examples[exampleName];
            this.clearOutput();
            this.showMessage(`Loaded ${exampleName.replace('-', ' ')} example`, 'success');
        }
    }
    
    showExampleSelector() {
        // For now, just load the hello world example
        this.loadExample('hello-world');
    }
    
    clearEditor() {
        this.editor.value = '';
        this.clearOutput();
        this.showMessage('Editor cleared', 'success');
    }
    
    clearOutput() {
        this.output.innerHTML = '<p class="placeholder">Output will appear here when you compile and run your WAT code...</p>';
        this.errorOutput.classList.add('hidden');
        this.errorOutput.textContent = '';
    }
    
    async runWasm() {
        this.clearOutput();
        this.showLoading();
        
        try {
            const wasmCode = this.editor.value.trim();
            
            if (!wasmCode) {
                throw new Error('Please enter some WAT code to compile and run.');
            }
            
            // Use the WASM executor to run the code
            const result = await this.executor.executeWasmText(wasmCode);
            
            this.hideLoading();
            this.showOutput(result);
            
        } catch (error) {
            this.hideLoading();
            this.showError(error.message);
        }
    }
    
    showLoading() {
        this.runButton.innerHTML = '<span class="loading"></span> Running...';
        this.runButton.disabled = true;
    }
    
    hideLoading() {
        this.runButton.innerHTML = 'Compile & Run WAT';
        this.runButton.disabled = false;
    }
    
    showOutput(content) {
        this.output.innerHTML = `<pre>${this.escapeHtml(content)}</pre>`;
        this.output.classList.add('success');
        setTimeout(() => this.output.classList.remove('success'), 2000);
    }
    
    showError(message) {
        this.errorOutput.textContent = `Error: ${message}`;
        this.errorOutput.classList.remove('hidden');
        this.output.classList.add('error');
        setTimeout(() => this.output.classList.remove('error'), 3000);
    }
    
    showMessage(message, type = 'info') {
        this.output.innerHTML = `<p class="${type}">${this.escapeHtml(message)}</p>`;
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    // Example WASM code templates
    getHelloWorldExample() {
        return `;; Hello World WASM Example
(module
  ;; Import console.log function
  (import "console" "log" (func $log (param i32 i32)))
  
  ;; Memory for storing strings
  (memory 1)
  
  ;; Data section - store "Hello, World!" string
  (data (i32.const 0) "Hello, World!")
  
  ;; Export memory so JavaScript can access it
  (export "memory" (memory 0))
  
  ;; Main function
  (func $main (result i32)
    ;; Call console.log with pointer and length
    (call $log (i32.const 0) (i32.const 13))
    ;; Return 42
    (i32.const 42)
  )
  
  ;; Export main function
  (export "main" (func $main))
)`;
    }
    
    getStringCopyExample() {
        return `;; String Copy WASM Example
(module
  ;; Import console.log function
  (import "console" "log" (func $log (param i32 i32)))
  
  ;; Memory for storing strings (100 chars each)
  (memory 1)
  
  ;; Data section - store input string "Hello from WASM!"
  (data (i32.const 0) "Hello from WASM!")
  
  ;; Export memory so JavaScript can access it
  (export "memory" (memory 0))
  
  ;; Function to copy string from input to output
  (func $copyString
    (local $i i32)
    (local $inputPtr i32)
    (local $outputPtr i32)
    
    ;; Set pointers: input at 0, output at 100
    (local.set $inputPtr (i32.const 0))
    (local.set $outputPtr (i32.const 100))
    (local.set $i (i32.const 0))
    
    ;; Copy loop
    (loop $copy_loop
      ;; Load character from input
      (local.get $inputPtr)
      (local.get $i)
      (i32.add)
      (i32.load8_u)
      
      ;; Store character to output
      (local.get $outputPtr)
      (local.get $i)
      (i32.add)
      (i32.store8)
      
      ;; Increment counter
      (local.get $i)
      (i32.const 1)
      (i32.add)
      (local.set $i)
      
      ;; Check if we've reached the end of input string (null terminator)
      (local.get $inputPtr)
      (local.get $i)
      (i32.add)
      (i32.load8_u)
      (i32.const 0)
      (i32.ne)
      (br_if $copy_loop)
    )
    
    ;; Add null terminator to output
    (local.get $outputPtr)
    (local.get $i)
    (i32.add)
    (i32.const 0)
    (i32.store8)
  )
  
  ;; Main function
  (func $main (result i32)
    ;; Copy the string
    (call $copyString)
    ;; Print the copied string with length
    (call $log (i32.const 100) (i32.const 16))
    ;; Return 42
    (i32.const 42)
  )
  
  ;; Export main function
  (export "main" (func $main))
)`;
    }
}

// Initialize the WASM editor when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new WasmEditor();
}); 