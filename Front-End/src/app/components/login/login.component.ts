import { Component, OnInit, OnDestroy } from "@angular/core";
import { AuthenticationService } from "../../services/authentication.service";
import { Router } from "@angular/router";
import { NotificationService } from "../../services/notification.service";
import { SharedService } from "../../services/shared.service";
import { Subject } from "rxjs/Subject";
import "rxjs/add/operator/takeUntil";

@Component({
  selector: "app-login",
  templateUrl: "./login.component.html",
  styleUrls: ["./login.component.scss"]
})
export class LoginComponent implements OnInit, OnDestroy {
  destroy$: Subject<boolean> = new Subject<boolean>();
  credentials: any = {};
  success = true;

  constructor(
    private auth: AuthenticationService,
    private router: Router,
    private notificationService: NotificationService,
    private shared: SharedService
  ) {}

  ngOnInit() {
    this.shared.changeShowInfo(false);
  }

  login() {
    this.shared.changeShowInfo(false);
    this.auth
      .login(this.credentials)
      .takeUntil(this.destroy$)
      .subscribe(
        () => {
          let currentUserId = this.auth.getUserDetails()._id;
          this.shared.changeReloadNotification(true);
          this.notificationService.connectSocket(currentUserId);
          this.success = true;
          this.router.navigateByUrl("experiments/all");
        },
        err => {
          this.success = false;
          console.error(err);
        }
      );
  }

  ngOnDestroy() {
    this.destroy$.next(true);
    // Now let's also unsubscribe from the subject itself:
    this.destroy$.unsubscribe();
  }
}
