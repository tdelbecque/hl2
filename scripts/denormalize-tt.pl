use strict;
use diagnostics;

my $PII;
my $hlno;
my $tokno;

while (<>) {
    chomp;
    if (/<PAPER-PII="(.+)">/) {
	$PII = $1;
	$hlno = 0;
    } elsif (/<HL>/) {
	$hlno ++;
	$tokno = 0;
    } elsif (my ($a, $b, $c) = /(.+)\t(.+)\t(.+)/) {
	$tokno ++;
	$a =~ s/\\/\\b/g;
	$c =~ s/\\/\\b/g;	
	print "$PII\t$hlno\t$tokno\t$a\t$b\t$c\n";
    }
}

