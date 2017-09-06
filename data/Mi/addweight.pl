use strict;
use diagnostics;

my %D;
open DATA, "<MI_DATA" or die $!;

while (<DATA>) {
    my ($pii, $hlno, $dummy, $w) = split /\t/;
    $D {"$pii $hlno"} = $w + 0
}

close DATA;

while (<>) {
    my ($pii, $hlno) = split /\t/;
    my $w = $D {"$pii $hlno"};
    defined $w or print STDERR  "Unable to find weight for $pii $hlno\n";
    s/\|([123])\|1></|$1|1> </g;
    s/\|([123])\|1>/|$1|$w>/g;
    print
}
