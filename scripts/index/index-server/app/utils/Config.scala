package utils

object Config {
  import com.typesafe.config.{Config, ConfigFactory}

  val configFile = "kgws"
  val configLabelKey = "sodad.kgws.config"

  private var config : Config = _
  private var configLabel : String = _
  private var _error : String = _
  def error = _error

  try {
    config = ConfigFactory.load (configFile)
    configLabel = config.getString (configLabelKey)
  }
  catch {
    case e: Exception => {
      e.printStackTrace
      _error = e.toString
    }
  }

  def getStringOrElse (k: String, alt: String) : String =
    try {
      config.getString (s"sodad.kgws.configSet.${configLabel}.${k}")
    }
    catch {
      case e: Exception => {
        e.printStackTrace
        _error = e.toString
        alt
      }
    }
}
