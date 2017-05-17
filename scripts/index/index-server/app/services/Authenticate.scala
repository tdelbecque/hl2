package services;

import play.api.mvc.{Request, AnyContent, Cookie}

object Authenticate {

  val thePwd = System.getenv ("KG_SERVER_PASSWORD")
  val theKey = System.getenv ("KG_SERVER_COOKIE_KEY")

  def apply (request: Request[AnyContent]) : Boolean = {
    val authCookie = request.cookies.get ("authkey")
    authCookie match {
      case Some (c) if (c.value == theKey) => true
      case _ => false
    }
  }

  def checkPwd (proposal: String) = proposal == thePwd

  def getAuthCookie = Cookie ("authkey", theKey)
}

