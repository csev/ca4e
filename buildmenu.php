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
    if ( ! isset($_SESSION['id']) ) {
        $set->addLeft('Explore', $R.'explore');
    }

    if ( U::isNotEmpty($CFG->lessons) && isset($_SESSION['id']) ) {
        $set->addLeft('Assignments', $R.'assignments');
    }

    if ( isset($_SESSION['id']) ) {
        $submenu = new \Tsugi\UI\Menu();
        $submenu->addLink('Profile', $R.'profile');
        if ( isset($CFG->google_map_api_key) ) {
            $submenu->addLink('Map', $R.'map');
        }
        $submenu->addLink('Announcements', $R.'announcements');
        $submenu->addLink('Notifications', $R.'notifications');
        $submenu->addLink('Grades', $R.'grades');
        if ( U::isNotEmpty($CFG->lessons) ) {
            $submenu->addLink('Calendar', $R.'calendar');
        }
        $submenu->addLink('Pages', $R.'pages');
        $submenu->addLink('Badges', $R.'badges');
        $submenu->addLink('Courses', 'https://online.dr-chuck.com');
        $submenu->addLink('LMS Integration', $T . 'settings');

        if ( isset($_COOKIE['adminmenu']) && $_COOKIE['adminmenu'] == "true" ) {
            $submenu->addLink('Administer', $T . 'admin/');
        }
        $submenu->addLink('Logout', $R.'logout');
        if ( isset($_SESSION['avatar']) ) {
            $set->addRight('<img src="'.$_SESSION['avatar'].'" alt="'.htmlentities(__('User profile')).'" title="'.htmlentities(__('User Profile Menu - Includes logout')).'" style="height: 2em;"/>', $submenu);
            // htmlentities($_SESSION['displayname']), $submenu);
        } else {
            $set->addRight(htmlentities($_SESSION['displayname']), $submenu);
        }
    } else {
        $set->addRight('Login', $R.'login');
    }


    if ( isset($_SESSION['id']) ) {
        $set->addRight('<tsugi-notifications api-url="'. htmlspecialchars($T . 'api/notifications.php') . '" notifications-view-url="'. htmlspecialchars($R . 'notifications') . '" announcements-view-url="'. htmlspecialchars($R . 'announcements') . '"></tsugi-notifications>', false);

        if ( U::isNotEmpty($CFG->lessons) ) {
            $set->addRight('<tsugi-calendar-due api-url="'. htmlspecialchars($R . 'calendar/json') . '" lessons-url="'. htmlspecialchars($R . 'lessons') . '"></tsugi-calendar-due>', false);
        }

        $discordUrl = 'https://discord.dr-chuck.com';
        $discordIcon = '<i class="fab fa-discord" aria-hidden="true" style="font-size:1.75em;color:#fff;"></i>';
        $set->addRight($discordIcon, $discordUrl, true, 'title="Discord" aria-label="Discord"');
    } else {
        $set->addRight('Courses', 'https://online.dr-chuck.com', true, array('target' => '_self'));
    }

    return $set;
}

