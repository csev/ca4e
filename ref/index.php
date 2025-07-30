<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
body {
    font-family: sans-serif;
}

ul, #ZUL {
  list-style-type: none;
}

#ZUL {
  margin: 0;
  padding: 0;
}

/* Style the caret/arrow */
.caret {
  cursor: pointer;
  user-select: none; /* Prevent text selection */
}

/* Create the caret/arrow with a unicode, and style it */
.caret::before {
  content: "\25B6";
  color: black;
  display: inline-block;
  margin-right: 6px;
}

/* Rotate the caret/arrow icon when clicked on (using JavaScript) */
.caret-down::before {
  transform: rotate(90deg);
}

/* Hide the nested list */
.nested {
  display: none;
}

.active {
  display: block;
}
</style>
</head>
<body>
<?php
// https://www.w3schools.com/howto/howto_js_treeview.asp

require_once("../tsugi/config.php");

use \Tsugi\Util\U;

$contents = file_get_contents("refs.json");
$json = json_decode($contents);
$array = (array) $json;

$ref = U::get_request_document();

echo("<p>");
echo('<a href="'.$CFG->apphome.'">'.$CFG->servicename.'</a>');
echo(" Quick Reference</p>\n");
echo('<ul id="ZUL">'."\n");
foreach ($array as $key => $value) {
    if ( !isset($value->title) || strlen($value->title) < 1 ) continue;
    if ( !is_array($value->links) || count($value->links) < 1 ) continue;
    $down = "";
    if ( $key == $ref ) $down = " caret-down";
    $active = "";
    if ( $key == $ref ) $active = " active";
    echo('<li><span class="caret'.$down.'">'.$value->title."</span></a>\n");
    echo('<ul class="nested'.$active.'">'."\n");
    foreach ($value->links as $link) {
        $href = str_replace("{apphome}", $CFG->apphome, $link->href);
        echo('<li><a href="'.$href.'" target="_blank">'.$link->title.'</a></li>'."\n");
    }
    echo('</ul></li>'."\n");
}
echo("<ul>\n");
?>

<script>
var toggler = document.getElementsByClassName("caret");
var i;

for (i = 0; i < toggler.length; i++) {
  toggler[i].addEventListener("click", function() {
    this.parentElement.querySelector(".nested").classList.toggle("active");
    this.classList.toggle("caret-down");
  });
}
</script>

</body>
</html>
