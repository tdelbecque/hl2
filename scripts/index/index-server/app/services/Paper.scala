package services

import java.sql.Connection
import java.sql.DriverManager
import java.sql.Statement
import java.sql.ResultSet

import scala.io.Source
import scala.util.matching.Regex

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
  Class.forName ("org.postgresql.Driver")

  val con: Connection = DriverManager getConnection ("jdbc:postgresql://localhost/cg", "cg", "cg")

  def apply (pii: String) : Option[P] = {
    val stmt: Statement = con createStatement
    var rs = stmt.executeQuery ("select hl from xml_hl where pii = '" + pii + "'")
    if (! rs.next ()) return None
    val hl = rs.getString ("hl")
    rs.close ()
    rs = stmt executeQuery ("select a.issn, a.title, a.authors, a.abstract, a.volume, a.pages, a.pubtime, coalesce (b.journal_title, '') journal from articles a left outer join journals_title b on a.issn = b.issn  where pii = '" + pii + "'")
    if (! rs.next ()) return None
    val title = rs.getString("title")
    val journal = rs.getString("journal")
    val pubtime = rs.getString("pubtime")
    val volume = rs.getString("volume")
    val pages = rs.getString("pages")
    val abstract_ = rs.getString("abstract")
    rs.close ()

    Some (P (pii, title, journal, abstract_, volume, pubtime, pages, hl))
  }

  def getAnalysis (pii: String) = {
    val stmt: Statement = con createStatement
    val rs = stmt.executeQuery (s"select data from parsing where pii = '${pii}'")
    var result = ""
    if (rs.next ()) {
      result = rs.getString ("data")
    }
    rs.close ()
    result
  }

  def getAbstract (pii: String) = {
    val stmt: Statement = con createStatement
    val rs = stmt.executeQuery (s"select abstract from articles where pii = '${pii}'")
    var result = ""
    if (rs.next ()) {
      result = rs.getString ("abstract")
    }
    rs.close ()
    result
  }

  def getHung (pii: String) : String = {
    val stmt: Statement = con createStatement
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
