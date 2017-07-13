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
    config = ConfigFactory load configFile
    configLabel = config getString configLabelKey
  }
  catch {
    case e: Exception => {
      e.printStackTrace
      _error = e.toString
    }
  }

  def getStringOrElse (k: String, alt: String) : String =
    try {
      if (config hasPath k) config getString k
      else {
        val k2 = s"sodad.kgws.configSet.${configLabel}.${k}"
        if (config hasPath k2) config getString k2
        else alt
      }
    }
    catch {
      case e: Exception => {
        e.printStackTrace
        _error = e.toString
        alt
      }
    }
}
