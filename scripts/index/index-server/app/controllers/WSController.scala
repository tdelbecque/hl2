package controllers

import javax.inject.Inject
import play.api.mvc._
import play.api.libs.streams._
import akka.actor._
import akka.stream._
import play.api.libs.json.{Json, JsValue}
import services.{QueryHandlerHTML, PaperLookup}

class WSController @Inject() (implicit system: ActorSystem, materializer: Materializer) {
  class MyWebSocketActor(out: ActorRef) extends Actor {
    def receive = {
      case msgin: String => try {
        val msg = Json.parse (msgin)
        val msgout = (msg \ "what").asOpt[String] match {
          case Some(what) => doit (what, msg)
          case _ => "Missing what parameter"
        }
        out ! msgout
      } catch {
        case e: Exception => {
          Console.err println ("" + e)
          out ! """{"error": "error"}"""
        }
      }

    }
  }

  object MyWebSocketActor {
    def props (out: ActorRef) = Props(new MyWebSocketActor(out))
  }

  def socket = WebSocket.accept[String, String] { request => {
    //Console.err println "Connect"
    ActorFlow.actorRef (out => MyWebSocketActor.props(out))
  }}

  def doit (what: String, msg: JsValue) = {
    what match {
      case "termsVector" => {
        val ret = (msg \ "pii").asOpt[String] match {
          case Some(pii) => {
            val htmlContent = QueryHandlerHTML.termsVector (pii)
            val retJsValue = Json.obj (
              "pii" -> pii,
              "divid" -> (msg \ "divid").as[String],
              "content" -> htmlContent)
            Json.stringify (retJsValue)
          }
          case _ => "Missing pii"
        }
        ret
      }
      case "analysis" => {
        val ret = (msg \ "pii").asOpt[String] match {
          case Some(pii) => {
            val analysis = PaperLookup.getAnalysis (pii)
            val retJsValue = Json.obj (
              "pii" -> pii,
              "divid" -> (msg \ "divid").as[String],
              "content" -> views.html.analysis (analysis).body)
            Json.stringify (retJsValue)
          }
          case _ => "Missing pii"
        }
        ret
      }
      case "abstract" => {
        val ret = (msg \ "pii").asOpt[String] match {
          case Some(pii) => {
            val abstr = PaperLookup.getAbstract (pii)
            val retJsValue = Json.obj (
              "pii" -> pii,
              "divid" -> (msg \ "divid").as[String],
              "content" -> views.html.abstr (abstr).body)
            Json.stringify (retJsValue)
          }
          case _ => "Missing pii"
        }
        ret        
      }
      case "semmedPredications" => {
        val ret = (msg \ "pii").asOpt[String] match {
          case Some(pii) => {
            val predications = PaperLookup.getSemMed (pii)
            val retJsValue = Json.obj (
              "pii" -> pii,
              "divid" -> (msg \ "divid").as[String],
              "content" -> views.html.semmed (predications).body
            )
            Json.stringify (retJsValue)
          }
          case _ => "Missing pii"
        }
        ret
      }
      case _ => "" 
    }
  }
}
