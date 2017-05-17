package controllers

import javax.inject._
import play.api._
import play.api.mvc._

import services.{Paper, Authenticate}

@Singleton
class PaperController @Inject() extends Controller {
  def get (pii: String) = Action { request =>
    if (Authenticate (request)) {
      val searchOnTitle = request.cookies.get ("searchontitle") match {
        case Some(Cookie(_,x,_,_,_,_,_)) => x.toBoolean
        case None => true
      }
      val searchOnHL = request.cookies.get ("searchonhl") match {
        case Some(Cookie(_,x,_,_,_,_,_)) => x.toBoolean
        case None => true
      }
      val titleWeight = request.cookies.get ("titleweight") match {
        case Some(Cookie(_,x,_,_,_,_,_)) => x.toDouble
        case None => 0.5
      }
      val hlWeight = request.cookies.get ("hlweight") match {
        case Some(Cookie(_,x,_,_,_,_,_)) => x.toDouble
        case None => 0.5
      }

      Paper.get (pii, searchOnTitle, searchOnHL, titleWeight, hlWeight) match {
        case None => BadRequest ("Nothing for " + pii)
        case Some(result) => Ok(result).as ("text/html")
      }
    } else {
      Unauthorized (views.html.pwd ())
    }
  }
}
