<?php
use \Tsugi\Util\U;
use \Tsugi\Util\Net;
use \Tsugi\Core\LTIX;
use \Tsugi\UI\Output;
use \Tsugi\UI\Pages;

require "top.php";
require "nav.php";

$seconds = time();
$val = intdiv($seconds, 5);
$photos = [
    ["src" => "images/arduino-2713093_1280.jpg", "alt" => "Arduino microcontroller board with components"],
    ["src" => "images/seven-segment-957235_1280.jpg", "alt" => "Seven-segment display showing numeric digits"],
    ["src" => "images/vishnu-mohanan-O68LT-zCYFg-unsplash.jpg", "alt" => "Electronic circuit components and wiring"],
    ["src" => "images/wirth_interview.png", "alt" => "Niklaus Wirth, creator of Pascal and Modula"],
    ["src" => "images/cdc_6500_cpu_living_computer.png", "alt" => "CDC 6500 CPU from the Living Computer Museum"],
    ["src" => "images/cdc_6500_console_living_computer.png", "alt" => "CDC 6500 console from the Living Computer Museum"],
];
$photo = $photos[intdiv(time(), 1) % count($photos)]["src"];
?>

<!-- Fix for smartphone screen responsiveness -->
<style>
code {
  word-break: break-word;
}
</style>

<main id="container">
<div style="margin-left: 10px; float:right">
<iframe width="400" height="225" src="https://www.youtube.com/embed/DK3Oq4PKxKU?list=PLa58EAvBOOSJjrzDrl9eVigR5SQQ0W-3D&rel=0" frameborder="0" allowfullscreen title="Django for Everybody course introduction video"></iframe>
</div>
<h1>Computer Architecture for Everybody</h1>
<?php
$front_page_text = null;
if ( isset($_SESSION['id']) && isset($_SESSION['context_id']) ) $front_page_text = Pages::getFrontPageText($_SESSION['context_id']);
if ( $front_page_text ) {
    echo $front_page_text;
} else {
?>
<p>
This course 
covers digital electronics, how electronics can be used for
computation, what machine language is, and what assembly language
is, and how compiled languages like C work.
</p>
<p>
You can explore the digital design tools developed for this course
by clicking on the <a href="explore">Explore</a> link above.
</p>
<p>
You can take this course and earn a certificate at:
<ul>
<li><a href="https://www.udemy.com/course/computer-hardware-history/?referralCode=E95943B808A6D0D60EDF" target="_blank">Udemy - Computer Hardware: History from Analog to Digital</a></li>
<li><a href="https://www.udemy.com/course/how-microprocessors-are-built-and-programmed/?referralCode=76AA3778A203F3AADF5D" target="_blank">Udemy - How Microprocessors are Built and Programmed</a></li>
</ul>
<p>
If you want to use these Creative Commons Licensed materials
in your own classes you can
<a href="materials.php">download or link</a> to the artifacts on this site,
<a href="tsugi/cc/">export the course material</a> as an
IMS Common Cartridge®, or apply for
an IMS Learning Tools Interoperability® (LTI®)
<a href="tsugi/admin/key/index.php">key and secret</a>
 to launch the autograders from your LMS.
<h3>Copyright</h3>
<p>
The material produced specifically for this site is by Charles Severance and others
and is Copyright Creative Commons Attribution 3.0
unless otherwise indicated.
</p>
<?php } /* End of there is a front page */ ?>
</main>
<?php

require_once "footer.php";
