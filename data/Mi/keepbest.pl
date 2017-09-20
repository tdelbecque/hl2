use strict;
use diagnostics;

my %X;

while (<>) {
    chomp;
    my ($pii, $hlno, $prob) = split /\t/;
    my $x = $X {$pii};
    unless ($x) {
	$x = $X {$pii} = {hlno => $hlno, prob => 0}
    }
    if ($prob > ($x -> {prob})) {
	$x -> {prob} = $prob;
	$x -> {hlno} = $hlno;
    } 
}
    
while (my ($k, $v) = each %X) {
    print STDOUT "$k\t$v->{hlno}\t$v->{prob}\n";
}
