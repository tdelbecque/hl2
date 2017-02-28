use strict;
use diagnostics;

my %TT;

open TT, '<../data/TT-output-denormalized.tsv'
    or die $!;

while (<TT>) {
    chomp;
    my ($pii, $hlno, $tokno, $tok, $pos) = split /\t/;
    $TT{$pii}->[$hlno-1]->[$tokno-1] = [$tok,$pos]; 
}

close TT;

open TURBO, '<../data/TurboParser-output-denormalized.tsv'
    or die $!;

my $N = 0;
while (<TURBO>) {
    chomp;
    my ($pii, $hlno, $tokno, $tok, $pos) = split /\t/;
    my $p = $TT{$pii};
    if (defined $p) {
	my $h = $p->[$hlno-1];
	if (defined $h) {
	    my $v = $h->[$tokno-1];
	    if (defined $v) {
		print "$pii\t$hlno\t$tokno\t$v->[0]\t$v->[1]\t$tok\t$pos\n";
	    }
	}
    }
}

close TURBO;

print STDOUT "$N\n";
