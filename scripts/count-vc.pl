
while (<>) {
    if (/S(?:X|\d){16}/) {
	$pii = $&;
	$hlno = 0;
	next;
    }
    if (/<HL>/) {
	$hlno ++;
	$n = 0;
	next;
    }
    if (/<VC>/) {
	$n ++;
	next;
    }
    if (/<VC/ and /PASSIVE|BE/) {
	$n ++;
	next;
    }
    if (m!</HL!) {
	print "$pii\t$hlno\t$n\n";
	next;
    }
}
