use strict;
use diagnostics;

my ($inPC, $inVC) = (0, 0);
my (@t, @v, @p, @l);

sub pushLine {
    push @l, $_;
    chomp;
    my ($a, $b, $c) = split /\t/;
    push @v, $c;
    push @p, $b;
    push @t, $a;
}

while (<>) {
    if (/<VC/) {
	$inVC = 1;
	@t = @v = @p = @l = ();
    } elsif (m!</VC!) {
	$inVC = 0;
	if ("@v" =~ /^(?:(?:have|can) )?be / and $p[$#p] eq 'VBN') {
	    print "<VC type=\"PASSIVE\">\n";
	    print for @l;
	    print "</VC>\n";
	} elsif ("@v" eq 'be') {
	    print "<VC type=\"BE\">\n";
	    print "@l";
	    print "</VC>\n";
	} elsif (@l == 1 and "@p" eq 'VBG') {
	    print "<VC type=\"GERUND\">\n";
	    print for @l;
	    print "</VC>\n";
	} elsif ($p [0] eq 'TO') {
	    print "<VC type=\"TO\">\n";
	    print for @l;
	    print "</VC>\n";
	} else {
	    print "<VC>\n";
	    print for @l;
	    print "</VC>\n";
	}
    } elsif (/<PC/) {
	$inPC = 1;
	@t = @v = @p = @l = ();
    } elsif (m!</PC!) {
	$inPC = 0;
	print "<PC type=\"$v[0]\">\n";
	print for @l;
	print "</PC>\n";
    } elsif ($inVC or $inPC) {
	pushLine;
    } else {
	print;
    }
}
