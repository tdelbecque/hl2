tostderr(){ echo "$@" 1>&2; }

TIMESTAMP=`date +'%s'`

FAILURES=$1
if [ ! -f $FAILURE ]; then
    tostderr "CANNOT USE $FAILURE"
fi

ORIGHLBASENAME=$(basename $FAILURES)

WORKDIR="$HLWORKDIR"
DATADIR="$WORKDIR/data"
OUTDATADIR="$DATADIR/analysis/$TIMESTAMP"
if [ -e $OUTDATADIR ]; then
    tostderr "directory $OUTDATADIR should not exist"
    exit -1
else
    mkdir $OUTDATADIR
    if test "$?" != "0" ; then
	tostderr "FAIL TO CREATE $OUTDATADIR"  
	exit -1
    fi
fi
TURBOPARSEDDIR="$OUTDATADIR/parser"
mkdir $TURBOPARSEDDIR
if test "$?" != "0" ; then
    tostderr "FAIL TO CREATE $TURBOPARSEDDIR"  
    exit -1
fi

PREDICATESDIR="$OUTDATADIR/predicates"
mkdir $PREDICATESDIR
if test "$?" != "0" ; then
    tostderr "FAIL TO CREATE $PREDICATESDIR"  
    exit -1
fi

WWWRESDIR="$OUTDATADIR/www-resources"
mkdir $WWWRESDIR
if test "$?" != "0" ; then
    tostderr "FAIL TO CREATE $WWWRESDIR"  
    exit -1
fi

TTBIN=$HOME/TreeTagger/bin
TTCMD=$HOME/TreeTagger/cmd
TTLIB=$HOME/TreeTagger/lib

TAGGER=${TTBIN}/tree-tagger 
ABBR_LIST=${TTLIB}/english-abbreviations
PARFILE=${TTLIB}/english-utf8.par
PARFILE2=${TTLIB}/english-chunker-utf8.par
FILTER=${TTCMD}/filter-chunker-output.perl

CMD=$HOME/HL/scripts

NODECMD="/usr/local/n/versions/node/7.6.0/bin/node --max-old-space-size=24596"

TAGCHUNKS="perl $CMD/tagchunks.pl"
STRIPHEADING="perl $CMD/strip-heading.pl"
STRIPTERMINATOR="perl $CMD/strip-terminators.pl"
ADDTOKNO="perl $CMD/addTokno.pl"
FORMAT4TURBO="perl $CMD/format4Turbo.pl"
RUNTURBOPARSER=$TURBODIR/scripts/run_parser.sh
TAGWITHPREDICATETAGS="perl $CMD/build-predicates.pl"

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
ARCHTURBOTAGGEDFILEPRE=$PREDICATESDIR/$ORIGHLBASENAME.pre
ARCHTURBOTAGGEDFILE=$PREDICATESDIR/$ORIGHLBASENAME.tagged
# to be digested by Hung indexing
ARCHPRED2HUNGSFILE=$PREDICATESDIR/$ORIGHLBASENAME.hung

scala -J-Xmx24g  -cp "/home/thierry/lib/*:../fix-errors" Main < $FAILURES > $INPUT4TT
if test "$?" != "0" ; then
    tostderr "FAIL TO CREATE FIXED FILE"  
    exit -1
fi

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

$TAGWITHPREDICATETAGS < $INPUT4TURBO.pred > $TURBOPARSEDTAGGEDFILE
# add tagging to the file before stripping
perl $CMD/addPredToTreeTagger.pl $TURBOPARSEDTAGGEDFILE $TELOMERESTRIPPED $CHUNKSTAGGED > $ARCHTURBOTAGGEDFILEPRE
perl patch.pl $ARCHTURBOTAGGEDFILEPRE $DATADIR/out/predicates/*.tagged > $ARCHTURBOTAGGEDFILE
tostderr "Tag 4 Hung"
$CMD/tags2Hung < $ARCHTURBOTAGGEDFILE > $ARCHPRED2HUNGSFILE
tostderr "Create xml resources for www"
perl $CMD/prepareHL4Server.pl < $ARCHTURBOTAGGEDFILE > $WWWRESDIR/$ORIGHLBASENAME.xml

echo 'truncate xml_hl;' | psql cgfallback
echo "\\copy xml_hl from $WWWRESDIR/$ORIGHLBASENAME.xml with csv delimiter E'\\t' quote E'\\b'" | psql cgfallback
#$NODECMD $CMS/updatedb-www-resources.js --db cgfallback --dir $WWWRESDIR
