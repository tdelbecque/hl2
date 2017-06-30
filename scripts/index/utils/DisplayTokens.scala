package com.sodad.lucene.utils

import scala.language.postfixOps
import java.io.{StringReader}

import org.apache.lucene.analysis.{Analyzer, TokenStream}
import org.apache.lucene.analysis.tokenattributes.
  {CharTermAttribute, OffsetAttribute, PositionIncrementAttribute}

object DisplayTokens {
  def displayTokens (stream: TokenStream) {
    val term: CharTermAttribute = stream addAttribute classOf[CharTermAttribute]
    val offset: OffsetAttribute = stream addAttribute classOf [OffsetAttribute]
    val pos : PositionIncrementAttribute = stream addAttribute classOf [PositionIncrementAttribute]
    stream.reset
    while (stream incrementToken)
      Console println s"$term\t/${offset.startOffset} -> ${offset.endOffset}\t/\t${pos.getPositionIncrement}"
    stream.end
    stream.close
  }

  def apply (analyzer: Analyzer, text: String) {
    displayTokens (analyzer.tokenStream ("content", new StringReader(text)))
    Console println "\n"
    displayTokens (analyzer.tokenStream ("hl", new StringReader(text)))
  }
}
