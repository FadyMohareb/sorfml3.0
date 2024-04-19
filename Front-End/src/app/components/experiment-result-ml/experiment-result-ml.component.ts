import { Component, OnInit, OnDestroy } from "@angular/core";
import { ApiService } from "../../services/api.service";
import { ActivatedRoute, Router } from "@angular/router";
import { SharedService } from "../../services/shared.service";
import { saveAs } from "file-saver";
import { AuthenticationService } from "../../services/authentication.service";
import { Subject } from "rxjs/Subject";
import "rxjs/add/operator/takeUntil";
import { ignoreElements } from "rxjs/operators";

@Component({
  selector: "app-experiment-result-ml",
  templateUrl: "./experiment-result-ml.component.html",
  styleUrls: ["./experiment-result-ml.component.css"]
})
export class ExperimentResultMLComponent implements OnInit, OnDestroy {
  objectKeys = Object.keys;
  destroy$: Subject<boolean> = new Subject<boolean>();
  columnDefs: any = [];
  currentExperimentId;
  rowData: any = [];
  error = { show: false, title: "", message: "" };
  currentRPath = "";
  rowSelection;
  type: any;
  model: any;
  pretreatment: any;
  is_metaFile: any;
  table = false;
  display = false;
  showError = false;
  previousResult = {};
  currentResult = {};
  info = {};
  private gridApi;
  private gridColumnApi;

  constructor(
    private api: ApiService,
    private route: ActivatedRoute,
    private router: Router,
    private shared: SharedService,
    public auth: AuthenticationService
  ) {
    this.rowSelection = "multiple";
    this.type = this.route.snapshot.params["type"];
    this.model = this.route.snapshot.params["model"];
    this.is_metaFile = this.route.snapshot.params["ismetafile"];
    this.pretreatment = this.route.snapshot.params["pretreatment"];
    if (this.model === "new") {
      this.table = true;
      this.columnDefs = this.setColumn(this.type);
    }
  }

  ngOnInit() {
    this.shared.changeExperimentId(this.route.snapshot.params["experimentid"]);
    this.shared.changeShowInfo(true);
    this.shared.currentExperimentId
      .takeUntil(this.destroy$)
      .subscribe(experimentId => (this.currentExperimentId = experimentId));
    this.currentRPath = sessionStorage.getItem("currentRPath");
    if (this.model === "new") {
      if(this.type == 'regression'){
        this.api
        .getResultRegMLNew(encodeURIComponent(this.currentRPath), this.type)
        .subscribe(
          res => {
            this.shared.changeShowInfo(true);
            let data = this.filter(res);
            this.rowData = data;
            this.display = true;
            console.log(this.rowData);
          },
          err => {
            this.shared.changeRPath("");
            this.error = {
              show: true,
              title: "Error to display the result.",
              message:
                "The output of the regression or classification is not readable.<br/>Check the console."
            };
            this.display = true;
            console.log(err);
          }
        );
      } else {
        this.api
        .getResultClassMLNew(encodeURIComponent(this.currentRPath), this.type)
        .subscribe(
          res => {
            this.shared.changeShowInfo(true);
            let data = this.filter(res);
            this.rowData = data;
            this.display = true;
            console.log(this.rowData);
          },
          err => {
            this.shared.changeRPath("");
            this.error = {
              show: true,
              title: "Error to display the result.",
              message:
                "The output of the regression or classification is not readable.<br/>Check the console."
            };
            this.display = true;
            console.log(err);
          }
        );
      }
      
    } else if (this.model == "train" && this.is_metaFile == "true") {
      this.api
        .getResultMLTrain(encodeURIComponent(this.currentRPath), this.type)
        .subscribe(
          res => {
            this.shared.changeShowInfo(true);
            this.previousResult = res[1];
            this.currentResult = res[0];
            this.info = res[2];
            this.display = true;
          },
          err => {
            this.shared.changeRPath("");
            this.error = {
              show: true,
              title: "Error to display the result.",
              message:
                "The output of the regression or classification is not readable.<br/>Check the console."
            };
            this.display = true;
            console.log(err);
          }
        );
    } else if (this.model == "train" && this.is_metaFile == "false") {
      this.api
        .getResultMLTrain(encodeURIComponent(this.currentRPath), this.type)
        .subscribe(
          res => {
            this.shared.changeShowInfo(true);
            this.previousResult = res[0];
            this.info = res[1];
            this.display = true;
          },
          err => {
            this.shared.changeRPath("");
            this.error = {
              show: true,
              title: "Error to display the result.",
              message:
                "The output of the regression or classification is not readable.<br/>Check the console."
            };
            this.display = true;
            console.log(err);
          }
        );
    }
  }

  onGridReady(params) {
    this.gridApi = params.api;
    this.gridColumnApi = params.columnApi;
    this.gridApi.sizeColumnsToFit();
  }

  save() {
    this.display = false;
    let selectedRows = this.gridApi.getSelectedRows();
    let model = {
      experimentid: this.currentExperimentId,
      type: this.type,
      model: selectedRows,
      path: this.currentRPath,
      pretreatment: this.pretreatment
    };
    console.log(model);
    this.api
      .postModel(model)
      .takeUntil(this.destroy$)
      .subscribe(
        res => {
          this.display = true;
          let url = "experiment/detail/" + this.currentExperimentId;
          this.router.navigate([url]);
        },
        err => {
          this.display = true;
          alert("Error to save the model(s).");
          console.log(err);
        }
      );
  }

  download() {
    let filename;
    if (this.model === "new") {
      filename = this.currentRPath + "report.pdf";
    } else {
      filename = this.currentRPath + "report.csv";
    }

    this.api
      .downloadReport(filename)
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

  setColumn(type): any[] {
    let column = [];
    column.push(
      {
        headerName: "Rank #",
        field: "rank",
        width: 120,
        minWidth: 120,
        sort: "asc",
        checkboxSelection: true,
        filter: "agNumberColumnFilter"
      },
      {
        headerName: "Platform",
        field: "platform"
      }
    );
    if (type == "regression") {
      column.push(
        {
          headerName: "Bacteria",
          field: "bacteria"
        },
        {
          headerName: "ML Method",
          field: "method"
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
          headerName: "k",
          field: "k"
        }
      );
    } else {
      column.push(
        {
          headerName: "ML Method",
          field: "method"
        },
        {
          headerName: 'Accuracy',
          field: "Accuracy",
          filter: "agNumberColumnFilter"
        },
        {
          headerName: "Precision",
          field: "Precision"
        },
        {
          headerName: "Recall",
          field: "Recall"
        },
        {
          headerName: "F1",
          field: "F1"
        }
      );
    }

    return column;
  }

  setRow(values, firstColumn): any[] {
    let row = [];
    for (let value of values) {
      let temp = value.sample;
      temp[firstColumn] = value.name;
      row.push(temp);
    }
    return row;
  }

  ngOnDestroy() {
    this.destroy$.next(true);
    // Now let's also unsubscribe from the subject itself:
    this.destroy$.unsubscribe();
  }

  filter(rowList) {
    for (let row of rowList) {
      // console.log(row);
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
    console.log(rowList);
    return rowList;
  }
}
