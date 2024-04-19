import { Component, OnInit } from "@angular/core";
import { Router } from "@angular/router";
import { ActivatedRoute } from "@angular/router";
import { ApiService } from "../../services/api.service";
import { SharedService } from "../../services/shared.service";

@Component({
  selector: "app-experiments-list",
  templateUrl: "./experiments-list.component.html",
  styleUrls: ["./experiments-list.component.scss"]
})
export class ExperimentsListComponent implements OnInit {
  public gridApi;
  public users: any;
  public gridColumnApi;
  public rowData: any;
  public browse: any;
  public message: any;
  display = false;
  error = { show: false, title: "", message: "" };
  public columnDefs;
  public columnTypes;

  constructor(
    public api: ApiService,
    public router: Router,
    public route: ActivatedRoute,
    public shared: SharedService
  ) {
    this.columnDefs = [
      {
        headerName: "Name",
        field: "name"
      },
      {
        headerName: "Date",
        field: "date",
        type: "dateColumn"
      },
      {
        headerName: "Author",
        field: "author_id.lastname"
      },
      {
        headerName: "Description",
        field: "description"
      },
      {
        headerName: "Experiment ID",
        field: "_id"
      }
    ];
    this.columnTypes = {
      dateColumn: {
        filter: "agDateColumnFilter",
        filterParams: {
          comparator: function(filterLocalDateAtMidnight, cellValue) {
            let dateParts = cellValue.split("/");
            let day = Number(dateParts[2]);
            let month = Number(dateParts[1]) - 1;
            let year = Number(dateParts[0]);
            let cellDate = new Date(day, month, year);
            if (cellDate < filterLocalDateAtMidnight) {
              return -1;
            } else if (cellDate > filterLocalDateAtMidnight) {
              return 1;
            } else {
              return 0;
            }
          }
        }
      }
    };
    this.browse = this.route.snapshot.params["browse"];
    switch (this.browse) {
      case "all":
        this.message = "All the experiments.";
        break;
      case "public":
        this.message = "Only the public experiments.";
        break;
      case "mine":
        this.message = "Only the experiments created by you.";
        break;
      case "share":
        this.message = "Only the experiments shared by a user with you.";
        break;
      default:
        this.message = "Error with the experiment choice.";
        break;
    }
  }

  ngOnInit() {
    this.shared.changeShowInfo(false);
    this.api.getAllExperiments(this.browse).subscribe(
      res => {
        console.log(res);
        this.rowData = res;
        this.display = true;
      },
      err => {
        this.error = {
          show: true,
          title: "Error to get the list of experiments.",
          message:
            "There is problably an error with the server.<br/>Check the console."
        };
        this.display = true;
        console.log(err);
      }
    );
  }

  onRowClicked(event: any) {
    let url = "experiment/dataset/" + event.data._id;
    this.shared.changeExperimentId(event.data._id);
    this.router.navigate([url]);
  }

  onGridReady(params) {
    this.gridApi = params.api;
    this.gridColumnApi = params.columnApi;
    this.gridApi.sizeColumnsToFit();
  }
}
