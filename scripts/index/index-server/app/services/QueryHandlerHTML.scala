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
  val indexDir = "/home/thierry/tmp/index"

  def getDirectory (path: String) : Directory =
    FSDirectory open FileSystems.getDefault.getPath(path)
  val dr = DirectoryReader open getDirectory (indexDir)

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
      views.html.resultlist (title, 1, "", 1, docs, searcher, query)
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
    x = "/".r.replaceAllIn (x, "\\\\/")
    x
  }

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
      views.html.resultlist (title, titleWeight, hl, hlWeight, docs, searcher, query)
    }
    finally {
      //case e: Exception => {"Failure due to the query"}
    }
  }

  def search (q: String, n: Int) = {
    try {
      val searcher = new IndexSearcher (dr)
      val parser = new QueryParser ("title", new StandardAnalyzer)
      val query = parser parse q
      val docs = searcher search (query, n)
      views.html.resultlist (q, 1, "", 0, docs, searcher, query)
    }
    catch {
      case e: Exception => {views.html.error ("Failure due to the query")}
    }    
  }

  def termsVector (pii: String) : String = {
    val searcher = new IndexSearcher (dr)
    val q = new TermQuery (new Term ("pii", pii))
    val docs = searcher.search (q, 1)
    if (docs.totalHits != 1) return ""
    val id = docs.scoreDocs (0).doc
    val titleTermsVector = dr.getTermVector (id, "title")
    val hlTermsVector = dr.getTermVector (id, "hl")
    return views.html.termsVector (titleTermsVector, hlTermsVector).body
  }
}
