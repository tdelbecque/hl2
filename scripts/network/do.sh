#!/bin/sh

WORKDIR=/home/thierry/HL
DIR=$WORKDIR/scripts/network
DATADIR=$WORKDIR/data
HLDIR=$DATADIR/in/HL
PARSERDIR=$DATADIR/out/parser
LOGDIR=$DIR/LOGS

cd $DIR
TIMESTAMP=`date +'%s'`
UNKNOWN=UNKNOWN/$TIMESTAMP
NODE=/usr/local/n/versions/node/7.6.0/bin/node

grep reques LOGS/* | perl -ne '/(S(?:X|\d){16})\s/ and print "$1\n"' | sort -u > $HLDIR/pbaccess
$NODE runGetPiis.js 2>LOGS/getpiis.$TIMESTAMP
$NODE getUnknownPiis.js $HLDIR PIIS/ > $UNKNOWN
$NODE runGetHLPar.js $UNKNOWN > $HLDIR/HL.$TIMESTAMP 2> $LOGDIR/log.$TIMESTAMP

cd ..
./extractNewHL $HLDIR $PARSERDIR > $DATADIR/out/PENDING.$TIMESTAMP 2>$LOGDIR/make.$TIMESTAMP
sh make.sh $DATADIR/out/PENDING.$TIMESTAMP 2>>$LOGDIR/make.$TIMESTAMP
