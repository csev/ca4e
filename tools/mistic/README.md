# Mistic VLSI Layout Tool

A web-based interactive tool for creating and simulating VLSI (Very Large Scale Integration) circuit layouts. This tool provides a simplified version of professional VLSI layout tools like Magic, designed for educational purposes.

## Overview

The Mistic VLSI Layout Tool allows users to "paint" different semiconductor layers on a grid-based canvas to create digital circuits suitable for manufacture by photolithography. The tool includes real-time circuit simulation, voltage propagation, and electrical analysis.

## Features

### Core Functionality
- **Interactive Grid Canvas**: Draw circuit layouts on a responsive grid
- **Multi-Layer Support**: Work with 7 different semiconductor layers
- **Real-Time Simulation**: Automatic voltage computation and propagation
- **Touch & Mouse Support**: Works on desktop and mobile devices
- **Responsive Design**: Adapts to different screen sizes

### Available Layers

| Layer | Color | Description |
|-------|-------|-------------|
| **Polysilicon** | Red | Gate material for transistors |
| **N+ Diffusion** | Green | N-type semiconductor regions |
| **P+ Diffusion** | Orange | P-type semiconductor regions |
| **Contact/Via** | Black | Electrical connections between layers |
| **Metal** | Blue | Metal interconnect layer |
| **VCC** | Gray | Power supply connections |
| **GND** | Gray | Ground connections |
| **Probe** | Purple | Test points with custom labels |

### Probe Feature

The probe feature allows you to place labeled test points on your circuit for monitoring and control.

#### Using Probes
1. Click the "Probe" button in the toolbar
2. Click on any grid square where you want to place a probe
3. Enter a single character label (e.g., "A", "B", "1", "2")
4. The probe appears with your custom label

#### JavaScript API

Probes can be accessed and controlled via JavaScript using the global `MisticProbes` object:

```javascript
// Read voltage at probe labeled "A"
let voltage = MisticProbes.getProbeValue("A");
// Returns: 1 (high), -1 (low), or 0 (neutral)

// Set voltage at probe labeled "B"
MisticProbes.setProbeValue("B", 1); // Set to high voltage
MisticProbes.setProbeValue("B", -1); // Set to low voltage

// Get all probe labels in the circuit
let labels = MisticProbes.getProbeLabels();
// Returns: ["A", "B", "1", "2"]

// Get probe positions
let locations = MisticProbes.getProbeLocations();
// Returns: {A: {x: 5, y: 3}, B: {x: 2, y: 1}}

// Force circuit recomputation
MisticProbes.recompute();
```

## Circuit Simulation

The tool automatically simulates electrical behavior:

- **Voltage Propagation**: Voltages spread through connected components
- **Short Detection**: Identifies and highlights electrical shorts with 🔥
- **Transistor Behavior**: N+ and P+ regions are gated by polysilicon voltage
- **Visual Feedback**: Shows voltage levels with + (high) and - (low) symbols

### Simulation Rules

1. **VCC** sources provide high voltage (+1)
2. **GND** sources provide low voltage (-1)
3. **Contacts** connect all layers at that location
4. **N+ Diffusion** conducts when polysilicon gate is high
5. **P+ Diffusion** conducts when polysilicon gate is low
6. **Metal** layers provide interconnection
7. **Probes** participate in voltage propagation

## User Interface

### Toolbar Controls
- **Layer Buttons**: Select which layer to draw
- **Erase (🧽)**: Remove all layers from selected areas
- **Clear (🗑️)**: Clear entire canvas (with confirmation)
- **Layers**: Toggle layer stack preview
- **Assignment**: Open assignment modal (authenticated users only)

### Layer Preview
- Shows cross-sectional view of layers at cursor position
- Displays layer stack from top to bottom: N+, Poly, P+, gap, Metal
- Visualizes vias as holes through all layers

### Drawing Modes
- **Drag Drawing**: Most layers support rectangular selection
- **Single Click**: VCC, GND, contacts, and probes are placed individually
- **Touch Support**: Full touch interface for mobile devices

## Technical Implementation

### Architecture
- **Frontend**: Pure HTML5 Canvas with JavaScript
- **Backend**: PHP with Tsugi LTI integration
- **Grid System**: Dynamic grid sizing based on screen width
- **Simulation Engine**: Multi-phase voltage propagation algorithm

### Data Structures
- **Grid**: 3D array `[y][x][layer]` storing layer presence
- **Voltages**: 3D array `[y][x][layer]` storing voltage values
- **Probe Labels**: Object mapping `"x_y"` coordinates to labels

### Performance
- Responsive canvas sizing with fixed tile size
- Efficient redraw system updating only changed tiles
- Bounded simulation phases to prevent infinite loops

## Educational Applications

### Learning Objectives
- Understand VLSI layout principles
- Learn semiconductor layer interactions
- Visualize electrical circuit behavior
- Practice digital circuit design

### Use Cases
- **Logic Gate Design**: Create AND, OR, NOT gates
- **Circuit Analysis**: Use probes to test circuit behavior
- **Layout Optimization**: Learn about area and routing
- **Debugging**: Identify shorts and connectivity issues

## Integration

### LTI Compatibility
- Integrates with Learning Management Systems
- Supports anonymous and authenticated access
- Grade passback capability (when configured)

### Browser Requirements
- Modern browser with HTML5 Canvas support
- JavaScript enabled
- Touch events (for mobile devices)

## API Reference

### MisticProbes Object

#### Methods

##### `getProbeValue(label)`
- **Parameters**: `label` (string) - Single character probe label
- **Returns**: Number - Voltage value (1, -1, or 0) or null if not found
- **Description**: Retrieves the current voltage at the specified probe

##### `setProbeValue(label, voltage)`
- **Parameters**: 
  - `label` (string) - Single character probe label
  - `voltage` (number) - Voltage value (1 for high, -1 for low, 0 for neutral)
- **Returns**: Boolean - true if successful, false if probe not found
- **Description**: Sets the voltage at the specified probe

##### `getProbeLabels()`
- **Parameters**: None
- **Returns**: Array of strings - All probe labels in the circuit
- **Description**: Returns a list of all probe labels currently placed

##### `getProbeLocations()`
- **Parameters**: None
- **Returns**: Object - Mapping of labels to {x, y} coordinates
- **Description**: Returns the grid coordinates of all probes

##### `recompute()`
- **Parameters**: None
- **Returns**: None
- **Description**: Forces recalculation of circuit voltages and redraws the canvas

## Examples

### Basic Logic Gate Testing
```javascript
// Create an AND gate and test it
// Place probes at inputs (A, B) and output (C)

// Test case 1: A=0, B=0
MisticProbes.setProbeValue("A", -1);
MisticProbes.setProbeValue("B", -1);
MisticProbes.recompute();
let output1 = MisticProbes.getProbeValue("C");

// Test case 2: A=1, B=1  
MisticProbes.setProbeValue("A", 1);
MisticProbes.setProbeValue("B", 1);
MisticProbes.recompute();
let output2 = MisticProbes.getProbeValue("C");
```

### Automated Circuit Testing
```javascript
// Test all combinations of a 2-input logic gate
const inputs = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
const results = [];

for (let [a, b] of inputs) {
    MisticProbes.setProbeValue("A", a);
    MisticProbes.setProbeValue("B", b);
    MisticProbes.recompute();
    
    const output = MisticProbes.getProbeValue("C");
    results.push({A: a, B: b, C: output});
}

console.table(results);
```

## Troubleshooting

### Common Issues

1. **Probe not responding**: Ensure the probe is properly placed and labeled
2. **Circuit not updating**: Call `MisticProbes.recompute()` after changes
3. **Short circuit (🔥)**: Check for conflicting voltage sources
4. **Transistor not switching**: Verify polysilicon gate voltage levels

### Debug Tips
- Use the layer preview to inspect layer stacking
- Check probe locations with `getProbeLocations()`
- Monitor browser console for error messages
- Test with simple circuits before building complex designs

## Version History

- **v1.1**: Added probe feature with JavaScript API
- **v1.0**: Initial release with basic VLSI layout and simulation

## License

This tool is part of the CA4E (Computer Architecture for Everyone) educational project.
