$N = 19;
for (0..$N) {
    print "perl -ne 'print if \$. % ($N+1) == $_' < unknownpiis > unknownpiis.$_\n" 
} 

print "\n";

for (0..$N) {
    print "node runGetHLPar.js unknownpiis.$_ > HL/HL.$_ 2>LOGS/log.$_ &\n" 
} 
