import { MediaMatcher } from "@angular/cdk/layout";
import { ChangeDetectorRef, Component, OnDestroy, OnInit } from "@angular/core";
import { Router } from "@angular/router";
import { AuthenticationService } from "../../services/authentication.service";
import { SharedService } from "../../services/shared.service";
import { NotificationService } from "../../services/notification.service";
import { ToastrService } from "ngx-toastr";
import { Subject } from "rxjs/Subject";
import "rxjs/add/operator/takeUntil";

@Component({
  selector: "main-nav",
  templateUrl: "./main-nav.component.html",
  styleUrls: ["./main-nav.component.scss"]
})
export class MainNavComponent implements OnInit, OnDestroy {
  destroy$: Subject<boolean> = new Subject<boolean>();
  currentExperimentId: any;
  newNotification = false;
  notification: any = [];
  showInfo;

  sidebarInfo = [
    {
      label: "Home",
      icon: "home",
      link: "home"
    },
    {
      label: "Browse Experiments",
      icon: "list",
      link: "experiments/public"
    }
  ];

  sidebarInfo_logged = [
    {
      label: "Home",
      icon: "home",
      link: "home"
    },
    {
      label: "Product Tracking",
      icon: "location_on",
      link: "tracking"
    },
    {
      label: "Create Experiment",
      icon: "create",
      link: "experiment/create"
    }
  ];

  mobileQuery: MediaQueryList;
  private _mobileQueryListener: () => void;

  constructor(
    changeDetectorRef: ChangeDetectorRef,
    media: MediaMatcher,
    public router: Router,
    public auth: AuthenticationService,
    private shared: SharedService,
    public notificationService: NotificationService,
    private toastr: ToastrService
  ) {
    this.mobileQuery = media.matchMedia("(max-width: 600px)");
    this._mobileQueryListener = () => changeDetectorRef.detectChanges();
    this.mobileQuery.addListener(this._mobileQueryListener);
    this.shared.newNotification.subscribe(data => {
      if (data.indicator) {
        this.displayNotification(data);
      }
    });
    this.shared.reloadNotification.subscribe(data => {
      if (data) {
        this.getNotification(this.auth.getUserDetails()._id, () => {
          this.shared.changeReloadNotification(false);
        });
      }
    });
  }

  ngOnInit() {
    this.shared.showInfo
      .takeUntil(this.destroy$)
      .subscribe(showInfo => (this.showInfo = showInfo));
    this.shared.currentExperimentId
      .takeUntil(this.destroy$)
      .subscribe(
        currentExperimentId => (this.currentExperimentId = currentExperimentId)
      );
    if (this.auth.isLoggedIn()) {
      let currentUserId = this.auth.getUserDetails()._id;
      this.getNotification(currentUserId, function() {});
      this.notificationService.connectSocket(currentUserId);
    } else {
      this.newNotification = false;
      this.notification = [];
    }
  }

  print() {
    console.log(this.notification);
  }

  displayNotification(data) {
    let currentUserId = this.auth.getUserDetails()._id;
    this.getNotification(currentUserId, () => {
      this.toastr.info(
        data.author + " shared an experiment with you",
        "New notification"
      );
      this.shared.changeNewNotification(false, "");
    });
  }

  deleteNotification(experimentId) {
    let currentUserId = this.auth.getUserDetails()._id;
    this.notificationService
      .deleteNotification(experimentId, currentUserId)
      .takeUntil(this.destroy$)
      .subscribe(
        res => {
          this.getNotification(currentUserId, function() {});
        },
        err => {
          console.log(err);
        }
      );
  }

  getNotification(userID, callback) {
    this.notificationService
      .getNotification(userID)
      .takeUntil(this.destroy$)
      .subscribe(
        data => {
          // Initialise the notification list
          let notificationList = [];
          // Add the value to know if there is new notification -> initialise to false
          this.newNotification = false;
          // Go through all the notification from the answer of the http GET
          for (let item of data[0].notification) {
            let info = item.experiment_id; // Assign the experiment populate from mongoose
            // Add the info to the object notif
            let notif = {
              author_name:
                info.author_id.firstname + " " + info.author_id.lastname,
              experimentId: info._id,
              experimentName: info.name,
              experimentCreationDate: info.date_creation,
              seen: item.seen
            };
            // If the notification has not been seen yet, set the value "new" of notificationList to true
            item.seen === false ? (this.newNotification = true) : null;
            notificationList.push(notif); // Add the notif object to the notification list
          }
          // Saved the notification list to the global variable thanks to the shared service
          this.notification = notificationList.slice();
          callback();
        },
        err => {
          console.log(err);
        }
      );
  }

  ngOnDestroy(): void {
    this.mobileQuery.removeListener(this._mobileQueryListener);
    this.destroy$.next(true);
    // Now let's also unsubscribe from the subject itself:
    this.destroy$.unsubscribe();
  }

  redirect($event, url) {
    if (url !== null) {
      this.router.navigateByUrl(url);
    } else {
      this.router.navigateByUrl($event.link);
    }
  }

  notificationSeen() {
    this.newNotification = false;
    this.notificationService
      .seenNotification(this.auth.getUserDetails()._id)
      .takeUntil(this.destroy$)
      .subscribe(
        res => {},
        err => {
          console.log(err);
        }
      );
  }
}
