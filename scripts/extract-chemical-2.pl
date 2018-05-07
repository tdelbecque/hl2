use strict;
use diagnostics;

my @triggers;
open TRIGGERS, "<chemical-triggers" or die $!;

while (<TRIGGERS>) {
    chomp;
    push @triggers, $_;
}

close TRIGGERS;

$" = "|";
my $re = "([^\\s.]*?\\b(?:@triggers)\\b[^\\s.]*)";

$" = "\n";

while (<>) {
    $_ = lc;
    s/\s+]/]/g;
    s/\s+}/}/g;
    s/\s+\)/)/g;
    s/\s+-/-/g;
    s/\[\s+/[/g;
    s/\{\s+/{/g;
    s/\(\s+/(/g;
    s/-\s+/-/g;
    my @X = /$re/g;
    @X and print "@X\n"
}


=for test

my $test = "Mono- and bis-(pentafluorophenyl)boranes can be prepared as Me 2 S adducts";

my @X = $test =~ /$re/gi;

print "@X";

=cut
