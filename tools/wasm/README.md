# WASM Editor & Execution Environment

A teaching tool for learning WebAssembly Text (WAT) format with real-time compilation and execution in the browser.

## Features

- **WAT Editor**: Write WebAssembly Text format code in a syntax-highlighted editor
- **Real-time Compilation**: Compile WAT to WASM using the `wat2wasm` tool from wabt
- **Browser Execution**: Execute compiled WASM modules directly in the browser
- **Console Output**: Display string output from WASM modules
- **Example Templates**: Pre-built examples to learn from
- **Error Handling**: Clear error messages for compilation and execution issues

## Prerequisites

### Installing wabt (WebAssembly Binary Toolkit)

The WASM editor requires `wat2wasm` from the WebAssembly Binary Toolkit (wabt) to compile WAT to WASM.

#### macOS (using Homebrew)
```bash
brew install wabt
```

#### Ubuntu/Debian
```bash
sudo apt-get install wabt
```

#### Windows (using Chocolatey)
```bash
choco install wabt
```

#### Manual Installation
1. Visit [wabt releases](https://github.com/WebAssembly/wabt/releases)
2. Download the appropriate version for your platform
3. Extract and add to your PATH

#### Verify Installation
```bash
wat2wasm --version
```

## Installation

1. **Clone or download** this repository
2. **Install wabt** (see Prerequisites above)
4. **Open** `http://localhost:8888/ca4e/wasm` in your browser

## Usage

### Basic Workflow

1. **Select an Example**: Use the dropdown to load one of the pre-built examples:
   - **Hello World**: Simple string output
   - **String Copy**: Copy strings between memory locations
   - **Uppercase Converter**: Convert lowercase text to uppercase

2. **Edit Code**: Modify the WAT code in the editor or write your own

3. **Compile & Run**: Click "Compile & Run WAT" to:
   - Send WAT code to the PHP compiler service
   - Compile to WASM using `wat2wasm`
   - Execute the WASM module in the browser
   - Display console output

### WAT Syntax Examples

#### Hello World
```wat
(module
  (import "console" "log" (func $log (param i32 i32)))
  (memory 1)
  (data (i32.const 0) "Hello, World!")
  (export "memory" (memory 0))
  
  (func $main (result i32)
    (call $log (i32.const 0) (i32.const 13))
    (i32.const 42)
  )
  
  (export "main" (func $main))
)
```

#### String Copy with Uppercase Conversion
```wat
(module
  (import "console" "log" (func $log (param i32 i32)))
  (memory 1)
  (data (i32.const 0) "Hello from WASM!")
  (export "memory" (memory 0))
  
  (func $copyAndUppercase (result i32)
    (local $i i32)
    (local $inputPtr i32)
    (local $outputPtr i32)
    (local $char i32)
    
    (local.set $inputPtr (i32.const 0))
    (local.set $outputPtr (i32.const 100))
    (local.set $i (i32.const 0))
    
    (block $copy_loop_end
      (loop $copy_loop
        (local.get $inputPtr)
        (local.get $i)
        (i32.add)
        (i32.load8_u)
        (local.tee $char)
        
        (local.get $char)
        (i32.const 0)
        (i32.eq)
        (br_if $copy_loop_end)
        
        ;; Convert lowercase to uppercase
        (local.get $char)
        (i32.const 97)  ;; ASCII 'a'
        (i32.ge_u)
        (local.get $char)
        (i32.const 122) ;; ASCII 'z'
        (i32.le_u)
        (i32.and)
        (if
          (then
            (local.get $char)
            (i32.const 32)
            (i32.sub)
            (local.set $char)
          )
        )
        
        (local.get $outputPtr)
        (local.get $i)
        (i32.add)
        (local.get $char)
        (i32.store8)
        
        (local.get $i)
        (i32.const 1)
        (i32.add)
        (local.set $i)
        
        (br $copy_loop)
      )
    )
    
    (local.get $outputPtr)
    (local.get $i)
    (i32.add)
    (i32.const 0)
    (i32.store8)
    
    (local.get $i)
  )
  
  (func $main (result i32)
    (local $length i32)
    (local.set $length (call $copyAndUppercase))
    (call $log (i32.const 100) (local.get $length))
    (i32.const 42)
  )
  
  (export "main" (func $main))
)
```

### Key Concepts

#### Console Output
- Import `console.log` with `(param i32 i32)` signature (pointer, length)
- Store strings in memory using `(data (i32.const 0) "your string")`
- Call `console.log` with memory pointer and string length

#### Memory Management
- Export memory with `(export "memory" (memory 0))`
- Use `(memory 1)` to allocate 1 page (64KB) of memory
- Access memory with `(i32.load8_u)` for bytes, `(i32.store8)` to write

#### Function Exports
- Export main function with `(export "main" (func $main))`
- Main function should return `i32` (typically 42 for success)

## File Structure

```
wasm/
├── index.php           # Main WASM editor interface (PHP for LTI/Tsugi integration)
├── script.js           # Editor logic and example templates
├── wasm-executor.js    # WASM execution engine
├── wat2wasm.php        # PHP compiler service
├── styles.css          # Styling
├── README.md           # This file
└── DESIGN.md           # Design documentation
```

## Troubleshooting

### Common Issues

1. **"wat2wasm not found"**
   - Ensure wabt is installed and in your PATH
   - Run `wat2wasm --version` to verify installation

2. **"WAT compilation failed"**
   - Check WAT syntax (parentheses, function names, etc.)
   - Ensure all imports are properly defined
   - Verify memory exports are present

3. **"Console output not working"**
   - Ensure `console.log` import has `(param i32 i32)` signature
   - Check that memory is exported
   - Verify string length is correct

4. **"Permission denied" errors**
   - Ensure PHP has execute permissions for `wat2wasm`
   - Check file permissions in the wasm directory

### Debug Mode

For detailed debugging, check the browser's developer console for:
- Compilation errors
- Execution errors
- Memory access issues
- Console output details

## LTI/Tsugi Integration

The WASM editor is designed to integrate with Learning Management Systems (LMS) through LTI (Learning Tools Interoperability) and Tsugi framework.

### Current Setup
- `index.php` includes commented code for future LTI integration
- Session management is enabled for user tracking
- Structure ready for Tsugi framework integration

### Future Integration Steps
1. **Uncomment LTI code** in `index.php`:
   ```php
   $CFG = new stdClass();
   $CFG->wwwroot = 'http://localhost/tsugi';
   require_once "tsugi/lib/lms_lib.php";
   require_once "tsugi/lib/lti_util.php";
   ```

2. **Enable user context**:
   ```php
   if (isset($USER)) {
       echo '<div class="lti-info">';
       echo '<p>Welcome, ' . htmlspecialchars($USER->displayname) . '</p>';
       echo '<p>Course: ' . htmlspecialchars($CONTEXT->title) . '</p>';
       echo '</div>';
   }
   ```

3. **Add grade passback** for completed exercises
4. **Implement user progress tracking**
5. **Add course-specific examples**

## Development

1. Add example method to `script.js`:
   ```javascript
   getNewExample() {
       return `;; Your WAT code here
   (module
     ;; ... WAT code
   )`;
   }
   ```

2. Add to examples object in constructor:
   ```javascript
   this.examples = {
       'hello-world': this.getHelloWorldExample(),
       'string-copy': this.getStringCopyExample(),
       'uppercase': this.getUppercaseExample(),
       'new-example': this.getNewExample()
   };
   ```

3. Add to dropdown in `showExampleSelector()`:
   ```javascript
   <option value="new-example">New Example</option>
   ```

### Customizing the Compiler

The PHP compiler service (`wat2wasm.php`) can be modified to:
- Add compilation options
- Support different output formats
- Add validation rules
- Implement caching

## About Computer Architecture for Everybody

This WASM tool is part of the **Computer Architecture for Everybody** course, 
available at [www.ca4e.com](https://www.ca4e.com). The course provides hands-on 
learning experiences for understanding computer architecture concepts through 
interactive tools and exercises.

## License

This project is part of the Computer Architecture for Everyone (CA4E) educational materials.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## Resources

- [WebAssembly Text Format](https://webassembly.github.io/spec/core/text/index.html)
- [wabt Documentation](https://github.com/WebAssembly/wabt)
- [WebAssembly MDN Guide](https://developer.mozilla.org/en-US/docs/WebAssembly)
- [WAT Syntax Reference](https://webassembly.github.io/spec/core/text/instructions.html) 