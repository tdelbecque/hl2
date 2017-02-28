WORKDIR=$HOME/HL
INDATADIR=$WORKDIR/data/in
OUTDATADIR=$WORKDIR/data/out

ORIGHLFILE=$INDATADIR/SD_PII_Highlights.tsv
INPUT4TT=$OUTDATADIR/TT_input
CHUNKS=$OUTDATADIR/TT-output
CHUNKSTAGGED=$OUTDATADIR/TT-taggedchunks
INPUT4TURBO=$OUTDATADIR/input4turbo

TTBIN=$HOME/TreeTagger/bin
TTCMD=$HOME/TreeTagger/cmd
TTLIB=$HOME/TreeTagger/lib

CMD=$HOME/HL/scripts
TOKENIZE=perl $CMD/tokenize.pl
TAGCHUNKS=perl $CMD/tagchunks.pl

TAGGER=${TTBIN}/tree-tagger 
ABBR_LIST=${TTLIB}/english-abbreviations
PARFILE=${TTLIB}/english-utf8.par
PARFILE2=${TTLIB}/english-chunker-utf8.par
FILTER=${TTCMD}/filter-chunker-output.perl

FORMAT4TURBO=perl format4Turbo.pl
RUNTURBOPARSER=$TURBODIR/scripts/run_parser.sh

$TOKENIZE < $ORIGHLFILE > $INPUT4TT

$TAGGER -token -sgml -hyphen-heuristics $PARFILE $INPUT4TT |
    perl -nae 'if ($#F==0){print}else{print "$F[0]-$F[1]\n"}' |
    $TAGGER $PARFILE2 -token -sgml -eps 0.00000001 -hyphen-heuristics -quiet |
    $FILTER  |
    $TAGGER -token -lemma -sgml -no-unknown $PARFILE |
    perl -pe 's/\tIN\/that/\tIN/;s/\tV[BDHV]/\tVB/' > $CHUNKS

$TAGCHUNKS < $CHUNKS > $CHUNKSTAGGED

perl -ne 'print if /^<.+>$/' < $CHUNKS |
    perl $CMD/simplify.pl |
    perl -ne 's/Nn/1/g; print' |
    perl -ne 's/Vv/2/g; print' |
    perl -ne 's/Aa/3/g; print' |
    perl -ne 's/Jj/4/g; print' |
    perl -ne 's/Rr/5/g; print' |
    perl -ne 's/Cc/6/g; print' |
    perl -ne 's/Ii/7/g; print' |
    perl -ne 's/Ll/8/g; print' |
    perl -ne 's/></>\n</; print' |
    perl -ne 's/-/ /; print' > $OUTDATADIR/simple-20161128

perl $CMD/strip-terminators.pl < $CHUNKSTAGGED | perl $CMD/strip-heading.pl > $OUTDATADIR/telomeres-stripped

$FORMAT4TURBO < $CHUNKS > $INPUT4TURBO
$RUNTURBOPARSER $INPUT4TURBO
