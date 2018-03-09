package io.sodad.annotator.services
import scala.language.postfixOps
import java.sql.{Connection, DriverManager, Statement, ResultSet}
import javax.inject._

trait DBUtils {
  def createConnection (dbName: String, userName: String, userPwd: String) : Connection
  def testTableExists (con: Connection, tableName: String, schemaName: String = "public") : Boolean
  def createTableIfNotExists (con: Connection, tableName: String, fields: Seq[(String, String, Boolean)]) : Unit
  def dropTable  (con: Connection,  tableName: String) : Unit
  def testColumnIsCharType (con: Connection, tableName: String, columnName: String) : Boolean
  def getColumnDataType (con: Connection, tableName: String, columnName: String) : Option[String]
  def assertAllColumnsExist (con: Connection, tableName: String, fields: Seq[String]) : Unit
  def testAllColumnsExist (con: Connection, tableName: String, fields: Seq[String]) : Boolean
  def getMissingColumns (con: Connection, tableName: String, fields: Seq[String]) : Seq[String]
  def getAnnotationsAtQuery (con: Connection, keys: Map[String, String]) : String
}

@Singleton
class DBUtilsComponentPostgreSQL extends DBUtils {
  Class.forName ("org.postgresql.Driver")
  val connectPrefix = "jdbc:postgresql://localhost"

  def createConnection (dbName: String, userName: String, userPwd: String) = 
    DriverManager getConnection (s"${connectPrefix}/${dbName}", userName, userPwd)

  def testTableExists (con: Connection, tableName: String, schemaName: String = "public") = {
    val q = s"select exists (select 1 from pg_tables where schemaname = '${schemaName}' and tablename = '${tableName}')"
    val stmt = con createStatement
    var rs : ResultSet = null
    var exists : Boolean = false
    try {
      rs = stmt executeQuery q
      rs.next
      exists = rs.getBoolean (1)
    }
    finally {
      rs.close
    }
    exists
  }

  def createTableIfNotExists (con: Connection, tableName: String, fields: Seq[(String, String, Boolean)]) {
    def declareFields = {
      val f = fields.map { case (a, b, _) => s"${a} ${b}" } mkString ","
      val k = fields.filter (_._3).map (_._1) mkString ","
      s"(${f}${if (k.length > 0) s", primary key (${k})" else ""})"
    }

    if (testTableExists (con, tableName)) return

    val q = s"create table ${tableName} ${declareFields}"
    Console.err println q
    val stmt = con.createStatement
    stmt executeUpdate q
  }

  def dropTable  (con: Connection,  tableName: String) {
    val q = s"drop table if exists ${tableName}"
    val stmt = con.createStatement
    stmt executeUpdate q
  }

  def testColumnIsCharType (con: Connection, tableName: String, columnName: String) =
    getColumnDataType (con, tableName, columnName) match {
      case Some(t) => ("char|text".r findFirstMatchIn t) nonEmpty
      case None => throw new Exception ("Column not found")
    }

  def getColumnDataType (con: Connection, tableName: String, columnName: String) = {
    val q = s"select data_type, character_maximum_length from information_schema.columns where table_name='${tableName}' and column_name='${columnName}'";
    val stmt = con.createStatement
    var rs : ResultSet = null
    var ret : Option[String] = None
    try {
      rs = stmt executeQuery q
      ret = if (rs.next)
        Some (s"${rs.getString (1)}${if (rs.getString(2) == null) "" else s" (${rs.getString(2)})"}")
      else
        None
    }
    finally {
      rs.close
    }
    ret
  }

  def assertAllColumnsExist (con: Connection, tableName: String, fields: Seq[String]) {
    val missings = getMissingColumns (con, tableName, fields)
    if (! missings.isEmpty)
      throw new Exception (s"Some expected columns are missing in ${tableName} : ${missings.mkString(",")}")
  }

  def testAllColumnsExist (con: Connection, tableName: String, fields: Seq[String]) = 
    fields.forall (k => getColumnDataType (con, tableName, k) isDefined)

  def getMissingColumns (con: Connection, tableName: String, fields: Seq[String]) =
    fields.filter (k => getColumnDataType (con, tableName, k) isEmpty)

  import AnnotationParameters._

  private val annotationsFields = Seq (
    ("annotname", "text", true),
    ("annotval", "text", false))

  private val annotnameIdx = 0;
  private val annotvalIdx = 1;

  def getAnnotNameColumnName = annotationsFields(annotnameIdx) . _1
  def getAnnotValColumnName = annotationsFields (annotvalIdx) . _1

  def getAnnotationsAtQuery (con: Connection, keys: Map[String, String]) : String = {
    def computedDefault (a: AnnotationDescription) =
      if (a.default startsWith "sequences")
        "sequences".r replaceFirstIn (a.default, "S")
      else
        s"'a.default'"

    val annotations = (annotationDescriptions map { case (k, a) => a }) zipWithIndex
    val outputFields =
      (((sequenceKeys :+ stepIndex) ++ symbolNames).map (s => s"S.$s") ++ annotations.map {
        case (a, i) => s"coalesce(X$i.${getAnnotValColumnName}, ${computedDefault(a)}) ${a.name}" }) mkString ","

    val whereClause = s"where ${
      keys . map { case (k, v) => {
        s"${k} = ${
          if (testColumnIsCharType (con, sequencesTable, k))
            s"'${v}'"
          else
            v
        }"
      }} . mkString (" and ")
    }"

    val fromClause = s"from (select * from ${sequencesTable} ${whereClause}) S"
    
    val joinClause = (annotations map {case (a, i) => {
      val joinConditionClause = (sequenceKeys :+ stepIndex) .
        map ( n => s"S.$n = X$i.$n" ) .
        mkString (" and ")
      s"left outer join (select * from $annotationsTable where $getAnnotNameColumnName = '${a name}') X$i on $joinConditionClause"
    }}) mkString " "

    val orderClause = s"order by ${stepIndex}"

    s"select $outputFields $fromClause $joinClause $orderClause"

  }

    def getAnnotationsAtQuery (con : Connection, annotation: String, keys: Map[String, String]) = {
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
          if (testColumnIsCharType (con, sequencesTable, k))
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

}
