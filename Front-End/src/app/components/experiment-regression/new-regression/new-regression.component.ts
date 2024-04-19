import { Component, OnInit, OnDestroy, Output, EventEmitter, Input } from "@angular/core";
import { COMMA, ENTER } from "@angular/cdk/keycodes";
import { Subscription } from "rxjs/Subscription";
import { Observable } from "rxjs/Observable";
import "rxjs/add/observable/timer";
import { MatChipList } from "@angular/material";
import { MatChipInputEvent } from '@angular/material/chips';
import { Subject } from "rxjs/Subject";
import "rxjs/add/operator/takeUntil";

import { SharedService } from "../../../services/shared.service";
import { ApiService } from "../../../services/api.service";
import { ActivatedRoute, Router } from "@angular/router";

@Component({
  selector: "app-new-regression",
  templateUrl: "./new-regression.component.html",
  styleUrls: ["./new-regression.component.css"]
})
export class NewRegressionComponent implements OnInit, OnDestroy {
  destroy$: Subject<boolean> = new Subject<boolean>();
  @Output()
  emitSpinner: EventEmitter<boolean> = new EventEmitter<boolean>();
  @Output()
  emitError: EventEmitter<any> = new EventEmitter<any>();
  @Input()
  bacteriaList: any;
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

  regression = {
    is_metaFile: true,
    title: "regression",
    experimentId: null,
    pretreatment: "raw",
    percentage: 70,
    iteration: 20,
    log: "FALSE",
    platformsList: [],
    bacteriaList: [],
    mlmList: [
      {
        nameDisplay: "XGBoost (XGBoost)",
        name: "XGBoost",
        selected: false
      },
      {
        nameDisplay: "Ordinary Least Squares Regression (OLS)",
        name: "OLS",
        selected: false
      },
      {
        nameDisplay: "Principal Component Regression (PCR)",
        name: "PCR",
        selected: false
      },
      {
        nameDisplay: "Partial Least Squares Regression (PLS)",
        name: "PLS",
        selected: false
      },
      {
        nameDisplay: "Random Forest Regression (RFR)",
        name: "RFR",
        selected: false
      },
      {
        nameDisplay: "Support Vector Regression Radial (SVR-Radial)",
        name: "SVR-Radial",
        selected: false
      },
      /*{
        nameDisplay: "Support Vector Regression Polynomial (SVR-Polynomial)",
        name: "SVR-Polynomial",
        selected: false
      },*/
      {
        nameDisplay: "k-Nearest Neighbours (KNN)",
        name: "KNN",
        selected: false
      },
      {
        nameDisplay: "Stepwise Regression (SR)",
        name: "SR",
        selected: false
      },
      {
        nameDisplay: "Neural Network (NN)",
        name: "NN",
        selected: false
      },
      {
        nameDisplay: "Elastic Regression (ER)",
        name: "ER",
        selected: false
      },
      {
        nameDisplay: "Ridge Regression (RR)",
        name: "RR",
        selected: false
      },
      {
        nameDisplay: "Lasso Regression (LR)",
        name: "LR",
        selected: false
      },
      {
        nameDisplay: "Regression Tree (RT)",
        name: "RT",
        selected: false
      },
    ],
    svr: {
      cost: [1, 4, 7, 10, 13, 16, 19, 30, 50, 70, 90, 110],
      epsilon: [0, 0.03, 0.06, 0.09, 0.2, 0.3, 0.6, 0.9],
      gamma: [0, 0.02, 0.04, 0.06, 0.1, 0.2, 0.3, 0.6],
      selectedCost: [],
      selectedEpsilon: [],
      selectedGamma: []
    },
    trees: 200,
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
    this.regression.bacteriaList = this.bacteriaList;
    this.regression.platformsList = this.platformsList;
  }

  submit() {
    // Check if svr options are filled
    if (
      this.regression.mlmList[6].selected === true &&
      (this.regression.svr.selectedCost.length === 0 ||
        this.regression.svr.selectedEpsilon.length === 0 ||
        this.regression.svr.selectedGamma.length === 0)
    ) {
      this.svrError = true;
      this.timer = Observable.timer(5000); // 5000 millisecond means 5 seconds
      this.subscription = this.timer.subscribe(() => {
        // set svrError to false to hide div from view after 5 seconds
        this.svrError = false;
      });
    } else {
      // No error submit the regression
      this.svrError = false;
      this.emitSpinner.emit(false);
      this.regression.experimentId = this.currentExperimentId;
      this.regression.is_metaFile = this.is_metaFile;
      console.log("REGRESSION", this.regression);
      this.api
        .postNewRegML(this.regression)
        .takeUntil(this.destroy$)
        .subscribe(
          res => {
            this.emitSpinner.emit(true);
            this.shared.changeRPath(res[0]);
            this.router.navigateByUrl(
              "experiment/resultml/regression/new/" +
              res[1] + // pretreatment
                "/" +
                this.is_metaFile +
                "/" +
                this.currentExperimentId
            );
          },
          err => {
            this.emitSpinner.emit(true);
            console.log("ERROR", err);
            alert("Error to perform the regression");
          }
        );
    }
  }

  toggleSVROption(option: string, value: number, event: MatChipInputEvent, chipList: MatChipList) {
    if (option === 'cost') {
      if (this.regression.svr.selectedCost.includes(value)) {
        this.regression.svr.selectedCost = this.regression.svr.selectedCost.filter(c => c !== value);
      } else {
        this.regression.svr.selectedCost.push(value);
      }
    } else if (option === 'epsilon') {
      if (this.regression.svr.selectedEpsilon.includes(value)) {
        this.regression.svr.selectedEpsilon = this.regression.svr.selectedEpsilon.filter(e => e !== value);
      } else {
        this.regression.svr.selectedEpsilon.push(value);
      }
    } else if (option === 'gamma') {
      if (this.regression.svr.selectedGamma.includes(value)) {
        this.regression.svr.selectedGamma = this.regression.svr.selectedGamma.filter(g => g !== value);
      } else {
        this.regression.svr.selectedGamma.push(value);
      }
    }
  // Reset the input value
  if (event) {
    (event as MatChipInputEvent).input.value = "";
    chipList.focus();
  }
  }

  toggleTreesOption(value: number) {
    if (this.regression.trees === value) {
      this.regression.trees = null;
    } else {
      this.regression.trees = value;
    }
  }

  toggleKNNOption(value: number) {
    if (this.regression.kForKNN === value) {
      this.regression.kForKNN = null;
    } else {
      this.regression.kForKNN = value;
    }
  }

  /**
   * Function to check if at least one option has been selected in each column
   */
  checkOptions() {
    let list = [
      this.regression.platformsList,
      this.regression.bacteriaList,
      this.regression.mlmList
    ];
    for (let i = 0; i < 3; i++) {
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
        for (let platform of this.regression.platformsList) {
          platform.selected = event.checked;
        }
        break;
      case 1:
        for (let bacteria of this.regression.bacteriaList) {
          bacteria.selected = event.checked;
        }
        break;
      case 2:
        for (let mlm of this.regression.mlmList) {
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
      this.regression.svr[key].push(value);
    }
  
    // Reset the input value
    if (input) {
      input.value = "";
    }
  }
  

  remove(value, key): void {
    const index = this.regression.svr[key].indexOf(value);

    if (index >= 0) {
      this.regression.svr[key].splice(index, 1);
    }
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

  ngOnDestroy() {
    this.destroy$.next(true);
    // Now let's also unsubscribe from the subject itself:
    this.destroy$.unsubscribe();
  }
}

