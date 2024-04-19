import { Component, OnInit, OnDestroy } from "@angular/core";
import { Router } from "@angular/router";
import { SharedService } from "../../../../services/shared.service";
import { ApiService } from "../../../../services/api.service";
import { Subject } from "rxjs/Subject";
import "rxjs/add/operator/takeUntil";

@Component({
  selector: "app-experiment-nav",
  templateUrl: "./experiment-nav.component.html",
  styleUrls: ["./experiment-nav.component.scss"]
})
export class ExperimentNavComponent implements OnInit, OnDestroy {
  destroy$: Subject<boolean> = new Subject<boolean>();
  constructor(
    public router: Router,
    private shared: SharedService,
    public api: ApiService
  ) {}

  currentExperimentId: string = "";

  appitems = [];

  ngOnInit() {
    this.shared.currentExperimentId
      .takeUntil(this.destroy$)
      .subscribe(currentExperimentId => {
        // Detect if there is any change in the experiment id to update the navbar
        if (currentExperimentId != this.currentExperimentId) {
          this.currentExperimentId = currentExperimentId;
          if (this.currentExperimentId !== "noId") {
            this.appitems = [this.resetListItem()];
          }
        } else {
          this.currentExperimentId = currentExperimentId;
        }
      });
  }

  resetListItem() {
    return {
      label: "Experiment",
      icon: "details",
      items: [
        {
          label: "View Details",
          link: "experiment/detail"
        },
        {
          label: "View Datasets",
          link: "experiment/dataset"
        },
        {
          label: "View Metadata",
          link: "experiment/metadata"
        },
        {
          label: "PCA",
          link: "experiment/pca"
        },
        {
          label: "HCA",
          link: "experiment/hca"
        },
        {
          label: "Regression",
          link: "experiment/regression"
        },
        {
          label: "Classification",
          items: [
            {
              label: "Sensory",
              link: "experiment/classification/sensory"
            },
            {
              label: "Authenticity",
              link: "experiment/classification/authenticity"
            }
          ]
        }
      ]
    };
  }

  redirect($event) {
    let url;
    if ($event.link == "home") {
      url = $event.link;
    } else {
      url = $event.link + "/" + this.currentExperimentId;
    }
    this.router.navigateByUrl(url);
  }

  ngOnDestroy() {
    this.destroy$.next(true);
    // Now let's also unsubscribe from the subject itself:
    this.destroy$.unsubscribe();
  }
}
