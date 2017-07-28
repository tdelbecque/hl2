package io.sodad.annotator.services

import scala.language.postfixOps
import com.typesafe.config.ConfigFactory
import java.io.File
import collection.JavaConverters._
import play.api.libs.json._

object Config {
  val config = ConfigFactory parseFile (new File ("/home/thierry/HL/scripts/annotator/annotation.conf"))

  val configLabelRoot = "sodad.annotationScheme"
  val configLabelDBName = s"${configLabelRoot}.db.name"
  val configLabelDBUser = s"${configLabelRoot}.db.user"
  val configLabelDBPwd =  s"${configLabelRoot}.db.pwd"

  val configLabelSequencesTable = s"${configLabelRoot}.table.sequences"
  val configLabelAnnotationsTable = s"${configLabelRoot}.table.annotations"

  val configLabelSequenceKeys = s"${configLabelRoot}.sequenceKeys"
  val configLabelStepIndex = s"${configLabelRoot}.stepIndex"
  val configLabelSymbolNames = s"${configLabelRoot}.symbolNames"

  val configLabelAnnotationDescriptions = s"${configLabelRoot}.annotations"

  def getString (k: String) = config getString k
  def getStringList (k: String) : Seq[String] = (config getStringList k).asScala
  def getConfigList (k: String) = (config getConfigList k).asScala

  def getAnnotationSchemeFeaturesAsJSON = JsObject (Seq (
    configLabelSequenceKeys -> JsArray (
      getStringList (configLabelSequenceKeys).map (JsString)),
    configLabelSymbolNames -> JsArray (
      getStringList (configLabelSymbolNames).map (JsString)),
    configLabelAnnotationDescriptions -> JsArray (
      getConfigList (configLabelAnnotationDescriptions).map {
        c => JsObject (Seq (
          "name" -> JsString (c getString "name"),
          "states" -> JsArray (c.getStringList ("states").asScala.map (JsString))))
      })))

}
