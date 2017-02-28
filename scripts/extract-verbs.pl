$B = 0;
@V = ();
$" = ' ';

while (<>) {
    if (/<VC>/) {
	$B = 1;
    } elsif (m!</VC>!) {
	print "@V\n";
	@V = ();
	$B = 0;
    } elsif ($B) {
	chomp;
	($a, $b, $c) = split /\t/;
	push @V, $c;
    }
}
 
