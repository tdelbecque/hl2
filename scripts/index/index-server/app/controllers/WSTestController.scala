package controllers

import javax.inject._
import play.api._
import play.api.mvc._

@Singleton
class WSTestController @Inject() extends Controller {
  def apply = Action { request => {
    Ok (views.html.ws ())
  }}
}
