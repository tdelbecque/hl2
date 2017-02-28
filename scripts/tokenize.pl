use strict;
use diagnostics;

sub tokenize {
    my ($hl) = @_;
    $hl = " $hl ";
    $hl =~ s/\s+/ /g;
    $hl =~ s=\.\.\.=\n...\n=g;
    $hl =~ s=[,;:@#\$%&!?"]=\n$&\n=g;
    $hl =~ s=([^.])([.])([])}>"']*)\s*$=$1\n$2$3\n=g;
    $hl =~ s=[][(){}<>]=\n$&\n=g;
    $hl =~ s=--=\n--\n=g;
    $hl =~ s=([^'])'\s+=$1\n'\n=g;
    $hl =~ s='([sSmMdD])\s+=\n'$1\n=g;
    $hl =~ s='(ll|re|ve)\s+=\n'$1\n=gi;
    $hl =~ s=(n't)\s+=\n$1\n=gi;
    $hl =~ s=\s+(can)(not)\s+=\n$1\n$2\n=gi;
    $hl =~ s=^\s+==;
    $hl =~ s=\s+$==;
    $hl =~ s=\s+=\n=g;
    $hl =~ s=\n+=\n=g;
    $hl;
}
    
while (<>) {
    chomp;
    
    my ($PII, @HLs) = split /\s*\xe2\x80\xa2\s*/;
    next unless $PII =~ /S(?:X|\d){16}/;
    print "<PAPER PII=\"$PII\">\n";
    for (@HLs) {
	$_ .= '.' unless /[?!:;.]\s*$/;
	print "<HL>\n";
	my $tokens = tokenize $_;
	print "$tokens\n";
	print "</HL>\n";
    }
    print "</PAPER>\n";
}

