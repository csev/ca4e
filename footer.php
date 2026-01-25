<?php

$foot = '
<p style="font-size: 75%; margin-top: 5em;">
Copyright Creative Commons Attribution 3.0 - Charles R. Severance
</p><script type="module" src="' . htmlspecialchars(\Tsugi\Controllers\StaticFiles::url('Announcements', 'tsugi-announce.js')) .'"></script>
<script>
$(document).ready( function () {
    $("#carousel").carousel();
});     
</script>   
';

$OUTPUT->setAppFooter($foot);

$OUTPUT->footer();
