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

import services.Paper

object QueryHandler {
  val indexDir = "/home/thierry/tmp/index"

  def getDirectory (path: String) : Directory =
    FSDirectory open FileSystems.getDefault.getPath(path)

  def getPaperElement (d: Document) = {
    val pii = d get "pii"
    val maybePaper = PaperLookup (pii)
    <paper>
    <pii>{pii}</pii>
    {
      if (maybePaper.isDefined) {
        val p = maybePaper.get
        <title>{p.title}</title>
      }
    }
    </paper>
  }

  def apply (q: String, n: Int) = {
    val dr = DirectoryReader open getDirectory (indexDir)
    try {
      val searcher = new IndexSearcher (dr)
      val parser = new QueryParser ("title", new StandardAnalyzer)
      val query = parser parse q
      val docs = searcher search (query, n)
      Console println "Query : " + q
      Console println "Found " + docs.totalHits + " for parsed query"
      <papers>{
        docs.scoreDocs.
          map (x => getPaperElement (searcher.doc (x.doc)))
/*
        docs.scoreDocs.
          map (_.doc).
          map (x => <paper>{(searcher doc x) get "pii"}</paper>)
 */
     }</papers>
    }
    finally {
      dr.close ()
    }
  }
}
