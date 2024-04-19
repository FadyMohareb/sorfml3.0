import { Injectable } from "@angular/core";
import { BehaviorSubject } from "rxjs";
@Injectable()
@Injectable({
  providedIn: "root"
})

/**
 * Service to manage all the global variables in order to use it in different components
 */
export class SharedService {
  // Global variable of the experiment ID
  // Find if there is already a currentExperimentId load in the sessionStorage
  // This is to handle the reload page
  previousExperimentId = sessionStorage.getItem("currentExperimentId")
    ? sessionStorage.getItem("currentExperimentId")
    : "noId";
  private experimentIdSource = new BehaviorSubject(this.previousExperimentId); // Set up the source
  currentExperimentId = this.experimentIdSource.asObservable(); // Make it Observable

  // Global variable of the experiment ID
  // Find if there is already a currentExperimentId load in the sessionStorage
  // This is to handle the reload page
  previousAssetId = sessionStorage.getItem("currentAssetId")
    ? sessionStorage.getItem("currentAssetId")
    : "noId";
  private assetIdSource = new BehaviorSubject(this.previousAssetId); // Set up the source
  currentAssetId = this.assetIdSource.asObservable(); // Make it Observable

  // Global variable of to know when there is a new notification
  private newNotificationSource = new BehaviorSubject({
    indicator: false,
    author: ""
  }); // Set up the source
  newNotification = this.newNotificationSource.asObservable(); // Make it Observable

  // Global variable of to know when to reload the notification list
  private reloadNotificationSource = new BehaviorSubject(false); // Set up the source
  reloadNotification = this.reloadNotificationSource.asObservable(); // Make it Observable

  // Global variable of the path of the result of the machine learning
  // Find if there is already a path load in the sessionStorage
  // This is to handle the reload page
  previousRPath = sessionStorage.getItem("currentRPath")
    ? sessionStorage.getItem("currentRPath")
    : "";
  private rPathSource = new BehaviorSubject(this.previousRPath); // Set up the source
  currentRPath = this.rPathSource.asObservable(); // Make it Observable

  // Global variable of the show info for the experiment
  private showInfoSource = new BehaviorSubject(false); // Set up the source
  showInfo = this.showInfoSource.asObservable(); // Make it Observable

  constructor() {}

  /**
   * Function to change the global experiment id variable from a component
   * @param experimentId string of the new value to assign to experiment id
   */
  changeExperimentId(experimentId: string) {
    sessionStorage.setItem("currentExperimentId", experimentId); // Save it into the session storage to handle the reload page
    this.experimentIdSource.next(experimentId);
  }

  /**
   * Function to change the global experiment id variable from a component
   * @param assetId string of the new value to assign to asset id
   */
   changeAssetId(assetId: string) {
    sessionStorage.setItem("currentAssetId", assetId); // Save it into the session storage to handle the reload page
    this.assetIdSource.next(assetId);
  }

  /**
   * Function to change the global notification indicator from a component
   * @param indicator boolean to know if it needs to be displayed or not
   * @param author string of the name of the user who shares the experiment
   */
  changeNewNotification(indicator: boolean, author: string) {
    this.newNotificationSource.next({
      indicator: indicator,
      author: author
    });
  }

    /**
   * Function to change the global show info from a component
   * @param showInfo boolean to display the info experiment
   */
  changeReloadNotification(bool: any) {
    this.reloadNotificationSource.next(bool);
  }

  /**
   * Function to change the global show info from a component
   * @param showInfo boolean to display the info experiment
   */
  changeShowInfo(showInfo: any) {
    this.showInfoSource.next(showInfo);
  }

  /**
   * Function to change the global path from a component
   * @param path string of the path of the R Folder for the result of the ML
   */
  changeRPath(path: any) {
    sessionStorage.setItem("currentRPath", path); // Save it into the session storage to handle the reload page
    this.rPathSource.next(path);
  }
}
