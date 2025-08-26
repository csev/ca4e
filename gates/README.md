# Digital Circuit Editor - Command Line Interface

A sophisticated web-based digital circuit simulation and design tool with a powerful command line interface designed for accessibility and ease of use.

## 🎯 Overview

This digital circuit editor allows users to create, simulate, and test digital logic circuits through both a visual interface and a command line interface. The command line interface is specifically designed to support users with limited vision, providing full keyboard control for building and testing circuits.

## 🖥️ Command Line Interface

The application includes a powerful command-line interface at the bottom of the screen, especially useful for accessibility and power users.

### Available Commands

#### `place [component-type] [optional-label]`
Places a component on the canvas. If a label is provided, it uses the literal label; otherwise, it uses automatic numbering.

**Component Types:**
- `input` - Input gate
- `output` - Output gate  
- `and` - AND gate
- `or` - OR gate
- `not` - NOT gate
- `nand` - NAND gate
- `nor` - NOR gate
- `xor` - XOR gate
- `full-adder` - Full adder
- `nixie` - Nixie tube display
- `clock` - Clock generator
- `sr-flip-flop` - SR flip-flop
- `jk-flip-flop` - JK flip-flop
- `1-bit-latch` - 1-bit latch
- `3-bit-latch` - 3-bit latch
- `3-bit-adder` - 3-bit adder

**Examples:**
- `place input a` - Places an input labeled "a"
- `place and` - Places an AND gate with automatic numbering
- `place or gate1` - Places an OR gate labeled "gate1"

#### `delete [component-type] [label]`
Deletes a specific component by type and label.

**Examples:**
- `delete input a` - Deletes input labeled "a"
- `delete and gate1` - Deletes AND gate labeled "gate1"

#### `connect [from] [from-connector] to [to] [to-connector]`
Connects two components using their input/output nodes.

**Connector Types:**
- **Simple Gates**: `input`, `input-1`, `input-2`, `output`, `output-1`, `output-2`
- **Complex Components**: Use labeled connectors (case-insensitive)

**Labeled Connectors by Component:**
- **Full Adder**: `Cin`, `A`, `B` (inputs); `S`, `Cout` (outputs)
- **Nixie Display**: `I1`, `I2`, `I4` (inputs); `O1`, `O2`, `O4` (outptuts)
- **3-bit Adder**: `A0`, `A1`, `A2`, `B0`, `B1`, `B2` (inputs); `S0`, `S1`, `S2`, `Cout` (outputs)
- **Clock Pulse**: `Hi`, `Lo` (outputs)
- **SR Flip-Flop**: `S`, `R`, `CLK` (inputs); `Q`, `Q'` (outputs)
- **JK Flip-Flop**: `J`, `K`, `CLK` (inputs); `Q`, `Q'` (outputs)
- **1-bit Latch**: `D`, `EN` (inputs); `Q` (output)
- **3-bit Latch**: `CLK`, `I1`, `I2`, `I3` (inputs); `O1`, `O2`, `O3` (outputs)

**Examples:**
- `connect a output to gate1 input-1` - Connects output of "a" to input-1 of "gate1"
- `connect sam output to full1 Cin` - Connects output of "sam" to Cin input of "full1"
- `connect full1 S to result input-1` - Connects S output of "full1" to input-1 of "result"
- `connect adder1 A0 to latch1 I1` - Connects A0 input of "adder1" to I1 input of "latch1"
- `connect counter1 output to nixie1 I1` - Connects output of "counter1" to I1 input of "nixie1"
- `connect clock1 Hi to flipflop1 CLK` - Connects Hi output of "clock1" to CLK input of "flipflop1"

#### `read`
Displays the current state of all components and their connections.

#### `read [component-label]`
Displays detailed information about a specific component, including:
- Component type and position
- Input and output connectors with their current values
- Connection status (connected/not connected)
- Special state information (for inputs, clocks, latches)
- Incoming and outgoing wire connections

**Examples:**
- `read` - Shows all components and connections
- `read full1` - Shows detailed info about component "full1"
- `read clock1` - Shows detailed info about component "clock1"

#### `clear`
Removes all components and wires from the canvas.

#### `layout`
**NEW!** Automatically optimizes component layout to minimize wire crossings and improve readability. This command uses advanced algorithms including:

- **Force-directed layout** - Components repel each other while connected components attract
- **Level-based positioning** - Components are arranged by their logical depth from inputs
- **Wire crossing minimization** - Detects and reduces wire intersections
- **Clean wire routing** - Removes existing waypoints for direct, clean connections
- **Grid snapping** - Aligns components to a grid for cleaner appearance

**Note:** If existing waypoints are detected, a confirmation dialog will appear asking permission to remove them before layout optimization.

**Examples:**
- `layout` - Optimizes the current circuit layout

#### `help`
Displays detailed help information for all available commands.

### Navigation

- **↑ (Up Arrow)** - Browse command history (previous commands)
- **↓ (Down Arrow)** - Browse command history (next commands)

### Examples

```bash
# Build a simple AND circuit
place input a
place input b
place and gate1
place output result
connect a output to gate1 input-1
connect b output to gate1 input-2
connect gate1 output to result input-1

# Optimize the layout
layout

# Read the circuit status
read

# Clear and start over
clear
```

## 🎨 Visual Interface Features

### Component Placement
- **Smart Positioning**: Components are automatically placed with proper spacing
- **No Overlapping**: Maintains 80px minimum distance between components
- **Canvas Bounds**: Components stay within canvas margins

### Component Types

#### Basic Logic Gates
- **AND, OR, NOT, NAND, NOR, XOR**: Standard logic gates
- **Visual Feedback**: Gates change color based on their logic state (green=1, red=0)

#### Complex Components
- **Full Adder**: 1-bit adder with carry input and outputs
- **3-Bit Adder**: Multi-bit adder for arithmetic operations
- **Nixie Display**: Visual display component

#### Sequential Logic
- **SR Flip-Flop**: Set-Reset flip-flop
- **JK Flip-Flop**: JK flip-flop with toggle capability
- **1-Bit Latch**: Single-bit storage element
- **3-Bit Latch**: Multi-bit storage register
- **Clock Pulse**: Automatic clock signal generator

#### Input/Output
- **Input**: Signal source that can be toggled by clicking
- **Output**: Signal destination that displays current value

### Wire Management
- **Automatic Routing**: Wires are automatically routed between components
- **Waypoints**: Double-click wires to add waypoints for custom routing
- **Visual Feedback**: Wires show connection status

## ♿ Accessibility Features

### Screen Reader Support
- **Announcements**: Screen reader announces component states and actions
- **Keyboard Navigation**: Full keyboard control for all operations
- **Status Updates**: Real-time status updates for all operations

### Command Line Interface
- **Text-Based Control**: Complete circuit control through text commands
- **Error Messages**: Clear error messages for invalid commands
- **Help System**: Comprehensive help and examples

### Visual Accessibility
- **High Contrast**: Clear visual distinction between components
- **Color Coding**: Consistent color scheme for logic states
- **Large Targets**: Adequate click targets for all interactive elements

## 🚀 Performance Features

### Debounced Circuit Updates
- **Smart Updates**: Circuit simulation only runs when needed
- **Mouse Movement**: Updates are debounced during mouse movement
- **Clock Support**: Immediate updates for clock-driven changes

### Visual Feedback
- **Status Indicators**: Shows when circuit is being computed
- **Performance Logging**: Console logs show computation times
- **Non-Blocking UI**: Interface remains responsive during computation

## 📝 Usage Examples

### Building a Simple AND Circuit
```bash
place input a
place input b
place and result
connect a output to result input-1
connect b output to result input-2
read
```

### Building a Full Adder
```bash
place input a
place input b
place input cin
place full-adder adder1
place output sum
place output cout
connect a output to adder1 input-1
connect b output to adder1 input-2
connect cin output to adder1 input-3
connect adder1 output-1 to sum input
connect adder1 output-2 to cout input
read
```