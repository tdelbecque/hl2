use strict;
use diagnostics;

my ($IDX, $TOKEN, $DUMMY1, $GRAM1, $GRAM2, $DUMMY2, $PARENT, $CAT, $SEGMENT) = (0..8);
my (@entries, $ROOT, $SUB, $OBJ, $status);
my %OBJ = ();
my $hlno = 0;

$" = "\t";

sub getSegment {
    my ($e) = @_;
    my $segment = $e -> [$SEGMENT];
    return $segment if defined $segment;

    my $idx = $e -> [$IDX];
    die "@$e" unless defined $idx;
    if ($idx == $ROOT) {
	push @$e, ($segment = 'PRED');
    } elsif ($idx == $SUB) {
	push @$e, ($segment = 'SUB');
    } elsif (defined $OBJ {$idx}) {
	if ($e -> [$PARENT] == $ROOT and 
	    ($e -> [$CAT] =~ /VC|VB|VMOD/)) {
	    push @$e, ($segment = 'PRED');
	} else {
	    push @$e, ($segment = 'OBJ');
	}
    } else {
	$segment = getSegment ($entries [$e -> [$PARENT] - 1]);
	if ($segment eq 'PRED') {
	    if (($e ->  [$CAT] eq 'VMOD' and $e -> [$GRAM1] eq 'RP') or
		($e -> [$CAT] eq 'VC')) {
		$segment = 'PRED';
	    } else {
		$segment = 'OBJ';
	    }
	}
	push @$e, $segment;
    }
    return $segment;
}

sub digest {
    if (defined $ROOT) {
	for my $e (@entries) {
	    $SUB = $e -> [$IDX] if $e -> [$CAT] eq 'SUB' and $e -> [$PARENT] == $ROOT;
	    $OBJ = $OBJ {$e -> [$IDX]} = 1 if $e -> [$CAT] ne 'SUB' and $e -> [$PARENT] == $ROOT;
	}
	if ($SUB && $OBJ) {
	    for my $e (@entries) {
		getSegment ($e);
	    }
	    $status = "TRIPLET_FOUND";
	} else {
	    $status = "NOT_A_TRIPLET" unless defined $status;
	}
    } else {
	$status = "NOT_ROOTED";
    }

    print STDOUT "$hlno\t$status\n";
    for my $e (@entries) {
	print STDOUT "\t@$e\n";
    }
    
    $ROOT = $SUB = $OBJ = $status = undef;
    %OBJ = ();
    $hlno ++;
    @entries = ();
}

while (<>) {
    chomp;
    if (/^\d/) {
	my ($idx, $token, $dummy1, $gram1, $gram2, $dummy2, $parent, $cat) =
	    split /\t/;
	push @entries, [$idx, 
			$token, $dummy1, $gram1, $gram2, $dummy2, $parent, $cat];
	if ($cat eq 'ROOT') {
	    if ($token =~ /S(\d|X){16}\b/ and $gram1 eq 'CD') {
		$status = "PII_FOUND\t$token";
		$hlno = 0;
	    }
	    $ROOT = $idx;
	}
    } else {
	digest;
    }
}
digest;
