package com.sodad.lucene.utils

import org.apache.lucene.analysis.{Tokenizer}
import org.apache.lucene.analysis.util.CharTokenizer

class MyTokenizer extends CharTokenizer {
  @Override
  protected def isTokenChar(c: Int) = c != '\n';
}
