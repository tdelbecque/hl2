package controllers

import scala.language.postfixOps
import javax.inject._
import play.api.mvc._
import play.api.libs.streams._
import akka.actor._
import akka.stream._
import io.sodad.annotator.services.{AnnotationFactory, Config}
import play.api.libs.json._
import play.api.Logger

@Singleton
class AnnotWSController @Inject() (implicit system: ActorSystem, materializer: Materializer, application: AnnotationFactory) {
  private class MyWebSocketActor(out: ActorRef) extends Actor {
    def receive = {
      case msgin: String => {
        Logger info s"Receiving ${msgin}"
        try {
          val decodedMsg = Json parse msgin;
          val ret: Option[String] = (decodedMsg \ "what") match {
            case JsDefined(JsString(what)) => {
              Console.err println s"what = ${what}"
              if (application msgCanHandle what)
                application msgHandle (what, decodedMsg)
              else
                throw new Exception (s"Cannot handle message ${what}")
            }
            case JsDefined (_) => 
              throw new Exception ("what should be a string")
            case _: JsUndefined =>
              throw new Exception ("what is missing")
          }
          ret match {
            case Some(msg) => out ! msg
            case None => Unit
          }
        }
        catch {
          case e: Exception =>
            Console.err println (e)
        }
      }
    }
  }

  object MyWebSocketActor {
    def props (out: ActorRef) = Props (new MyWebSocketActor(out))
  }

  def socket = WebSocket.accept[String, String] { request => {
    Logger info "Web Socket Connection"
    ActorFlow.actorRef (out => MyWebSocketActor.props (out))
  }}
}
