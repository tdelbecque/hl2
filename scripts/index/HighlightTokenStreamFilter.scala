//package com.sodad.lucene.utils

import scala.language.postfixOps
import scala.util.matching.Regex
import org.apache.lucene.analysis.
  {TokenFilter, TokenStream}
import org.apache.lucene.analysis.tokenattributes.
  {CharTermAttribute, OffsetAttribute, PositionIncrementAttribute}

class HighlightTokenStreamFilter (in: TokenStream) extends TokenFilter (in) {

  private val posIncrAtt : PositionIncrementAttribute =
    addAttribute (classOf[PositionIncrementAttribute])
  private val termAttr : CharTermAttribute =
    addAttribute (classOf [CharTermAttribute])

  var positionIncrementExtra = 0
  var positionIncrementSetHuge = false
  val hugePositionIncrement = 1000

  override def incrementToken : Boolean = {
    while (in incrementToken) {
      if (positionIncrementSetHuge)
        posIncrAtt.setPositionIncrement (hugePositionIncrement)
      val x = termAttr.toString ()
      if (! ((x startsWith "<") && (x endsWith ">"))) {
        val fields = x.split ("\t")
        termAttr.setEmpty ()
        termAttr.append (fields (0))
        positionIncrementSetHuge = false
        return true
      } else {
        if (x == "<HL>") {
          positionIncrementSetHuge = true
        }

      }
    }
    false
  }
}
