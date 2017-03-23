use strict;
use diagnostics;

my $tokno;

while (<>) {
    if (/<PAPER.+PII="(.+)">/) {
	print "1\t$1\t_\tCD\tCD\t_\t_\t_\n\n";
	next;
    }
    if (/<HL>/) {
	$tokno = 0;
	next;
    }
    if (m!</HL>!) {
	print "\n";
	next;
    }
    chomp;
    if (my ($tok, $pos, $lemma) = /^(.+?)\t(.+?)\t([^\t]+)/) {
       $pos = '-LRB-' if $pos eq '('; 
       $pos = '-RRB-' if $pos eq ')';
       $pos = '.' if $pos eq 'SENT';
       $pos = 'NNP' if $pos eq 'NP';
       $pos = 'NNPS' if $pos eq 'NPS';
       $pos = 'PRP' if $pos eq 'PP';
       $pos = 'PRP$' if $pos eq 'PP$';
       $tokno ++;
       print "$tokno\t$tok\t$lemma\t$pos\t$pos\t_\t_\t_\n";
    }
}
