package controllers

import javax.inject._
import play.api._
import play.api.mvc._

import services.QueryHandler
import services.QueryHandlerHTML
import services.Authenticate

@Singleton
class QueryController @Inject() extends Controller {
  def search(q: String, n: Int = 10) = Action {request => {
    if (Authenticate (request)) {
      Ok(QueryHandlerHTML.search (q, n))
    } else {
      Unauthorized (views.html.pwd ())
    }
  }}

  def query (q: String, n: Int = 10) = Action {
    Ok (QueryHandlerHTML (q, n)).as("text/html")
  }

  def querylong (
    title: String, hl: String,
    searchOnTitle: Boolean, searchOnSelectedHL: Boolean,
    titleWeight: Double, hlWeight: Double,
    saveParameters: Boolean,
    n: Int) = Action {request => {
      if (Authenticate (request)) {
        var theTitle = if (searchOnTitle) title else ""
        var theHL = if (searchOnSelectedHL) hl else ""
        if ((theTitle == "") && (theHL == ""))
          BadRequest ("All parameters are empty")
        else {
          val result = Ok (QueryHandlerHTML.applyLong (theTitle, theHL, titleWeight, hlWeight, n))
          if (saveParameters) {
            val trueTitleWeight = if (titleWeight == 0.5) (1.0 - hlWeight) else titleWeight
            val trueHLWeight = 1.0 - trueTitleWeight
            result.
              withCookies (
                Cookie ("searchontitle", searchOnTitle.toString),
                Cookie ("searchonhl", searchOnSelectedHL.toString),
                Cookie ("titleweight", trueTitleWeight.toString),
                Cookie ("hlweight", trueHLWeight.toString)
              )
          } else
              result
        }
      } else {
        Unauthorized (views.html.pwd ())
      }
    }
  }
}
