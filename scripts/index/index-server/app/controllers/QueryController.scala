package controllers

import javax.inject._
import play.api._
import play.api.mvc._

import services.QueryHandler
import services.QueryHandlerHTML

@Singleton
class QueryController @Inject() extends Controller {
  def query (q: String, n: Int = 10) = Action {
    Console println q
    Ok (QueryHandlerHTML (q, n)).as("text/html")
  }

  def querylong (title: String, hl: String, searchOnTitle: Boolean, searchOnSelectedHL: Boolean, n: Int) = Action {
    var theTitle = if (searchOnTitle) title else ""
    var theHL = if (searchOnSelectedHL) hl else ""
     if ((theTitle == "") && (theHL == ""))
      BadRequest ("All parameters are empty")
    else
      Ok (QueryHandlerHTML.applyLong (theTitle, theHL, n)).as("text/html")
  }
}
