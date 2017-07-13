package services

import scala.language.postfixOps

import java.sql.{Connection, Statement, ResultSet}
import scala.io.Source
import scala.util.matching.Regex
import scala.collection.mutable.ArrayBuffer
import utils.{Config, Regular, Patch}

object Paper {
  def getHung (pii: String) : String = PaperLookup.getHung (pii)

  def get (
    pii: String,
    searchOnTitle: Boolean, searchOnHL: Boolean,
    titleWeight: Double, hlWeight: Double
  ) = {
    PaperLookup (pii).map (x => {
      var page = views.html.paperpage (x.title, x.abstr, x.journal,
        x.volume, x.pages, x.pubtime, x.hl,
        searchOnTitle, searchOnHL, titleWeight, hlWeight
      )
      page
    })
  }
}


case class P (
  pii: String,
  title: String,
  journal: String,
  abstr: String,
  volume: String,
  pubtime: String,
  pages: String,
  hl: String)

object PaperLookup {
  def getSomeHL (pii: String, con: Connection) : Option[String] = {
    val stmt: Statement = con createStatement
    var rs = stmt.executeQuery ("select hl from xml_hl where pii = '" + pii + "'")
    val ret = if (rs.next ()) Some (rs.getString ("hl")) else None
    rs.close ()
    ret
  }

  def getSomeResultSet (pii: String) : Option[P] = {
    val hl = getSomeHL (pii, Patch.con) orElse getSomeHL (pii, Regular.con)
    val stmt: Statement = Regular.con createStatement
    val rs = stmt executeQuery ("select a.issn, a.title, a.authors, a.abstract, a.volume, a.pages, a.pubtime, coalesce (b.journal_title, '') journal from articles a left outer join journals_title b on a.issn = b.issn  where pii = '" + pii + "'")
    if (! rs.next ()) return None
    val title = rs.getString("title")
    val journal = rs.getString("journal")
    val pubtime = rs.getString("pubtime")
    val volume = rs.getString("volume")
    val pages = rs.getString("pages")
    val abstract_ = rs.getString("abstract")
    rs.close ()

    Some (P (pii, title, journal, abstract_, volume, pubtime, pages, hl get))
  }

  def apply (pii: String) = getSomeResultSet (pii)
  
  def getAnalysis (pii: String) = {
    val stmt: Statement = Regular.con createStatement
    val rs = stmt.executeQuery (s"select data from parsing where pii = '${pii}'")
    var result = ""
    if (rs.next ()) {
      result = rs.getString ("data")
    }
    rs.close ()
    result
  }

  def getAbstract (pii: String) = {
    val stmt: Statement = Regular.con createStatement
    val rs = stmt.executeQuery (s"select abstract from articles where pii = '${pii}'")
    var result = ""
    if (rs.next ()) {
      result = rs.getString ("abstract")
    }
    rs.close ()
    result
  }

  def getSemMed (pii: String) : Traversable[SemMedPredication] = {
    val stmt: Statement = Regular.con createStatement

    val rs = stmt.executeQuery (s"select A.PREDICATION_ID, A.SUBJECT_NAME, A.OBJECT_NAME, A.PREDICATE, B.SENTENCE from predications A JOIN sentences B on A.sentence_id = B.sentence_id where A.pii = '${pii}'")
    val xs = new ArrayBuffer[SemMedPredication]
    while (rs.next ()) {
      val subject: String = rs.getString ("subject_name")
      val _object: String = rs.getString ("object_name")
      val predicate: String = rs.getString ("predicate")
      val sentence: String = rs.getString ("sentence")
      val predicationId: Int = rs.getInt ("predication_id")
      xs += SemMedPredication (predicationId, subject, _object, predicate, sentence)
    }
    rs.close ()
    xs
  }

  def getHung (pii: String) : String = {
    val stmt: Statement = Regular.con createStatement
    val rs = stmt.executeQuery (s"select * from hung_predicates where pii = '${pii}' order by hlno")
    var result: String = ""
    while (rs.next ()) {
      val hlno = rs.getString ("hlno")
      val p = rs.getString ("predicates")
      result = result + s"${pii}\t${hlno}\t${p}\n"
    }
    rs.close ()
    result
  }
}
