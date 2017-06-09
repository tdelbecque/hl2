import scala.language.postfixOps

import java.sql.{Connection, DriverManager, Statement, ResultSet}

import scala.io.Source
import scala.collection.mutable.{Set, HashSet, HashMap, ArrayBuffer, Queue}

object Main extends App {
  val posMappingHave = Map (
    "VB" -> "VH", "VBP" -> "VHP", "VBZ" -> "VHZ", "VBD" -> "VHD", "VBN" -> "VHN", "VBG" -> "VHG")
  val PosMappingGen = Map (
    "VB" -> "VV", "VBP" -> "VVP", "VBZ" -> "VVZ", "VBD" -> "VVD", "VBN" -> "VVN", "VBG" -> "VVG")

  def posMap (lemma: String, pos: String) = lemma match {
    case "be" => pos
    case "have" => posMappingHave.getOrElse (pos, pos)
    case _ => 
      if (lemma != "be" && lemma != "have") pos
      else PosMappingGen.getOrElse (pos, pos)
  }

  val verbs = new HashSet[String]
  val scores = new HashMap[String, Array[(String, Float)]]

  def loadVerbs (con: Connection) = {
    val stmt = con createStatement
    val rs = stmt.executeQuery ("select token from verbs_curated")
    while (rs.next ()) {
      verbs += rs.getString ("token")
    }
    rs.close ()
  }

  def scoreKey (token: String, statbef: String, stataft: String) =
    s"${token},${statbef},${stataft}"

  def loadScores (con: Connection) = {
    val stmt = con createStatement
    val rs = stmt.executeQuery ("select * from F5 order by token, statbef, stataft, score desc")
    var lastKey = ""
    val scoreSet = new ArrayBuffer[(String, Float)]()
    while (rs.next ()) {
      var key = scoreKey (rs.getString("token"), rs.getString("statbef"), rs.getString("stataft"))
      if (lastKey != key) {
        if (lastKey != "") scores += ((lastKey, scoreSet toArray))
        lastKey = key
        scoreSet clear
      }
      scoreSet += ((rs.getString ("pos"), rs.getFloat ("score")))
    }
    scores += ((lastKey, scoreSet toArray))
    rs.close ()
  }

  def getScores (token: String, statbef: String, stataft: String) =
    scores.get (scoreKey (token, statbef, stataft))

  def loadResources = {
    Class.forName ("org.postgresql.Driver")

    val con = DriverManager getConnection ("jdbc:postgresql://localhost/cganalysis", "cg", "cg")

    loadVerbs (con)
    loadScores (con)
    con.close ()
  }

  def output (s: String) = Console println s

  val Q = new Queue[String]
  var posHasChanged = false
  var hlWritten = false

  var currentPii = ""
  var currentHlno = ""

  def closehl {
    if (posHasChanged) {
      if (! hlWritten) {
        output (s"""<PAPER PII="${currentPii}">""")
        hlWritten = true
      }
      //output (s"""<HL rank="${currentHlno}">""")
      output ("<HL>")
      for (p <- Q) {output (p)}
      output ("</HL>")
      posHasChanged = false
    }
    Q clear
  }

  def closePaper {
    closehl
    if (hlWritten) {
      output ("</PAPER>")
      hlWritten = false
    }
  }

  def main {
    loadResources

    for (l <- Source.stdin.getLines) {
      val xs = l.split ("\t")

      val pii = xs(0)
      val hlno = xs(1)
      val statbef = xs(3)
      val stataft = xs(4)
      val pos = xs(5)
      val token = xs(6)
      val lemma = xs (7)

      if (pii != currentPii) {
        if (currentHlno != "") closePaper
        currentHlno = ""
        currentPii = pii
      }
      if (currentHlno != hlno) {
        if (currentHlno != "") closehl
        currentHlno = hlno
      }
      if (lemma startsWith "OmniConcept") {
        if (verbs contains token) {
          val bestPos =
            getScores (token, statbef, stataft) match {
              case Some (scores) => {
                val (bestPos, _) = scores (0)
                bestPos
              }
              case _ => pos
            }
          if (bestPos startsWith "V") {
            Q += s"${token}\t${posMap(lemma, bestPos)}"
            posHasChanged = true
          }
          else Q += s"${token} ${lemma}\t${pos}"
        }
        else Q += s"${token} ${lemma}\t${pos}"
      } else
        if (verbs contains token) {
          val bestPos =
            getScores (token, statbef, stataft) match {
              case Some (scores) => {
                val (bestPos, _) = scores (0)
                bestPos
              }
              case _ => pos
            }
          if (pos != bestPos) posHasChanged = true
          Q += s"${token}\t${posMap(lemma, bestPos)}"
        }
        else
          Q += s"${token}\t${posMap(lemma, pos)}"
    }
    if (currentHlno != "") closePaper
  }

  main
}
