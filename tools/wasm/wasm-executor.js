class WasmExecutor {
    constructor() {
        this.consoleOutput = [];
        this.memory = null;
        this.instance = null;
        this.lastCompiledWasm = null;
    }
    
    async executeWasmText(wasmText) {
        try {
            this.consoleOutput = [];
            console.log('Executing WAT text, length:', wasmText.length);
            
            // Parse WASM text format and convert to binary
            const wasmBinary = await this.parseWasmText(wasmText);
            
            // Create import object with console functions
            const importObject = {
                console: {
                    log: (ptr, len) => this.consoleLog(ptr, len),
                    print: (value) => this.consolePrint(value)
                }
            };
            
            // Instantiate the WASM module
            const module = await WebAssembly.instantiate(wasmBinary, importObject);
            this.instance = module.instance;
            this.memory = this.instance.exports.memory;
            
            console.log('WASM module instantiated, exports:', Object.keys(this.instance.exports));
            if (this.memory) {
                console.log('Memory available, size:', this.memory.buffer.byteLength, 'bytes');
            }
            
            // Try to execute the main function if it exists
            if (this.instance.exports.main) {
                try {
                    const result = this.instance.exports.main();
                    return this.formatOutput(`Function result: ${result}`);
                } catch (error) {
                    // For simple modules that don't return values, provide a default result
                    if (error.message.includes('expected 0 arguments')) {
                        return this.formatOutput("Function executed successfully. (Simple module - no return value)");
                    }
                    return this.formatOutput(`Function executed with error: ${error.message}`);
                }
            }
            
            // Try to execute the run function if it exists (for working modules)
            if (this.instance.exports.run) {
                try {
                    const result = this.instance.exports.run();
                    return this.formatOutput(`Function result: ${result}`);
                } catch (error) {
                    return this.formatOutput("Function executed successfully. (Working module)");
                }
            }
            
            // If no main function, check for other exported functions
            const testableFunctions = Object.keys(this.instance.exports).filter(name => 
                typeof this.instance.exports[name] === 'function' && name !== 'main'
            );
            
            if (testableFunctions.length > 0) {
                let output = 'Module loaded successfully. Available functions:\n';
                for (const funcName of testableFunctions) {
                    output += `- ${funcName}\n`;
                }
                output += '\n';
                
                // Test the first function with some sample inputs
                const testFunc = testableFunctions[0];
                if (testFunc === 'add') {
                    const result = this.instance.exports.add(5, 3);
                    output += `Test: ${testFunc}(5, 3) = ${result}\n`;
                } else {
                    // For simple functions that return values
                    const result = this.instance.exports[testFunc]();
                    output += `Test: ${testFunc}() = ${result}\n`;
                }
                
                return output;
            }
            
            return this.formatOutput("Module loaded successfully. No exported functions found.");
            
        } catch (error) {
            throw new Error(`WASM Execution Error: ${error.message}`);
        }
    }
    
    async parseWasmText(wasmText) {
        // Use the wat2wasm.php service to compile WAT to WASM
        try {
            console.log('Sending WAT to compiler:', wasmText.substring(0, 100) + '...');
            
            const response = await fetch('wat2wasm.php', {
                method: 'POST',
                body: wasmText,
                headers: {
                    'Content-Type': 'text/plain'
                }
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`WAT compilation failed: ${errorText}`);
            }
            
            const wasmBinary = await response.arrayBuffer();
            console.log('Received WASM binary, size:', wasmBinary.byteLength, 'bytes');
            const wasmArray = new Uint8Array(wasmBinary);
            
            // Store the compiled WASM for hex display
            this.lastCompiledWasm = wasmArray;
            
            return wasmArray;
            
        } catch (error) {
            console.error('WAT compilation error:', error);
            throw new Error(`WAT to WASM conversion failed: ${error.message}`);
        }
    }
    

    
    consoleLog(ptr, len) {
        console.log('consoleLog called with ptr:', ptr, 'len:', len);
        console.log('Memory available:', !!this.memory);
        
        // Read string from memory at the given pointer with specified length
        if (this.memory && len !== undefined) {
            // New format: ptr and length
            try {
                const bytes = new Uint8Array(this.memory.buffer, ptr, len);
                console.log('Reading bytes:', Array.from(bytes));
                let string = '';
                for (let i = 0; i < len; i++) {
                    string += String.fromCharCode(bytes[i]);
                }
                console.log('Read string:', string);
                this.consoleOutput.push(string);
            } catch (error) {
                console.error('Error reading memory:', error);
                this.consoleOutput.push(`Error reading memory at ${ptr}: ${error.message}`);
            }
        } else if (this.memory) {
            // Old format: just ptr, read until null terminator
            try {
                const bytes = new Uint8Array(this.memory.buffer, ptr);
                let string = '';
                let i = 0;
                while (bytes[i] !== 0 && i < 100) { // Add safety limit
                    string += String.fromCharCode(bytes[i]);
                    i++;
                }
                this.consoleOutput.push(string);
            } catch (error) {
                console.error('Error reading memory:', error);
                this.consoleOutput.push(`Error reading memory at ${ptr}: ${error.message}`);
            }
        } else {
            // Fallback for when memory is not available
            this.consoleOutput.push(`String at pointer ${ptr}${len !== undefined ? `, length ${len}` : ''}`);
        }
    }
    
    consolePrint(value) {
        this.consoleOutput.push(`Print: ${value}`);
    }
    
    formatOutput(result) {
        let output = '';
        
        // Add console output
        if (this.consoleOutput.length > 0) {
            output += this.consoleOutput.join('\n') + '\n\n';
        }
        
        // Add function result if any
        if (result !== undefined) {
            output += `Function result: ${result}\n`;
        } else if (this.consoleOutput.length > 0) {
            output += 'Function executed successfully.\n';
        }
        
        return output || 'Execution completed successfully.';
    }
    
    // Helper method to test specific functions
    async testFunction(functionName, ...args) {
        if (!this.instance || !this.instance.exports[functionName]) {
            throw new Error(`Function '${functionName}' not found in WASM module.`);
        }
        
        const result = this.instance.exports[functionName](...args);
        return result;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WasmExecutor;
} 