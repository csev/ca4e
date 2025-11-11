<?php
use \Tsugi\Util\U;
use \Tsugi\Util\Net;
use \Tsugi\Core\LTIX;
use \Tsugi\UI\Output;

require "top.php";
require "nav.php";

$seconds = time();
$val = intdiv($seconds, 5);
$photos = [
    "images/arduino-2713093_1280.jpg",
    "images/seven-segment-957235_1280.jpg",
    "images/vishnu-mohanan-O68LT-zCYFg-unsplash.jpg",
    "images/wirth_interview.png",
    "images/cdc_6500_cpu_living_computer.png",
    "images/cdc_6500_console_living_computer.png",
];
$photo = $photos[intdiv(time(), 1) % count($photos)];
?>

<!-- Fix for smartphone screen responsiveness -->
<style>
code {
  word-break: break-word;
}
</style>

<div id="container">
<div style="margin-left: 10px; float:right">
<div id="carousel" class="carousel slide" data-ride="carousel">
  <div class="carousel-inner">
    <?php foreach($photos as $index => $img): ?>
        <div class="carousel-item item <?= ($index === intdiv(time(), 1) % count($photos)) ? 'active' : '' ?>">
            <img class="d-block" src="<?= $img ?>"  width="400" height="225"/>
        </div>
    <?php endforeach; ?>
  </div>

<!-- Previous/Next controls -->
<a class="left carousel-control" href="#carousel" role="button" data-slide="prev">
<span class="icon-prev" aria-hidden="true"></span>
<span class="sr-only">Previous</span>
</a>
<a class="right carousel-control" href="#carousel" role="button" data-slide="next">
<span class="icon-next" aria-hidden="true"></span>
<span class="sr-only">Next</span>
</a>


</div>
<!--
<iframe width="400" height="225" src="https://www.youtube.com/embed/oxJQB4f2MMs?rel=0" frameborder="0" allowfullscreen></iframe>
-->
</div>
<h1>Computer Architecture for Everybody</h1>
<p>
<b>This web site and all the tools are under construction.</b>
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
the sample content in various stages of completion:
<ul>
<li>
<a href="tools/sliderule"  target="_blank" class="text-primary">Interactive Slide Rule</a>
</li>
<li>
<a href="tools/e6b"  target="_blank" class="text-primary">Online Pilot Wind Correction Calculator (E6B)</a>
</li>
<li>
<a href="tools/truth"  target="_blank" class="text-primary">Logical Truth Table Practice</a>
</li>
<li>
<a href="tools/nixie"  target="_blank" class="text-primary">Number conversion Practice - The Nixie Challenge</a>
</li>
    <li>
      <a href="tools/cmos/" target="_blank" class="text-primary">CMOS Gate Builder</a>
    </li>
    <li>
      <a href="tools/mistic/" target="_blank" class="text-primary">Mistic VLSI Layout Tool</a> (inspried by the
     <a href="http://opencircuitdesign.com/magic/" class="text-primary" target="_blank">Magic VLSI Layout Tool</a>)
    </li>
    <li>
      <a href="tools/gates/" target="_blank" class="text-primary">Digital Logic Builder</a>
    </li>
<li>
<a href="tools/cdc8512"  target="_blank" class="text-primary">A CDC8512 Microprocessor Emulator</a> (<a href="cdc8512/documentation.html"  target="_blank" class="text-primary">Documentation</a>)
</li>
<li>
<a href="tools/wasm"  target="_blank" class="text-primary">WASM Playground</a>
</li>
<li>You also can view the course that is a pre-requisite for this course
<a href="http://www.cc4e.com/" target="_blank" class="text-primary">C Programming Everybody</a>
</li>
</ul>
<p>
The course is not developed in a linear order.  These courses take a long time to develop.
I tend to work on things that I think will be most difficult first.  Most of the early work is to build
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

$foot = '
<p style="font-size: 75%; margin-top: 5em;">
Copyright Creative Commons Attribution 3.0
</p>';

$OUTPUT->setAppFooter($foot);

$OUTPUT->footerStart();
?>
<script>
$(document).ready( function () {
    $('#carousel').carousel();
});
</script>

<?php
$OUTPUT->footerEnd();
