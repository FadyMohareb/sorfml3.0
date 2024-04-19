import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import { Router } from "@angular/router";
import { SharedService } from "./shared.service";
import { NotificationService } from "./notification.service";
import { environment } from "../../environments/environment";

interface TokenResponse {
  token: string;
}

const url = environment.urlAPI;

@Injectable()

/**
 * Service to manage the authentication
 */
export class AuthenticationService {
  private token: string;
  currentExperimentId: any;

  constructor(
    private http: HttpClient,
    private router: Router,
    private shared: SharedService,
    private notificationService: NotificationService
  ) {}

  /**
   * Function to save the token in the local storage
   * when a user signs in or signs up
   *
   * @param token string of the token to save
   */
  private saveToken(token: string): void {
    // Store the tocken in the local storage
    localStorage.setItem("mean-token", token);
    // Assign the new token to the current token
    this.token = token;
  }

  /**
   * Function to get and return the item in the local storage
   */
  private getToken(): string {
    // If the token does not exist
    if (!this.token) {
      // Assign the local storage to the current token
      this.token = localStorage.getItem("mean-token");
    }
    return this.token;
  }

  /**
   * Function to get the detail of the connected user thanks to the payload
   * The payload will be decrypted
   * The payload is divided in 3 parts:
   * - Header: an encoded JSON object containing the type and the hashing algorithm used
   * - Payload: an encoded JSON object containing the data, the real body of the token
   * - Signature: an encrypted hash of the header and payload, using the “secret” set on the server.
   */
  public getUserDetails(): any {
    // Get the token
    const token = this.getToken();
    let payload;

    if (token) {
      // Get the the second part of the encrypted payload
      payload = token.split(".")[1];
      payload = window.atob(payload); // Decode the payload
      return JSON.parse(payload); // Return the decoded json object
    } else {
      return null;
    }
  }

  /**
   * Function to check if the user is logged in
   */
  public isLoggedIn(): boolean {
    // Get the user detail to check the expire session time
    const user = this.getUserDetails();

    if (user) {
      // Compare with time now
      return user.exp > Date.now() / 1000;
    } else {
      return false;
    }
  }

  /**
   * Function to check if the user is an admin
   */
  public isAdmin(): boolean {
    // Get the user detail to check the role of the user
    const user = this.getUserDetails();

    // If the user exist and the role equals to Admin
    // return true if not false
    if (user && user.role === "Admin") {
      return true;
    } else {
      return false;
    }
  }

  /**
   * Function to handle the different http request
   *
   * @param method string to know if it is a POST or a GET method
   * @param type string to set up the url
   * @param data object to pass for the POST method
   */
  private request(
    method: "post" | "get" | "put",
    type: "login" | "register" | "profile" | "updatePassword" | "updateProfile",
    data?: any
  ): Observable<any> {
    let base;

    // Set up the url with the http request
    if (method === "post") {
      base = this.http.post(`${url}${type}`, data);
    } else if (method === "get") {
      base = this.http.get(`${url}${type}`, {
        headers: { Authorization: `Bearer ${this.getToken()}` }
      });
    } else {
      base = this.http.put(`${url}${type}`, data);
    }

    // Call the http method
    const request = base.pipe(
      map((data: TokenResponse) => {
        if (data.token) {
          this.saveToken(data.token);
        }
        return data;
      })
    );
    return request;
  }

  /**
   * Function to register the new user into the database on the server
   * @param user json object of the user
   */
  public register(user: any): Observable<any> {
    console.log('[authentication.service/register()]: The data being registered:');
    console.log(user);
    // Call the request method which handle all the request for authentication
    return this.request("post", "register", user);
  }

  /**
   * Function to sign in and check if credentials are good on the server
   *
   * @param user json object of the user credentials
   */
  public login(user: any): Observable<any> {
    // Call the request method which handle all the request for authentication
    let request = this.request("post", "login", user);
    return request;
  }

  /**
   * Function to GET the user details from the database
   */
  public profile(): Observable<any> {
    // Call the request method which handle all the request for authentication
    return this.request("get", "profile");
  }

  /**
   * Function to register the new user into the database on the server
   * @param user json object of the user
   */
  public updateProfile(user: any): Observable<any> {
    // Call the request method which handle all the request for authentication
    return this.request("put", "updateProfile", user);
  }

  /**
   * Function to register the new user into the database on the server
   * @param user json object of the user
   */
  public updatePassword(password: any): Observable<any> {
    // Call the request method which handle all the request for authentication
    return this.request("put", "updatePassword", password);
  }

  /**
   * Function to log out
   */
  public logout(): void {
    this.shared.changeExperimentId("noId"); // Reinitialised the current experiment id in the session storage
    this.shared.changeShowInfo(false);
    this.notificationService.disconnectSocket(); // Disconnect the socket
    this.token = ""; // Empty the token
    window.localStorage.removeItem("mean-token"); // Remove the token from the local storage
    this.router.navigateByUrl("/"); // Redirect to the home page
  }
}
