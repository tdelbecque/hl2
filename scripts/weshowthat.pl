($n, $d) = (0, 0);
while (<>) {
    if (/S(?:X|\d){16}/) {
	$PII = $&;
    } elsif (/<HL>/) {
	$n = $d = 0;
	@l = ();
    } else {
	if (/^<[A-Z]/) {
	    $n ++;
	    $d ++;
	} elsif (m!</!) {
	    $d --;
	} else {
	    chomp;
	    ($a, $b, $c) = split /\t/;
	    push @l, $c;
	    if ($d == 0) {
		if ($a eq 'that' and $n == 2) {
		    print "$PII\t@l\n";
		}
	    }
	}
    }
#    print "$n\t$d\t$_";
}
