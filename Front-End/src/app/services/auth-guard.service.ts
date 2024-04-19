import { Injectable } from "@angular/core";
import { Router, CanActivate } from "@angular/router";
import { AuthenticationService } from "./authentication.service";

@Injectable()
/**
 * Service to let the user access to the page if authorized
 */
export class AuthGuardService implements CanActivate {
  constructor(private auth: AuthenticationService, private router: Router) {}

  /**
   * Function to let the user access to the url
   */
  canActivate() {
    // Check if the user is logged in
    if (!this.auth.isLoggedIn()) {
      this.router.navigateByUrl("/");
      return false;
    }
    return true;
  }
}
