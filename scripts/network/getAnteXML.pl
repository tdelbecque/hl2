use strict;
use diagnostics;

my %DejaVu;

open DEJAVU, "<foo" or die $!;

while (<DEJAVU>) {
    $DejaVu{$_} = 1;
}

close DEJAVU;

while (<>) {
    print unless $DejaVu {$_}
}
