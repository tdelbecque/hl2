perl -ne 'print if $. % (19+1) == 0' < unknownpiis > unknownpiis.0
perl -ne 'print if $. % (19+1) == 1' < unknownpiis > unknownpiis.1
perl -ne 'print if $. % (19+1) == 2' < unknownpiis > unknownpiis.2
perl -ne 'print if $. % (19+1) == 3' < unknownpiis > unknownpiis.3
perl -ne 'print if $. % (19+1) == 4' < unknownpiis > unknownpiis.4
perl -ne 'print if $. % (19+1) == 5' < unknownpiis > unknownpiis.5
perl -ne 'print if $. % (19+1) == 6' < unknownpiis > unknownpiis.6
perl -ne 'print if $. % (19+1) == 7' < unknownpiis > unknownpiis.7
perl -ne 'print if $. % (19+1) == 8' < unknownpiis > unknownpiis.8
perl -ne 'print if $. % (19+1) == 9' < unknownpiis > unknownpiis.9
perl -ne 'print if $. % (19+1) == 10' < unknownpiis > unknownpiis.10
perl -ne 'print if $. % (19+1) == 11' < unknownpiis > unknownpiis.11
perl -ne 'print if $. % (19+1) == 12' < unknownpiis > unknownpiis.12
perl -ne 'print if $. % (19+1) == 13' < unknownpiis > unknownpiis.13
perl -ne 'print if $. % (19+1) == 14' < unknownpiis > unknownpiis.14
perl -ne 'print if $. % (19+1) == 15' < unknownpiis > unknownpiis.15
perl -ne 'print if $. % (19+1) == 16' < unknownpiis > unknownpiis.16
perl -ne 'print if $. % (19+1) == 17' < unknownpiis > unknownpiis.17
perl -ne 'print if $. % (19+1) == 18' < unknownpiis > unknownpiis.18
perl -ne 'print if $. % (19+1) == 19' < unknownpiis > unknownpiis.19

node runGetHLPar.js unknownpiis.0 > HL/HL.0 2>LOGS/log.0 &
node runGetHLPar.js unknownpiis.1 > HL/HL.1 2>LOGS/log.1 &
node runGetHLPar.js unknownpiis.2 > HL/HL.2 2>LOGS/log.2 &
node runGetHLPar.js unknownpiis.3 > HL/HL.3 2>LOGS/log.3 &
node runGetHLPar.js unknownpiis.4 > HL/HL.4 2>LOGS/log.4 &
node runGetHLPar.js unknownpiis.5 > HL/HL.5 2>LOGS/log.5 &
node runGetHLPar.js unknownpiis.6 > HL/HL.6 2>LOGS/log.6 &
node runGetHLPar.js unknownpiis.7 > HL/HL.7 2>LOGS/log.7 &
node runGetHLPar.js unknownpiis.8 > HL/HL.8 2>LOGS/log.8 &
node runGetHLPar.js unknownpiis.9 > HL/HL.9 2>LOGS/log.9 &
node runGetHLPar.js unknownpiis.10 > HL/HL.10 2>LOGS/log.10 &
node runGetHLPar.js unknownpiis.11 > HL/HL.11 2>LOGS/log.11 &
node runGetHLPar.js unknownpiis.12 > HL/HL.12 2>LOGS/log.12 &
node runGetHLPar.js unknownpiis.13 > HL/HL.13 2>LOGS/log.13 &
node runGetHLPar.js unknownpiis.14 > HL/HL.14 2>LOGS/log.14 &
node runGetHLPar.js unknownpiis.15 > HL/HL.15 2>LOGS/log.15 &
node runGetHLPar.js unknownpiis.16 > HL/HL.16 2>LOGS/log.16 &
node runGetHLPar.js unknownpiis.17 > HL/HL.17 2>LOGS/log.17 &
node runGetHLPar.js unknownpiis.18 > HL/HL.18 2>LOGS/log.18 &
node runGetHLPar.js unknownpiis.19 > HL/HL.19 2>LOGS/log.19 &
