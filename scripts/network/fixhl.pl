$/=undef;
$_ = <>;

s/\n/__NL__/gm;
s/__NL__(S(?:X|\d){16})/\n$1/gm;
s/__NL__/ /gm;
s/ $//;
print "$_\n";
    
