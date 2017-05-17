package controllers

import javax.inject._
import play.api._
import play.api.mvc._

import services.Authenticate

@Singleton
class AuthenticateController @Inject() extends Controller {
  def apply() = Action { request => {
    val pwd = request.body.asFormUrlEncoded.get.get("pwd").head
    if (Authenticate.checkPwd (pwd.mkString)) {
      Ok (views.html.authenticok ()).withCookies (Authenticate.getAuthCookie)
    } else {
      Unauthorized (views.html.pwd ())
    }
  }}
}
