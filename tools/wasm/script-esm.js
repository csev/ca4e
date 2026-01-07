/**
 * WASM Editor - ES Module Version
 * 
 * This version uses ES modules and integrates with the pure JavaScript WAT compiler.
 */

import { WasmExecutor } from './wasm-executor-esm.js';

export class WasmEditor {
    constructor() {
        this.editor = document.getElementById('wasmEditor');
        this.output = document.getElementById('output');
        this.errorOutput = document.getElementById('errorOutput');
        this.runButton = document.getElementById('runWasm');
        this.showWasmButton = document.getElementById('showWasm');
        this.executor = new WasmExecutor();
        
        // Store the last compiled WASM binary
        this.lastCompiledWasm = null;
        
        this.examples = {
            'hello-world': this.getHelloWorldExample(),
            // 'string-copy': this.getStringCopyExample(),  // Hidden but not removed
            'uppercase': this.getUppercaseExample()
        };
        
        this.initializeEventListeners();
        this.loadDefaultExample();
    }
    
    initializeEventListeners() {
        // Run WASM button
        this.runButton.addEventListener('click', () => this.runWasm());
        
        // Clear editor button
        document.getElementById('clearEditor').addEventListener('click', () => this.clearEditor());
        
        // Show WASM button
        this.showWasmButton.addEventListener('click', () => this.showWasmHex());
        
        // Modal close button
        document.querySelector('.close').addEventListener('click', () => this.closeModal());
        
        // Close modal when clicking outside
        document.getElementById('wasmModal').addEventListener('click', (e) => {
            if (e.target.id === 'wasmModal') {
                this.closeModal();
            }
        });
        
        // Show example selector immediately
        this.showExampleSelector();
        
        // Keyboard shortcuts
        this.editor.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'Enter') {
                e.preventDefault();
                this.runWasm();
            }
        });
        
        // Initialize save/restore functionality
        this.initializeSaveRestore();
    }
    
    initializeSaveRestore() {
        // Clean up any potentially corrupted save data from development
        try {
            const savedData = localStorage.getItem('ca4e_wasm_saves');
            if (savedData) {
                const saves = JSON.parse(savedData);
                let needsCleanup = false;
                
                for (const [name, save] of Object.entries(saves)) {
                    if (save.data && !save.data.code) {
                        needsCleanup = true;
                        break;
                    }
                }
                
                if (needsCleanup) {
                    console.log('Cleaning up corrupted WASM save data...');
                    localStorage.removeItem('ca4e_wasm_saves');
                }
            }
        } catch (error) {
            console.warn('Error checking WASM save data, clearing:', error);
            localStorage.removeItem('ca4e_wasm_saves');
        }
        
        const saveRestoreManager = new SaveRestoreManager('wasm', {
            defaultNamePrefix: 'WAT_Code_',
            maxSaves: 25
        });

        // Functions to get/set code data for save/restore
        const getCurrentCodeData = () => {
            return {
                code: this.editor.value,
                timestamp: new Date().toISOString()
            };
        };

        const setCodeData = (data) => {
            if (data && data.code) {
                this.editor.value = data.code;
                this.clearOutput();
                this.showMessage('Code loaded successfully', 'success');
            }
        };

        // Initialize save/restore buttons
        saveRestoreManager.createStorageDropdown({
            dropdownId: 'storageDropdown',
            getDataCallback: getCurrentCodeData,
            setDataCallback: setCodeData
        });
    }
    
    loadDefaultExample() {
        // Don't load any example by default - let user choose
        this.clearEditor();
    }
    
    loadExample(exampleName) {
        if (this.examples[exampleName]) {
            this.editor.value = this.examples[exampleName];
            this.clearOutput();
            this.showMessage(`Loaded ${exampleName.replace('-', ' ')} example`, 'success');
        }
    }
    
    showExampleSelector() {
        // Create example selector dropdown
        const selector = document.createElement('select');
        selector.innerHTML = `
            <option value="">Load sample code</option>
            <option value="hello-world">Hello World</option>
            <!-- String Copy option hidden but not removed -->
            <option value="uppercase">Uppercase Converter</option>
        `;
        
        selector.addEventListener('change', (e) => {
            if (e.target.value) {
                this.loadExample(e.target.value);
                // Reset to default option after loading
                e.target.value = '';
            }
        });
        
        // Insert selector before the run button
        this.runButton.parentNode.insertBefore(selector, this.runButton);
    }
    
    clearEditor() {
        this.editor.value = '';
        this.clearOutput();
        this.lastCompiledWasm = null;
        this.showWasmButton.classList.add('hidden');
        this.showMessage('Editor cleared', 'success');
    }
    
    clearOutput() {
        this.output.innerHTML = '<p class="placeholder">Output will appear here when you compile and run your WAT code...</p>';
        this.errorOutput.classList.add('hidden');
        this.errorOutput.textContent = '';
        this.showWasmButton.classList.add('hidden');
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
            
            // Store the compiled WASM binary for hex display
            this.lastCompiledWasm = this.executor.lastCompiledWasm;
            
            this.hideLoading();
            this.showOutput(result);
            
            // Show the Show WASM button if compilation was successful
            if (this.lastCompiledWasm) {
                this.showWasmButton.classList.remove('hidden');
            }
            
        } catch (error) {
            this.hideLoading();
            this.showError(error.message);
            this.showWasmButton.classList.add('hidden');
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
    
    showWasmHex() {
        if (!this.lastCompiledWasm) {
            this.showError('No compiled WASM available. Please compile and run your WAT code first.');
            return;
        }
        
        const modal = document.getElementById('wasmModal');
        const wasmSize = document.getElementById('wasmSize');
        const wasmMagic = document.getElementById('wasmMagic');
        const wasmHex = document.getElementById('wasmHex');
        
        // Update size
        wasmSize.textContent = this.lastCompiledWasm.length;
        
        // Update magic number (first 4 bytes)
        const magicBytes = Array.from(this.lastCompiledWasm.slice(0, 4))
            .map(b => b.toString(16).padStart(2, '0'))
            .join(' ');
        wasmMagic.textContent = magicBytes;
        
        // Format hex dump
        const hexLines = [];
        for (let i = 0; i < this.lastCompiledWasm.length; i += 16) {
            const offset = i.toString(16).padStart(8, '0');
            const bytes = Array.from(this.lastCompiledWasm.slice(i, i + 16))
                .map(b => b.toString(16).padStart(2, '0'))
                .join(' ');
            const ascii = Array.from(this.lastCompiledWasm.slice(i, i + 16))
                .map(b => (b >= 32 && b <= 126) ? String.fromCharCode(b) : '.')
                .join('');
            
            hexLines.push(`${offset}: ${bytes.padEnd(47)} |${ascii}|`);
        }
        
        wasmHex.textContent = hexLines.join('\n');
        
        // Show modal
        modal.classList.remove('hidden');
    }
    
    closeModal() {
        document.getElementById('wasmModal').classList.add('hidden');
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
    
    // Hidden but not removed
    /*
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
  
  ;; Function to copy string from input to output, returns length
  (func $copyString (result i32)
    (local $i i32)
    (local $inputPtr i32)
    (local $outputPtr i32)
    (local $char i32)
    
    ;; Set pointers: input at 0, output at 100
    (local.set $inputPtr (i32.const 0))
    (local.set $outputPtr (i32.const 100))
    (local.set $i (i32.const 0))
    
    ;; Copy loop
    (block $copy_loop_end
      (loop $copy_loop
        ;; Load character from input
        (local.get $inputPtr)
        (local.get $i)
        (i32.add)
        (i32.load8_u)
        (local.tee $char)
        
        ;; Check if we've reached the end of input string (null terminator)
        (local.get $char)
        (i32.const 0)
        (i32.eq)
        (br_if $copy_loop_end)
        
        ;; Store character to output
        (local.get $outputPtr)
        (local.get $i)
        (i32.add)
        (local.get $char)
        (i32.store8)
        
        ;; Increment counter
        (local.get $i)
        (i32.const 1)
        (i32.add)
        (local.set $i)
        
        ;; Continue loop
        (br $copy_loop)
      )
    )
    
    ;; Add null terminator to output
    (local.get $outputPtr)
    (local.get $i)
    (i32.add)
    (i32.const 0)
    (i32.store8)
    
    ;; Return the length of copied string
    (local.get $i)
  )
  
  ;; Main function
  (func $main (result i32)
    ;; Copy the string and get its length
    (local $length i32)
    (local.set $length (call $copyString))
    ;; Print the copied string with calculated length
    (call $log (i32.const 100) (local.get $length))
    ;; Return 42
    (i32.const 42)
  )
  
  ;; Export main function
  (export "main" (func $main))
)`;
    }
    */
    
    getUppercaseExample() {
        return `;; Uppercase Converter WASM Example
(module
  ;; Import console.log function
  (import "console" "log" (func $log (param i32 i32)))
  
  ;; Memory for storing strings (100 chars each)
  (memory 1)
  
  ;; Data section - store input string "Hello from WASM!"
  (data (i32.const 0) "Hello from WASM!")
  
  ;; Export memory so JavaScript can access it
  (export "memory" (memory 0))
  
  ;; Function to copy string and convert to uppercase, returns length
  (func $copyAndUppercase (result i32)
    (local $i i32)
    (local $inputPtr i32)
    (local $outputPtr i32)
    (local $char i32)
    
    ;; Set pointers: input at 0, output at 100
    (local.set $inputPtr (i32.const 0))
    (local.set $outputPtr (i32.const 100))
    (local.set $i (i32.const 0))
    
    ;; Copy and convert loop
    (block $copy_loop_end
      (loop $copy_loop
        ;; Load character from input
        (local.get $inputPtr)
        (local.get $i)
        (i32.add)
        (i32.load8_u)
        (local.tee $char)
        
        ;; Check if we've reached the end of input string (null terminator)
        (local.get $char)
        (i32.const 0)
        (i32.eq)
        (br_if $copy_loop_end)
        
        ;; Convert lowercase to uppercase if needed
        (local.get $char)
        (i32.const 97)  ;; ASCII 'a'
        (i32.ge_u)
        (local.get $char)
        (i32.const 122) ;; ASCII 'z'
        (i32.le_u)
        (i32.and)
        (if
          (then
            ;; Convert to uppercase by subtracting 32
            (local.get $char)
            (i32.const 32)
            (i32.sub)
            (local.set $char)
          )
        )
        
        ;; Store character to output
        (local.get $outputPtr)
        (local.get $i)
        (i32.add)
        (local.get $char)
        (i32.store8)
        
        ;; Increment counter
        (local.get $i)
        (i32.const 1)
        (i32.add)
        (local.set $i)
        
        ;; Continue loop
        (br $copy_loop)
      )
    )
    
    ;; Add null terminator to output
    (local.get $outputPtr)
    (local.get $i)
    (i32.add)
    (i32.const 0)
    (i32.store8)
    
    ;; Return the length of copied string
    (local.get $i)
  )
  
  ;; Main function
  (func $main (result i32)
    ;; Copy and convert the string and get its length
    (local $length i32)
    (local.set $length (call $copyAndUppercase))
    ;; Print the converted string with calculated length
    (call $log (i32.const 100) (local.get $length))
    ;; Return 42
    (i32.const 42)
  )
  
  ;; Export main function
  (export "main" (func $main))
)`;
    }
} 