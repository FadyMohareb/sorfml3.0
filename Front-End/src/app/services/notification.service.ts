import { Injectable } from "@angular/core";
import * as io from "socket.io-client";
import { SharedService } from "./shared.service";
import { throwError, Observable } from "rxjs";
import {
  HttpClient,
  HttpHeaders,
  HttpErrorResponse
} from "@angular/common/http";
import { catchError, map } from "rxjs/operators";
import { environment } from "../../environments/environment";

// Set the http options
const httpOptions = {
  headers: new HttpHeaders({ "Content-Type": "application/json" })
};

// Constant from the environmnent file
const urlSocket = environment.urlSocket;
const urlAPI = environment.urlAPI;

@Injectable({
  providedIn: "root"
})

/**
 * Service to manage the notifications
 */
export class NotificationService {
  private socket;
  currentNotification: any;
  currentUserId: any;

  constructor(private shared: SharedService, private http: HttpClient) {}

  /**
   * Function to establish to connection between the server and the client with socket io
   *
   * @param userId string of the user id in order to save the socket of the connected user on the server
   */
  public connectSocket(userId: any) {
    this.currentUserId = userId;
    // Establish the connection and send the user id at the same time
    this.socket = io(urlSocket, { query: "userId=" + userId });

    // Listen if the server send a notification when the author's experiment
    // shares an experiment with some users connected
    this.socket.on("sendNotification", data => {
      this.shared.changeNewNotification(true, data.author_name); // Change the global indicator notification variable in order to display the toastr
    });

    // Listen to delete the notification if the author of the experiment
    // deletes the experiment while the shared user(s) is still connected
    this.socket.on("deleteNotificationFromAuthor", data => {
      this.shared.changeReloadNotification(true);
    });
  }

  /**
   * Function to disconnect the socket when a user log out
   */
  public disconnectSocket() {
    this.socket.disconnect();
  }

  /**
   * Function to GET all the notification of the user
   *
   * @param id string of the user id to find the notification in the database according to the user
   */
  public getNotification(id: string): Observable<any> {
    // Create url
    let url = `${urlAPI}${"notification"}/${id}`;

    // Call the http GET
    return this.http.get(url, httpOptions).pipe(
      map(this.extractData),
      catchError(this.handleError)
    );
  }

  /**
   * Function to delete the notification of the user
   *
   * @param experimentId string of the experiment id to find the experiment to delete in the user's notification in the database on the server
   * @param currentUserId string of the user id to find the list of notification in the user database on the server
   */
  public deleteNotification(
    experimentId: any,
    currentUserId: any
  ): Observable<any> {
    let params: any = {};
    // Assign the variables to the parameters to send in the url
    params.experimentId = experimentId;
    params.currentUserId = currentUserId;
    // Create url
    let url = `${urlAPI}${"notification"}`;

    // Call the http DELETE
    return this.http
      .delete(url, {
        headers: new HttpHeaders({ "Content-Type": "application/json" }),
        params: params
      })
      .pipe(catchError(this.handleError));
  }

  /**
   * Function to change the status of the notification ("seen") to true
   *
   * @param currentUserId string of the user id to find the notification of the user in the database on the server
   */
  public seenNotification(currentUserId: any): Observable<any> {
    let data = { currentUserId: currentUserId };
    let url = `${urlAPI}${"notification"}`;
    return this.http
      .put(url, data, httpOptions)
      .pipe(catchError(this.handleError));
  }

  /**
   * Function to handle error when the server return an error
   *
   * @param error
   */
  private handleError(error: HttpErrorResponse) {
    if (error.error instanceof ErrorEvent) {
      // A client-side or network error occurred. Handle it accordingly.
      console.error("An error occurred:", error.error.message);
    } else {
      // The backend returned an unsuccessful response code. The response body may contain clues as to what went wrong,
      console.error(
        `Backend returned code ${error.status}, ` + `body was: ${error.error}`
      );
    }
    // return an observable with a user-facing error message
    return throwError("Something bad happened; please try again later.");
  }

  /**
   * Function to extract the data when the server return some
   *
   * @param res
   */
  private extractData(res: Response) {
    let body = res;
    return body || {};
  }
}
