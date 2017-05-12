package services

import java.nio.file.{Path, FileSystems}
import org.apache.lucene.analysis.Analyzer
import org.apache.lucene.analysis.standard.StandardAnalyzer
import org.apache.lucene.index._
import org.apache.lucene.store.{Directory, FSDirectory}
import org.apache.lucene.search.{Query, TermQuery, IndexSearcher, ScoreDoc}
import org.apache.lucene.queryparser.classic.QueryParser
import org.apache.lucene.analysis.Analyzer
import org.apache.lucene.document.Document
import org.apache.lucene.search.Explanation
import services.{P, Paper, PaperLookup}

object QueryHandlerHTML {
  /*
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
<script src="resources/js/utils.js"> </script>
</head>"""
   */
  val indexDir = "/home/thierry/tmp/index"

  def getDirectory (path: String) : Directory =
    FSDirectory open FileSystems.getDefault.getPath(path)
  val dr = DirectoryReader open getDirectory (indexDir)

  /*
  def getPaperElement (dd: Document, searcher: IndexSearcher, query: Query, docId: Int) = {
    val d: Document = searcher.doc (docId)
    val pii = d get "pii"
    val explanationDivId = s"sodad-explain-id-$pii"
    val maybePaper = PaperLookup (pii)
    "<div class=\"sodad-list-paper\">\n" +
    s"<div class=${q}sodad-list-paper-pii$q>$pii\n" +
     (if (maybePaper.isDefined) {
       val p = maybePaper.get
       val titleClean = "\"".r.replaceAllIn (p.title, "")
       /*
        Explanation of the weights
        */
       val explanation : Explanation = searcher.explain(query, docId)
       s"<span class=${q}sodad-tooltip-class$q onclick=${q}flipVisibilityForId('$explanationDivId')$q style=${q}cursor: pointer;$q>" +
       s"Explain<span class=${q}sodad-tooltiptext-class$q>Shows/Hides weighting scheme for this result item</span></span>\n" +
       "</div>\n" +
       s"<div class=${q}sodad-explanation-class$q id=${q}$explanationDivId$q style=${q}height: 0px; visibility: hidden;$q data-visible=${q}0$q>" +
       explanation.toHtml() +
       "</div>\n" +
       s"<div class=${q}sodad-list-paper-title$q>\n" +
       s"<a href=$q/paper?pii=$pii$q target=${q}_blank$q>$titleClean</a>\n" +
       "</div>\n" +
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
   */

  def apply (title: String, n: Int) = {
    try {
      val searcher = new IndexSearcher (dr)
      val parser = new QueryParser ("title", new StandardAnalyzer)
      val query = parser parse title
      val docs = searcher search (query, n)
/*
      docs.scoreDocs.foldLeft (s"<html>\n${getHeader}\n<body><div class=${q}sodad-list$q>\n")(
        (acc, x) => acc + getPaperElement (searcher.doc (x.doc), searcher, query, x.doc)) + 
      s"</body></html>\n"
 */
      views.html.resultlist (title, "", docs, searcher, query)
    }
    finally {
    }
  }

  def escapeQuery (s : String) : String = {
    var x = """\\""".r.replaceAllIn (s, "\\\\")
    x = "\\+".r.replaceAllIn (x, "\\\\+")
    x = "-".r.replaceAllIn (x, "\\\\-")
    x = "!".r.replaceAllIn (x, "\\\\!")
    x = "\\(".r.replaceAllIn (x, "\\\\(")
    x = "\\)".r.replaceAllIn (x, "\\\\)")
    x = ":".r.replaceAllIn (x, "\\\\:")
    x = "\\^".r.replaceAllIn (x, "\\\\^")
    x = "\\[".r.replaceAllIn (x, "\\\\[")
    x = "]".r.replaceAllIn (x, "\\\\]")
    x = "\\{".r.replaceAllIn (x, "\\\\{")
    x = "}".r.replaceAllIn (x, "\\\\}")
    x = "~".r.replaceAllIn (x, "\\\\~")
    x = "\\*".r.replaceAllIn (x, "\\\\*")
    x = "\\?".r.replaceAllIn (x, "\\\\?")
    x
  }
/*
  def buildSpecifDiv (title: String, hl: String) : String = {
    "<div class=\"sodad-specif-div-class\">\n" + (
      if (title != "")
        s"<span class=${q}sodad-specif-lbl-class$q>Search on title:</span><span class=${q}sodad-specif-value-class$q>$title</span>" +
        (if (hl != "") "<br/>\n" else "")
      else "") + (
      if (hl != "")
        s"<span class=${q}sodad-specif-lbl-class$q>Search on highlights:</span><span class=${q}sodad-specif-value-class$q>$hl</span>"
      else "") +
    "</div>\n"
  }

  def applyLong (title: String, hl: String, n: Int) = {
    try {
      val searcher = new IndexSearcher (dr)
      val parser = new QueryParser ("title", new StandardAnalyzer)
      var fullQuery : String = ""
      if (title != "") fullQuery = s"(${escapeQuery (title)})"
      if (hl != "") fullQuery = s"$fullQuery hl:(${escapeQuery (hl)})"
      Console println fullQuery
      val query = parser parse fullQuery
      val docs = searcher search (query, n)
      docs.scoreDocs.foldLeft (s"<!DOCTYPE html>\n<html>\n${getHeader}\n<body>${buildSpecifDiv(title, hl)}<div class=${q}sodad-list$q>\n")(
        (acc, x) => acc + getPaperElement (searcher.doc (x.doc), searcher, query, x.doc)) + 
      s"</body></html>\n"
    }
    finally {
    }
  }
 */
  def applyLong (
    title: String, hl: String,
    titleWeight: Double, hlWeight: Double,
    n: Int) = {
    try {
      val searcher = new IndexSearcher (dr)
      val parser = new QueryParser ("title", new StandardAnalyzer)
      var fullQuery : String = ""
      if (title != "") fullQuery = s"(${escapeQuery (title)})^${titleWeight.toString}"
      if (hl != "") fullQuery = s"$fullQuery hl:(${escapeQuery (hl)})^${hlWeight.toString}"

      val query = parser parse fullQuery
      val docs = searcher search (query, n)
      views.html.resultlist (title, hl, docs, searcher, query)
    }
    finally {
    }
  }
}
