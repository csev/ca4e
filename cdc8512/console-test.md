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

// Test all load operations
cpu.memory[0x05] = 0x42;  // Set memory location
cpu.requestUpdate();
cpu.a0 = 0x05;  // Should load 0x42 into X0
cpu.a1 = 0x05;  // Should load 0x42 into X1

// Test all store operations
cpu.x2 = 0xCC;  // Set data to store
cpu.x3 = 0xDD;  // Set data to store
cpu.a2 = 0x0A;  // Should store 0xCC to memory[0x0A]
cpu.a3 = 0x0B;  // Should store 0xDD to memory[0x0B]

// Test data movement (load from one location, store to another)
cpu.memory[0x0C] = 0x55;  // Source data
cpu.requestUpdate();
cpu.a0 = 0x0C;  // Load 0x55 into X0
cpu.x2 = cpu.x0;  // Copy X0 to X2
cpu.a2 = 0x0D;  // Store 0x55 to memory[0x0D]
```

## Expected Behavior

- **PC Changes**: Should immediately update the highlighted instruction in the instruction memory
- **A0/A1 Changes**: Should immediately load values from memory into X0/X1
- **A2/A3 Changes**: Should immediately store values from X2/X3 into memory
- **Register Updates**: Should immediately reflect in the UI
- **Memory Updates**: Should immediately reflect in the memory display
- **Hex Display**: All values should display in hex format (0x00 to 0xFF)
- **Hardware Emulation**: Load/store operations work exactly like CDC 6500 addressing

## Important Notes

- **Direct Memory Changes**: When setting `cpu.memory[index] = value` directly, you need to call `cpu.requestUpdate()` to trigger a UI re-render
- **Character Input**: The UI input fields handle character-to-hex conversion automatically, but direct memory assignment doesn't
- **ASCII Values**: Memory only stores ASCII values (0-255). Use numeric values like `72` for 'H', not Unicode strings
- **Memory Range**: Memory addresses range from 0x00 to 0x1F (32 locations total)
- **Display Format**: All registers and memory display values in hex format (e.g., `0x48` for ASCII 72)
- **Hardware Emulation**: A0/A1 trigger load operations, A2/A3 trigger store operations when changed
- **Responsive Layout**: UI adapts to screen size with breakpoint at 1000px
