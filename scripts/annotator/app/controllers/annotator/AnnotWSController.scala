package controllers

import scala.language.postfixOps
import javax.inject._
import play.api.mvc._
import play.api.libs.streams._
import akka.actor._
import akka.stream._
import io.sodad.annotator.services.{AnnotationFactory, Config}
import io.sodad.annotator.actors.{Message}
import play.api.libs.json._
import play.api.Logger

@Singleton
class AnnotWSController @Inject() (implicit system: ActorSystem, materializer: Materializer, application: AnnotationFactory) {
  private class MyWebSocketActor(out: ActorRef) extends Actor {
    override def preStart = {
      Logger info s"prestart, out=${out}"
    }

    override def postStop = {
      Logger info "poststop"
    }

    override def receive : Receive = {
      case msgin: String => {
        Logger info s"Receiving ${msgin} from ${sender}"
        try {
          val decodedMsg = Json parse msgin;
          (decodedMsg \ "what") match {
            case JsDefined(JsString(what)) =>
              Logger info  s"what = ${what}"
              application getActorForQuery what match {
                case None =>
                  throw new Exception (s"Cannot handle message ${what}")
                case Some(actor) =>
                  actor ! Message(out, decodedMsg)
              }

            case JsDefined (_) =>
              throw new Exception ("what should be a string")
            case _: JsUndefined =>
              throw new Exception ("what is missing")
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
