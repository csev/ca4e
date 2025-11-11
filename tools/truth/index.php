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
$maxScore = 10;

$taglines = array(
    'AllGates' => 'Fill in the missing outputs and master classic logic gates.',
);
$tagline = $taglines[$assn] ?? 'Build intuition for digital logic gates.';
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
<div class="logic-container" data-assignment="<?php echo htmlspecialchars($assn, ENT_QUOTES); ?>">
    <header class="logic-header">
        <div>
            <h1><?php echo htmlentities($REGISTER_LTI2["name"]); ?></h1>
            <p class="tagline"><?php echo htmlspecialchars($tagline); ?></p>
        </div>
        <div class="toolbar">
            <div class="scoreboard" aria-live="polite">
                <span id="scoreDisplay">Score: 0/<?php echo $maxScore; ?></span>
            </div>
            <label class="auto-advance-toggle">
                <input type="checkbox" id="autoAdvanceToggle" checked>
                <span>Auto advance</span>
            </label>
            <?php if ($isInstructor) : ?>
                <a class="toolbar-link" href="<?php echo addSession('instructor.php'); ?>">Instructor Dashboard</a>
            <?php endif; ?>
        </div>
    </header>

    <?php if ($assn === 'AllGates') : ?>
        <section class="challenge-section">
            <div class="challenge-header">
                <div>
                    <h2 id="gateHeading">Truth Table Practice</h2>
                    <p id="gateDescription" class="gate-description">
                        Identify the correct outputs for the selected logic gate.
                    </p>
                </div>
                <div class="gate-info">
                    <span class="gate-name-label">Gate:</span>
                    <span id="gateName" class="gate-name">—</span>
                </div>
            </div>

            <div class="challenge-body">
                <div id="gateDiagram" class="gate-diagram" role="img" aria-live="polite" aria-label="Logic gate schematic">
                    <!-- Gate diagram rendered here -->
                </div>
                <div class="truth-table-wrapper">
                    <table id="truthTable" class="truth-table" aria-describedby="gateHeading">
                        <caption id="truthTableCaption">Truth table for the selected gate.</caption>
                        <thead>
                            <tr id="truthTableHeaderRow">
                                <!-- Header cells inserted dynamically -->
                            </tr>
                        </thead>
                        <tbody id="truthTableBody">
                            <!-- Rows inserted dynamically -->
                        </tbody>
                    </table>
                </div>
            </div>

            <div class="controls">
                <button id="nextTableBtn" type="button">
                    Next table <span id="nextCountdown" hidden>(5)</span>
                </button>
            </div>
            <p id="challengeFeedback" class="feedback" role="status" aria-live="polite"></p>
        </section>

        <section class="resources">
            <h2>Tips</h2>
            <ul>
                <li>Each logic gate has a signature pattern—focus on when it outputs 1.</li>
                <li>Use the keyboard to move between blank outputs. Entries accept 0 or 1.</li>
                <li>Turn off auto advance if you need extra review time before switching tables.</li>
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
window.logicConfig = <?php echo json_encode(array(
    'assignment' => $assn,
    'gradeSubmitUrl' => addSession('grade-submit.php'),
    'maxScore' => $maxScore,
)); ?>;
</script>
<script src="logic.js" defer></script>
</body>
</html>


