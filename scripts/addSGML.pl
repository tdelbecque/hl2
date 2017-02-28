$HL = '';
$PREV_PAPER='';
$HL0='';
print "<HLSET>\n";
while (<>) {
    if (/S(?:\d|X){16}/) {
	print "$PREV_PAPER<PAPER PII=\"$&\">\n";
	$PREV_PAPER="</HL>\n</PAPER>\n";
	$HL0='';
    } elsif (/^$/) {
	$HL = "$HL0<HL>\n";
    } else {
	print $HL;
	$HL = '';
	$HL0="</HL>\n";
	print
    }
}
print "</HL>\n</PAPER>\n</HLSET>\n";

    
