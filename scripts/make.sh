#!/bin/sh

#
# Apply NLP pipeline on a given file of HL.
# This file should be found in HLDIR directory
#

tostderr(){ echo "$@" 1>&2; }

WORKDIR="$HLWORKDIR"
DATADIR="$WORKDIR/data"
INDATADIR="$DATADIR/in"
HLDIR="$INDATADIR/HL"
OUTDATADIR="$DATADIR/out"
TURBOPARSEDDIR="$OUTDATADIR/parser"
PREDICATESDIR="$OUTDATADIR/predicates"
WWWRESDIR="$OUTDATADIR/www-resources"

#ORIGHLFILE=$INDATADIR/SD_PII_Highlights.tsv
#ORIGHLFILE=$HLDIR/HL.1489035601
#ORIGHLFILE=$HLDIR/$1
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
# with predicate tags
ARCHTURBOTAGGEDFILE=$PREDICATESDIR/$ORIGHLBASENAME.tagged
# to be digested by Hung indexing
ARCHPRED2HUNGSFILE=$PREDICATESDIR/$ORIGHLBASENAME.hung

TTBIN=$HOME/TreeTagger/bin
TTCMD=$HOME/TreeTagger/cmd
TTLIB=$HOME/TreeTagger/lib

CMD=$HOME/HL/scripts

NODECMD="node --max-old-space-size=16384"
TOKENIZE="perl $CMD/tokenize.pl"
#TOKENIZECMD="$TOKENIZE < $FILTEREDHLFILE > $INPUT4TT"
TOKENIZECMD="$NODECMD $CMD/fingerprint/runTokenize.js $FILTEREDHLFILE > $INPUT4TT"
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

tostderr PT0
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

tostderr PT1
$TAGCHUNKS < $CHUNKS | $ADDTOKNO > $CHUNKSTAGGED
tostderr PT2
$STRIPHEADING < $CHUNKSTAGGED | $STRIPTERMINATOR > $TELOMERESTRIPPED
tostderr PT3
$FORMAT4TURBO < $TELOMERESTRIPPED > $INPUT4TURBO
tostderr PT4
$RUNTURBOPARSER $INPUT4TURBO
tostderr PT5
mv $TURBOPARSEDFILE $ARCHTURBOPARSEDFILE
tostderr PT6
$TAGWITHPREDICATETAGS < $ARCHTURBOPARSEDFILE > $TURBOPARSEDTAGGEDFILE
# add tagging to the file before stripping
tostderr PT7
perl addPredToTreeTagger.pl $TURBOPARSEDTAGGEDFILE $TELOMERESTRIPPED $CHUNKSTAGGED > $ARCHTURBOTAGGEDFILE
tostderr PT8
./tags2Hung < $ARCHTURBOTAGGEDFILE > $ARCHPRED2HUNGSFILE
tostderr PT9
perl  prepareHL4Server.pl < $ARCHTURBOTAGGEDFILE > $WWWRESDIR/$ORIGHLBASENAME.xml
tostderr PTA
$NODECMD updatedb.js
tostderr PTB

