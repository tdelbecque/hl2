use strict;
use diagnostics;

my ($pii, $hlno);
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

sub output0 {
    print "<HL>\n";
    for (@HL) {
	if ($_->[0] == 0) {
	    print "$_->[1]\n";
	    next;
	}
	if ($_->[0] == 1) {
	    print "NC\n";
	    next;
	}
	if ($_->[0] == 2) {
	    print "VC\n";
	    next;
	}
	if ($_->[0] == 3) {
	    print "$_->[1]->[0]\t$_->[1]->[1]\t$_->[1]->[2]\n";
	}
    }
    print "</HL>\n";
}

sub outputNode {
    my ($x) = @_;
    print "$x->[1]\n";
    for (@{$x->[2]}) {
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
    my $x = pop @HL;
    if ($x->[0] == 3 and $x->[1]->[1] eq "SENT") {
	$x = pop @HL;
    }
    if (defined $x and $x->[0] == 2 and $x->[1] =~ /PASSIVE/) {
	my @tail;
	for (@{$x->[2]}) {
	    if ($_->[1] eq 'VBN' and $_->[0] ne 'been') {
		print "$pii\t$hlno\t$_->[0]\n";
	    }
	    #push @tail, $_->[0] if $_->[1] eq 'VBN' and $_->[0] ne 'been';
	}
#	push @tail, $_->[2] for @{$x->[2]};
#	print "$pii\t@tail\n";
    }
}

sub clear {
    @HL = ();
}

while (<>) {
    if (/<.+"(S(?:\d|X){16})"/) {
	$pii = $1;
	$hlno = 0;
#	print $_;
	next;
    }
    if (m!</PAPER!) {
#	print $_;
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
    if (/<HL>/) {
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
