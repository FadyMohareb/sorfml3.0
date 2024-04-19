import { Component, OnInit, OnDestroy } from "@angular/core";
import { SharedService } from "../../services/shared.service";
import { ActivatedRoute } from "@angular/router";
import { ApiService } from "../../services/api.service";
import { Subject } from "rxjs/Subject";
import "rxjs/add/operator/takeUntil";

@Component({
  selector: "app-experiment-regression",
  templateUrl: "./experiment-regression.component.html",
  styleUrls: ["./experiment-regression.component.css"]
})
export class ExperimentRegressionComponent implements OnInit, OnDestroy {
  destroy$: Subject<boolean> = new Subject<boolean>();
  currentExperimentId;
  err = { show: false, title: "", message: "" };
  hiddenSpinner = true;
  new = false;
  model = false;
  is_metaFile = false;
  platforms = [];
  bacterias = [];

  constructor(
    private shared: SharedService,
    private route: ActivatedRoute,
    private api: ApiService
  ) {}

  ngOnInit() {
    this.shared.changeExperimentId(this.route.snapshot.params["experimentid"]);
    this.shared.changeRPath("");
    this.shared.currentExperimentId
      .takeUntil(this.destroy$)
      .subscribe(experimentId => (this.currentExperimentId = experimentId));

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
            } else if (item.type === "bacterialCount") {
              this.is_metaFile = true;
              for (let i = 1; i < item.headers.length; i++) {
                this.bacterias.push({
                  name: item.headers[i],
                  selected: false
                });
              }
            }
          }
          this.hiddenSpinner = true;
          this.shared.changeShowInfo(true);
          this.err = { show: false, title: "", message: "" };
        },
        err => {
          this.hiddenSpinner = false;
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
