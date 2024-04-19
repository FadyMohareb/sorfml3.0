import { Component, OnInit, OnDestroy } from "@angular/core";
import { ApiService } from "../../services/api.service";
import { ActivatedRoute } from "@angular/router";
import { SharedService } from "../../services/shared.service";
import { Subject } from "rxjs/Subject";
import "rxjs/add/operator/takeUntil";


@Component({
  selector: "app-experiment-dataset",
  templateUrl: "./experiment-dataset.component.html",
  styleUrls: ["./experiment-dataset.component.css"]
})
export class ExperimentDatasetComponent  implements OnInit, OnDestroy {
  destroy$: Subject<boolean> = new Subject<boolean>();
  columnDefs: any = [];
  currentExperimentId;
  rowData: any = [];
  tabs: any = [];
  display = false;
  showError = false;
  private gridApiList: any = [];
  private gridApi;
  private rowSelection;

  constructor(
    private api: ApiService,
    private route: ActivatedRoute,
    private shared: SharedService
  ) {
    this.rowSelection = "multiple";
  }

  ngOnInit() {
    this.shared.changeExperimentId(this.route.snapshot.params["experimentid"]);
    this.shared.currentExperimentId.takeUntil(this.destroy$).subscribe(
      experimentId => (this.currentExperimentId = experimentId)
    );
    this.api.getDataset(this.currentExperimentId).takeUntil(this.destroy$).subscribe(
      res => {
        this.shared.changeShowInfo(true);
        for (let object of res) {
          this.tabs.push(object.type);
          this.shared.changeShowInfo(true);
          this.columnDefs.push(this.setHeader(object.headers));
          this.rowData.push(this.setRow(object.values_file, object.headers[0]));
          this.display = true;
        }
      },
      err => {
        this.shared.changeExperimentId("noId");
        this.shared.changeShowInfo(false);
        this.display = true;
        this.showError = true;
        console.log(err);
      }
    );
  }

  onGridReady(params) {
    this.gridApiList.push(params.api);
    this.gridApi = this.gridApiList[0];
  }

  onTabChanged(event) {
    this.gridApi = this.gridApiList[event.index];
  }

  exportCSV() {
    this.gridApi.exportDataAsCsv();
  }

  setHeader(headers): any[] {
    let column = [];
    for (let head of headers) {
      column.push({
        headerName: head,
        field: head
      });
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
}
