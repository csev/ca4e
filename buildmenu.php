<?php

use \Tsugi\Util\U;

function buildMenu() {
    global $CFG;
    $R = $CFG->apphome . '/';
    $T = $CFG->wwwroot . '/';
    $L = $CFG->wwwroot . '/lms/';
    $A = $L . 'announce';

    $adminmenu = isset($_COOKIE['adminmenu']) && $_COOKIE['adminmenu'] == "true";
    $set = new \Tsugi\UI\MenuSet();
    $set->setHome($CFG->servicename, $CFG->apphome);

    // Generate URLs using rest_path and addSession
    $json_url = U::addSession($A . '/json.php');
    $dismiss_url = U::addSession($A . '/dismiss.php');
    $view_url = U::addSession($A . '/index.php');

    if ( U::isNotEmpty($CFG->lessons) ) {
        $set->addLeft('Lessons', $L.'lessons');
    }
    if ( U::isNotEmpty($CFG->tdiscus) && $CFG->tdiscus ) $set->addLeft('Discussions', $L.'discussions');

    if ( U::isNotEmpty($CFG->lessons) && isset($_SESSION['id']) ) {
        $set->addLeft('My Progress', $L.'assignments');
    }

    if ( U::isNotEmpty($CFG->lessons) && (! isset($_SESSION['id'])) && is_dir('assn') ) {
        $set->addLeft('Assignments', $R.'assn');
    }

    if ( isset($_SESSION['id']) ) {
        $submenu = new \Tsugi\UI\Menu();
        $submenu->addLink('Profile', $L.'profile');
        if ( isset($CFG->google_map_api_key) ) {
            $submenu->addLink('Map', $L.'map');
        }
        $submenu->addLink('Announcements', $L.'announce');
        $submenu->addLink('Grades', $L.'grades');
        $submenu->addLink('Pages', $L.'pages');
        if ( isset($_COOKIE['adminmenu']) && $_COOKIE['adminmenu'] == "true" ) {
            $submenu->addLink('Administer', $T . 'admin/');
        }
        $submenu->addLink('Logout', $R.'logout');
        if ( isset($_SESSION['avatar']) ) {
            $set->addRight('<img src="'.$_SESSION['avatar'].'" title="'.htmlentities(__('User Profile Menu - Includes logout')).'" style="height: 2em;"/>', $submenu);
            // htmlentities($_SESSION['displayname']), $submenu);
        } else {
            $set->addRight(htmlentities($_SESSION['displayname']), $submenu);
        }
    } else {
        $set->addRight('Login', $T.'login.php');
    }

    $set->addRight('Instructor', 'https://online.dr-chuck.com', true, array('target' => '_self'));

    if ( isset($_SESSION['id']) ) {
        $set->addRight('<tsugi-announce json-url="'. htmlspecialchars($json_url) . '" dismiss-url="'. htmlspecialchars($dismiss_url) . '" view-url="'. htmlspecialchars($view_url) . '"> </tsugi-announce>', false);
    }

    return $set;
}

