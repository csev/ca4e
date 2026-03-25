<?php
/**
 * Resolve $assn from LTI link custom and/or ?exercise= when there is no tool link ($LINK).
 * Include after assignments.php (requires $assignments).
 *
 * Sets:
 *   $assn                 — valid exercise key or null
 *   $toolExerciseFromGet   — true if assignment came from GET (direct access)
 *   $toolLtiGradePassback  — true if grades should POST to the LMS (LTI link + user)
 *   $showAssignmentButton  — show assignment UI (valid assn from LTI custom or ?exercise= on direct access)
 */
global $LINK, $USER;

$assn = \Tsugi\Core\Settings::linkGetCustom('exercise');
if ($assn && !isset($assignments[$assn])) {
    $assn = null;
}

$toolExerciseFromGet = false;
if (!$LINK && isset($_GET['exercise'])) {
    $g = $_GET['exercise'];
    if (is_string($g) && isset($assignments[$g])) {
        $assn = $g;
        $toolExerciseFromGet = true;
    }
}

$toolLtiGradePassback = (bool) ($LINK && $USER);
$showAssignmentButton = (bool) ($assn && ($USER || $toolExerciseFromGet));
