import scala.language.postfixOps
import java.io.StringReader
import org.apache.lucene.analysis.tokenattributes.
  {CharTermAttribute}
import org.apache.lucene.analysis.standard.StandardAnalyzer

object show extends App {
  val data: Array[String] = Array("<HL>\n<NC>\nPositivity\tNN\tPositivity\t1\tsub\n</NC>\n<PC type=\"of\">\nof\tIN\tof\t2\tsub\n<NC>\nBorrelia\tNN\tOmniConceptID_268450971\t3\tsub\nburgdorferi\tNN\tburgdorferi\t4\tsub\ninfection\tNN\tOmniConceptID_192626149\t5\tsub\n</NC>\n</PC>\n<VC type=\"PASSIVE\">\nwas\tVBD\tbe\t6\tpred\nassessed\tVBN\tassess\t7\tpred\n</VC>\n<PC type=\"by\">\nby\tIN\tby\t8\tobj\n<NC>\na\tDT\ta\t9\tobj\nLyme\tNP\tLyme\t10\tobj\nELISPOT\tNP\tELISPOT\t11\tobj\nassay\tNN\tassay\t12\tobj\n</NC>\n</PC>\n.\tSENT\t.\t13\tobj\n</HL>\n<HL>\n<NC>\nAssessed\tVBN\tassess\t1\tunk\nlevels\tNNS\tlevel\t2\tunk\n</NC>\n<PC type=\"of\">\nof\tIN\tof\t3\tunk\n<NC>\nmitochondrial\tJJ\tmitochondrial\t4\tunk\nsuperoxide\tNN\tOmniConceptID_249564584\t5\tunk\nand\tCC\tand\t6\tunk\ncytosolic\tJJ\tcytosolic\t7\tunk\ncalcium\tNN\tOmniConceptID_253226691\t8\tunk\nin patient\tNN\tOmniConceptID_253233526\t9\tunk\nPBMCs\tNP\tPBMCs\t10\tunk\n</NC>\n</PC>\n.\tSENT\t.\t11\tunk\n</HL>\n<HL>\n<NC>\nLyme\tNP\tLyme\t1\tsub\nborreliosis\tNN\tborreliosis\t2\tsub\npatients\tNNS\tOmniConceptID_252912370\t3\tsub\n</NC>\n<VC>\nshowed\tVBD\tshow\t4\tpred\n</VC>\n<NC>\na\tDT\ta\t5\tobj\nmarked\tJJ\tmarked\t6\tobj\nincrease\tNN\tincrease\t7\tobj\n</NC>\n<PC type=\"in\">\nin\tIN\tin\t8\tobj\n<NC>\nmitochondrial\tJJ\tmitochondrial\t9\tobj\nsuperoxide\tNN\tOmniConceptID_249564584\t10\tobj\n</NC>\n</PC>\n.\tSENT\t.\t11\tobj\n</HL>\n<HL>\n<NC>\nLevels\tNNS\tlevel\t1\tsub\n</NC>\n<PC type=\"of\">\nof\tIN\tof\t2\tsub\n<NC>\ncytosolic\tJJ\tcytosolic\t3\tsub\ncalcium\tNN\tOmniConceptID_253226691\t4\tsub\n</NC>\n</PC>\n<VC type=\"BE\">\nwere\tVBD\tbe\t5\tpred\n</VC>\n<ADJC>\nsignificantly\tRB\tsignificantly\t6\tobj\nlower\tJJR\tlow\t7\tobj\n</ADJC>\n<PC type=\"in\">\nin\tIN\tin\t8\tpred\n<NC>\nLyme\tNP\tLyme\t9\tobj\nborreliosis\tNN\tborreliosis\t10\tobj\npatients\tNNS\tOmniConceptID_252912370\t11\tobj\n</NC>\n</PC>\n.\tSENT\t.\t12\tobj\n</HL>\n<HL>\n<VC type=\"GERUND\">\nSuggesting\tVBG\tsuggest\t1\tunk\n</VC>\n<NC>\nthat\tDT\tthat\t2\tunk\nLyme\tNP\tLyme\t3\tunk\nborreliosis\tNN\tborreliosis\t4\tunk\n</NC>\n<VC>\nmay\tMD\tmay\t5\tunk\n</VC>\n<NC>\nlead\tNN\tOmniConceptID_239419350\t6\tunk\n</NC>\n<PC type=\"to\">\nto\tTO\tto\t7\tunk\n<NC>\na\tDT\ta\t8\tunk\nstate\tNN\tstate\t9\tunk\n</NC>\n</PC>\n<PC type=\"of\">\nof\tIN\tof\t10\tunk\n<NC>\nmitochondrial\tJJ\tmitochondrial\t11\tunk\ndysfunction\tNN\tdysfunction\t12\tunk\n</NC>\n</PC>\n.\tSENT\t.\t13\tunk\n</HL>",
  "Positivity of Borrelia burgdorferi infection was assessed by a Lyme ELISPOT assay S0167527316348203")

  val hlAnalyzer = new HighlightAnalyzer
  val stdAnalyzer = new StandardAnalyzer
  val theAnalyzer = stdAnalyzer

  def displayTokens (text: String) {
    val stream = theAnalyzer.tokenStream ("hl", new StringReader (text))
    val termAttr = stream.addAttribute (classOf [CharTermAttribute])
    stream.reset ()
    while (stream incrementToken) {
      Console println termAttr.toString
    }
    stream.end ()
    stream.close ()
  }

  def analyze (text: String) {
    displayTokens (text)
  }

  analyze (data (1))
}
