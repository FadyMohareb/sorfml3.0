import { Component, OnInit, OnDestroy } from "@angular/core";
import { ApiService } from "../../services/api.service";
import { Router, ActivatedRoute } from "@angular/router";
import { AuthenticationService } from "../../services/authentication.service";
import { SharedService } from "../../services/shared.service";
import { Subject } from "rxjs/Subject";
import "rxjs/add/operator/takeUntil";

@Component({
  selector: "app-experiment-detail",
  templateUrl: "./experiment-detail.component.html",
  styleUrls: ["./experiment-detail.component.scss"]
})
export class ExperimentDetailComponent implements OnInit, OnDestroy {
  destroy$: Subject<boolean> = new Subject<boolean>();
  experiment = {};
  author = {};
  display = false;
  currentExperimentId: string;
  visible: string;
  showError = false;

  constructor(
    private api: ApiService,
    private router: Router,
    private route: ActivatedRoute,
    private auth: AuthenticationService,
    private shared: SharedService
  ) {}

  ngOnInit() {
    this.shared.changeShowInfo(false);
    this.shared.changeExperimentId(this.route.snapshot.params["experimentid"]);
    this.shared.currentExperimentId
      .takeUntil(this.destroy$)
      .subscribe(experimentId => (this.currentExperimentId = experimentId));
    this.getExperimentDetails(this.currentExperimentId);
  }

  getExperimentDetails(experimentid) {
    this.api
      .getExperiment(experimentid)
      .takeUntil(this.destroy$)
      .subscribe(
        data => {
          this.showError = false;
          this.experiment = data;
          this.author = data["author_id"];
          this.visibility(data);
          this.display = true;
        },
        err => {
          this.shared.changeExperimentId("noId");
          this.showError = true;
          this.display = true;
          console.log(err);
        }
      );
  }

  deleteExperiment(id) {
    this.shared.changeExperimentId("noId");
    this.api
      .deleteExperiment(id)
      .takeUntil(this.destroy$)
      .subscribe(
        res => {
          this.router.navigate(["experiments/all"]);
        },
        err => {
          alert("Error while deleting the experiment");
          console.log(err);
        }
      );
  }

  visibility(data) {
    if (data.is_public) {
      this.visible = "Public";
    } else {
      if (data.user_permission.length == 0) {
        this.visible = "Private";
      } else {
        this.visible = "Shared with:";
        for (let user of data.user_permission) {
          this.visible += " " + user.firstname + " " + user.lastname + ",";
        }
        this.visible = this.visible.slice(0, -1);
      }
    }
  }

  redirect() {
    let url = "experiment/modify/" + this.currentExperimentId;
    this.router.navigate([url]);
  }

  ngOnDestroy() {
    this.destroy$.next(true);
    // Now let's also unsubscribe from the subject itself:
    this.destroy$.unsubscribe();
  }
}
