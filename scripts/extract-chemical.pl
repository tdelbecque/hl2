use strict;
use diagnostics;

$"="\n";

while (<>) {
    my @xs = /(\S*[1-9]+,[1-9]+-[^\s.]+)/g;
    @xs and print "@xs\n"
}

