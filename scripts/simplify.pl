%T = ('<NC>' => 'N',
      '</NC>' => 'n',
      '<VC>' => 'V',
      '</VC>' => 'v',
      '<PC>' => 'P',
      '</PC>' => 'p',
      '<ADVC>' => 'A',
      '</ADVC>' => 'a',
      '<ADJC>' => 'J',
      '</ADJC>' => 'j',
      '<PRT>' => 'R',
      '</PRT>' => 'r',
      '<CONJC>' => 'C',
      '</CONJC>' => 'c',
      '<INTJ>' => 'I',
      '</INTJ>' => 'i',
      '<LST>' => 'L',
      '</LST>' => 'l',);

while (<>) {
    if (/PII/) {
	print;
    } elsif (m!/HL!) {
	print "\n";
    } elsif (/HL/) {
    } else {
	chomp;
	$x = $T{$_} || $_;
	print $x;
    }
}
