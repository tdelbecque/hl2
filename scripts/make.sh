#!/bin/sh

#
# Apply NLP pipeline on a given file of HL.
# This file should be found in HLDIR directory
#

tostderr(){ echo "$@" 1>&2; }

WORKDIR="$HLWORKDIR"
CMD=$WORKDIR/scripts

if [ "$2" == '' ]; then
    CONFIGFILE=$CMD/config
else
    CONFIGFILE=$CMD/$2
fi

if [ ! -f $CONFIGFILE ]; then
    echo "$CONFIGFILE is not a file"
    exit -1
fi

getoption(){
    XYZ=$(grep "^$1\\b" $CONFIGFILE | perl -ne '/^.+ (.+?) *$/; print "$1"')
    if [ "$XYZ" == '' -a "$2" != '' ]; then
	XYZ=$2
    fi
    echo $XYZ
}

DATADIR=$WORKDIR/$(getoption DATADIR data)
INDATADIR="$DATADIR/in"
HLDIR="$INDATADIR/HL"
OUTDATADIR=$DATADIR/$(getoption OUTDATADIR out)
TURBOPARSEDDIR="$OUTDATADIR/parser"
PREDICATESDIR="$OUTDATADIR/predicates"
WWWRESDIR="$OUTDATADIR/www-resources"

ORIGHLFILE=$1
FILTEREDHLFILE=$OUTDATADIR/filtered-hl
ORIGHLBASENAME=$(basename $ORIGHLFILE)
INPUT4TT=$OUTDATADIR/TT-input
CHUNKS=$OUTDATADIR/TT-output
CHUNKSTAGGED=$OUTDATADIR/TT-taggedchunks
CHUNKSPRED=$OUTDATADIR/TT-taggedchunks-pred
TELOMERESTRIPPED=$OUTDATADIR/telomeres-stripped
INPUT4TURBO=$OUTDATADIR/input4turbo
TURBOPARSEDFILE=$INPUT4TURBO.pred
TURBOPARSEDTAGGEDFILE=$TURBOPARSEDFILE.tagged

# Archived produced files:
# Turbo ependency parsing, as this is costly
ARCHTURBOPARSEDFILE=$TURBOPARSEDDIR/$ORIGHLBASENAME.pred
ARCHTTORIGINALFILE=$TURBOPARSEDDIR/$ORIGHLBASENAME.ttorigin
# with predicate tags
ARCHTURBOTAGGEDFILE=$PREDICATESDIR/$ORIGHLBASENAME.tagged
# to be digested by Hung indexing
ARCHPRED2HUNGSFILE=$PREDICATESDIR/$ORIGHLBASENAME.hung

TTBIN=$HOME/TreeTagger/bin
TTCMD=$HOME/TreeTagger/cmd
TTLIB=$HOME/TreeTagger/lib

NODECMD="/usr/local/n/versions/node/7.6.0/bin/node --max-old-space-size=24596"
TOKENIZE="perl $CMD/tokenize.pl"
#TOKENIZECMD="$TOKENIZE < $FILTEREDHLFILE > $INPUT4TT"
TOKENIZECMD="$NODECMD $CMD/fingerprint/runTokenize.js $FILTEREDHLFILE $(getoption "FPEDIR") > $INPUT4TT"

TAGCHUNKS="perl $CMD/tagchunks.pl"
STRIPHEADING="perl $CMD/strip-heading.pl"
STRIPTERMINATOR="perl $CMD/strip-terminators.pl"
ADDTOKNO="perl addTokno.pl"
TAGGER=${TTBIN}/tree-tagger 
ABBR_LIST=${TTLIB}/english-abbreviations
PARFILE=${TTLIB}/english-utf8.par
PARFILE2=${TTLIB}/english-chunker-utf8.par
FILTER=${TTCMD}/filter-chunker-output.perl

FORMAT4TURBO="perl format4Turbo.pl"
RUNTURBOPARSER=$TURBODIR/scripts/run_parser.sh
TAGWITHPREDICATETAGS="perl $CMD/build-predicates.pl"

rm -f $INPUT4TT
rm -f $CHUNKS
rm -f $CHUNKSTAGGED
rm -f $TELOMERESTRIPPED
rm -f $INPUT4TURBO
rm -f $TURBOPARSEDTAGGEDFILE
rm -f $CHUNKSPRED
rm -f $FILTEREDHLFILE

# filter the lines that contain HL
perl -ne 'print if /^S(?:X|\d){16}\t.{10}/' < $ORIGHLFILE > $FILTEREDHLFILE
eval $TOKENIZECMD

tostderr "TreeTagger"
$TAGGER -token -sgml -hyphen-heuristics $PARFILE $INPUT4TT |
    perl -pe 's/ /__SPACE__/g' |
    perl -nae 'if ($#F==0){print}else{print "$F[0]-$F[1]\n"}' |
    $TAGGER $PARFILE2 -token -sgml -eps 0.00000001 -hyphen-heuristics -quiet |
    $FILTER  |
    $TAGGER -token -lemma -sgml -no-unknown $PARFILE |
    perl -pe 's/\S+(OmniConceptID_\d+)$/$1/' |
    perl -pe 's/__SPACE__/ /g' |
    perl -pe 's/ OmniConceptID_\d+//' |
    perl -pe 's/\tIN\/that/\tIN/;s/\tV[BDHV]/\tVB/' > $CHUNKS

tostderr "Chunks Tagging"
$TAGCHUNKS < $CHUNKS | $ADDTOKNO > $CHUNKSTAGGED
tail -n 1 $CHUNKSTAGGED | perl -ne 'if (m!</PAPER>!) {exit 0} else {exit -1}'
if test "$?" != "0" ; then
    tostderr "FAIL IN CHUNCK PROCESSING"  
    exit -1
fi

tostderr "Trimming"
$STRIPHEADING < $CHUNKSTAGGED | $STRIPTERMINATOR > $TELOMERESTRIPPED
tostderr "Format for Turbo"
$FORMAT4TURBO < $TELOMERESTRIPPED > $INPUT4TURBO
tostderr "Dependency Analysis"
$RUNTURBOPARSER $INPUT4TURBO
mv $TURBOPARSEDFILE $ARCHTURBOPARSEDFILE
tostderr "SVO Tagging"
$TAGWITHPREDICATETAGS < $ARCHTURBOPARSEDFILE > $TURBOPARSEDTAGGEDFILE
# add tagging to the file before stripping
perl addPredToTreeTagger.pl $TURBOPARSEDTAGGEDFILE $TELOMERESTRIPPED $CHUNKSTAGGED > $ARCHTURBOTAGGEDFILE
tostderr "Tag 4 Hung"
./tags2Hung < $ARCHTURBOTAGGEDFILE > $ARCHPRED2HUNGSFILE
tostderr "Create xml resources for www"
perl  prepareHL4Server.pl < $ARCHTURBOTAGGEDFILE > $WWWRESDIR/$ORIGHLBASENAME.xml

if [ $(getoption "UPDATEDB") == 'y' ]; then
    tostderr "Update DB"
    $NODECMD updatedb.js
    tostderr "Update DB for www resources"
    $NODECMD updatedb-www-resources.js --db $(getoption XMLHLDB cg) --dir $WWWRESDIR
    tostderr "Update Data for Hung"
    $NODECMD updatedb-predicates.js
    tostderr "Update Parsing"
    $NODECMD updatedb-parser.js
    tostderr "Rebuilding the index"
    cd index
    make run
fi
tostderr Finished
