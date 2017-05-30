import java.nio.file.{Path, FileSystems}
import org.apache.lucene.store.{Directory, FSDirectory}
import org.apache.lucene.index._
import org.apache.lucene.search.{Query, TermQuery, IndexSearcher, ScoreDoc}

object reader extends App {
  val indexDir = "/home/thierry/tmp/index"

  def getDirectory (path: String) : Directory =
    FSDirectory open FileSystems.getDefault.getPath(path)
  val dr = DirectoryReader open getDirectory (indexDir)

  val searcher = new IndexSearcher (dr)
  val t = new Term ("pii", "S0167527316348203")
  val q = new TermQuery (t)
  val id = searcher.search (q, 1).scoreDocs (0).doc

  val v = dr.getTermVector (id, "hl")
  val it = v.iterator
  while (it.next () != null) {
    Console println (it.term ()).utf8ToString
  }
}
