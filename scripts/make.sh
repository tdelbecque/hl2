#!/bin/sh

#
# Apply NLP pipeline on a given file of HL.
# This file should be found in HLDIR directory
#
WORKDIR=$HLWORKDIR
INDATADIR=$WORKDIR/data/in
HLDIR=$INDATADIR/HL
OUTDATADIR=$WORKDIR/data/out
TURBOPARSEDDIR=$OUTDATADIR/parser
WWWRESDIR="$OUTDATADIR/www-resources"

#ORIGHLFILE=$INDATADIR/SD_PII_Highlights.tsv
#ORIGHLFILE=$HLDIR/HL.1489035601
ORIGHLFILE=$HLDIR/$1
FILTEREDHLFILE=$OUTDATADIR/filtered-hl
ORIGHLBASENAME=$(basename $ORIGHLFILE)
INPUT4TT=$OUTDATADIR/TT-input
CHUNKS=$OUTDATADIR/TT-output
CHUNKSTAGGED=$OUTDATADIR/TT-taggedchunks
CHUNKSPRED=$OUTDATADIR/TT-taggedchunks-pred
TELOMERESTRIPPED=$OUTDATADIR/telomeres-stripped
INPUT4TURBO=$OUTDATADIR/input4turbo
TURBOPARSEDFILE=$INPUT4TURBO.pred
ARCHTURBOPARSEDFILE=$TURBOPARSEDDIR/$ORIGHLBASENAME.pred
TURBOPARSEDTAGGEDFILE=$TURBOPARSEDFILE.tagged

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

$TAGCHUNKS < $CHUNKS | $ADDTOKNO > $CHUNKSTAGGED
$STRIPHEADING < $CHUNKSTAGGED | $STRIPTERMINATOR > $TELOMERESTRIPPED
$FORMAT4TURBO < $TELOMERESTRIPPED > $INPUT4TURBO
$RUNTURBOPARSER $INPUT4TURBO
mv $TURBOPARSEDFILE $ARCHTURBOPARSEDFILE
$TAGWITHPREDICATETAGS < $ARCHTURBOPARSEDFILE > $TURBOPARSEDTAGGEDFILE
perl addPredToTreeTagger.pl $TURBOPARSEDTAGGEDFILE $TELOMERESTRIPPED $CHUNKSTAGGED > $CHUNKSPRED
perl  prepareHL4Server.pl < $CHUNKSPRED > $WWWRESDIR/$ORIGHLBASENAME.xml
