<?php

use \Tsugi\Util\U;

function buildMenu() {
    global $CFG;
    $R = $CFG->apphome . '/';
    $T = $CFG->wwwroot . '/';

    $adminmenu = isset($_COOKIE['adminmenu']) && $_COOKIE['adminmenu'] == "true";
    $showCalendarDueUi = isset($_SESSION['id'])
        && U::isNotEmpty($CFG->lessons)
        && \Tsugi\Grades\GradeUtil::showDueDates(U::get($_SESSION, 'context_id', 0));

    $set = new \Tsugi\UI\MenuSet();
    $set->setHome($CFG->servicename, $CFG->apphome);

    if ( U::isNotEmpty($CFG->lessons) ) {
        $set->addLeft('Lessons', $R.'lessons');
    }
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
        if ( $showCalendarDueUi ) {
            $submenu->addLink('Calendar', $R.'calendar');
        }
        $submenu->addLink('Pages', $R.'pages');
        $submenu->addLink('Badges', $R.'badges');
        $submenu->addLink('Courses', 'https://online.dr-chuck.com');
        $submenu->addLink('Leaderboard', $R . 'launch/ca4e_01_leaderboard');
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
        /* hidden-xs: hide WC in collapsed nav; links stay in profile dropdown */
        $set->addRight(
            '<tsugi-notifications api-url="'. htmlspecialchars($T . 'api/notifications.php') . '" notifications-view-url="'. htmlspecialchars($R . 'notifications') . '" announcements-view-url="'. htmlspecialchars($R . 'announcements') . '"></tsugi-notifications>',
            false,
            true,
            'hidden-xs'
        );

        if ( $showCalendarDueUi ) {
            $set->addRight(
                '<tsugi-calendar-due api-url="'. htmlspecialchars($R . 'calendar/json') . '" lessons-url="'. htmlspecialchars($R . 'lessons') . '"></tsugi-calendar-due>',
                false,
                true,
                'hidden-xs'
            );
        }
        if ( U::isNotEmpty($CFG->tdiscus) && $CFG->tdiscus ) {
            $set->addRight(
                '<tsugi-discussions api-url="'. htmlspecialchars($R . 'discussions/json') . '" discussions-url="'. htmlspecialchars($R . 'discussions') . '"></tsugi-discussions>',
                false,
                true,
                'hidden-xs'
            );
        }

        $discordUrl = 'https://discord.dr-chuck.com';
        $discordIcon = '<i class="fab fa-discord" aria-hidden="true" style="font-size:1.75em;color:#fff;"></i>';
        /* Wide: icon only; xs: plain text (same URL) */
        /* data-tsugi-li-class: whole &lt;li&gt; hidden/shown (avoids empty row when only &lt;a&gt; is hidden-xs) */
        $set->addRight($discordIcon, $discordUrl, true, 'title="Discord" aria-label="Discord" data-tsugi-li-class="hidden-xs"');
        $set->addRight('Discord', $discordUrl, true, 'title="Discord" aria-label="Discord" data-tsugi-li-class="visible-xs"');
    } else {
        $set->addRight('Courses', 'https://online.dr-chuck.com', true, array('target' => '_self'));
    }

    return $set;
}

