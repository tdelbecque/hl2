package controllers

import javax.inject._
import play.api._
import play.api.mvc._

import services.Paper

@Singleton
class PaperController @Inject() extends Controller {
  def get (pii: String) = Action {
    Paper.get (pii) match {
      case None => BadRequest ("Nothing for " + pii)
      case Some(result) => Ok(result).as ("text/html")
    }
  }
}
