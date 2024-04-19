import { Component, OnInit, OnDestroy } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { ApiService } from "../../services/api.service";
import { SharedService } from "../../services/shared.service";
import { Router } from "@angular/router";
import { Subject } from "rxjs/Subject";
import "rxjs/add/operator/takeUntil";

@Component({
  selector: "app-experiment-info",
  templateUrl: "./experiment-info.component.html",
  styleUrls: ["./experiment-info.component.css"]
})
export class ExperimentInfoComponent implements OnInit, OnDestroy {
  destroy$: Subject<boolean> = new Subject<boolean>();
  experiment: any = {};
  author: any = {};
  currentExperimentId: string;
  currentListData;
  currentTooltips;
  showError = false;

  constructor(
    private route: ActivatedRoute,
    private api: ApiService,
    private shared: SharedService,
    private router: Router
  ) {}

  ngOnInit() {
    this.shared.currentExperimentId
      .takeUntil(this.destroy$)
      .subscribe(currentExperimentId => {
        this.currentExperimentId = currentExperimentId;
        this.getExperimentDetails(this.currentExperimentId);
      });
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
        },
        err => {
          this.showError = true;
          console.log(err);
        }
      );
  }

  redirect() {
    let url = "experiment/detail/" + this.currentExperimentId;
    this.router.navigate([url]);
  }

  ngOnDestroy() {
    this.destroy$.next(true);
    // Now let's also unsubscribe from the subject itself:
    this.destroy$.unsubscribe();
  }
}
