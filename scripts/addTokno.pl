use strict;
use diagnostics;

my $tokno = 0;

while (<>) {
    $tokno = 0 if /<HL/;
    if (/^<.+>$/) {
	print;
    } else {
	$tokno ++;
	chomp;
	print "$_\t$tokno\n";
    }
}
