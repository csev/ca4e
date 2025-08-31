<?php

require_once "../config.php";

use \Tsugi\Core\LTIX;

// Initialize LTI if we received a launch.  If this was a non-LTI GET,
// then $USER will be null (i.e. anonymous)
$LTI = LTIX::session_start();
?><!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CMOS Circuit Editor</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css">
    <style>
        body {
            margin: 0;
            padding: 20px;
            background-color: #f0f0f0;
            font-family: Arial, sans-serif;
            overflow: hidden;
        }

        .toolbar {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            background-color: #fff;
            padding: 10px 20px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
            z-index: 100;
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-wrap: wrap;
            gap: 10px;
        }

        .component-selector {
            display: flex;
            gap: 10px;
            align-items: center;
            flex-wrap: wrap;
        }

        .component-selector button {
            padding: 8px 15px;
            border: none;
            border-radius: 4px;
            background-color: #2196F3;
            color: white;
            cursor: pointer;
            transition: background-color 0.2s;
            font-weight: bold;
        }

        .component-selector button:hover {
            background-color: #1976D2;
        }

        .right-section {
            display: flex;
            align-items: center;
            gap: 10px;
        }

        #selectedTool {
            font-weight: bold;
            color: #333;
            margin-left: 10px;
        }

        #delete {
            background-color: #FF9800;
        }

        #delete:hover {
            background-color: #F57C00;
        }

        #clear {
            background-color: #f44336;
        }

        #circuitCanvas {
            margin-top: 60px;
            background-color: white;
            border: 1px solid #ccc;
            border-radius: 5px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        }

        .status-bar {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            background-color: #333;
            color: white;
            padding: 5px 20px;
            font-size: 12px;
            display: flex;
            justify-content: space-between;
        }

        /* Common toolbar button style */
        .toolbar-button {
            padding: 8px 15px;
            border: none;
            border-radius: 4px;
            background-color: #2196F3;
            color: white;
            cursor: pointer;
            transition: all 0.2s;
            font-weight: bold;
            margin-right: 10px;
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .toolbar-button:hover {
            background-color: #1976D2;
        }

        /* Mode buttons (fixed width for icons) */
        .mode-button {
            padding: 8px 15px;
            border: none;
            border-radius: 4px;
            background-color: #2196F3;
            color: white;
            cursor: pointer;
            transition: all 0.2s;
            font-weight: bold;
            margin-right: 10px;
            height: 40px;
            width: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .mode-button:hover {
            background-color: #1976D2;
        }

        .mode-button.active {
            background-color: #ff9800;
        }

        #deleteMode.active {
            background-color: #f44336;
        }

        /* Custom icon classes */
        .ca4e-icon {
            font-size: 20px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
        }

        .ca4e-move::before {
            content: "\f256"; /* Font Awesome hand pointer icon */
            font-family: "Font Awesome 6 Free";
            font-weight: 900;
        }

        .ca4e-delete::before {
            content: "\f2ed"; /* Font Awesome trash-alt icon */
            font-family: "Font Awesome 6 Free";
            font-weight: 900;
        }

        /* Add trash icon for clear all */
        .ca4e-clear::before {
            content: "\f2ed"; /* Font Awesome trash-alt icon */
            font-family: "Font Awesome 6 Free";
            font-weight: 900;
            font-size: 1.2em; /* Slightly larger than the icon */
        }

        .mode-button.active svg {
            color: #2196F3;
        }

        .ca4e-label::before {
            content: "\f02b"; /* Font Awesome tag icon */
            font-family: "Font Awesome 6 Free";
            font-weight: 900;
        }

        .ca4e-about::before {
            content: "\f05a"; /* Font Awesome info-circle icon */
            font-family: "Font Awesome 6 Free";
            font-weight: 900;
        }

        .modal {
            display: none;
            position: fixed;
            z-index: 1000;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0,0,0,0.4);
        }

        .modal-content {
            background-color: #fefefe;
            margin: 15% auto;
            padding: 20px;
            border: 1px solid #888;
            width: 80%;
            max-width: 500px;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }

        .close {
            color: #aaa;
            float: right;
            font-size: 28px;
            font-weight: bold;
            cursor: pointer;
        }

        .close:hover,
        .close:focus {
            color: black;
            text-decoration: none;
            cursor: pointer;
        }

        .modal-content h2 {
            margin-top: 0;
            color: #2196F3;
        }

        .modal-content ul {
            padding-left: 20px;
        }

        /* Update the media query for narrow screens */
        @media (max-width: 768px) {
            .toolbar {
                padding: 5px;
                gap: 5px;
            }

            .component-selector, .right-section {
                display: flex;
                flex-wrap: wrap;
                gap: 5px;
                width: auto; /* Remove 100% width */
            }

            .toolbar-button, .mode-button {
                padding: 6px 10px;
                font-size: 14px;
                height: 32px; /* Slightly smaller height */
                margin-right: 0; /* Remove margin, using gap instead */
            }

            .mode-button {
                width: 32px; /* Match height */
            }

            /* Adjust canvas margin for two rows instead of three */
            #circuitCanvas {
                margin-top: 85px; /* Reduced from 120px to account for two rows */
            }
        }

        .component-button {
            padding: 8px 15px;
            border: none;
            border-radius: 4px;
            background-color: #2196F3;
            color: white;
            cursor: pointer;
            transition: background-color 0.2s;
            font-weight: bold;
        }

        .component-button:hover {
            background-color: #1976D2;
        }

        .component-button.active {
            background-color: #ff9800 !important; /* Use !important to override hover state */
        }

        .component-button.active:hover {
            background-color: #f57c00 !important; /* Darker orange for hover on active state */
        }
    </style>
</head>
<body>
    <div class="toolbar">
        <div class="component-selector">
            <button data-component="SWITCH" class="toolbar-button component-button" title="Add a switch (high/low input)">Switch</button>
            <button data-component="PROBE" class="toolbar-button component-button" title="Add a probe to measure voltage">Probe</button>
            <button data-component="NMOS" class="toolbar-button component-button" title="Add an NMOS transistor">NMOS</button>
            <button data-component="PMOS" class="toolbar-button component-button" title="Add a PMOS transistor">PMOS</button>
        </div>
        <div class="right-section">
            <button id="moveMode" class="mode-button" title="Move components">
                <span class="ca4e-icon ca4e-move"></span>
            </button>
            <button id="deleteMode" class="mode-button" title="Delete components">
                <span class="ca4e-icon ca4e-delete"></span>
            </button>
            <button id="labelMode" class="mode-button" title="Label components">
                <span class="ca4e-icon ca4e-label"></span>
            </button>
            <button id="clear" class="toolbar-button">Clear All</button>
            <button id="aboutButton" class="mode-button" title="About">
                <span class="ca4e-icon ca4e-about"></span>
            </button>
        </div>
    </div>

    <canvas id="circuitCanvas"></canvas>

    <div class="status-bar">
        <span id="coordinates">Position: 0, 0</span>
        <span id="voltage">Voltage: N/A</span>
    </div>

    <div id="aboutModal" class="modal">
        <div class="modal-content">
            <span class="close">&times;</span>
            <h2>About CMOS Circuit Editor</h2>
            <p>This is a web-based CMOS circuit editor for designing and simulating
                simple digital logic circuits.
                The underlying logic simulator has limitations.   It can design a two-transistor NOT gate 
                but does not have a complete logic simulator to handle more
                complex circuits like NAND, NOR, XOR, etc.
            </p>
        </div>
    </div>

    <script src="components.js"></script>
    <script src="circuit.js"></script>
    <script src="editor.js"></script>
    <script>
        // Utility functions to read probe values
        function getProbeVoltage(label) {
            if (!window.circuitEditor) {
                console.error('Circuit editor not initialized');
                return null;
            }
            const voltage = window.circuitEditor.getProbeVoltageByLabel(label);
            if (voltage === null) {
                console.warn(`No probe found with label "${label}"`);
            }
            return voltage;
        }

        function getAllProbeLabels() {
            if (!window.circuitEditor) {
                console.error('Circuit editor not initialized');
                return [];
            }
            return window.circuitEditor.getAllProbeLabels();
        }

        // Example usage:
        // const voltage = getProbeVoltage('output1');
        // const allLabels = getAllProbeLabels();

        // Function to read probe voltage - call from browser console
        function getProbeVoltage(label) {
            return window.circuitEditor.getProbeVoltageByLabel(label);
        }

        // Example usage from browser console:
        // getProbeVoltage('output1')  // Returns voltage of probe labeled 'output1'

        // Functions to control switches - call from browser console
        function setSwitchHigh(label) {
            return window.circuitEditor.setSwitchHigh(label);
        }

        function setSwitchLow(label) {
            return window.circuitEditor.setSwitchLow(label);
        }

        // Example usage from browser console:
        // setSwitchHigh('input1')  // Sets switch labeled 'input1' to VCC (5V)
        // setSwitchLow('input1')   // Sets switch labeled 'input1' to GND (0V)
    </script>
</body>
</html> 
