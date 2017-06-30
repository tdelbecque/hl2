LIBDIR=/home/thierry/lucene/lucene-6.3.0
CP=.:${LIBDIR}/core/*:${LIBDIR}/queryparser/*:${LIBDIR}/analysis/common/*:/home/thierry/lib/*

BUILDDIR=com/sodad/lucene/utils

${BUILDDIR}/DisplayTokens.class: DisplayTokens.scala
	scalac -classpath ${CP} $<

${BUILDDIR}/Test.class: Test.scala ${BUILDDIR}/MyTokenizer.class
	scalac -classpath ${CP} $<

${BUILDDIR}/MyTokenizer.class: MyTokenizer.scala
	scalac -classpath ${CP} $<

${BUILDDIR}/MyAnalyzer.class: MyAnalyzer.scala
	scalac -classpath ${CP} $<

${BUILDDIR}/Samples.class: Samples.scala
	scalac -classpath ${CP} $<

${BUILDDIR}/MyTokenStreamFilter.class: MyTokenStreamFilter.scala
	scalac -classpath ${CP} $<

build: ${BUILDDIR}/Samples.class ${BUILDDIR}/DisplayTokens.class ${BUILDDIR}/Test.class ${BUILDDIR}/MyTokenizer.class ${BUILDDIR}/MyAnalyzer.class ${BUILDDIR}/MyTokenStreamFilter.class

run: build
	scala -J-Xmx10g -classpath ${CP} com.sodad.lucene.utils.Test
