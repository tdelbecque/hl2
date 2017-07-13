use strict;
use diagnostics;

my %PMIDS = ();

open IDSFILE, "<ids-ante" or die $!;

while (<IDSFILE>) {
    my ($pii, $doi, $pmid, $eid) = split "\t";
    $PMIDS {$pmid} = 1;
}

close IDSFILE;

while (<>) {
    my ($pmid) = /\d+,'(.+?)'/;
    die "$. $_" unless $pmid;
    if ($PMIDS {$pmid}) {
	s/\\'/''/g;
	s/NULL//g;
	print;
    }
}

