import scala.language.postfixOps

import collection.JavaConverters._

import java.sql.Connection
import java.sql.DriverManager
import java.sql.Statement
import java.sql.ResultSet

import java.io.{File, FileReader}
import java.nio.file.{Path, FileSystems}

import org.apache.lucene.analysis.Analyzer
import org.apache.lucene.analysis.tokenattributes.
  {CharTermAttribute, OffsetAttribute, PositionIncrementAttribute}
import org.apache.lucene.analysis.standard.StandardAnalyzer
import org.apache.lucene.index._
import org.apache.lucene.store.{Directory, FSDirectory}
import org.apache.lucene.document.{Document, Field, FieldType}
import org.apache.lucene.util.Attribute
import org.apache.lucene.search.{TermQuery, IndexSearcher}
import org.apache.lucene.queryparser.classic.QueryParser
import org.apache.lucene.analysis.miscellaneous.PerFieldAnalyzerWrapper

import scala.util.matching.Regex
import scala.collection.mutable.{ListBuffer, Map}

object index extends App {
  Class.forName ("org.postgresql.Driver")
  val c: Connection = DriverManager getConnection ("jdbc:postgresql://localhost/cg",
    "cg", "cg")

  var indexDirPath: String = null

  def getDirectory (path: String) : Directory =
    FSDirectory open FileSystems.getDefault.getPath(path)

  def gatherTokens (predicates: String, field: String, tokens: ListBuffer[String]) {
    val pattern = "<.*?[^\\\\]>".r
    val xs = pattern findAllIn predicates
    try {
      for (x <- xs) {
        var ts = x.split ("\\|")
        if (ts (3) == field) tokens += ts (1)
      }
    } catch {
      case e: Exception => {
        Console.err.println ("Pred => " + predicates)
        throw e
      }
    }
  }

  def createDocument (
    pii: String,
    title: String,
    objectTokens: ListBuffer [String],
    verbTokens: ListBuffer [String],
    subjectTokens: ListBuffer [String]
  ) : Document = {
    val stmt: Statement = c createStatement
    val rs: ResultSet = stmt executeQuery (s"select data allhl from parsing where pii = '$pii'")
    var allhl : String = null
    if (rs next) allhl = rs.getString ("allhl")
    else assert (verbTokens.length == 0, s"Issue with $pii ${verbTokens.length} ${verbTokens(0)}")
    rs.close ()

    val d = new Document
    val piiFieldType = new FieldType
    val titleFieldType = new FieldType

    piiFieldType setIndexOptions IndexOptions.DOCS
    piiFieldType setTokenized false
    piiFieldType setStored true
    d add new Field ("pii", pii, piiFieldType)
    
    titleFieldType setIndexOptions IndexOptions.DOCS_AND_FREQS_AND_POSITIONS_AND_OFFSETS
    titleFieldType setStored true
    titleFieldType setStoreTermVectors true
    d add new Field ("title", title, titleFieldType)

    /*
    if (objectTokens.length > 0) {
      val objectFieldType = new FieldType
      objectFieldType setIndexOptions IndexOptions.DOCS_AND_FREQS_AND_POSITIONS
      objectFieldType setStored false
      d add new Field ("object", objectTokens mkString (" "), objectFieldType)
    }
    if (verbTokens.length > 0) {
      val verbFieldType = new FieldType
      verbFieldType setIndexOptions IndexOptions.DOCS_AND_FREQS_AND_POSITIONS
      verbFieldType setStored false
      d add new Field ("verb", verbTokens mkString (" "), verbFieldType)
    }
    if (subjectTokens.length > 0) {
      val subjectFieldType = new FieldType
      subjectFieldType setIndexOptions IndexOptions.DOCS_AND_FREQS_AND_POSITIONS
      subjectFieldType setStored false
      d add new Field ("subject", subjectTokens mkString (" "), subjectFieldType)
    }
     */
    if (allhl != null) {
      val hlFieldType = new FieldType
      hlFieldType setIndexOptions IndexOptions.DOCS_AND_FREQS_AND_POSITIONS
      hlFieldType setStored false
      hlFieldType setStoreTermVectors true
      d add new Field ("hl", allhl, hlFieldType)
    }
    objectTokens.clear
    verbTokens.clear
    subjectTokens.clear
    d
  }

  def indexDB {
     val indexDir = getDirectory (indexDirPath)
    val defaultAnalyzer : Analyzer = new StandardAnalyzer;

    val altAnalyzers : Map [String, Analyzer] = Map ("hl" -> new HighlightAnalyzer ())
    val analyzer = new PerFieldAnalyzerWrapper (defaultAnalyzer, altAnalyzers.asJava)
    val config : IndexWriterConfig = new IndexWriterConfig (analyzer);
    config.setOpenMode (IndexWriterConfig.OpenMode.CREATE)
    val w = new IndexWriter (indexDir, config)

    def addToIndex (pii: String, title: String, objectTokens: ListBuffer [String], verbTokens: ListBuffer [String], subjectTokens: ListBuffer [String]) {
      val d = createDocument (pii, title, objectTokens, verbTokens, subjectTokens)
      w addDocument d
    }

    var pii : String = null
    var title : String = null
    var hlno : Int = 0

    try {
      val stmt: Statement = c createStatement

      val rs: ResultSet = stmt executeQuery ("select a.pii pii, title, hlno, predicates from articles a left outer join hung_predicates b on a.pii = b.pii order by pii, hlno")

      var objectTokens = ListBuffer.empty [String]
      var verbTokens = ListBuffer.empty [String]
      var subjectTokens = ListBuffer.empty [String]
      var allHL: String = null

      while (rs next) {
        hlno = rs.getInt ("hlno")
        if (hlno < 2 && pii != null) {
          addToIndex (pii, title, objectTokens, verbTokens, subjectTokens)
          pii = null
        }
        if (hlno == 1) {
          objectTokens.clear
          verbTokens.clear
          subjectTokens.clear
        }
        pii = rs.getString ("pii")
        title = rs.getString ("title")
        if (hlno == 0) {
          addToIndex (pii, title, objectTokens, verbTokens, subjectTokens)
          pii = null
        }
        else {
          var predicates = rs.getString ("predicates")
          gatherTokens (predicates, "1", objectTokens)
          gatherTokens (predicates, "2", verbTokens)
          gatherTokens (predicates, "3", subjectTokens)
        }
      }
      rs.close ()
      if (pii != null) 
        addToIndex (pii, title, objectTokens, verbTokens, subjectTokens)
    }
    catch {
      case e:Exception => {
        Console.err.println ("PII => " + pii)
        e.printStackTrace
      }
    }
    w close
  }

  def main () {
    if (args.length != 1) {
      Console.println ("Not enought arguments")
      return
    }
    indexDirPath = args (0)

    indexDB
    Console println "Indexation over"
  }

  try {
    main
  } catch {
    case e:Exception => e.printStackTrace
  }
}
