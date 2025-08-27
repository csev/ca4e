# CDC8512 CPU Console Testing

## Accessing the Web Component

### Method 1: Using `document.querySelector()`
```javascript
// In the browser console, find the web component
const cpu = document.querySelector('cdc8512-cpu');
// Now you can access its properties
cpu.pc = 0x10;  // This should update the highlighting
cpu.a0 = 0x20;  // This should trigger the load into X0
```

### Method 2: Using `$0` (if you've selected the element)
```javascript
// In DevTools, right-click on the CPU simulator and "Inspect Element"
// Then in the console:
$0.pc = 0x15;  // $0 refers to the currently selected element
```

### Method 3: Using `document.getElementsByTagName()`
```javascript
const cpu = document.getElementsByTagName('cdc8512-cpu')[0];
cpu.pc = 0x08;
```

### Method 4: Add a global reference (temporary)
You could temporarily add this to your component's constructor:
```javascript
constructor() {
  super();
  // ... existing code ...
  window.cpu = this;  // Makes it accessible as window.cpu
}
```

Then in the console:
```javascript
window.cpu.pc = 0x12;
window.cpu.a2 = 0x30;  // Should trigger store of X2 to memory[0x30]
```

## Test Commands to Try

```javascript
const cpu = document.querySelector('cdc8512-cpu');

// Test PC highlighting
cpu.pc = 0x10;  // Should highlight instruction at address 0x10

// Test load operation
cpu.x0 = 0x99;  // Set some data in X0
cpu.a0 = 0x20;  // Should load memory[0x20] into X0

// Test store operation  
cpu.x2 = 0xAA;  // Set data to store
cpu.a2 = 0x18;  // Should store 0xAA to memory[0x18]

// Test memory operations
cpu.memory[0x10] = 0x55;  // Set memory location directly
cpu.requestUpdate();  // Force re-render to update UI
cpu.a0 = 0x10;  // Should load 0x55 into X0

// Test ASCII character in memory
cpu.memory[0x15] = 72;  // ASCII 72 = 'H'
cpu.requestUpdate();  // Force re-render to update UI
cpu.a0 = 0x15;  // Should load 0x48 (72) into X0

// Convert Unicode to ASCII and store
cpu.memory[0x1A] = 'H'.charCodeAt(0);  // Convert 'H' to ASCII 72
cpu.memory[0x1B] = 'i'.charCodeAt(0);  // Convert 'i' to ASCII 105
cpu.requestUpdate();

// Test comparison register
cpu.comparison = ">";  // Set comparison to greater than
```

## Expected Behavior

- **PC Changes**: Should immediately update the highlighted instruction in the instruction memory
- **A0/A1 Changes**: Should immediately load values from memory into X0/X1
- **A2/A3 Changes**: Should immediately store values from X2/X3 into memory
- **Register Updates**: Should immediately reflect in the UI
- **Memory Updates**: Should immediately reflect in the memory display

## Important Notes

- **Direct Memory Changes**: When setting `cpu.memory[index] = value` directly, you need to call `cpu.requestUpdate()` to trigger a UI re-render
- **Character Input**: The UI input fields handle character-to-hex conversion automatically, but direct memory assignment doesn't
- **ASCII Values**: Memory only stores ASCII values (0-255). Use numeric values like `72` for 'H', not Unicode strings
- **Memory Range**: Memory addresses range from 0x00 to 0x1F (32 locations total)
- **Display Format**: X registers display values in hex format (e.g., `0x48` for ASCII 72), not as characters
- **Memory Display**: Memory cells display values in hex format (e.g., `0x48` for ASCII 72), consistent with registers
