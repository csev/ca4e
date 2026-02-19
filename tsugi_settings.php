<?php
/**
 * These are some configuration variables that are not secure / sensitive
 *
 * This file is included at the end of tsugi/config.php
 */

// This is how the system will refer to itself.
$CFG->servicename = 'CA4E';
$CFG->servicedesc = false;

// Theme like CC4E
$CFG->theme = array(
    "primary" => "#336791", //default color for nav background, splash background, buttons, text of tool menu
    "secondary" => "#EEEEEE", // Nav text and nav item border color, background of tool menu
    "text" => "#111111", // Standard copy color
    "text-light" => "#5E5E5E", // A lighter version of the standard text color for elements like "small"
    "font-url" => "https://fonts.googleapis.com/css2?family=Open+Sans", // Optional custom font url for using Google fonts
    // "font-family" => "'Open Sans', Corbel, Avenir, 'Lucida Grande', 'Lucida Sans', sans-serif", // Font family
    // "font-family" => "'Open Sans', Corbel, Avenir, 'Lucida Grande', 'Lucida Sans', sans-serif", // Font family
    "font-size" => "14px", // This is the base font size used for body copy. Headers,etc. are scaled off this value
);

$CFG->context_title = "Computer Architecture for Everybody";

$CFG->giftquizzes = $CFG->dirroot.'/../ca4e-private/quiz';

// $CFG->youtube_url = $CFG->apphome . '/mod/youtube/';

$CFG->tdiscus = $CFG->apphome . '/mod/tdiscus/';

$CFG->google_login_redirect = $CFG->apphome . "/login";

$CFG->service_worker = true;

// $CFG->launcherror = $CFG->apphome . "/launcherror";

$CFG->lessons = $CFG->dirroot.'/../lessons.json';

$CFG->setExtension('lessons2_enable', true);
$CFG->setExtension('lessons_debug_conversion', false);
$CFG->lessons = $CFG->dirroot.'/../lessons-items.json';
$CFG->youtube_playlist = 'PLa58EAvBOOSJjrzDrl9eVigR5SQQ0W-3D';

// Information on the owner of this system
$CFG->ownername = 'Charles Severance';
$CFG->owneremail = 'drchuck@learnxp.com';
$CFG->providekeys = true;  // true

// VAPID keys for push notifications
// Generate keys at: https://giga.tools/developer-tools/vapid-key-generator
// Or see tsugi/VAPID_SETUP.md for detailed instructions and alternatives
// $CFG->vapid_public_key = 'YOUR_PUBLIC_KEY_HERE';
// $CFG->vapid_private_key = 'YOUR_PRIVATE_KEY_HERE';
// $CFG->vapid_subject = 'mailto:drchuck@learnxp.com'; // Required: mailto: URL with your email

$buildmenu = $CFG->dirroot."/../buildmenu.php";
if ( file_exists($buildmenu) ) {
    require_once $buildmenu;
    $CFG->defaultmenu = buildMenu();
}

// Debug
// $CFG->setExtension('launch_debug', true);



