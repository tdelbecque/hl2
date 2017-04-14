use strict;
use diagnostics;

my ($pii, $previousClass, $txt) = ('', '');

while (<>) {
    if (/^<.+(S(?:\d|X){16})/) {
	$pii = $1;
	$txt = "<div class=\"abstract svAbstract abstractHighlights\" data-etype=\"ab\"><h4 id=\"absSec_1\">Highlights</h4><p><dl class=\"listitem\">";
	next;
    }
    if (m!</PAPER>!) {
	$txt .= "</dl></p></div>\n";
	print "$pii\t$txt";
	next;
    }
    if (/<HL>/) {
	$txt .= "<dt class=\"label\">&bull;</dt><dd><p>";
	$previousClass = "";
	next;
    } 
    if (m!</HL>!) {
	$txt .= "</span></p></dd>";
	next;
    }
    unless (/^<.+>$/) {
	my ($token, $pos, $lemma, $tokno, $class) = /(.+)\t(.+)\t(.+)\t(\d+)\t(.+)$/;
	if ($class eq $previousClass) {
	    $txt .= " $token";
	} else {
	    $txt .= "</span>" if $tokno > 1;
	    $txt .= " <span class=\"$class\">$token";
	    $previousClass = $class;
	}
    }
}

    
