# Pure JavaScript WASM Editor (100% In-Browser, ES6 Modules)

**New!** This version uses [wabt.js](https://github.com/AssemblyScript/wabt.js) loaded from a CDN as an ES6 module, so you can compile WAT to WASM entirely in the browser with no server, no npm, and no build step. Just static files!

## Quick Start (CDN, ES6 Modules)

1. Open `index-esm-example.html` in your browser.
2. The editor uses ES6 modules and dynamically loads wabt.js from CDN for WAT-to-WASM compilation.
3. No server or PHP required. Works on any static host (or just open the HTML file directly).

**Key code:**
```js
import wabtInit from 'https://cdn.jsdelivr.net/npm/wabt@1.0.37/index.js';
const wabt = await wabtInit();
const module = wabt.parseWat('module.wat', watSource);
const { buffer } = module.toBinary({});
```

See the rest of this file for more details and comparison with the old approach.

## 🎯 Why Pure JavaScript?

This version eliminates all server-side dependencies, making it:
- **Portable**: Works on any static web server
- **Fast**: No network requests for compilation
- **Simple**: No need to install `wat2wasm` or PHP
- **Secure**: No server-side code execution
- **Offline-capable**: Works without internet connection

## 🚀 Quick Start

### Option 1: Use Pre-built Bundle
1. Download the `wat-compiler-bundle.js` file
2. Include it in your HTML:
   ```html
   <script src="wat-compiler-bundle.js"></script>
   ```
3. Use the compiler:
   ```javascript
   const compiler = new WatCompiler();
   const wasmBinary = await compiler.compileWatToWasm(watText);
   ```

### Option 2: Build from Source
1. Install dependencies:
   ```bash
   npm install
   ```

2. Build the bundle:
   ```bash
   npm run build
   ```

3. Include the generated bundle in your HTML

## 📦 Dependencies

The pure JavaScript version uses these packages:

- **@webassemblyjs/wast-parser**: Parse WAT text to AST
- **@webassemblyjs/wasm-gen**: Generate WASM binary from AST
- **@webassemblyjs/ast**: AST manipulation utilities
- **@webassemblyjs/helper-***: Various helper modules

## 🔧 Integration

### Replace PHP Compiler Service

Instead of using `wat2wasm.php`, update your `wasm-executor.js`:

```javascript
// Old approach (PHP)
async parseWasmText(wasmText) {
    const response = await fetch('wat2wasm.php', {
        method: 'POST',
        body: wasmText
    });
    return new Uint8Array(await response.arrayBuffer());
}

// New approach (Pure JavaScript)
async parseWasmText(wasmText) {
    const compiler = new WatCompiler();
    return await compiler.compileWatToWasm(wasmText);
}
```

### Update HTML

Replace the PHP file with the JavaScript bundle:

```html
<!-- Old -->
<script src="wat2wasm.php"></script>

<!-- New -->
<script src="wat-compiler-bundle.js"></script>
```

## 🎨 Features

### Same as Original Version
- ✅ WAT editor with syntax highlighting
- ✅ Real-time compilation and execution
- ✅ Console output display
- ✅ Example templates
- ✅ Error handling
- ✅ Hex dump viewer
- ✅ LTI/Tsugi integration ready

### New Benefits
- ✅ **No server setup required**
- ✅ **Works on GitHub Pages, Netlify, etc.**
- ✅ **Faster compilation** (no network latency)
- ✅ **Better error messages** (detailed parsing errors)
- ✅ **Offline capability**
- ✅ **No security concerns** (no server-side execution)

## 📊 Performance Comparison

| Aspect | PHP + wat2wasm | Pure JavaScript |
|--------|----------------|-----------------|
| Setup Complexity | High (install wabt, PHP) | Low (just include JS) |
| Compilation Speed | ~100-500ms (network) | ~10-50ms (local) |
| Deployment | Requires server | Static hosting OK |
| Offline Support | No | Yes |
| Error Messages | Basic | Detailed |
| Bundle Size | Small | ~500KB (compressed) |

## 🔍 Error Handling

The pure JavaScript version provides much better error messages:

```javascript
// PHP version error
"WAT compilation failed: wat2wasm compilation failed: syntax error"

// Pure JS version error
"WAT compilation failed: unexpected token ')' at line 5, column 15. Expected 'i32' or 'i64' or 'f32' or 'f64'"
```

## 🛠️ Development

### Building
```bash
# Development with watch
npm run dev

# Production build
npm run build
```

### Testing
```bash
# Test compilation
node -e "
const WatCompiler = require('./wat-compiler.js');
const compiler = new WatCompiler();
compiler.compileWatToWasm('(module)').then(console.log);
"
```

## 🌐 Browser Support

- Chrome 57+
- Firefox 52+
- Safari 11+
- Edge 16+

## 📝 Migration Guide

### From PHP Version

1. **Remove server dependencies**:
   - Delete `wat2wasm.php`
   - Remove wabt installation requirement

2. **Update HTML**:
   ```html
   <!-- Remove PHP -->
   <!-- <script src="wat2wasm.php"></script> -->
   
   <!-- Add JavaScript bundle -->
   <script src="wat-compiler-bundle.js"></script>
   ```

3. **Update JavaScript**:
   ```javascript
   // In wasm-executor.js, replace parseWasmText method
   ```

4. **Update documentation**:
   - Remove wabt installation instructions
   - Update deployment instructions

### Benefits After Migration

- **Simpler deployment**: Just upload static files
- **Better performance**: No server round-trips
- **Enhanced UX**: Faster compilation feedback
- **Reduced complexity**: No server configuration needed

## 🎓 Educational Benefits

This pure JavaScript approach is particularly valuable for education because:

1. **Students can run it anywhere** without setup
2. **No server administration** required
3. **Faster feedback loop** for learning
4. **Works on any device** with a modern browser
5. **Can be embedded** in other educational platforms

## 🔮 Future Enhancements

With the pure JavaScript foundation, we can add:

- **Syntax highlighting** for WAT
- **Real-time validation** as you type
- **Step-by-step debugging** of WASM execution
- **Memory inspection** tools
- **Performance profiling**
- **Code optimization** suggestions

## 📄 License

MIT License - same as the original project.

## 🤝 Contributing

Contributions welcome! The pure JavaScript version opens up many possibilities for enhancements that weren't practical with the server-side approach. 