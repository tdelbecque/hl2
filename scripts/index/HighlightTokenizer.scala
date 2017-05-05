//package com.sodad.lucene.utils

import org.apache.lucene.analysis.{Tokenizer}
import org.apache.lucene.analysis.util.CharTokenizer

class HighlightTokenizer extends CharTokenizer {
  override protected def isTokenChar(c: Int) = c != '\n';
}
