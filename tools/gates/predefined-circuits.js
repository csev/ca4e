/**
 * Predefined Circuits for Gates Tool
 * Contains example circuits with multiple components that can be loaded
 */

// Initialize if not already defined (allows merging with other predefined circuits)
if (!window.predefinedCircuits) {
    window.predefinedCircuits = {};
}

// Merge gates-specific predefined circuits
Object.assign(window.predefinedCircuits, {
    'half-adder': {
        name: 'Half Adder',
        description: 'A half adder circuit that adds two binary digits (A and B) and produces a sum (SUM) and carry (COUT) output.',
        instructorOnly: true,
        gates: [
            { type: 'INPUT', label: 'A', x: 100, y: 75, state: false },
            { type: 'INPUT', label: 'B', x: 100, y: 175, state: false },
            { type: 'XOR', label: 'XOR1', x: 250, y: 125, state: false },
            { type: 'AND', label: 'AND1', x: 250, y: 225, state: false },
            { type: 'OUTPUT', label: 'SUM', x: 400, y: 125, state: false },
            { type: 'OUTPUT', label: 'COUT', x: 400, y: 225, state: false }
        ],
        wires: [
            { startGateLabel: 'A', startNodeIndex: 0, endGateLabel: 'XOR1', endNodeIndex: 0, waypoints: [] },
            { startGateLabel: 'A', startNodeIndex: 0, endGateLabel: 'AND1', endNodeIndex: 0, waypoints: [] },
            { startGateLabel: 'B', startNodeIndex: 0, endGateLabel: 'XOR1', endNodeIndex: 1, waypoints: [] },
            { startGateLabel: 'B', startNodeIndex: 0, endGateLabel: 'AND1', endNodeIndex: 1, waypoints: [] },
            { startGateLabel: 'XOR1', startNodeIndex: 0, endGateLabel: 'SUM', endNodeIndex: 0, waypoints: [] },
            { startGateLabel: 'AND1', startNodeIndex: 0, endGateLabel: 'COUT', endNodeIndex: 0, waypoints: [] }
        ]
    },

    'full-adder': {
        name: 'Full Adder',
        description: 'A full adder circuit that adds three binary digits (A, B, and CIN) and produces a sum (SUM) and carry (COUT) output.',
        instructorOnly: true,
        gates: [
            { type: 'INPUT', label: 'CIN', x: 100, y: 75, state: false },
            { type: 'INPUT', label: 'A', x: 100, y: 175, state: false },
            { type: 'INPUT', label: 'B', x: 100, y: 275, state: false },
            { type: 'XOR', label: 'XOR1', x: 250, y: 125, state: false },
            { type: 'XOR', label: 'XOR2', x: 400, y: 125, state: false },
            { type: 'AND', label: 'AND1', x: 250, y: 225, state: false },
            { type: 'AND', label: 'AND2', x: 250, y: 325, state: false },
            { type: 'OR', label: 'OR1', x: 400, y: 275, state: false },
            { type: 'OUTPUT', label: 'SUM', x: 550, y: 125, state: false },
            { type: 'OUTPUT', label: 'COUT', x: 550, y: 275, state: false }
        ],
        wires: [
            { startGateLabel: 'A', startNodeIndex: 0, endGateLabel: 'XOR1', endNodeIndex: 0, waypoints: [] },
            { startGateLabel: 'A', startNodeIndex: 0, endGateLabel: 'AND1', endNodeIndex: 0, waypoints: [] },
            { startGateLabel: 'B', startNodeIndex: 0, endGateLabel: 'XOR1', endNodeIndex: 1, waypoints: [] },
            { startGateLabel: 'B', startNodeIndex: 0, endGateLabel: 'AND1', endNodeIndex: 1, waypoints: [] },
            { startGateLabel: 'XOR1', startNodeIndex: 0, endGateLabel: 'XOR2', endNodeIndex: 0, waypoints: [] },
            { startGateLabel: 'CIN', startNodeIndex: 0, endGateLabel: 'XOR2', endNodeIndex: 1, waypoints: [] },
            { startGateLabel: 'CIN', startNodeIndex: 0, endGateLabel: 'AND2', endNodeIndex: 0, waypoints: [] },
            { startGateLabel: 'XOR1', startNodeIndex: 0, endGateLabel: 'AND2', endNodeIndex: 1, waypoints: [] },
            { startGateLabel: 'AND1', startNodeIndex: 0, endGateLabel: 'OR1', endNodeIndex: 0, waypoints: [] },
            { startGateLabel: 'AND2', startNodeIndex: 0, endGateLabel: 'OR1', endNodeIndex: 1, waypoints: [] },
            { startGateLabel: 'XOR2', startNodeIndex: 0, endGateLabel: 'SUM', endNodeIndex: 0, waypoints: [] },
            { startGateLabel: 'OR1', startNodeIndex: 0, endGateLabel: 'COUT', endNodeIndex: 0, waypoints: [] }
        ]
    },

    'and-gate-demo': {
        name: 'AND',
        description: 'Simple demonstration of an AND gate with two inputs and one output.',
        gates: [
            { type: 'INPUT', label: 'A', x: 100, y: 67, state: false },
            { type: 'INPUT', label: 'B', x: 100, y: 167, state: false },
            { type: 'AND', label: 'AND1', x: 250, y: 117, state: false },
            { type: 'OUTPUT', label: 'Q', x: 400, y: 117, state: false }
        ],
        wires: [
            { startGateLabel: 'A', startNodeIndex: 0, endGateLabel: 'AND1', endNodeIndex: 0, waypoints: [] },
            { startGateLabel: 'B', startNodeIndex: 0, endGateLabel: 'AND1', endNodeIndex: 1, waypoints: [] },
            { startGateLabel: 'AND1', startNodeIndex: 0, endGateLabel: 'Q', endNodeIndex: 0, waypoints: [] }
        ]
    },

    'or-gate-demo': {
        name: 'OR',
        description: 'Simple demonstration of an OR gate with two inputs and one output.',
        gates: [
            { type: 'INPUT', label: 'A', x: 100, y: 67, state: false },
            { type: 'INPUT', label: 'B', x: 100, y: 167, state: false },
            { type: 'OR', label: 'OR1', x: 250, y: 117, state: false },
            { type: 'OUTPUT', label: 'Q', x: 400, y: 117, state: false }
        ],
        wires: [
            { startGateLabel: 'A', startNodeIndex: 0, endGateLabel: 'OR1', endNodeIndex: 0, waypoints: [] },
            { startGateLabel: 'B', startNodeIndex: 0, endGateLabel: 'OR1', endNodeIndex: 1, waypoints: [] },
            { startGateLabel: 'OR1', startNodeIndex: 0, endGateLabel: 'Q', endNodeIndex: 0, waypoints: [] }
        ]
    },

    'xor-gate-demo': {
        name: 'XOR',
        description: 'Simple demonstration of an XOR (exclusive OR) gate with two inputs and one output.',
        gates: [
            { type: 'INPUT', label: 'A', x: 100, y: 67, state: false },
            { type: 'INPUT', label: 'B', x: 100, y: 167, state: false },
            { type: 'XOR', label: 'XOR1', x: 250, y: 117, state: false },
            { type: 'OUTPUT', label: 'Q', x: 400, y: 117, state: false }
        ],
        wires: [
            { startGateLabel: 'A', startNodeIndex: 0, endGateLabel: 'XOR1', endNodeIndex: 0, waypoints: [] },
            { startGateLabel: 'B', startNodeIndex: 0, endGateLabel: 'XOR1', endNodeIndex: 1, waypoints: [] },
            { startGateLabel: 'XOR1', startNodeIndex: 0, endGateLabel: 'Q', endNodeIndex: 0, waypoints: [] }
        ]
    },

    'flip-flop-demo': {
        name: 'SR',
        description: 'SR Flip-Flop demonstration circuit with Set and Reset inputs.',
        gates: [
            { type: 'INPUT', label: 'S', x: 100, y: 67, state: false },
            { type: 'INPUT', label: 'R', x: 100, y: 167, state: false },
            { type: 'SR_FLIP_FLOP', label: 'FF1', x: 250, y: 117, state: false },
            { type: 'OUTPUT', label: 'Q', x: 400, y: 67, state: false },
            { type: 'OUTPUT', label: 'Qbar', x: 400, y: 167, state: false }
        ],
        wires: [
            { startGateLabel: 'S', startNodeIndex: 0, endGateLabel: 'FF1', endNodeIndex: 0, waypoints: [] },
            { startGateLabel: 'R', startNodeIndex: 0, endGateLabel: 'FF1', endNodeIndex: 1, waypoints: [] },
            { startGateLabel: 'FF1', startNodeIndex: 0, endGateLabel: 'Q', endNodeIndex: 0, waypoints: [] },
            { startGateLabel: 'FF1', startNodeIndex: 1, endGateLabel: 'Qbar', endNodeIndex: 0, waypoints: [] }
        ]
    },

    'counter': {
        name: 'Counter',
        description: 'A 3-bit counter circuit using a 3-bit latch and 3-bit adder with clock input.',
        gates: [
            { type: 'THREE_BIT_LATCH', label: 'Latch1', x: 334, y: 169, state: false },
            { type: 'THREE_BIT_ADDER', label: 'Adder1', x: 509, y: 168, state: false },
            { type: 'INPUT', label: 'INPUT1', x: 522, y: 76, state: true },
            { type: 'CLOCK_PULSE', label: 'CLK1', x: 265, y: 52, state: true }
        ],
        wires: [
            { startGateLabel: 'Latch1', startNodeIndex: 0, endGateLabel: 'Adder1', endNodeIndex: 0, waypoints: [] },
            { startGateLabel: 'Latch1', startNodeIndex: 1, endGateLabel: 'Adder1', endNodeIndex: 1, waypoints: [] },
            { startGateLabel: 'Latch1', startNodeIndex: 2, endGateLabel: 'Adder1', endNodeIndex: 2, waypoints: [] },
            { startGateLabel: 'Adder1', startNodeIndex: 0, endGateLabel: 'Latch1', endNodeIndex: 1, waypoints: [{x: 419, y: 264}, {x: 232, y: 181}] },
            { startGateLabel: 'Adder1', startNodeIndex: 1, endGateLabel: 'Latch1', endNodeIndex: 2, waypoints: [{x: 420, y: 296}, {x: 230, y: 212}] },
            { startGateLabel: 'Adder1', startNodeIndex: 2, endGateLabel: 'Latch1', endNodeIndex: 3, waypoints: [{x: 422, y: 326}, {x: 232, y: 246}] },
            { startGateLabel: 'INPUT1', startNodeIndex: 0, endGateLabel: 'Adder1', endNodeIndex: 3, waypoints: [] },
            { startGateLabel: 'CLK1', startNodeIndex: 0, endGateLabel: 'Latch1', endNodeIndex: 0, waypoints: [] }
        ]
    },

    'instruction': {
        name: 'Instruction',
        description: 'An instruction circuit using a register, adder, and instruction input with AND gates.',
        gates: [
            { type: 'THREE_BIT_LATCH', label: 'Register', x: 334, y: 169, state: false },
            { type: 'THREE_BIT_ADDER', label: 'Adder', x: 509, y: 168, state: false },
            { type: 'INPUT', label: 'INPUT1', x: 522, y: 76, state: true },
            { type: 'CLOCK_PULSE', label: 'CLK1', x: 231, y: 69, state: true },
            { type: 'AND', label: 'AND1', x: 157, y: 118, state: false },
            { type: 'AND', label: 'AND2', x: 195, y: 169, state: false },
            { type: 'AND', label: 'AND4', x: 246, y: 218, state: false },
            { type: 'INPUT', label: 'Instruction', x: 56, y: 157, state: false }
        ],
        wires: [
            { startGateLabel: 'Register', startNodeIndex: 0, endGateLabel: 'Adder', endNodeIndex: 0, waypoints: [] },
            { startGateLabel: 'Register', startNodeIndex: 1, endGateLabel: 'Adder', endNodeIndex: 1, waypoints: [] },
            { startGateLabel: 'Register', startNodeIndex: 2, endGateLabel: 'Adder', endNodeIndex: 2, waypoints: [] },
            { startGateLabel: 'INPUT1', startNodeIndex: 0, endGateLabel: 'Adder', endNodeIndex: 3, waypoints: [] },
            { startGateLabel: 'CLK1', startNodeIndex: 0, endGateLabel: 'Register', endNodeIndex: 0, waypoints: [] },
            { startGateLabel: 'AND1', startNodeIndex: 0, endGateLabel: 'Register', endNodeIndex: 1, waypoints: [] },
            { startGateLabel: 'AND2', startNodeIndex: 0, endGateLabel: 'Register', endNodeIndex: 2, waypoints: [] },
            { startGateLabel: 'AND4', startNodeIndex: 0, endGateLabel: 'Register', endNodeIndex: 3, waypoints: [] },
            { startGateLabel: 'Adder', startNodeIndex: 2, endGateLabel: 'AND4', endNodeIndex: 1, waypoints: [{x: 391, y: 335}, {x: 183, y: 304}] },
            { startGateLabel: 'Adder', startNodeIndex: 1, endGateLabel: 'AND2', endNodeIndex: 1, waypoints: [{x: 388, y: 305}, {x: 153, y: 275}] },
            { startGateLabel: 'Adder', startNodeIndex: 0, endGateLabel: 'AND1', endNodeIndex: 1, waypoints: [{x: 388, y: 276}, {x: 121, y: 229}] },
            { startGateLabel: 'Instruction', startNodeIndex: 0, endGateLabel: 'AND1', endNodeIndex: 0, waypoints: [] },
            { startGateLabel: 'Instruction', startNodeIndex: 0, endGateLabel: 'AND2', endNodeIndex: 0, waypoints: [] },
            { startGateLabel: 'Instruction', startNodeIndex: 0, endGateLabel: 'AND4', endNodeIndex: 0, waypoints: [] }
        ]
    }
});
