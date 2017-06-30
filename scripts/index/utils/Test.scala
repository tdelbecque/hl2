package com.sodad.lucene.utils

import collection.JavaConverters._
//import scala.collection.convert.decorateAll._
import collection.mutable._
import org.apache.lucene.analysis.Analyzer
import org.apache.lucene.analysis.standard.StandardAnalyzer
import org.apache.lucene.analysis.miscellaneous.PerFieldAnalyzerWrapper

object Test extends App {
  val m : Map [String, Analyzer] = Map ("hl" -> new MyAnalyzer)
  val textToIndex = Samples.parser

  //val analyzer = new StandardAnalyzer
  //val analyzer = new MyAnalyzer
  val analyzer = new PerFieldAnalyzerWrapper (new StandardAnalyzer, m.asJava)
  DisplayTokens (analyzer, textToIndex)

}
