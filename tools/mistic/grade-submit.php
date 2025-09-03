<?php
require_once "../config.php";

use \Tsugi\Grades\GradeUtil;
use \Tsugi\Core\LTIX;

// Set content type to JSON
header('Content-Type: application/json');

// Sanity checks
$LAUNCH = LTIX::requireData();
$user_id = $USER->id;

// Get and validate grade
if (!isset($_POST['grade'])) {
    echo json_encode(Array("status" => "failure", "detail" => "Grade parameter is required"));
    return;
}

$grade = floatval($_POST['grade']);
if ($grade < 0.0 || $grade > 1.0) {
    echo json_encode(Array("status" => "failure", "detail" => "Grade must be between 0.0 and 1.0"));
    return;
}

// Get code if provided (optional)
$code = isset($_POST['code']) ? $_POST['code'] : '';

// Log the grade submission
error_log("Grade submission: user_id=$user_id, grade=$grade, code=$code");

$debug_log = array();
$retval = LTIX::gradeSend($grade, false, $debug_log);
if ( is_string($retval) ) {
    echo json_encode(Array("status" => "failure", "detail" => $retval, "debug_log" => $debug_log));
    return;
}

$retval = Array("status" => "success", "debug_log" => $debug_log);
echo json_encode($retval);