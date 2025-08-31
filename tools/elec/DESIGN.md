
Electric Layout Tool
--------------------

This is a simple electric layout tool that iwll help students learn about
how electricity works with an eye to laying a foundation for understanding digital circuits.

There will be three files:

* index.html - contains the canvas and all of the UI bits
* editor.js - processes all the commands to maintain the circuit data structures - this will
have the compnents and connections and allow for voltage values at every node.  It will show the voltage
at any node but all curciut computation will be done in circuit.js
* circuit.js - does all of the curcuit simulation - takes as its input the circuit data structure
from editor.js and computes all the voltages at all the nodes

The components will be:

* Battery 6 volts
* Switches that toggle open / closed
* Lights
* Single pole double throw relays - one that is open until activated and another that is closed until activated

The components will be laid out on a square canvas that resizes in a responsive way.

Components will all be squares and equal sized the label and orginal inside the square and
an indication of the state of the component, also inside the square.  There will be "Move" button
in the top tool bar which when selected allows the user to "grab" a component and move it around.

As the component is moving the wires that are connected to the inputs and outputs will follow the
component.

Each of the components will have input connectors on the top and output
connectors on the bottom.  The battery will have a 6V output
connector on the top and ground (0V) input connector on the bottom. Input connnectors will look
like a filled equilateral triangle with the tip pointing inwards touching the edge of the component and output conectors will be a small equilateral triangle with the base touching the component.

Wires can be drawn between any pair of input and output connectors.
Wires need to be routed around components when drawing a cricuit.
Wires between components will be laid out using Manhattan wire routing where any wire can be
vertical or horizontal.  Wires will be routed in a way that no wire
are laid out on top of another wire until the wires get close to connectors.  Wires can cross one another a 90 degree angles.
If two wires are near each other and going to the same connection they can be joined with a 45, 135, 225, or 315 degree angle on their way to the connectors.

Any number of wires can be connected to an input or output connector.
When connected, the connectors will be red if they are at 6V, blue if they are
at 0V and black of they have unknown voltage.

Wires will have a similar red/blue/black color code depending on the voltages they
are carrying.

The layout of components can be adjusted to make the circuit easier to read.

Each component will be numbered with an orginal like "Switch 1" or "Light 2".  Components
will be placed using a set of buttons across the top of the UI.

There will also be a small command line interface at the bottom where users can type commands like:

    place switch
    place battery
    connect battery-1 output to switch-1 input
    place light
    connect switch-1 output to light-1 input
    connect light-1 output to battery-1 input

This command line interface is specifically designed to allow those with limited vision to build
and test circuits.

When the buttons are used to place components or make connections, the equivalent command line commands
will be show in the small command line interface.

There will be a command to read out the components and all the connections as well as the
voltages at each component's input and output.  Voltages will be read as 6 volts,
0 volts, or not connnected.  There will also be a button to read out the components, connections,
and voltages.

There will be a JavaScript API to read any input or output of any component based on
the component's name / orginal.


