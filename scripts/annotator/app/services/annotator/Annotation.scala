package io.sodad.annotator.services

import scala.language.postfixOps
import java.sql.{Connection, DriverManager, Statement, ResultSet}
import play.api.libs.json._
import collection.JavaConverters._
import javax.inject._
import play.api.inject.ApplicationLifecycle

case class  AnnotatedItem (
  val stepIdx : Integer,
  val symbols : Map[String, String],
  val annotationValue : String
)

trait AnnotatedSequenceTrait {
  def getAnnotationFactory: AnnotationFactory
  def getAnnotatedItemsIterator: Iterator[AnnotatedItem]
  def getSymbolIterator: Iterator[String]
  def getAnnotationName: String
  def getItemKeys: Map[String, String]
}

case class AnnotationDescription (name: String, states: Seq[String], default: String)

object MsgSet {
  val MainPage = "MainPage"
}

@Singleton
class AnnotationFactory @Inject() (_dbu: DBUtils, _appLifecycle: ApplicationLifecycle) {
  val msg = MsgSet

  private val appLifecycle = _appLifecycle
  private val dbu = _dbu

  private var stateNames: Seq[String] = _
  private var stateValues: Seq[Seq[String]] = _

  private var _isValid = false
  def isValid = _isValid

  private var dbName: String = _
  private var dbUser: String = _
  private var dbPwd: String = _
  private var sequenceKeys: Seq[String] = _
  private var stepIndex: String = _
  private var sequencesTable: String = _
  private var symbolNames: Seq[String] = _
  private var annotationsTable: String = _

  private var con: Connection = _
  private var _nbSequences: Int = _
  private var keys: Array[Array[String]] = _

  private var annotationDescriptions: Map[String, AnnotationDescription] = _

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
      dbName = Config getString Config.configLabelDBName
      dbUser = Config getString Config.configLabelDBUser
      dbPwd =  Config getString Config.configLabelDBPwd
      sequenceKeys = (Config getStringList Config.configLabelSequenceKeys)
      stepIndex = Config getString Config.configLabelStepIndex
      sequencesTable = Config getString Config.configLabelSequencesTable
      symbolNames = (Config getStringList Config.configLabelSymbolNames)
      annotationsTable = Config getString Config.configLabelAnnotationsTable
      annotationDescriptions = getAnnotationDescriptions

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

  def getAnnotationDescriptions = 
    (Map[String, AnnotationDescription] () /:
      Config . getConfigList (Config configLabelAnnotationDescriptions) . map (
        c => {
          new AnnotationDescription (
            c getString "name",
            (c getStringList "states") asScala,
            c getString "default"
          )})
    ) ( (m, d) => {m + ((d.name, d))} )

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
        keys (i) = xs
        i = i + 1
      }
    }
    finally {
      rs close
    }
  }

  def getKeyAt (i: Int) = keys (i) clone

  def getAnnotationsAtQuery (annotation: String, keys: Map[String, String]) = {
    val a1 = "A"
    val a2 = "B"

    val specifiedDefault = annotationDescriptions (annotation).default
    val computedDefault =
      if (specifiedDefault startsWith "sequences.")
        "sequences".r replaceFirstIn (specifiedDefault, a1)
      else
        s"'${specifiedDefault}'"

    val outputFields = (((sequenceKeys :+ stepIndex) ++ symbolNames).
      map ( n => s"${a1}.${n}" ) :+
      s"coalesce(${a2}.${getAnnotNameColumnName}, '${annotation}') ${getAnnotNameColumnName}" :+
      s"coalesce(${a2}.${getAnnotValColumnName}, ${computedDefault}) ${getAnnotValColumnName}") mkString (",")

    val whereClause = s"where ${
      keys . map { case (k, v) => {
        s"${k} = ${
          if (dbu testColumnIsCharType (con, sequencesTable, k))
            s"'${v}'"
          else
            v
        }"
      }} . mkString (" and ")
    }"

    val fromClause = s"from (select * from ${sequencesTable} ${whereClause}) ${a1}"

    val joinConditionClause = (sequenceKeys :+ stepIndex) .
      map ( n => s"${a1}.${n} = ${a2}.${n}" ) .
      mkString (" and ")

    val joinClause = s"left outer join (select * from ${annotationsTable} where ${getAnnotNameColumnName} = '${annotation}') ${a2} on ${joinConditionClause}"

    val orderClause = s"order by ${stepIndex}"

    s"select ${outputFields} ${fromClause} ${joinClause} ${orderClause}"
  }

  def getAnnotationsAt (annotation: String, keys: Map[String, String]) : AnnotatedSequenceTrait = {
    val query = getAnnotationsAtQuery (annotation, keys)
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

