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
        <section class="challenge-section">
            <h2>Base-10 → Base-2</h2>
            <p>Set the sum bits to match the decimal value shown on the nixie display.</p>
            <canvas id="decimalNixie" width="180" height="200" aria-label="Decimal nixie display"></canvas>
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
                <button id="nextDecimalChallenge">New Number</button>
                <?php if ($isInstructor) : ?>
                    <a class="secondary-btn" href="<?php echo addSession('instructor.php'); ?>">Instructor Dashboard</a>
                <?php endif; ?>
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
                <li>Remember: the switches represent 4, 2, and 1. Add them together to get the decimal value.</li>
                <li>Practice until you can convert between bases without hints!</li>
            </ul>
        </section>
    <?php elseif ($assn === 'BinaryAddition') : ?>
        <section class="challenge-section addition-section">
            <h2>Binary Addition</h2>
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
                </div>
                <div class="binary-add-row" aria-label="First addend">
                    <span class="operand-label">A</span>
                    <div class="bit-strip" id="additionOperandA"></div>
                </div>
                <div class="binary-add-row" aria-label="Second addend">
                    <span class="operand-label">B</span>
                    <div class="bit-strip" id="additionOperandB"></div>
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
                </div>
            </div>

            <div class="controls">
                <button id="nextAdditionChallenge">New Problem</button>
                <?php if ($isInstructor) : ?>
                    <a class="secondary-btn" href="<?php echo addSession('instructor.php'); ?>">Instructor Dashboard</a>
                <?php endif; ?>
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

