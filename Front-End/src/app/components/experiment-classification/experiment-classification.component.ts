import { Component, OnInit, OnDestroy } from "@angular/core";
import { SharedService } from "../../services/shared.service";
import { ApiService } from "../../services/api.service";
import { ActivatedRoute } from "@angular/router";
import { Subject } from "rxjs/Subject";
import "rxjs/add/operator/takeUntil";

@Component({
  selector: "app-experiment-classification",
  templateUrl: "./experiment-classification.component.html",
  styleUrls: ["./experiment-classification.component.css"]
})
export class ExperimentClassificationComponent implements OnInit, OnDestroy {
  destroy$: Subject<boolean> = new Subject<boolean>();
  currentExperimentId;
  err = { show: false, title: "", message: "" };
  hiddenSpinner = false;
  new = false;
  model = false;
  is_metaFile = false;
  platforms = [];
  title = "";

  constructor(
    private shared: SharedService,
    private api: ApiService,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.shared.changeExperimentId(this.route.snapshot.params["experimentid"]);
    this.shared.changeRPath("");
    this.shared.currentExperimentId
      .takeUntil(this.destroy$)
      .subscribe(experimentId => (this.currentExperimentId = experimentId));

    this.title = this.route.snapshot.params["type"];

    // Find the platform and the type of bacteria
    // Check if the experiment id exists at the same time
    this.api
      .getAllData(this.currentExperimentId)
      .takeUntil(this.destroy$)
      .subscribe(
        data => {
          for (let item of data.datasetMetaList) {
            if (item.is_metadata === false) {
              this.platforms.push({
                name: item.type,
                selected: false
              });
            } else if (
              item.type === "sensoryScore" &&
              this.title === "sensory"
            ) {
              this.is_metaFile = true;
            } else if (
              item.type === "authenticityClass" &&
              this.title === "authenticity"
            ) {
              this.is_metaFile = true;
            }
          }
          this.hiddenSpinner = true;
          this.shared.changeShowInfo(true);
          this.err = { show: false, title: "", message: "" };
        },
        err => {
          this.hiddenSpinner = true;
          this.shared.changeExperimentId("noId");
          this.shared.changeShowInfo(false);
          this.err = {
            show: true,
            title: "No Experiment Found.",
            message:
              "The experiment as been deleted by the author or there is a problem with the server.<br/>Check the console."
          };
          console.log(err);
        }
      );
  }

  displayComponent(flag) {
    // this.hiddenSpinner = false;
    if (flag) {
      this.new = true;
    } else {
      this.model = true;
    }
  }

  spinner(hidden: boolean) {
    this.hiddenSpinner = hidden;
  }

  error(err: any) {
    this.err = err;
  }

  ngOnDestroy() {
    this.destroy$.next(true);
    // Now let's also unsubscribe from the subject itself:
    this.destroy$.unsubscribe();
  }
}
