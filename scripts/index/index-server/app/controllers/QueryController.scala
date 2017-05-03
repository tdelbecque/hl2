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
}
