package services

import java.nio.file.{Path, FileSystems}
import org.apache.lucene.analysis.Analyzer
import org.apache.lucene.analysis.standard.StandardAnalyzer
import org.apache.lucene.index._
import org.apache.lucene.store.{Directory, FSDirectory}
import org.apache.lucene.search.{TermQuery, IndexSearcher, ScoreDoc}
import org.apache.lucene.queryparser.classic.QueryParser
import org.apache.lucene.analysis.Analyzer
import org.apache.lucene.document.Document

import services.{P, Paper, PaperLookup}

object QueryHandlerHTML {
  val q = '"'
  val header = """
<head>
<meta http-equiv="content-type" content="text/html; charset=UTF-8">
<link rel="stylesheet" title="Default Styles" href="resources/page_files/style.css" type="text/css">
<meta charset="utf-8">

<link type="text/css" rel="StyleSheet" href="resources/page_files/gadgets_extgadgetstoolbarSDArticleGadgetOverRidejquery-ui-1.css">
<link rel="stylesheet" href="resources/page_files/article_1704R1.css" type="text/css">
<link rel="stylesheet" href="resources/page_files/articleSprite_1704R1.css" type="text/css">
<link rel="stylesheet" href="resources/page_files/jquery-ui_1704R1.css" type="text/css">
<link rel="stylesheet" href="resources/styles/cg.css" type="text/css">
</head>"""

  val indexDir = "/home/thierry/tmp/index"

  def getDirectory (path: String) : Directory =
    FSDirectory open FileSystems.getDefault.getPath(path)

  def getPaperElement (d: Document) = {
    val pii = d get "pii"
    val maybePaper = PaperLookup (pii)
    "<div class=\"sodad-list-paper\">\n" + 
    s"<div class=${q}sodad-list-paper-pii$q>$pii</div>\n" +
     (if (maybePaper.isDefined) {
       val p = maybePaper.get
       val titleClean = "\"".r.replaceAllIn (p.title, "")
       s"<div class=${q}sodad-list-paper-title$q><a href=$q/paper?pii=$pii$q target=${q}_blank$q>$titleClean</a></div>\n" +
       s"<div class=${q}sodad-list-paper-journal$q>${p.journal}</div>\n" +
       s"<div class=${q}sodad-list-paper-hls$q>${p.hl}</div>\n" +
       s"<div class=${q}sodad-list-submit-div$q>\n<form action=${q}/query$q>\n" +
       s"<input id=${q}hidden_${pii}$q name=${q}papertitle$q type=${q}hidden$q value=${q}$titleClean$q/>"+
       "<input type=\"submit\" value=\"Submit\"/>\n" +
       "</form></div>\n"
     } else  "") +  
    "</div>\n"
  }

  def getHeader = header

/*
  def getEndScript (papers: Array[Option[P]]) : String = {
    papers.foldLeft ("<script>\n") (
      (acc, p) => p match {
        case None => acc
        case Some(p) => {
          acc +
          s"(function () {var e = document.getElementById(${q}hidden_${p.pii}$q)
        }
      }
    ) + "</script>\n"
  }
 */

  def apply (q: String, n: Int) : String = {
    val dr = DirectoryReader open getDirectory (indexDir)
    try {
      val searcher = new IndexSearcher (dr)
      val parser = new QueryParser ("title", new StandardAnalyzer)
      val query = parser parse q
      val docs = searcher search (query, n)
      /*
      val papers : Array[Option[P]] = docs.scoreDocs.map (x => {
        val d = searcher.doc (x.doc)
        val pii = d get "pii"
        PaperLookup (pii)
      })
       */
      docs.scoreDocs.foldLeft (s"<html>\n${getHeader}\n<body><div class=${q}sodad-list$q>\n")(
        (acc, x) => acc + getPaperElement (searcher.doc (x.doc))) + 
      s"</body></html>\n"
    }
    finally {
      dr.close ()
    }
  }
}
