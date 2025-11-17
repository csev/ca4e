<?php

require_once "../config.php";
require_once "assignments.php";

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

$OUTPUT->suppressSiteNav();

$OUTPUT->header();
?>
<style>
/* Anchor tag styles matching index.php toolbar buttons */
#toolbar a {
    display: inline-block;
    font-size: 14px;
    padding: 8px 15px;
    border-radius: 6px;
    border: 1px solid #ccc;
    cursor: pointer;
    min-width: 60px;
    transition: all 0.2s ease;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    text-decoration: none;
    color: #333;
    background-color: #f8f9fa;
    margin: 2px;
}

#toolbar a:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(0,0,0,0.15);
    text-decoration: none;
    color: #333;
}

#toolbar a:active {
    transform: translateY(1px);
    box-shadow: 0 1px 2px rgba(0,0,0,0.1);
}

#toolbar a:visited {
    color: #333;
}
</style>
<?php

$OUTPUT->bodyStart();

if ( $USER->instructor ) {
    SettingsForm::start();
    SettingsForm::select("exercise", __('Please select an assignment'),$assignments); 
    SettingsForm::dueDate();
    SettingsForm::done();
    SettingsForm::end();

} // end isInstructor() 

if ( $dueDate->message ) {
    echo('<p style="color:red;">'.$dueDate->message.'</p>'."\n");
}
?>
<center>
    <h1>ASCII Chart - Instructor</h1>
    <div id="toolbar">
        <a href="<?php echo addSession('index.php'); ?>">Back To Tool</a>
        <a href="<?php echo addSession('grades.php'); ?>">Student Data</a>
        <a href="#" data-toggle="modal" data-target="#tsugi_settings_dialog">Settings</a>
        <a href="analytics">Launches</a>
    </div>
</center>
  
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

