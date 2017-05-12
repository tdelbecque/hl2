package services

import java.sql.Connection
import java.sql.DriverManager
import java.sql.Statement
import java.sql.ResultSet

import scala.io.Source
import scala.util.matching.Regex

object Paper {
  /*
  val paperTemplateFile = System.getenv("HLWORKDIR") + "/scripts/server/resources/page.html"

  val paperTemplate = Source.
    fromFile (paperTemplateFile).
    getLines.
    mkString

  def get (pii: String): Option[String] = {
    PaperLookup (pii).map (x => {
      var page = "__TITLE__".r.replaceAllIn (paperTemplate, x.title)
      page = "__ABSTRACT__".r.replaceAllIn (page, x.abstr)
      page = "__JOURNAL__".r.replaceAllIn (page, x.journal)
      page = "__VOLUME__".r.replaceAllIn (page, x.volume)
      page = "__PAGES__".r.replaceAllIn (page, x.pages)
      page = "__PUBTIME__".r.replaceAllIn (page, x.pubtime)
      page = "__HIGHLIGHTS__".r.replaceAllIn (page, x.hl)
      return Some (page)
    })
  }
}
 */

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
}
