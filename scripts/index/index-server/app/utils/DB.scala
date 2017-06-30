package utils

import java.sql.Connection
import java.sql.DriverManager

trait DB {
  Class.forName ("org.postgresql.Driver")
  val connectPrefix = "jdbc:postgresql://localhost"
  private var _con : Connection = _
  protected var _name : String = _
  protected var _user : String = _
  protected var _pwd : String = _

  def name = _name
  def user = _user
  def pwd = _pwd

  def con = {
    if (_con == null) 
      _con = DriverManager getConnection (s"${connectPrefix}/${name}", user, pwd)
    _con
  }
}

object Regular extends DB {
  val configNameKey = "db.regular.name"
  val configUserKey = "db.regular.user"
  val configPwdKey = "db.regular.pwd"

  _name = Config.getStringOrElse (configNameKey, "cg")
  _user = Config.getStringOrElse (configUserKey, "cg")
  _pwd = Config.getStringOrElse (configPwdKey, "cg")
}

object Patch extends DB {
  val configNameKey = "db.patch.name"
  val configUserKey = "db.patch.user"
  val configPwdKey = "db.patch.pwd"

  _name = Config.getStringOrElse (configNameKey, "fallback")
  _user = Config.getStringOrElse (configUserKey, "cg")
  _pwd = Config.getStringOrElse (configPwdKey, "cg")
}

