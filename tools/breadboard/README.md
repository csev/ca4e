# Breadboard Circuit Simulator

A modular, interactive circuit simulation tool that allows users to build and test electronic circuits on a virtual breadboard.

## Architecture

The application has been refactored into a clean, modular architecture with clear separation of concerns:

### Files

- **`index.html`** - Main HTML file with UI controls and canvas
- **`circuit-simulator.js`** - Circuit simulation engine (electrical calculations)
- **`layout-editor.js`** - UI, drawing, and user interaction handling
- **`layout.js`** - Original monolithic file (kept for reference)

### Module Responsibilities

#### Circuit Simulator (`circuit-simulator.js`)
- **Electrical calculations**: Voltage propagation, current flow, component behavior
- **Circuit analysis**: Connection tracking, short circuit detection
- **Component characteristics**: LED forward voltage, transistor thresholds, etc.
- **State management**: Switch states, transistor states, voltage sources
- **Data structures**: Connection maps, voltage maps

#### Layout Editor (`layout-editor.js`)
- **UI rendering**: Canvas drawing, component visualization
- **User interaction**: Mouse events, drag-and-drop, component placement
- **Visual feedback**: Color coding, animations, warnings
- **Event handling**: Click detection, keyboard shortcuts
- **Component drawing**: LEDs, switches, transistors, voltage indicators

### Data Flow

The only data passed between modules is:
1. **Nodes and connections**: Array of dots and their electrical connections
2. **Component states**: Switch positions, transistor states, voltage source values
3. **Voltage calculations**: Results from circuit analysis for visualization

## Features

### Components
- **Wires** - Basic electrical connections
- **LEDs** - Light-emitting diodes with realistic voltage drop (2.0V forward voltage)
- **Switches** - Normally Open (NO) and Normally Closed (NC) with clickable interaction
- **Transistors** - NMOS and PMOS with realistic switching behavior
- **Voltage Indicators** - Show voltage at any point in the circuit
- **Voltage Sources** - VCC/GND sources that can be toggled

### Interactive Features
- **Real-time simulation**: Automatic voltage calculation and propagation
- **Visual feedback**: Color-coded voltage levels, LED brightness based on current
- **Component interaction**: Click switches, toggle voltage sources
- **Delete mode**: Remove components with right-click or delete button
- **Auto-compute toggle**: Enable/disable automatic circuit recalculation

### Educational Value
- **Realistic behavior**: Components behave like real electronics
- **Safety features**: Short circuit warnings
- **Visual learning**: Immediate feedback on circuit changes
- **Breadboard simulation**: Accurate representation of physical breadboard connectivity

## Usage

1. **Select a component** from the dropdown menu
2. **Place components** by clicking on the breadboard
3. **Connect components** by dragging from one dot to another
4. **Interact with components**:
   - Click switches to toggle them
   - Click voltage sources to switch between VCC/GND
   - Right-click components to delete them
5. **Observe results** in real-time as voltages propagate through the circuit

## Technical Details

### Grid Layout
- 30 columns × 14 rows
- Power rails (VCC/GND) at top and bottom
- Center channel separating breadboard into two halves
- Column connections within each half (rows a-e and f-j)

### Circuit Analysis
- Voltage propagation algorithm with iteration limits
- Breadboard column connectivity simulation
- Component-specific behavior (LED forward voltage, transistor thresholds)
- Short circuit detection and warnings

### Performance
- Modular architecture allows for easy optimization
- Separate simulation and rendering loops
- Efficient connection tracking using Sets and Maps

## Development

### Adding New Components
1. Add component characteristics to `circuit-simulator.js`
2. Add drawing method to `layout-editor.js`
3. Add component type to HTML dropdown
4. Update event handlers for placement and interaction

### Extending Functionality
- The modular design makes it easy to add new features
- Circuit simulator can be extended with new analysis algorithms
- Layout editor can be enhanced with new visualization features
- Clear interfaces between modules prevent coupling issues

## Browser Compatibility

- Modern browsers with Canvas support
- ES6+ JavaScript features
- No external dependencies (except Font Awesome for icons)

## License

This project is part of an educational system for teaching electronics and circuit design concepts.
