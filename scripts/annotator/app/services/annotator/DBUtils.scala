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
}
