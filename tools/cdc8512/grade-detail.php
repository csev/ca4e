<?php
require_once "../config.php";
\Tsugi\Core\LTIX::getConnection();

use \Tsugi\Grades\GradeUtil;
use \Tsugi\Util\U;

session_start();

// Get the user's grade data also checks session
$row = GradeUtil::gradeLoad($_REQUEST['user_id']);

$menu = new \Tsugi\UI\MenuSet();
$menu->addLeft(__('Back to all grades'), 'grades.php');

// View
$OUTPUT->header();
$OUTPUT->bodyStart();
$OUTPUT->topNav($menu);
$OUTPUT->flashMessages();

// Show the basic info for this user
GradeUtil::gradeShowInfo($row, false);

// Unique detail
if ( U::isEmpty($row['json'])) {
    echo("<p>No submission</p>\n");
    $OUTPUT->footer();
    return;
}

echo("<p>Submission:</p>\n");
$json = json_decode($row['json']);
if ( is_object($json) ) {
    echo("<pre>\n");
    if ( isset($json->code)) {
        echo(htmlent_utf8($json->code));
        echo("\n");
        unset($json->code);
    }
    if ( count(get_object_vars($json)) > 0 ) {
        echo("\nJson:\n");
        var_dump($json);
        echo("\n");
    }
    echo("</pre>\n");
}

$OUTPUT->footer();
