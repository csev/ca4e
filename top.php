<?php
use \Tsugi\Core\LTIX;

if ( ! defined('COOKIE_SESSION') ) define('COOKIE_SESSION', true);

require_once "tsugi/config.php";

$OUTPUT->header();
?>
<style>
body {
    font-family: var(--font-family);
    font-size: 1.2rem;
    line-height: 1.93rem;
    color: var(--text);
    background-color: var(--background-color);
}
</style>

