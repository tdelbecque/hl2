package controllers

import javax.inject._
import play.api._
import play.api.mvc._
import io.sodad.annotator.services.AnnotationFactory
import views.html.annotator

/**
 * This controller creates an `Action` to handle HTTP requests to the
 * application's home page.
 */
@Singleton
class HomeController @Inject() (app: AnnotationFactory) extends Controller {

  private val application = app

  /**
   * Create an Action to render an HTML page with a welcome message.
   * The configuration in the `routes` file means that this method
   * will be called when the application receives a `GET` request with
   * a path of `/`.
   */
  def index = Action {
    Ok(annotator.main("SoDAD Sequence Annotator", app))
  }

}
