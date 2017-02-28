use strict;
use diagnostics;

my ($PII, $hlno);

while (<>) {
    chomp;
    if (/^0\tPII_FOUND\t(.+)/) {
	$PII = $1;
	$hlno = 0;
    } elsif (/^(\d+)/) {
	$hlno = $1;
    } elsif ($hlno and my ($a, $b, $c) = /^\t(\d+)\t(.+?)\t_\t(.+?)\t/) {
	$b =~ s/\\/\\b/g;
	print "$PII\t$hlno\t$a\t$b\t$c\n";
    }
}
