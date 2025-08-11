# Electric Circuit Layout Tool

A simple electric circuit layout application designed to help students learn about electricity and digital circuits.

## Features

- **Interactive Circuit Design**: Drag and drop components, connect them with wires
- **Real-time Simulation**: See voltages propagate through the circuit
- **Multiple Components**: Battery (6V), Switches, Lights, and Relays
- **Command Line Interface**: Build circuits using text commands for accessibility
- **Visual Feedback**: Color-coded connectors (red=6V, blue=0V, gray=no voltage)

## Components

### Battery
- **Output**: 6V on top
- **Input**: 0V (ground) on bottom
- **Behavior**: Always provides 6V output

### Switch
- **Inputs**: Top and left sides
- **Outputs**: Bottom and right sides
- **Behavior**: When closed, passes voltage from input to output
- **Interaction**: Click to toggle open/closed state

### Light
- **Inputs**: Top and left sides
- **Outputs**: Bottom and right sides
- **Behavior**: Turns on when voltage is present at input
- **Visual**: Shows "ON" when lit, "OFF" when dark

### Relay (Single Pole Double Throw)
- **Input**: Top
- **Outputs**: Bottom (A and B positions)
- **Behavior**: When energized, connects input to position B; otherwise connects to position A
- **Interaction**: Click to toggle energized state



## How to Use

### Using the UI

1. **Place Components**: Click the component buttons in the toolbar
2. **Move Components**: Select "Move" mode and drag components around
3. **Connect Components**: Select "Connect" mode and click on connectors
4. **Toggle Components**: Click on switches or relays to change their state
5. **Read Circuit**: Click "Read Circuit" to see voltages and states

### Using the Command Line

Type commands in the command line at the bottom:

```
place battery
place switch
place light
connect battery-1 output to switch-1 input
connect switch-1 output to light-1 input
connect light-1 output to battery-1 input
read
clear
help
```

### Command Syntax

- `place [component]` - Place a component (battery, switch, light, relay)
- `connect [component] [input|output] to [component] [input|output]` - Connect two components
- `read` - Display circuit status, voltages, and component states
- `clear` - Clear all components and connections
- `help` - Show available commands

## Circuit Simulation

The application simulates voltage propagation through the circuit:

1. **Battery Initialization**: Batteries provide 6V at output, 0V at input
2. **Voltage Propagation**: Voltage flows through connected components
3. **Component Behavior**: Each component type has specific behavior:
   - Switches only pass voltage when closed
   - Lights turn on when voltage is present
   - Relays route voltage based on energized state

## File Structure

- `index.html` - Main HTML file with UI and canvas
- `editor.js` - Circuit editor and UI interaction logic
- `circuit.js` - Circuit simulation and voltage calculation
- `DESIGN.md` - Original design specification

## Running the Application

1. Open `index.html` in a web browser
2. Or serve the directory with a local web server:
   ```bash
   python3 -m http.server 8000
   # Then open http://localhost:8000
   ```

## Educational Use

This tool is designed to help students understand:
- Basic electrical concepts (voltage, current, circuits)
- Component behavior and interactions
- Circuit design and troubleshooting
- Digital logic fundamentals

The visual feedback and real-time simulation make it easy to see how changes affect the circuit behavior.
