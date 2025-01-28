<?php

use \Tsugi\Util\U;

function buildMenu() {
    global $CFG;
    $R = $CFG->apphome . '/';
    $T = $CFG->wwwroot . '/';
    $adminmenu = isset($_COOKIE['adminmenu']) && $_COOKIE['adminmenu'] == "true";
    $set = new \Tsugi\UI\MenuSet();
    $set->setHome($CFG->servicename, $CFG->apphome);

    if ( U::isNotEmpty($CFG->lessons) ) {
        $set->addLeft('Lessons', $R.'lessons');
    }
    if ( U::isNotEmpty($CFG->tdiscus) && $CFG->tdiscus ) $set->addLeft('Discussions', $R.'discussions');

    if ( U::isNotEmpty($CFG->lessons) && isset($_SESSION['id']) ) {
        $set->addLeft('My Progress', $R.'assignments');
    }

    if ( U::isNotEmpty($CFG->lessons) && (! isset($_SESSION['id'])) && is_dir('assn') ) {
        $set->addLeft('Assignments', $R.'assn');
    }

    /*
    if ( isset($_SESSION['id']) ) {
        $submenu = new \Tsugi\UI\Menu();
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
     */
    $set->addRight('Instructor', 'https://online.dr-chuck.com');

    return $set;
}

