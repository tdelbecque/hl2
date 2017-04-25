CP=.:/home/thierry/lucene/lucene-6.3.0/core/*:/home/thierry/lucene/lucene-6.3.0/queryparser/*:/home/thierry/lib/*

index.class: index.scala
	scalac -classpath ${CP} index.scala

run: index.class
	scala -J-Xmx10g -classpath ${CP} index /home/thierry/tmp/index
