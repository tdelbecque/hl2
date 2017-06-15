//package com.sodad.lucene.utils

import org.apache.lucene.analysis.{Analyzer, LowerCaseFilter}
import org.apache.lucene.analysis.Analyzer._

class HighlightAnalyzer extends Analyzer {
  @Override
  protected def createComponents(fieldName: String) : TokenStreamComponents = {
    val t = new HighlightTokenizer

    new TokenStreamComponents(
      t,
      new LowerCaseFilter (
        new HighlightTokenStreamFilter (
          new PartOfSpeechTokenStreamFilter (t))))

  }
}

object HighlightAnalyzer {
  def apply = new HighlightAnalyzer
}
