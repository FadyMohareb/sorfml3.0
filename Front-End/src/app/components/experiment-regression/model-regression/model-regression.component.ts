import {
  Component,
  Output,
  EventEmitter,
  Input,
  OnInit,
  OnDestroy
} from "@angular/core";
import { SharedService } from "../../../services/shared.service";
import { ActivatedRoute, Router } from "@angular/router";
import { ApiService } from "../../../services/api.service";
import { saveAs } from "file-saver";
import { Subject } from "rxjs/Subject";
import "rxjs/add/operator/takeUntil";

@Component({
  selector: "app-model-regression",
  templateUrl: "./model-regression.component.html",
  styleUrls: ["./model-regression.component.css"]
})
export class ModelRegressionComponent implements OnInit, OnDestroy {
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

  private gridApi;
  private gridColumnApi;
  rowData: any[];
  columnDefs;
  overlayNoRowsTemplate;

  mlmList = ["XGBoost","OLS","PCR","PLS","RFR","SVR-Radial","SVR-Polynomial","KNN","SR","NN","ER","LR","RT","RR"];

  constructor(
    private shared: SharedService,
    private api: ApiService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.columnDefs = [
      {
        headerName: "Type",
        field: "type"
      },
      {
        headerName: "Platform",
        field: "platform"
      },
      {
        headerName: "Bacteria",
        field: "bacteria"
      },
      {
        headerName: "Machine Learning",
        field: "ml"
      },
      {
        headerName: "Pretreatment",
        field: "pretreatment"
      },
      {
        headerName: "RMSE",
        field: "RMSE",
        filter: "agNumberColumnFilter"
      },
      {
        headerName: "Accuracy (%)",
        field: "Acc",
        filter: "agNumberColumnFilter"
      },
      {
        headerName: "Af",
        field: "Af",
        filter: "agNumberColumnFilter"
      },
      {
        headerName: "Bf",
        field: "Bf",
        filter: "agNumberColumnFilter"
      },
      {
        headerName: "Delta max",
        field: "Delta",
        filter: "agNumberColumnFilter"
      },
      {
        headerName: "ML Options",
        field: "options",
        default: "No options"
      },
      {
        headerName: "Actions",
        suppressMenu: true,
        suppressSorting: true,
        suppressFilter: true,
        autoHeight: true,
        width: 350,
        pinned: "right",
        template: `
        <div class="button-row">
          <button class="btn btn-success" data-action-type="view">
            <i class="fa fa-eye"></i>
          </button>
          <button class="btn btn-warning" data-action-type="download">
            <i class="fa fa-arrow-circle-down"></i>
          </button>
          <button class="btn btn-primary" data-action-type="run">
            <i class="fa fa-caret-right"></i>
          </button>
        </div>`
      }
    ];
    this.overlayNoRowsTemplate =
      "<span>No model fits for this experiment.</span>";
  }

  ngOnInit() {
    this.shared.changeExperimentId(this.route.snapshot.params["experimentid"]);
    this.shared.changeRPath("");
    this.shared.currentExperimentId
      .takeUntil(this.destroy$)
      .subscribe(experimentId => (this.currentExperimentId = experimentId));

    let params = {
      bacteriaList: this.bacteriaList,
      platformsList: this.platformsList,
      type: "regression"
    };

    this.api
      .getModel(params)
      .takeUntil(this.destroy$)
      .subscribe(
        res => {
          this.emitSpinner.emit(true);
          this.shared.changeShowInfo(true);
          let data = this.filter(res);
          this.rowData = data;
        },
        err => {
          this.emitSpinner.emit(true);
          this.shared.changeShowInfo(false);
          this.emitError.emit({ show: false, title: "", message: "" });
        }
      );
  }

  onGridReady(params) {
    this.gridApi = params.api;
    this.gridColumnApi = params.columnApi;
    this.gridApi.rowHeight = 50;
    this.gridApi.sizeColumnsToFit();
  }

  ngOnDestroy() {
    this.destroy$.next(true);
    // Now let's also unsubscribe from the subject itself:
    this.destroy$.unsubscribe();
  }

  onRowClicked(e) {
    if (e.event.target !== undefined) {
      let data = e.data;
      let actionType = e.event.target.getAttribute("data-action-type");

      switch (actionType) {
        case "view":
          return this.onActionViewClick(data);
        case "run":
          return this.onActionRunClick(data);
        case "download":
          return this.onActionDownloadClick(data);
      }
    }
  }

  onActionViewClick(data: any) {
    let url = window.location.origin;
    if (url == "http://elvis.misc.cranfield.ac.uk") {
      url += "/sorfML";
    }
    url += "/experiment/detail/" + data.experiment_id;
    let win = window.open(url, "_blank");
    win.focus();
  }

  onActionDownloadClick(data: any) {
    let filename = data.pathPDFReport;
    this.api
      .downloadReport(data.pathPDFReport)
      .takeUntil(this.destroy$)
      .subscribe(
        data => {
          saveAs(data, filename);
        },
        err => {
          alert("Problem while downloading the file.");
          console.error(err);
        }
      );
  }

  onActionRunClick(data: any) {
    this.emitSpinner.emit(false);
    data.is_metaFile = this.is_metaFile;
    this.api
      .postTrainML(data)
      .takeUntil(this.destroy$)
      .subscribe(
        res => {
          console.log(res);
          this.emitSpinner.emit(true);
          this.shared.changeRPath(res[0]);
          this.router.navigateByUrl(
            "experiment/resultml/regression/train/" +
              res[1] +
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

  filter(rowList) {
    for (let row of rowList) {
      for (let key in row) {
        switch (key) {
          case "RMSE":
            row[key] = parseFloat(row[key]);
            break;
          case "Acc":
            row[key] = parseFloat(row[key]);
            break;
          case "$\\Delta_{max}$":
            row[key] = parseFloat(row[key]);
            break;
          case "$A_{f}$":
            row[key] = parseFloat(row[key]);
            break;
          case "$B_{f}$":
            row[key] = parseFloat(row[key]);
            break;
          case "position":
            row[key] = parseInt(row[key]);
            break;
          default:
            break;
        }
      }
    }
    return rowList;
  }
}
