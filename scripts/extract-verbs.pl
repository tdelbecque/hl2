$B = 0;
@V = ();
$" = ' ';

while (<>) {
    if (/S(?:X|\d){16}/) {
	$pii = $&;
	$hlno = 0;
	next
    }
    if (/<HL>/) {
	$hlno ++;
	next
    }
    if (/<VC>/) {
	$B = 1;
    } elsif (m!</VC>!) {
	print "$pii\t$hlno\t@V\n";
	@V = ();
	$B = 0;
    } elsif ($B) {
	chomp;
	($a, $b, $c) = split /\t/;
	push @V, $c;
    }
}
 
