use strict;
use diagnostics;

my %D;

my $patchFile = shift @ARGV;
$/="</PAPER>";

open PATCHFILE, "<$patchFile" or die "$!";

while (<PATCHFILE>) {
    my ($pii) = /PII\s*=\s*"(.+?)"/;
    last unless $pii;
    $D {$pii} = my $data = [];
    my @HL = m!(<HL.+?/HL>)!sg;
    for (@HL) {
	my ($r) = /<HL\s+rank\s*=\s*"(.+?)"/;
	$data -> [$r - 1] = $_;
    }
}

close PATCHFILE;

while (<>) {
    my ($pii) = /PII\s*=\s*"(.+?)"/;
    last unless $pii;
    next unless my $data = $D {$pii};
    my $i = 0;
    print "<PAPER PII=\"$pii\">\n";
    my @HL = m!(<HL.+?/HL>)!sg;
    for (@HL) {
	my $hl = $data -> [$i];
	if ($hl) {
	    print "$hl\n";
	} else {
	    print "$_\n";
	}
	$i ++;
    }
    print "</PAPER>\n";
}



