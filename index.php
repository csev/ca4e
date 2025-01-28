<?php
use \Tsugi\Util\U;
use \Tsugi\Util\Net;
use \Tsugi\Core\LTIX;
use \Tsugi\UI\Output;

require "top.php";
require "nav.php";

?>

<!-- Fix for smartphone screen responsiveness -->
<style>
code {
  word-break: break-word;
}
</style>

<div id="container">
<!--
<div style="margin-left: 10px; float:right">
<iframe width="400" height="225" src="https://www.youtube.com/embed/oxJQB4f2MMs?rel=0" frameborder="0" allowfullscreen></iframe>
</div>
-->
<h1>Computer Architecture for Everybody</h1>
<p>
<b>This web site is under construction.</b>
</p>
<p>
This course will
cover digitial electronics, how electronics can be used for
computation, what machine language is, and what assembly language
is, and how compiled languages like C work.
</p>
<h2>Some Sample Content</h2>
<p>
As the course is developed, you can see some of
the sample content:
<ul>
</li>
<li>A lecture on a microprocessor that will be developed for the course
<a href="lectures/CDC8512.pptx" target="_blank" class="text-primary">CDC8512 Microprocessor</a>.
</li>
<li>
<a href="cdc8512/index.html"  target="_blank" class="text-primary">A CDC8512 Microprocessor Emulator Prototype</a>
</li>
<li>
<a href="https://www.youtube.com/playlist?list=PLa58EAvBOOSJDJoRNd8q8t3U0dgRAgZ1e" target="_blank" class="text-primary">A YouTube Playlist of the Development of the Course Content</a> (Please like and subscribe)</li>
<li>You also can view the course that is a pre-requisite for this course
<a href="http://www.cc4e.com/" target="_blank" class="text-primary">C Programming Everybody</a>
</li>
</ul>
<p>
The course is not developed in a linear order.  These courses take a long time to develop.
I tend to work on thigs that I think will be most difficult first.  Most of the early work is to build
and test autograders.
</p>
<h3>Copyright</h3>
<p>
The material produced specifically for this site is by Charles Severance and others
and is Copyright Creative Commons Attribution 3.0
unless otherwise indicated.
</p>
</div>
<?php
require "footer.php";
