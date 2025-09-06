<?php
require_once "../config.php";

use \Tsugi\Core\LTIX;
use \Tsugi\Core\Settings;
use \Tsugi\UI\SettingsForm;
use \Tsugi\Grades\GradeUtil;
use \Tsugi\UI\Lessons;

// Sanity checks
$LAUNCH = LTIX::requireData();
$p = $CFG->dbprefix;

if ( SettingsForm::handleSettingsPost() ) {
    header( 'Location: '.addSession('index.php?howdysuppress=1') ) ;
    return;
}

$oldsettings = Settings::linkGetAll();
// Get any due date information
$dueDate = SettingsForm::getDueDate();

$tool_menu = false;
if ( $LAUNCH->link && $LAUNCH->user && $LAUNCH->user->instructor ) {
    $tool_menu = new \Tsugi\UI\MenuSet();
    $tool_menu->addLeft('Student Data', 'grades.php');
    if ( $CFG->launchactivity ) {
        $tool_menu->addRight(__('Launches'), 'analytics');
    }
    $tool_menu->addRight(__('Settings'), '#', /* push */ false, SettingsForm::attr());
}

$OUTPUT->header();

$OUTPUT->bodyStart();
$nav_menu = $OUTPUT->closeMenuSet();

$OUTPUT->topNav($tool_menu, $nav_menu);

if ( $USER->instructor ) {
    SettingsForm::start();
    SettingsForm::dueDate();
    SettingsForm::done();
    SettingsForm::end();

} // end isInstructor() 

if ( $dueDate->message ) {
    echo('<p style="color:red;">'.$dueDate->message.'</p>'."\n");
}
?>
<button onclick="alert('yada')">🗑️</button>
<?php

$OUTPUT->footerStart();

if ( $USER->instructor ) {
    echo("<!--\n");
    echo(">Global Tsugi Objects:\n\n");
    var_dump($USER);
    var_dump($CONTEXT);
    var_dump($LINK);
    echo("\n<hr/>\n");
    echo("Session data (low level):\n");
    echo($OUTPUT->safe_var_dump($_SESSION));
    echo("\n-->\n");
}

$OUTPUT->footerEnd();
