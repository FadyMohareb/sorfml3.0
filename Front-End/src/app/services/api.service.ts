import { Injectable } from "@angular/core";
import { Observable, throwError } from "rxjs";
import {
  HttpClient,
  HttpHeaders,
  HttpErrorResponse
} from "@angular/common/http";
import { catchError, map } from "rxjs/operators";
import { AuthenticationService } from "./authentication.service";
import { environment } from "../../environments/environment";

// Set the http options
const httpOptions = {
  headers: new HttpHeaders({ "Content-Type": "application/json" })
};

// Constant from the environmnent file
const baseUrl = environment.urlAPI;

@Injectable({
  providedIn: "root"
})

/**
 * Service to call all the API for the experiment, dataset and metadata
 */
export class ApiService {
  constructor(private http: HttpClient, private auth: AuthenticationService) {}

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
    return throwError(error);
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

  /**
   * Function to GET all the experiments from the database
   * according to browser parameter
   *
   * @param browse String to indicate if the user want to see all, shared, public or private experiments
   */
  public getAllExperiments(browse: string): Observable<any> {
    // Create url
    let url = ``;

    // Add the browse condition to param
    if (browse === "mine" || browse === "share") {
      url =
        `${baseUrl}${"experiments"}/${browse}/` +
        this.auth.getUserDetails()._id;
    } else if (browse === "all") {
      if (this.auth.isAdmin()) {
        url = `${baseUrl}${"experiments/alladmin"}`;
      } else {
        url =
          `${baseUrl}${"experiments"}/${browse}/` +
          this.auth.getUserDetails()._id;
      }
    } else {
      url = `${baseUrl}${"experiments/public"}`;
    }

    // Call the http GET
    return this.http.get(url, httpOptions).pipe(
      map(this.extractData),
      catchError(this.handleError)
    );
  }

  /**
   * Function to GET the experiment detail according to the experiment ID
   *
   * @param id string of the experiment id selected
   */
  public getExperiment(id: string): Observable<any> {
    //Create url
    let url = `${baseUrl}${"experiment"}/${id}`;

    // Call the http GET
    return this.http.get(url, httpOptions).pipe(
      map(this.extractData),
      catchError(this.handleError)
    );
  }

  /**
   * Function to UPDATE the experiment
   *
   * @param id string of the experimet id to update
   * @param data json object of the data to update
   */
  public updateExperiment(id: string, data): Observable<any> {
    // Create url
    let url = `${baseUrl}${"experiment"}/${id}`;

    // Call the http PUT
    return this.http
      .put(url, data, httpOptions)
      .pipe(catchError(this.handleError));
  }

  /**
   * Function to DELETE the experiment
   * This will also delete the dataset, the metadata and all the notifications
   * (if there are) related to the experiment on the server side
   *
   * @param id string of the experiment id to delete
   */
  public deleteExperiment(id: string): Observable<{}> {
    // Create url
    let url = `${baseUrl}${"experiment"}/${id}`;

    // Call the http DELETE
    return this.http
      .delete(url, httpOptions)
      .pipe(catchError(this.handleError));
  }

  /**
   * Function to DELETE the experiment
   * This will also delete the dataset, the metadata and all the notifications
   * (if there are) related to the experiment on the server side
   *
   * @param id string of the experiment id to delete
   */
  public deleteModel(id: string): Observable<{}> {
    // Create url
    let url = `${baseUrl}${"deleteModel"}/${id}`;

    // Call the http DELETE
    return this.http
      .delete(url, httpOptions)
      .pipe(catchError(this.handleError));
  }

    /**
   * Function to DELETE the experiment
   * This will also delete the dataset, the metadata and all the notifications
   * (if there are) related to the experiment on the server side
   *
   * @param id string of the experiment id to delete
   */
  public deleteUser(id: string): Observable<{}> {
    // Create url
    let url = `${baseUrl}${"deleteAccount"}/${id}`;

    // Call the http DELETE
    return this.http
      .delete(url, httpOptions)
      .pipe(catchError(this.handleError));
  }

  /**
   * Function to CREATE the experiment
   * This will also create the dataset, the metadata and all the
   * notifications (if the experiment is shared) related to the experiment
   * on the server side and send notification to the connected user
   *
   * @param data json object of the experiment with dataset, metadata files
   */
  public postExperiment(data): Observable<any> {
    // Create url
    let url = `${baseUrl}${"experiment"}`;

    // Call the http POST
    return this.http
      .post(url, data, httpOptions)
      .pipe(catchError(this.handleError));
  }

  /**
   * Function to register a new product
   *
   * @param data json object of product info
   */
   public postProductRegistration(data): Observable<any> {
    // Create url
    let url = `${baseUrl}${"tracking/registerproduct"}`;

    // Call the http POST
    return this.http
      .post(url, data, httpOptions)
      .pipe(catchError(this.handleError));
  }

    /**
   * Function to auto register samples to blockchain
   *
   * @param data json object of product info
   */
     public postSampleRegistration(data): Observable<any> {
      // Create url
      let url = `${baseUrl}${"tracking/registersamples"}`;
  
      // Call the http POST
      return this.http
        .post(url, data, httpOptions)
        .pipe(catchError(this.handleError));
    }

  //  /**
  //  * Function to get users assets
  //  *
  //  * @param data json object of product info
  //  */
  //  public getallassets(data): Observable<any> {
  //   // Create url
  //   let url = `${baseUrl}${"tracking/getassets"}`;

  //   // Call the http POST
  //   return this.http
  //     .post(url, data, httpOptions)
  //     .pipe(catchError(this.handleError));
  // }

  /**
   * Function to create keypair
   *
   * @param data json object of product info
   */
   public postCreateKeypair(data): Observable<any> {
    // Create url
    let url = `${baseUrl}${"tracking/createkeypair"}`;

    // Call the http POST
    return this.http
      .post(url, data, httpOptions)
      .pipe(catchError(this.handleError));
  }

  /**
   * Function to check keypair
   *
   * @param data json object of product info
   */
   public postCheckKeypair(data): Observable<any> {
    // Create url
    let url = `${baseUrl}${"tracking/checkkeypair"}`;

    // Call the http POST
    return this.http
      .post(url, data, httpOptions)
      .pipe(catchError(this.handleError));
  }

    /**
   * Function to check keypair
   *
   * @param data Json object containing the user Id from jwt
   */
    public checkUserExist(data): Observable<any> {
      // Create url
      let url = `${baseUrl}${"tracking/checkUserExists"}`;

      // Call the http POST
      return this.http
        .post(url, data, httpOptions)
        .pipe(catchError(this.handleError));
    }


  /**
   * Function to heck product ownership 
   *
   * @param data json object of product info
   */
   public postCheckOwnership(data): Observable<any> {
    // Create url
    let url = `${baseUrl}${"tracking/checkownership"}`;

    // Call the http POST
    return this.http
      .post(url, data, httpOptions)
      .pipe(catchError(this.handleError));
  }

  /**
 * Function to register a new user in the blockchain layer
 *
 * @param data json object of product info
 */
  public postRegisterNewUser(data):Observable<any> {
    console.log("[api.service.ts/postRegisterNewUser()]: Argument:");
    console.log(data);

    let url = `${baseUrl}${"tracking/registerNew"}`;
    return this.http
    .post(url, data, httpOptions)
    .pipe(catchError(this.handleError));
  }

  /**
 * Function to transfer asset ownership
 *
 * @param data json object of product info
 */
    public postTransferOwnership(data): Observable<any> {
    // Create url
    let url = `${baseUrl}${"tracking/transferownership"}`;

    // Call the http POST
    return this.http
      .post(url, data, httpOptions)
      .pipe(catchError(this.handleError));
  }

/**
   * Function to update location
   *
   * @param data json object of product info
   */
  public postUpdateLocation(data): Observable<any> {
  // Create url
  let url = `${baseUrl}${"tracking/updatelocation"}`;

  // Call the http POST
  return this.http
    .post(url, data, httpOptions)
    .pipe(catchError(this.handleError));
}

/**
   * Function to link and experiment
   *
   * @param data json object of product info
   */
    public postLinkExperiment(data): Observable<any> {
    // Create url
    let url = `${baseUrl}${"tracking/linkexperiment"}`;

    // Call the http POST
    return this.http
      .post(url, data, httpOptions)
      .pipe(catchError(this.handleError));
  }

  /**
   * Function to CREATE the regression
   *
   * @param data json object of the options for the regression
   */
  public postNewRegML(data): Observable<any> {
    // Create url
    let url = `${baseUrl}${"experiment/newregml"}`;

    // Call the http POST
    return this.http
      .post(url, data, httpOptions)
      .pipe(catchError(this.handleError));
  }

   /**
   * Function to run new classification
   *
   * @param data json object of the options for the regression
   */
    public postNewClassML(data): Observable<any> {
      // Create url
      let url = `${baseUrl}${"experiment/newclassml"}`;
  
      // Call the http POST
      return this.http
        .post(url, data, httpOptions)
        .pipe(catchError(this.handleError));
    }

  /**
   * Function to PERFORM the regression from a train model
   *
   * @param data json object of the options for the regression
   */
  public postTrainML(data): Observable<any> {
    // Create url
    let url = `${baseUrl}${"experiment/trainml"}`;

    // Call the http POST
    return this.http
      .post(url, data, httpOptions)
      .pipe(catchError(this.handleError));
  }

  /**
   * Function to save the models selected by the user
   * @param data json object of the models with extra info
   */
  public postModel(data): Observable<any> {
    // Create url
    let url = `${baseUrl}${"experiment/model"}`;

    // Call the http POST
    return this.http
      .post(url, data, httpOptions)
      .pipe(catchError(this.handleError));
  }

  /**
   * Function to get all the models according to the parameters
   * @param params Json object of the parameters to fetch the model in DB
   */
  public getModel(params): Observable<any> {
    // Create url
    let url = `${baseUrl}${"experimentmodel"}`;

    // Call the http POST
    return this.http
      .post(url, params, httpOptions)
      .pipe(catchError(this.handleError));
  }

  /**
   * Function to get the result of the ML for a new classification
   */
  public getResultClassMLNew(path, type): Observable<any> {
    // Create url
    let url = `${baseUrl}${"experiment/resultclassMLNew"}/${type}/${path}`;

    // Call the http GET
    return this.http.get(url, httpOptions).pipe(
      map(this.extractData),
      catchError(this.handleError)
    );
  }

  /**
   * Function to get the result of the ML for a new regression
   */
   public getResultRegMLNew(path, type): Observable<any> {
    // Create url
    let url = `${baseUrl}${"experiment/resultregMLNew"}/${type}/${path}`;

    // Call the http GET
    return this.http.get(url, httpOptions).pipe(
      map(this.extractData),
      catchError(this.handleError)
    );
  }

  /**
   * Function to get the result of the ML for a new model
   */
  public getResultMLTrain(path, type): Observable<any> {
    // Create url
    let url = `${baseUrl}${"experiment/resultMLTrain"}/${type}/${path}`;

    // Call the http GET
    return this.http.get(url, httpOptions).pipe(
      map(this.extractData),
      catchError(this.handleError)
    );
  }

  /**
   * Function to GET all the users
   * This function is used to select users with who
   * the user wants to share its experiments
   */
  public getAllUsers(): Observable<any> {
    // Create url
    let url = `${baseUrl}${"users"}`;

    // Call the http GET
    return this.http.get(url, httpOptions).pipe(
      map(this.extractData),
      catchError(this.handleError)
    );
  }

  /**
   * Function get the dataset according to the experiment id
   *
   * @param id string of the experiment id to find the dataset
   */
  public getDataset(id: string): Observable<any> {
    // Create url
    let url = `${baseUrl}${"experiment/dataset"}/${id}`;

    // Call the http GET
    return this.http.get(url, httpOptions).pipe(
      map(this.extractData),
      catchError(this.handleError)
    );
  }

  /**
   * Function get all users assets
   *
   * @param id string of the user id to find the assets
   */
   public getallassets(id: string): Observable<any> {
    // Create url
    let url = `${baseUrl}${"tracking/getassets"}/${id}`;

    // Call the http GET
    return this.http.get(url, httpOptions).pipe(
      map(this.extractData),
      catchError(this.handleError)
    );
  }

   /**
   * Function get user's keypair
   *
   * @param id string of the user id to find the assets
   */
    public getKeyPair(id: string): Observable<any> {
      // Create url
      let url = `${baseUrl}${"tracking/getkeypair"}/${id}`;
  
      // Call the http GET
      return this.http.get(url, httpOptions).pipe(
        map(this.extractData),
        catchError(this.handleError)
      );
    }
  

  /**
   * Function to get the all the data according to the experiment id
   *
   * @param id string of the experiment id to find all the data related to
   */
  public getAllData(id: string): Observable<any> {
    // Create url
    let url = `${baseUrl}${"experiment/alldata"}/${id}`;

    // Call the http GET
    return this.http.get(url, httpOptions).pipe(
      map(this.extractData),
      catchError(this.handleError)
    );
  }

  /**
   * Function to get the PCA value to display the PCA
   *
   * @param id string of the dataset id to get the PCA
   */
  public getPCA(id: string, type: string): Observable<any> {
    //Create url
    let url = `${baseUrl}${"experiment/pca"}/${id}/${type}`;

    // Call the http GET
    return this.http.get(url, httpOptions).pipe(
      map(this.extractData),
      catchError(this.handleError)
    );
  }

  /**
   * Function to get the HCA value to display the HCA
   *
   * @param id string of the dataset id to get the HCA
   * @param type string of the type of the data
   */
  public getHCA(id: string, type: string): Observable<any> {
    //Create url
    let url = `${baseUrl}${"experiment/hca"}/${id}/${type}`;

    // Call the http GET
    return this.http.get(url, httpOptions).pipe(
      map(this.extractData),
      catchError(this.handleError)
    );
  }

  public getMetadataOneType(id: string, type: string): Observable<any> {
    // Create url
    let url = `${baseUrl}${"experiment/metadataOneType"}/${id}/${type}`;

    // Call the http GET
    return this.http.get(url, httpOptions).pipe(
      map(this.extractData),
      catchError(this.handleError)
    );
  }

  public downloadReport(file): Observable<any> {
    // Create url
    let url = `${baseUrl}${"/experiment/resultML/downloadReport"}`;
    var body = { filename: file };

    return this.http.post(url, body, {
      responseType: "blob",
      headers: new HttpHeaders().append("Content-Type", "application/json")
    });
  }

  public downloadQR(file): Observable<any> {
    // Create url
    let url = `${baseUrl}${"/tracking/SeeOrgTransactionHistory/downloadQR"}`;
    var body = { filename: file };

    return this.http.post(url, body, {
      responseType: "blob",
      headers: new HttpHeaders().append("Content-Type", "application/json")
    });
  }
}
