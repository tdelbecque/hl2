use strict;
use diagnostics;

my %dico;

open DIC, '</usr/share/dict/american-english'
    or die $!;

while (<DIC>) {
    chomp;
    $_ = lc;
    $dico{$_} = 1;
}

close DIC;

print STDERR "!\n";

while (<>) {
    chomp;
    my $L = $_;
    my ($pii, $hlno, $ntokens,
	$nsub,
	$npred,
	$nobj,
	$nunk,
	$nnouns,
	$nconcepts,
	$ndistconc,
	$nverbs,
	$nverbsstrong,
	$nverbsunknown,
	$hl) = split '\t';
    my @terms = split /\s+/, $hl;
    my ($nknown, $nunknown) = (0, 0);
    for my $t (@terms) {
	my $l = lc $t;
	if ($l =~ /[a-z]/) {
	    if ($dico {$l}) {
		$nknown ++;
	    } else {
		$nunknown ++
	    }
	}
    }
    print "$L\t$nknown\t$nunknown\n"
}

