package com.sodad.lucene.utils

import org.apache.lucene.analysis.Analyzer
import org.apache.lucene.analysis.Analyzer._

class MyAnalyzer extends Analyzer {
  @Override
  protected def createComponents(fieldName: String) : TokenStreamComponents = {
    val t = new MyTokenizer
    new TokenStreamComponents(t, new MyTokenStreamFilter (t))
  }
}
