use strict;
use diagnostics;

my %end = ();

open ENDTERMS, "<meta-ends" or die $!;
while (<ENDTERMS>) {
    chomp;
    my ($t) = /.+ (.+)/;
    $end{$t} = 1;
}
close ENDTERMS;

while (<>) {
    if (/ (\S+ed) \./) {
	print if $end {$1}
    }
}
