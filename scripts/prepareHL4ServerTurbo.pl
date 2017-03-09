use strict;
use diagnostics;

my (@tokens, @hls);
my ($pii, $tripletFound);
$" = ' ';

sub outputItem {
    @tokens and push @hls, '<dl class="listitem">' .
	'<dt class="label">&bull;</dt><dd><p>' .
	"@tokens" .
	'</p></dd>';
    @tokens = ()
}

sub outputHL {
    return unless @hls;
    my $load = 
	'<div class="abstract svAbstract abstractHighlights" data-etype="ab">' .
	'<h4 id="absSec_1">Highlights</h4>' .
	"<p>" .
	"@hls" .
	"</dl></p></div>";
    $load =~ s/\n|\t/ /g;
    @hls = ();
    print STDOUT "$pii\t$load\n"
}

while (<>) {
    if (/S(?:\d|X){16}/) {
	$tripletFound = 0;
	outputItem;	    
	outputHL;
	$pii = $&;
	next;
    }
    if (/^\d/) {
	outputItem;
	$tripletFound = /TRIPLET_FOUND/;
	next;
    }
    next unless $tripletFound; 
    my ($token, $class) = /^\s+\d+\s+(.+?)\s.*?\w+\s+(\w+)$/;
    $class = "unk" unless $class;
    $class = lc $class;
    push @tokens, "<span class=\"$class\">$token</span>";
}

outputItem;
outputHL;
