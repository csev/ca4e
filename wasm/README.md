# WASM Editor & Execution Environment

A simple, browser-based WebAssembly editor and execution environment designed for teaching and learning WASM.

## Features

- **Text-based WASM Editor**: Write and edit WASM code in a syntax-highlighted text area
- **Real-time Execution**: Run WASM code directly in the browser
- **Two Focused Examples**: Hello World and String Copy examples
- **Error Handling**: Clear error messages and debugging information
- **Responsive Design**: Works on desktop and mobile devices

## Getting Started

1. Open `index.html` in a modern web browser
2. The editor will load with a "Hello World" example
3. Click "Run WASM" to execute the code
4. View the output in the right panel

## Examples

### Hello World
A simple example that demonstrates basic WASM module structure and console output.

```wat
(module
  ;; Import console.log function
  (import "console" "log" (func $log (param i32)))
  
  ;; Memory for storing strings
  (memory 1)
  
  ;; Data section - store "Hello, World!" string
  (data (i32.const 0) "Hello, World!")
  
  ;; Main function
  (func $main
    ;; Call console.log with pointer to string
    (call $log (i32.const 0))
  )
  
  ;; Export main function
  (export "main" (func $main))
)
```

### String Copy
Demonstrates string manipulation in WASM by copying a string from input to output and printing it.

```wat
(module
  ;; Import console.log function
  (import "console" "log" (func $log (param i32)))
  
  ;; Memory for storing strings (100 chars each)
  (memory 1)
  
  ;; Data section - store input string "Hello from WASM!"
  (data (i32.const 0) "Hello from WASM!")
  
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
  (func $main
    ;; Copy the string
    (call $copyString)
    ;; Print the copied string
    (call $log (i32.const 100))
  )
  
  ;; Export main function
  (export "main" (func $main))
)
```

## WASM Text Format

The editor supports WASM text format (WAT), which is a human-readable representation of WebAssembly modules. The examples demonstrate:

- **Module Structure**: Basic WASM module organization
- **Imports**: Using external functions (console.log)
- **Memory**: Allocating and using memory
- **Data Sections**: Storing static data
- **Functions**: Defining and calling functions
- **Loops**: Iterative operations
- **Memory Operations**: Loading and storing data

## Keyboard Shortcuts

- `Ctrl + Enter`: Run the current WASM code

## Browser Compatibility

This editor requires a modern browser with WebAssembly support:
- Chrome 57+
- Firefox 52+
- Safari 11+
- Edge 16+

## Technical Details

### Architecture

The editor consists of several components:

1. **WasmEditor** (`script.js`): Main UI controller
2. **WasmExecutor** (`wasm-executor.js`): WASM execution engine
3. **HTML/CSS**: User interface

### WASM Execution Process

1. Parse WASM text format
2. Convert to binary format
3. Instantiate the module
4. Execute exported functions
5. Capture and display output

### Learning Objectives

These examples teach:

1. **Hello World**:
   - Basic WASM module structure
   - Importing external functions
   - Memory allocation
   - Data sections
   - Function exports

2. **String Copy**:
   - Memory manipulation
   - Loops and control flow
   - Local variables
   - String operations
   - Pointer arithmetic

## Future Enhancements

- Full WASM text format parser
- Syntax highlighting
- Step-by-step debugging
- Memory inspection
- More complex examples

## Contributing

This is a teaching tool, so contributions that improve the educational experience are welcome:

- Better examples
- Improved error messages
- Enhanced documentation
- Bug fixes

## License

This project is open source and available under the MIT License. 