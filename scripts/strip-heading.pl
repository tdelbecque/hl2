use strict;
use diagnostics;

my ($pii, $hlno, $rank);
my ($inNode, $node);

my @HL = ();

sub setTag {
    push @HL, [0, $_[0]]; 
}

sub openNC {
    push @HL, [1, $_[0], $node=[]];
}

sub openVC {
    push @HL, [2, $_[0], $node=[]];
}

$" = "\t";

sub output0 {
    if ($rank) {
	print "<HL rank=\"$rank\">\n";
    } else {
	print "<HL>\n";
    }
    for (@HL) {
	if ($_->[0] == 0) {
	    print "$_->[1]\n";
	    next;
	}
	if ($_->[0] == 1 || $_->[0] == 2) {
	    outputNode ($_);
	    next;
	}
	if ($_->[0] == 3) {
	    print "@{$_->[1]}\n";
#	    print "$_->[1]->[0]\t$_->[1]->[1]\t$_->[1]->[2]\n";
	}
    }
    print "</HL>\n";
}

sub outputNode {
    my ($x) = @_;
    print "$x->[1]\n";
    for (@{$x->[2]}) {
#	print "$_->[0]\t$_->[1]\t$_->[2]\n";
	print "@$_\n";
    }
    if ($x->[0] == 1) {
	print "</NC>\n";
    }
    if ($x->[0] == 2) {
	print "</VC>\n";
    }
    
}

sub output {
    if (@HL + 1 > 3 and $HL[0]->[0] == 1 and $HL[1]->[0] == 2 and  $HL[2]->[0] == 3 and $HL[2]->[1]->[0] eq 'that') {
	shift @HL;
	shift @HL;
	shift @HL;
    }
    output0;
}

sub clear {
    @HL = ();
}

while (<>) {
    if (/<.+"(S(?:\d|X){16})"/) {
	$pii = $1;
	$hlno = 0;
	print $_;
	next;
    }
    if (m!</PAPER!) {
	print $_;
	next;
    }
    chomp;
    if (/<NC/) {
	$inNode = 1;
	openNC $_;
	next;
    }
    if (m!</NC>!) {
	$inNode = 0;
	next;
    }
    if (/<VC/) {
	$inNode = 1;
	openVC $_;
	next;
    }	
    if (m!</VC>!) {
	$inNode = 0;
	next;
    }
    if (/<HL/) {
	($rank) = /rank\s*=\s*"(\d+)"/;
	clear;
	$hlno ++;
	next;
    }
    if (m!</HL>!) {
	output;
	next;
    }    
    if (/<.+>/) {
	setTag $_;
	next;
    }
 
    my @x = split /\t/;
    if ($inNode) {
	push @$node, \@x;
    } else {
	push @HL, [3, [@x]];
    }
}
