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
<h1>Digital Design Tools</h1>
<p>
A number of online digital design tools were developed for this course.
This page allows you to explore those tools without logging in.  If you
log in these same tools are used for assignments under lessons.
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
      <a href="tools/ascii/" target="_blank" class="text-primary">An ASCII chart</a>
    </li>
<li>
<a href="tools/cdc6504"  target="_blank" class="text-primary">A CDC6504 Microprocessor Emulator</a> (<a href="tools/cdc6504/documentation.html"  target="_blank" class="text-primary">Documentation</a>)
</li>
<li>
<a href="tools/wasm"  target="_blank" class="text-primary">WASM Playground</a>
</li>
</ul>
<p>
Most of these tools were developed with extensive use 
of <a href="https://cursor.com/download" target="_blank">Cursor.AI</a>.
It was a great study of both the impressive capabilities and
unfortunate limitations of AI.  I would say 80% impressive /
20% disappointing - but things got bettwe as 2025 progressed.
</p>
<h2>A Challenge for You</h2>
<p>
One tool I really wanted to use early in the course was a breadboard emulation.
I used AI to build a beautiful and functional UI, and it actually worked quite
well for single components. Check out how it lights up the pins with their
voltages 🙂 Unfortunately, once the circuits became more complex, the circuit
emulation was never reliable.
</p>
<p>
<a href="tools/breadboard" target="_blank" class="text-primary">Breadboard</a>
</p>
<p>
I think the core problem is that the simulation needs to be analog and allowed
to settle. A common quick-and-dirty approach is to repeatedly recompute voltages
(perhaps 100 times), letting them converge and then stopping when things are
“close enough.” Trust me — I tried that a LOT, and it was never successful.
</p>
<p>
I’ll be honest: part of the problem is that I dropped out of Electrical
Engineering shortly after I almost learned
<a href="https://en.wikipedia.org/wiki/Mesh_analysis" target="_blank">Mesh Analysis</a>
and
<a href="https://en.wikipedia.org/wiki/Nodal_analysis" target="_blank">Nodal Analysis</a>.
I knew enough to know just how hard this problem really is. After spending 40+
hours begging AI to solve it — and watching it fail repeatedly — I finally
decided to build the circuit emulation by hand when I had 40 hours of my own
to spend on it. For the record, AI knows a LOT
about mesh and nodal analysis; it just can’t seem to write working code to
implement them, no matter how carefully I prompt it.  By the way - I think
Nodal analysis will win the day in these circuits.
</p>
<p>
I also attempted to build another version that would let me explore the nature
of transistor-based amplification. This involved analog computing with voltages
changing over time. I got a prettty cool UI pretty quickly with AI - but
when it came to circuit emulation - AI was so lost that I gave up quickly.
</p>
<p>
<a href="tools/analog" target="_blank" class="text-primary">Analog</a>
</p>
<p>
One theory I have is wat about a year for AI to get smarter and then try it again :)
</p>
<p>
So here’s your challenge: check out the
<a href="github.com/csev/ca4e" target="_blank">CA4E GitHub repository</a>
and fix one (or both) of these tools. Breadboard is more useful to me
pedagogically, is closer to being complete, and is frankly easier than
Analog. If you fix Breadboard, send me a PR — and then I’ll have to redo the
course materials 🙂 Thanks in advance.
</p>
<h2>Copyright</h2>
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
</div>
<?php

require_once "footer.php";
