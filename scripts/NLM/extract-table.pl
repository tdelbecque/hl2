use strict;
use diagnostics;

$" = "\n";
while (<>) {
    next unless /^INSERT/;
    s/'\),\((\d\d\d)/'<THY_A><THY_B>$1/g;
    s/VALUES \(/<THY_B>/;
    s/\);$/<THY_A>/;
    my @tuples = /<THY_B>(.+?)<THY_A>/g;
    print "@tuples\n";
}

