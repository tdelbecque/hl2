LIBDIR=/home/thierry/lucene/lucene-6.3.0
CP=.:${LIBDIR}/core/*:${LIBDIR}/queryparser/*:${LIBDIR}/analysis/common/*:/home/thierry/lib/*

index.class: index.scala HighlightTokenizer.class HighlightTokenStreamFilter.class HighlightAnalyzer.class
	scalac -classpath ${CP} $<

HighlightTokenizer.class: HighlightTokenizer.scala
	scalac -classpath ${CP} $<

HighlightTokenStreamFilter.class: HighlightTokenStreamFilter.scala
	scalac -classpath ${CP} $<

HighlightAnalyzer.class: HighlightAnalyzer.scala HighlightTokenStreamFilter.class
	scalac -classpath ${CP} $<

run: build
	scala -J-Xmx24g -classpath ${CP} index /home/thierry/tmp/index

build: index.class show.class reader.class

show.class: show.scala index.class
	scalac -classpath ${CP} $<

reader.class: reader.scala
	scalac -classpath ${CP} $<

runshow: build
	scala -J-Xmx24g -classpath ${CP} show

runreader: build
	scala -J-Xmx24g -classpath ${CP} reader
