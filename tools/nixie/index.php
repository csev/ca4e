<?php
require_once "../config.php";

use \Tsugi\Core\LTIX;

$LTI = LTIX::session_start();
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Nixie Challenge</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
<div class="nixie-container">
    <header>
        <h1>Nixie Challenge</h1>
        <p class="tagline">Practice converting between base-10 and base-2 using a glowing nixie tube.</p>
    </header>

    <section class="challenge-section">
        <h2>Base-10 → Base-2</h2>
        <p>Set the bits to match the decimal value shown on the nixie display.</p>
        <canvas id="decimalNixie" width="180" height="200" aria-label="Decimal nixie display"></canvas>
        <div class="decimal-value">Current value: <span id="decimalValue">0</span></div>
        <div class="bit-inputs" role="group" aria-label="Binary bits">
            <label>
                <span>4s</span>
                <input type="checkbox" id="bit4">
            </label>
            <label>
                <span>2s</span>
                <input type="checkbox" id="bit2">
            </label>
            <label>
                <span>1s</span>
                <input type="checkbox" id="bit1">
            </label>
        </div>
        <div class="controls">
            <button id="nextDecimalChallenge">New Number</button>
        </div>
        <p id="decimalFeedback" class="feedback" role="status"></p>
    </section>

    <section class="challenge-section">
        <h2>Base-2 → Base-10</h2>
        <p>Convert the binary pattern to its decimal value. Reveal your answer on the nixie!</p>
        <div class="binary-display">
            <div class="bit-card">
                <h3>4s</h3>
                <span id="binaryBit4" class="bit-value">0</span>
            </div>
            <div class="bit-card">
                <h3>2s</h3>
                <span id="binaryBit2" class="bit-value">0</span>
            </div>
            <div class="bit-card">
                <h3>1s</h3>
                <span id="binaryBit1" class="bit-value">0</span>
            </div>
        </div>
        <div class="decimal-answer">
            <label for="decimalAnswerInput">Decimal value</label>
            <input type="number" id="decimalAnswerInput" min="0" max="7" inputmode="numeric" pattern="[0-7]*">
        </div>
        <canvas id="binaryNixie" width="180" height="200" aria-label="Decimal nixie display for binary conversion"></canvas>
        <div class="controls">
            <button id="nextBinaryChallenge">New Pattern</button>
        </div>
        <p id="binaryFeedback" class="feedback" role="status"></p>
    </section>

    <section class="resources">
        <h2>Tips</h2>
        <ul>
            <li>The nixie tube glows with the decimal number you are working with.</li>
            <li>Remember: the bits represent 4, 2, and 1. Add them when the switch is on.</li>
            <li>Practice until you can convert between bases without hints!</li>
        </ul>
    </section>
</div>

<script src="nixie.js"></script>
</body>
</html>

