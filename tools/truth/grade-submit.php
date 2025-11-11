<?php
require_once "../config.php";

use \Tsugi\Core\LTIX;

$LAUNCH = LTIX::requireData();

if (!isset($_POST['grade'])) {
    echo json_encode(array("status" => "failure", "detail" => "Missing grade parameter."));
    return;
}

$grade = floatval($_POST['grade']);
if ($grade < 0.0 || $grade > 1.0) {
    echo json_encode(array("status" => "failure", "detail" => "Grade must be between 0.0 and 1.0."));
    return;
}

$debug_log = array();
$retval = LTIX::gradeSend($grade, false, $debug_log);
if (is_string($retval)) {
    echo json_encode(array("status" => "failure", "detail" => $retval, "debug_log" => $debug_log));
    return;
}

echo json_encode(array("status" => "success", "debug_log" => $debug_log));



