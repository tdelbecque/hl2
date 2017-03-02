#!/bin/sh

DIR=/home/thierry/HL/scripts/network
cd $DIR
TIMESTAMP=`date +'%s'`
UNKNOWN=UNKNOWN/$TIMESTAMP

node runGetPiis.js 2>LOGS/getpiis.$TIMESTAMP
node getUnknownPiis.js HL PIIS/ > $UNKNOWN
node runGetHLPar.js $UNKNOWN > HL/HL.$TIMESTAMP 2> LOGS/log.$TIMESTAMP
