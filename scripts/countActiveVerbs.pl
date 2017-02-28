$b = 0;
@v = ();

while (<>) {
    if (/<VC>/) {
	$b = 1;
	@v = ();
    } elsif (m!</VC! and $b) {
	print "@v\n";
	$b = 0;
	@v = ();
    } elsif ($b) {
	chomp;
	($a, $b, $c) = split /\t/;
	push @v, $c;
    }
}
