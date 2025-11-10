<?php
require_once "../config.php";
require_once "assignments.php";
require_once "register.php";

use \Tsugi\Core\LTIX;
use \Tsugi\Core\Settings;

$LTI = LTIX::session_start();

$assn = Settings::linkGetCustom('exercise');
if ($assn && !isset($assignments[$assn])) {
    $assn = null;
}
if (!$assn) {
    $keys = array_keys($assignments);
    $assn = reset($keys);
}

$isInstructor = $USER && $USER->instructor;

$taglines = array(
    'Base2Conversions' => 'Practice converting between base-10 and base-2 with a glowing nixie tube.',
    'HexConversions' => 'Convert between hex and decimal using a retro seven-segment display.',
    'BinaryAddition' => 'Add binary numbers one bit at a time and track the carry.',
);
$tagline = $taglines[$assn] ?? 'Sharpen your digital logic intuition.';
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php echo htmlentities($REGISTER_LTI2["name"]); ?></title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
<div class="nixie-container" data-assignment="<?php echo htmlspecialchars($assn, ENT_QUOTES); ?>">
    <header>
        <h1><?php echo htmlentities($REGISTER_LTI2["name"]); ?></h1>
        <p class="tagline"><?php echo htmlspecialchars($tagline); ?></p>
    </header>

    <?php if ($assn === 'Base2Conversions') : ?>
        <section class="challenge-section tabbed-card" id="base2Card">
            <div class="tab-header">
                <div class="tab-buttons">
                    <button type="button" class="tab-btn active" data-tab-target="#base2DecimalPanel">Decimal → Binary</button>
                    <button type="button" class="tab-btn" data-tab-target="#base2BinaryPanel">Binary → Decimal</button>
                    <?php if ($isInstructor) : ?>
                        <a class="tab-btn tab-btn-link" href="<?php echo addSession('instructor.php'); ?>">Instructor Dashboard</a>
                    <?php endif; ?>
                </div>
                <div class="tab-actions">
                    <span class="score-display" id="base2Score">Score: 0/10</span>
                </div>
            </div>
            <div class="tab-panels">
                <div class="tab-panel active" id="base2DecimalPanel">
                    <p>Set the sum bits to match the decimal value shown on the nixie display.</p>
                    <canvas id="decimalNixie" class="segment-canvas" width="180" height="200" aria-label="Decimal nixie display"></canvas>
                    <div class="decimal-value">Current value: <span id="decimalValue">0</span></div>
                    <div class="binary-input-grid" role="group" aria-label="Binary bits">
                        <label>
                            <span class="bit-pos">4s</span>
                            <input class="conversion-bit" data-weight="4" maxlength="1" pattern="[01]" inputmode="numeric" aria-label="4s bit">
                        </label>
                        <label>
                            <span class="bit-pos">2s</span>
                            <input class="conversion-bit" data-weight="2" maxlength="1" pattern="[01]" inputmode="numeric" aria-label="2s bit">
                        </label>
                        <label>
                            <span class="bit-pos">1s</span>
                            <input class="conversion-bit" data-weight="1" maxlength="1" pattern="[01]" inputmode="numeric" aria-label="1s bit">
                        </label>
                    </div>
                    <div class="controls">
                        <button id="nextDecimalChallenge">New Number <span id="base2DecimalCountdown" hidden>(5)</span></button>
                    </div>
                    <p id="decimalFeedback" class="feedback" role="status"></p>
                </div>
                <div class="tab-panel" id="base2BinaryPanel">
                    <p>Convert the binary pattern to its decimal value. Reveal your answer on the nixie!</p>
                    <div class="binary-display">
                        <div class="bit-card">
                            <h3>4s</h3>
                            <span id="binaryBit4" class="bit-value" data-bit="4">0</span>
                        </div>
                        <div class="bit-card">
                            <h3>2s</h3>
                            <span id="binaryBit2" class="bit-value" data-bit="2">0</span>
                        </div>
                        <div class="bit-card">
                            <h3>1s</h3>
                            <span id="binaryBit1" class="bit-value" data-bit="1">0</span>
                        </div>
                    </div>
                    <div class="decimal-answer">
                        <label for="decimalAnswerInput">Decimal value</label>
                        <input type="number" id="decimalAnswerInput" min="0" max="7" inputmode="numeric" pattern="[0-7]*">
                    </div>
                    <div class="controls">
                        <button id="nextBinaryChallenge">New Number <span id="base2BinaryCountdown" hidden>(5)</span></button>
                    </div>
                    <p id="binaryFeedback" class="feedback" role="status"></p>
                </div>
            </div>
        </section>

        <section class="resources">
            <h2>Tips</h2>
            <ul>
                <li>The nixie tube glows with the decimal number you are working with.</li>
                <li>Remember: the switches represent 4, 2, and 1. Add them together to get the decimal value.</li>
                <li>Practice until you can convert between bases without hints!</li>
            </ul>
        </section>
    <?php elseif ($assn === 'HexConversions') : ?>
        <section class="challenge-section tabbed-card" id="hexCard">
            <div class="tab-header">
                <div class="tab-buttons">
                    <button type="button" class="tab-btn active" data-tab-target="#hexDecimalPanel">Decimal → Hex</button>
                    <button type="button" class="tab-btn" data-tab-target="#hexBinaryPanel">Hex → Decimal</button>
                    <?php if ($isInstructor) : ?>
                        <a class="tab-btn tab-btn-link" href="<?php echo addSession('instructor.php'); ?>">Instructor Dashboard</a>
                    <?php endif; ?>
                </div>
                <div class="tab-actions">
                    <span class="score-display" id="hexScore">Score: 0/10</span>
                </div>
            </div>
            <div class="tab-panels">
                <div class="tab-panel active" id="hexDecimalPanel">
                    <p>Type the hexadecimal digit that matches the decimal value.</p>
                    <div class="decimal-value">Decimal value: <span id="hexDecimalValue">0</span></div>
                    <div class="hex-input">
                        <label for="hexDigitInput">Hex digit</label>
                        <input id="hexDigitInput" maxlength="1" pattern="[0-9A-Fa-f]" inputmode="text" aria-label="Hexadecimal digit">
                    </div>
                    <div class="controls">
                        <button id="nextHexDecimal">New Number <span id="hexDecimalCountdown" hidden>(5)</span></button>
                    </div>
                    <p id="hexDecimalFeedback" class="feedback" role="status"></p>
                </div>
                <div class="tab-panel" id="hexBinaryPanel">
                    <p>Convert the hex digit to its decimal value.</p>
                    <div class="decimal-value">Hex digit: <span id="hexRandomValue">A</span></div>
                    <div class="decimal-answer">
                        <label for="hexDecimalInput">Decimal value</label>
                        <input type="number" id="hexDecimalInput" min="0" max="15" inputmode="numeric" pattern="[0-9]{1,2}" aria-label="Decimal value 0 to 15">
                    </div>
                    <div class="controls">
                        <button id="nextHexRandom">New Pattern <span id="hexRandomCountdown" hidden>(5)</span></button>
                    </div>
                    <p id="hexRandomFeedback" class="feedback" role="status"></p>
                </div>
            </div>
        </section>

        <section class="resources">
            <h2>Tips</h2>
            <ul>
                <li>Hex digits 0–9 map to decimal 0–9. A–F map to decimal 10–15.</li>
                <li>Practice both directions to build hexadecimal fluency.</li>
            </ul>
        </section>
    <?php elseif ($assn === 'BinaryAddition') : ?>
        <section class="challenge-section addition-section">
            <div class="section-header">
                <div class="section-title">
                    <h2>Binary Addition</h2>
                    <?php if ($isInstructor) : ?>
                        <a class="tab-btn tab-btn-link" href="<?php echo addSession('instructor.php'); ?>">Instructor Dashboard</a>
                    <?php endif; ?>
                </div>
                <div class="score-block">
                    <span class="score-display" id="additionScore">Score: 0/10</span>
                    <span class="next-spinner" id="additionSpinner" hidden>
                        <span class="spinner"></span>
                        Next problem in 5s…
                    </span>
                </div>
            </div>
            <p>Add the two binary numbers. Enter each sum bit (include the carry on the left).</p>

            <div class="addition-problem" aria-live="polite">
                <div class="binary-add-row header-row" aria-hidden="true">
                    <span class="operand-label"></span>
                    <div class="bit-strip header-strip">
                        <span class="bit-pos">8s</span>
                        <span class="bit-pos">4s</span>
                        <span class="bit-pos">2s</span>
                        <span class="bit-pos">1s</span>
                    </div>
                    <span class="decimal-summary">&nbsp;</span>
                </div>
                <div class="binary-add-row" aria-label="First addend">
                    <span class="operand-label">A</span>
                    <div class="bit-strip" id="additionOperandA"></div>
                    <span class="decimal-summary">(<span id="additionOperandADec">0</span>)</span>
                </div>
                <div class="binary-add-row" aria-label="Second addend">
                    <span class="operand-label">B</span>
                    <div class="bit-strip" id="additionOperandB"></div>
                    <span class="decimal-summary">(<span id="additionOperandBDec">0</span>)</span>
                </div>
                <div class="binary-add-row sum-input-row" aria-label="Sum bits">
                    <span class="operand-label">Sum</span>
                    <div class="bit-strip inputs">
                        <label>
                            <span class="bit-pos">8s</span>
                            <input class="sum-input" data-bit="8" maxlength="1" pattern="[01]" inputmode="numeric" aria-label="Sum bit 8s">
                        </label>
                        <label>
                            <span class="bit-pos">4s</span>
                            <input class="sum-input" data-bit="4" maxlength="1" pattern="[01]" inputmode="numeric" aria-label="Sum bit 4s">
                        </label>
                        <label>
                            <span class="bit-pos">2s</span>
                            <input class="sum-input" data-bit="2" maxlength="1" pattern="[01]" inputmode="numeric" aria-label="Sum bit 2s">
                        </label>
                        <label>
                            <span class="bit-pos">1s</span>
                            <input class="sum-input" data-bit="1" maxlength="1" pattern="[01]" inputmode="numeric" aria-label="Sum bit 1s">
                        </label>
                    </div>
                    <span class="decimal-summary">(<span id="additionSumDec">0</span>)</span>
                </div>
            </div>

            <div class="controls">
                <button id="nextAdditionChallenge">New Problem <span id="additionCountdown" hidden>(5)</span></button>
            </div>
            <p id="additionFeedback" class="feedback" role="status"></p>
        </section>

        <section class="resources">
            <h2>Tips</h2>
            <ul>
                <li>Work from right to left just like decimal addition.</li>
                <li>If you add two 1s, write 0 in that column and carry 1 to the next column.</li>
                <li>The leftmost box is for the final carry (8s place). Leave it 0 if there is no carry.</li>
            </ul>
        </section>
    <?php else : ?>
        <section class="challenge-section">
            <h2>Select an assignment</h2>
            <p>No assignment has been configured for this link. Please ask your instructor to choose one on the Instructor Dashboard.</p>
        </section>
    <?php endif; ?>
</div>

<script>
window.nixieConfig = <?php echo json_encode(array('assignment' => $assn)); ?>;
</script>
<script src="nixie.js"></script>
</body>
</html>

