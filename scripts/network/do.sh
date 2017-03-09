#!/bin/sh

WORKDIR=/home/thierry/HL
DIR=$WORKDIR/scripts/network
HLDIR=$WORKDIR/data/in/HL

cd $DIR
TIMESTAMP=`date +'%s'`
UNKNOWN=UNKNOWN/$TIMESTAMP
NODE=/usr/local/n/versions/node/7.6.0/bin/node

grep reques LOGS/* | perl -ne '/(S(?:X|\d){16})\s/ and print "$1\n"' | sort -u > $HLDIR/pbaccess
$NODE runGetPiis.js 2>LOGS/getpiis.$TIMESTAMP
$NODE getUnknownPiis.js $HLDIR PIIS/ > $UNKNOWN
$NODE runGetHLPar.js $UNKNOWN > $HLDIR/HL.$TIMESTAMP 2> LOGS/log.$TIMESTAMP
