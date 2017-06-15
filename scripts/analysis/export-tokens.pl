use strict;
use diagnostics;

my ($pii, $hlno, $globtokno, $gap, $cumulgap);
($gap, $cumulgap) = (2000, -100);

while (<>) {
    if (/<PAPER PII="(.+)"/) {
	$pii = $1;
	$hlno = 0;
    } elsif (/<HL>/) {
	$cumulgap += $gap;
	$hlno ++;
	$globtokno = $cumulgap;
    } elsif (! /^<.+>$/) {
	$globtokno ++;
	print "$pii\t$hlno\t$globtokno\t$_";
    }
}
