package io.sodad.annotator.services

import scala.language.postfixOps
import java.sql.{Connection, DriverManager, Statement, ResultSet}
import play.api.libs.json._
import collection.JavaConverters._
import javax.inject._
import play.api.inject.ApplicationLifecycle
import akka.actor._
import play.api.Logger

case class  AnnotatedItem (
  val stepIdx : Integer,
  val symbols : Map[String, String],
  val annotationValue : String
){
  def toJSON = Json.obj (
    "stepIdx" -> BigDecimal(stepIdx),
    "symbols" -> JsObject (
      symbols.toSeq.map {case (k, s) => (k, JsString(s))}
    ),
    "annotation" -> annotationValue
  )
}

trait AnnotatedSequenceTrait {
  def getAnnotationFactory: AnnotationFactory
  def getAnnotatedItemsIterator: Iterator[AnnotatedItem]
  def getSymbolIterator: Iterator[String]
  def getAnnotationName: String
  def getItemKeys: Map[String, String]
  def toJSON: JsValue = Json.obj (
    "itemKeys" -> JsObject (getItemKeys map {case (k, s) => (k, JsString(s))}),
    "items" -> JsArray (Seq.empty[JsValue] ++ getAnnotatedItemsIterator.map (_.toJSON))
  )
}

object MsgSet {
  val MainPage = "MainPage"
  val AnnotationParameters = "AnnotationParameters"
  val GetAnnotatedSequence = "GetAnnotatedSequence"
}

trait MainActorMessage
case class MAM_RegisterForQueries (val props: Props, val queryKeys: Seq[String]) extends MainActorMessage
case class MAM_RegisterForQuery (val props: Props, val queryKey: String) extends MainActorMessage

@Singleton
class AnnotationFactory @Inject() (_dbu: DBUtils, _appLifecycle: ApplicationLifecycle, system: ActorSystem) {
  import AnnotationParameters._

  val msg = MsgSet

  private class ApplicationMainActor extends Actor {
    override def receive : Receive = {
      case MAM_RegisterForQueries (p, ks) =>
        val a = context.actorOf (p)
        for (k <- ks) actorForQueriesMap += k -> a
        Logger info s"Registering for ${ks}"
      case MAM_RegisterForQuery (p, k) =>
        val a = context.actorOf (p)
        actorForQueriesMap += k -> a
        Logger info s"Registering for ${k}"
   }
  }

  private object ApplicationMainActor {
    def props = Props (new ApplicationMainActor)
  }

  private val mainActor = system.actorOf (ApplicationMainActor props)

  private val actorForQueriesMap = collection.mutable.Map.empty[String, ActorRef]
  def getActorForQuery (q: String) : Option[ActorRef] = actorForQueriesMap get q

  def createActorForQueries (props: Props, queryKeys: Seq[String]) {
    mainActor ! MAM_RegisterForQueries (props, queryKeys)
  }

  def createActorForQuery (props: Props, queryKey: String) {
    mainActor ! MAM_RegisterForQuery (props, queryKey)
  }

  private val appLifecycle = _appLifecycle
  private val dbu = _dbu

  private var _isValid = false
  def isValid = _isValid

  private lazy val dbName: String = Config getString Config.configLabelDBName
  private lazy val dbUser: String = Config getString Config.configLabelDBUser
  private lazy val dbPwd: String  = Config getString Config.configLabelDBPwd

  private var con: Connection = _
  private var _nbSequences: Int = _
  private var keys: Array[Array[String]] = _
  private var keysToIdxMap: collection.mutable.Map[String,Int] = collection.mutable.Map.empty[String,Int]

  private val annotationsFields = Seq (
    ("annotname", "text", true),
    ("annotval", "text", false))

  private val annotnameIdx = 0;
  private val annotvalIdx = 1;

  def getAnnotNameColumnName = annotationsFields(annotnameIdx) . _1
  def getAnnotValColumnName = annotationsFields (annotvalIdx) . _1

  init

  //=================================================

  def nbSequences = _nbSequences

  def close = if (con != null) con close

  private def init {
    try {
       con = dbu createConnection (dbName, dbUser, dbPwd)

      dbu assertAllColumnsExist (con, sequencesTable, sequenceKeys :+ stepIndex)
      createOrAssertAnnotationsTable
      loadKeys
    }
    catch {
      case e : Throwable => {
        close
        throw e
      }
    }
    finally {
    }
  }

  def createOrAssertAnnotationsTable {
    if (dbu testTableExists (con, annotationsTable))
      assertAnnotationsTable
    else
      createAnnotationsTable
  }

  def createAnnotationsTable {
    dbu.createTableIfNotExists (
      con,
      annotationsTable,
      (sequenceKeys :+ stepIndex).
        map (k => (k, dbu.getColumnDataType (con, sequencesTable, k))).
        map (t => t match {
          case (a, Some(b)) => (a, b, true)
          case _ => throw new Exception
        })
        ++
        annotationsFields)
  }

  def assertAnnotationsTable {
    dbu.assertAllColumnsExist (con, annotationsTable, sequenceKeys :+ stepIndex)
  }

  private def loadKeys {
    val stmt: Statement = con createStatement ()
    val sequenceKeysString = sequenceKeys mkString ","

    var rs : ResultSet = null
    try {
      rs = stmt executeQuery s"select count(*) from (select distinct ${sequenceKeysString} from ${sequencesTable}) X"
      if (! (rs next)) throw new Exception ("Unable to count")
      _nbSequences = rs.getInt (1)
    }
    finally {
      rs close
    }

    keys = new Array [Array[String]](_nbSequences)
    try {
      rs = stmt executeQuery s"select distinct ${sequenceKeysString} from ${sequencesTable} order by ${sequenceKeysString}"
      var i : Int = 0;
      while (rs next) {
        val xs = new Array[String](sequenceKeys size)
        for (j <- 0 until sequenceKeys.size) {
          xs (j) = rs getString (j + 1)
        }
        keysToIdxMap (xs mkString " ") = i
        keys (i) = xs
        i = i + 1
      }
    }
    finally {
      rs close
    }
  }

  def getKeyAt (i: Int) = keys (i) clone

  def getAnnotationsAt (annotation: String, keys: Map[String, String]) : AnnotatedSequenceTrait = {
//    val query = dbu.getAnnotationsAtQuery (con, annotation, keys)
    val query = dbu.getAnnotationsAtQuery (con, keys)

    println (s"query = ${query}")
    println (s"getAnnotValColumnName = ${getAnnotValColumnName}")
    
    val stmt = con createStatement
    val a = new AnnotatedSequence (annotation, keys)

    var rs : ResultSet = null
    try {
      rs = stmt executeQuery query
      while (rs next) {
        a.annotatedItems += AnnotatedItem (
          rs getInt stepIndex,
          (Map.empty[String,String] /: symbolNames) {
            case (m, n) => m + ((n, rs getString n))
          },
          rs getString getAnnotValColumnName)
      }
    }
    finally {
      rs close
    }
    a
  }

  def getAnnotationsAt (annotation: String, keys: Map[String, String], offset: Integer) : AnnotatedSequenceTrait = {
    println (s"PT0: offset=${offset}")
    if (offset == 0 && false)
      getAnnotationsAt (annotation, keys)
    else {
      val k = ((collection.mutable.ArrayBuffer.empty[String] /: sequenceKeys) ((b, s) => b += keys (s))) mkString " "
      Logger info s"k == ${k}"
      val i = keysToIdxMap (k) + offset
      getAnnotationsAt (annotation, i)
    }
  }

  def getAnnotationsAt (annotation: String, index: Integer) : AnnotatedSequenceTrait = {
    println ("PT1")
    getAnnotationsAt (
      annotation,
      Map ((sequenceKeys zip (keys (index))):_*))
  }
  private class AnnotatedSequence (val annotationName: String, val itemKeys: Map[String, String])
      extends AnnotatedSequenceTrait {
    import collection.mutable.ArrayBuffer

    private[AnnotationFactory] val annotatedItems: ArrayBuffer[AnnotatedItem] =
      ArrayBuffer.empty[AnnotatedItem]

    def getAnnotationFactory = AnnotationFactory.this

    def getAnnotatedItemsIterator = annotatedItems iterator
    def getSymbolIterator = symbolNames iterator
    def getAnnotationName = annotationName
    def getItemKeys = itemKeys
  }

  def msgCanHandle (msg: String) = msg == MsgSet.MainPage

  def msgHandle (msg: String, data: JsValue) =
    Some (Json.stringify (Config getAnnotationSchemeFeaturesAsJSON))

}
