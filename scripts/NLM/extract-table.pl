use strict;
use diagnostics;

$" = "\n";
while (<>) {
    next unless /^INSERT/;
    s/\(/<B>/;
    s/\),\(/<A><B>/g;
    my @tuples = /<B>(.+?)<A>/g;
    print "@tuples\n";
}

