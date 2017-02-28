use strict;
use diagnostics;

my $PII;
my $hlno;
my @s = ();

while (<>) {
    chomp;
    if (/<PAPER-PII="(.+)">/) {
	$hlno = 0;
	$PII = $1;
	next;
    }
    if (/<HL>/) {
	#push @s, $_;
	$hlno ++;
    } elsif (m!</HL>!) {
	#push @s, $_;
	print "$PII\t$hlno\t@s\n";
	@s = ();
    } elsif (/(.+)\t(.+)\t(.+)/) {
	push @s, "$3";
    } else {
	push @s, $_;
    }
}

@s and print "$PII\t$hlno\t@s\n";
