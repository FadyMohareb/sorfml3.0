import {
  Component,
  OnInit,
  OnDestroy,
  Output,
  EventEmitter,
  Input
} from "@angular/core";
import { COMMA, ENTER } from "@angular/cdk/keycodes";
import { Subscription } from "rxjs/Subscription";
import { Observable } from "rxjs/Observable";
import "rxjs/add/observable/timer";
import { MatChipInputEvent } from "@angular/material";
import { Subject } from "rxjs/Subject";
import "rxjs/add/operator/takeUntil";

import { SharedService } from "../../../services/shared.service";
import { ApiService } from "../../../services/api.service";
import { ActivatedRoute, Router } from "@angular/router";

@Component({
  selector: "app-new-classification",
  templateUrl: "./new-classification.component.html",
  styleUrls: ["./new-classification.component.css"]
})
export class NewClassificationComponent implements OnInit, OnDestroy {
  destroy$: Subject<boolean> = new Subject<boolean>();
  @Output()
  emitSpinner: EventEmitter<boolean> = new EventEmitter<boolean>();
  @Output()
  emitError: EventEmitter<any> = new EventEmitter<any>();
  @Input()
  title: any;
  @Input()
  is_metaFile: any; 
  @Input()
  platformsList: any;

  currentExperimentId;
  subscription: Subscription;
  timer: Observable<any>;
  visible = true;
  selectable = true;
  removable = true;
  addOnBlur = true;
  svrError = false;
  readonly separatorKeysCodes: number[] = [ENTER, COMMA];
  step = 0;
  optionsChecked = false;
  logList = [{ name: "Yes", value: "TRUE" }, { name: "No", value: "FALSE" }];

  classification = {
    is_metaFile: true,
    title: "",
    experimentId: null,
    pretreatment: "raw",
    percentage: 70,
    iteration: 20,
    log: "FALSE",
    platformsList: [],
    bacteriaList: [],
    mlmList: [
      {
        nameDisplay: " XGBoost",
        name: "XGBoost",
        selected: false
      },
      {
        nameDisplay: " Linear Discriminant Analysis (LDA)",
        name: "LDA",
        selected: false
      },
      /*{
        nameDisplay: "Stepwize Linear Classification (SLC)",
        name: "SLC",
        selected: false
      },*/
      {
        nameDisplay: "Partial Least Squares Discriminant Analysis (PLSDA)",
        name: "PLSDA",
        selected: false
      },
      {
        nameDisplay: "Random Forest Classification (RFC)",
        name: "RFC",
        selected: false
      },
      {
        nameDisplay: "Support Vector Classification (SVC)",
        name: "SVC",
        selected: false
      },
      {
        nameDisplay: "k-Nearest Neighbours (KNN)",
        name: "KNN",
        selected: false
      }
    ],
    svr: {
      cost: [1, 4, 7, 10, 13, 16, 19, 30, 50, 70, 90, 110],
      epsilon: [0, 0.03, 0.06, 0.09, 0.2, 0.3, 0.6, 0.9],
      gamma: [0, 0.02, 0.04, 0.06, 0.1, 0.2, 0.3, 0.6]
    },
    trees: 'repeatedcv',
    kForKNN: 10
  };

  constructor(
    private router: Router,
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
    this.emitSpinner.emit(true);
    this.classification.title = this.title;
    this.classification.platformsList = this.platformsList;
  }

  submit() {
    // Check if svr options are filled
    if (
      this.classification.mlmList[4].selected === true &&
      (this.classification.svr.cost.length === 0 ||
        this.classification.svr.epsilon.length === 0 ||
        this.classification.svr.gamma.length === 0)
    ) {
      this.svrError = true;
      this.timer = Observable.timer(5000); // 5000 millisecond means 5 seconds
      this.subscription = this.timer.subscribe(() => {
        // set svrError to false to hide div from view after 5 seconds
        this.svrError = false;
      });
    } else {
      // No error submit the classification
      this.svrError = false;
      this.emitSpinner.emit(false);
      this.classification.experimentId = this.currentExperimentId;
      this.classification.is_metaFile = this.is_metaFile;
      console.log("CLASSIFICATION", this.classification);
      this.api
        .postNewClassML(this.classification)
        .takeUntil(this.destroy$)
        .subscribe(
          res => {
            this.emitSpinner.emit(true);
            this.shared.changeRPath(res[0]);
            this.router.navigateByUrl(
              "experiment/resultml/" +
                this.classification.title +
                "/new/" +
                res[1] +
                "/" +
                this.is_metaFile +
                "/" +
                this.currentExperimentId
            );
          },
          err => {
            this.emitSpinner.emit(true);
            alert("Error to perform the classification");
            console.log(err);
          }
        );
    }
  }

  /**
   * Function to check if at least one option has been selected in each colomn
   */
  checkOptions() {
    let list = [this.classification.platformsList, this.classification.mlmList];
    for (let i = 0; i < 2; i++) {
      let index = list[i].findIndex(function(item, k) {
        return item.selected == true;
      });
      if (index === -1) {
        this.optionsChecked = false;
        break;
      } else {
        this.optionsChecked = true;
      }
    }
  }

  /**
   * Function to select or unselect all the checkboxes
   *
   * @param index Number to know which list to update
   * @param event Event to know if it is true or false (select or unselect)
   */
  selectAll(index, event) {
    switch (index) {
      case 0:
        for (let platform of this.classification.platformsList) {
          platform.selected = event.checked;
        }
        break;
      case 1:
        for (let bacteria of this.classification.bacteriaList) {
          bacteria.selected = event.checked;
        }
        break;
      case 2:
        for (let mlm of this.classification.mlmList) {
          mlm.selected = event.checked;
        }
        break;
      default:
        break;
    }
  }

  /**
   * Function to add element to the SVR object
   *
   * @param event Value
   * @param key Name of the list to add in the object
   */
  add(event: MatChipInputEvent, key): void {
    const input = event.input;
    const value = parseFloat(event.value.trim());

    // Add element to the proper list
    if (value) {
      this.classification.svr[key].push(value);
    }

    // Reset the input value
    if (input) {
      input.value = "";
    }
  }

  remove(value, key): void {
    const index = this.classification.svr[key].indexOf(value);

    if (index >= 0) {
      this.classification.svr[key].splice(index, 1);
    }
  }

  ngOnDestroy() {
    this.destroy$.next(true);
    // Now let's also unsubscribe from the subject itself:
    this.destroy$.unsubscribe();
  }

  setStep(index: number) {
    this.checkOptions();
    this.step = index;
  }

  nextStep() {
    this.step++;
  }

  prevStep() {
    this.step--;
  }
}
