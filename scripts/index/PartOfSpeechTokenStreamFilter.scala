import org.apache.lucene.analysis.FilteringTokenFilter
import org.apache.lucene.analysis.tokenattributes.CharTermAttribute
import org.apache.lucene.analysis.TokenStream

class PartOfSpeechTokenStreamFilter (in: TokenStream) extends FilteringTokenFilter (in) {
  private val posToKeep = Array ("SYM", "FW", "JJ", "JJR", "JJS", "NN", "NNS", "NP", "NPS", "RB", "RBS", "RBR")
  private val posvb = Array ("VB", "VBD", "VBG", "VBN", "VBP", "VBZ")
  private val auxvb = Array ("be", "have", "can", "do")

  private val termAttr = addAttribute (classOf[CharTermAttribute])
  protected def accept = {
    val xs = termAttr.toString ().split ("\t")
      (xs.length < 5) || posToKeep.contains (xs (1)) ||
    ( posvb.contains (xs (1)) && ! auxvb.contains (xs (2)) )
  }
}
