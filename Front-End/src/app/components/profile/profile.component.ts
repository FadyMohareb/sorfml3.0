import { Component, OnInit, OnDestroy } from "@angular/core";
import { AuthenticationService } from "../../services/authentication.service";
import { SharedService } from "../../services/shared.service";
import { Subject } from "rxjs/Subject";
import "rxjs/add/operator/takeUntil";
import { ApiService } from "../../services/api.service";
import { GridOptions } from "ag-grid";

@Component({
  selector: "app-profile",
  templateUrl: "./profile.component.html",
  styleUrls: ["./profile.component.scss"]
})
export class ProfileComponent implements OnInit, OnDestroy {
  destroy$: Subject<boolean> = new Subject<boolean>();
  currentExperimentId;
  currentUserId;
  gridApiList: any = [];
  gridApi: any;
  display = false;
  passwordConfirm;
  selected = "User";
  message = { display: false, message: "", class: "" };
  password;
  err = { show: false, title: "", message: "" };
  userInfo: any = {};
  columnDefs: any = [];
  rowData: any = [];
  tabIndex = 0;

  constructor(
    private auth: AuthenticationService,
    private shared: SharedService,
    private api: ApiService
  ) {
    if (auth.isAdmin()) {
      this.currentUserId = this.auth.getUserDetails()._id;
      this.getAllUsers();
      this.getAllModels();
      this.columnDefs = [this.createColumnModels(), this.createColumnUsers()];
    }
  }

  ngOnInit() {
    this.shared.changeShowInfo(false);
    this.getProfile();
  }

  getProfile() {
    this.auth
      .profile()
      .takeUntil(this.destroy$)
      .subscribe(
        user => {
          this.userInfo = user;
          this.userInfo.previousEmail = user.email;
          this.display = true;
        },
        err => {
          this.display = true;
          console.error(err);
        }
      );
  }

  getAllUsers() {
    this.api
      .getAllUsers()
      .takeUntil(this.destroy$)
      .subscribe(
        data => {
          let users = [];
          for (let item of data) {
            // Display all users except the logged user
            if (item._id !== this.currentUserId) {
              users.push(item);
            }
          }
          this.rowData[1] = users;
        },
        err => {
          console.log(err);
        }
      );
  }

  getAllModels() {
    let param = { type: "all" };
    this.api
      .getModel(param)
      .takeUntil(this.destroy$)
      .subscribe(
        models => {
          this.rowData[0] = this.filter(models);
        },
        err => {
          console.log(err);
        }
      );
  }

  updateProfile() {
    this.auth
      .updateProfile(this.userInfo)
      .takeUntil(this.destroy$)
      .subscribe(
        res => {
          this.getProfile();
          this.message = {
            display: true,
            message: "Details Updated.",
            class: "alert alert-success"
          };
          this.timer();
        },
        err => {
          if (err.status === 528) {
            this.message = {
              display: true,
              message: "Email already exists. Retry with another one.",
              class: "alert alert-danger"
            };
          } else {
            this.message = {
              display: true,
              message: "Error to update your details.",
              class: "alert alert-danger"
            };
          }
          this.timer();
          console.error(err);
        }
      );
  }

  updatePassword() {
    let data = { password: this.password, currentUserId: this.userInfo._id };
    this.auth
      .updatePassword(data)
      .takeUntil(this.destroy$)
      .subscribe(
        res => {
          this.message = {
            display: true,
            message: "Password Updated.",
            class: "alert alert-success"
          };
          this.timer();
        },
        err => {
          this.message = {
            display: true,
            message: "Error to update your password.",
            class: "alert alert-danger"
          };
          this.timer();
          console.error(err);
        }
      );
  }

  onGridReady(params) {
    this.gridApi = params.api;
    this.gridApi.sizeColumnsToFit();
  }

  onTabChanged(event) {
    switch (event.index) {
      case 0:
        this.tabIndex = 0;
        break;
      case 1:
        this.tabIndex = 1;
        break;
      case 2:
        this.tabIndex = 2;
        break;
      case 3:
        this.tabIndex = 3;
        break;
      default:
        this.tabIndex = -1;
        break;
    }
  }

  onRowClicked(e) {
    if (e.event.target !== undefined) {
      let data = e.data;
      let actionType = e.event.target.getAttribute("data-action-type");

      switch (actionType) {
        case "save":
          return this.onActionSaveUserClick(data);
        case "deleteUser":
          return this.onActionDeleteUserClick(data);
        case "deleteModel":
          return this.onActionDeleteModelClick(data);
      }
    }
  }

  onActionSaveUserClick(data: any) {
    console.log(this.selected);
  }

  onActionDeleteUserClick(data: any) {
    console.log(data);
    let index = this.rowData[1]
      .map(function(d) {
        return d["_id"];
      })
      .indexOf(data._id);
    this.api
      .deleteUser(data._id)
      .takeUntil(this.destroy$)
      .subscribe(
        res => {
          // To avoid to fetch all the users just remove it on the front end
          // Because it has been deleted in the DB
          this.gridApi.updateRowData({ remove: [data] }); // Remove in the table
          if (index > -1) {
            this.rowData[1].splice(index, 1); // Remove the element of the rowdata
          }
          this.message = {
            display: true,
            message: "User deleted.",
            class: "alert alert-success"
          };
          this.timer();
        },
        err => {
          this.message = {
            display: true,
            message: "Error to remove the user.",
            class: "alert alert-danger"
          };
          this.timer();
          console.error(err);
        }
      );
  }

  onActionDeleteModelClick(data: any) {
    let index = this.rowData[0]
      .map(function(d) {
        return d["_id"];
      })
      .indexOf(data._id);
    this.api
      .deleteModel(data._id)
      .takeUntil(this.destroy$)
      .subscribe(
        res => {
          // To avoid to fetch all the models just remove it on the front end
          // Because it has been deleted in the DB
          this.gridApi.updateRowData({ remove: [data] }); // Remove in the table
          if (index > -1) {
            this.rowData[0].splice(index, 1); // Remove the element of the rowdata
          }
          this.message = {
            display: true,
            message: "Model deleted.",
            class: "alert alert-success"
          };
          this.timer();
        },
        err => {
          this.message = {
            display: true,
            message: "Error to remove the model.",
            class: "alert alert-danger"
          };
          this.timer();
          console.error(err);
        }
      );
  }

  ngOnDestroy() {
    this.destroy$.next(true);
    // Now let's also unsubscribe from the subject itself:
    this.destroy$.unsubscribe();
  }

  timer() {
    setTimeout(
      function() {
        this.message = { display: false, message: "", class: "" };
      }.bind(this),
      3000
    );
  }

  createColumnUsers() {
    return [
      {
        headerName: "Lastname",
        field: "lastname"
      },
      {
        headerName: "Firstname",
        field: "firstname"
      },
      {
        headerName: "Email Address",
        field: "email"
      },
      {
        headerName: "Organisation",
        field: "organisation"
      },
      {
        headerName: "Role",
        field: "role"
      },
      {
        headerName: "Actions",
        suppressMenu: true,
        suppressSorting: true,
        suppressFilter: true,
        autoHeight: true,
        width: 150,
        pinned: "right",
        template: `
          <div class="button-row">
            <button class="btn btn-success" data-action-type="save"><i class="fa fa-floppy-o"></i></button>
            <button class="btn btn-danger" data-action-type="deleteUser"><i class="fa fa-trash-o"></i></button>
          </div>`
      }
    ];
  }

  createColumnModels() {
    return [
      {
        headerName: "Type",
        field: "type"
      },
      {
        headerName: "Platform",
        field: "platform"
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
        headerName: "Bacteria",
        field: "bacteria"
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
        field: "options"
      },
      {
        headerName: "Actions",
        suppressMenu: true,
        suppressSorting: true,
        suppressFilter: true,
        autoHeight: true,
        width: 170,
        pinned: "right",
        template: `
          <div class="button-row">
            <button class="btn btn-danger" data-action-type="deleteModel"><i class="fa fa-trash-o"></i></button>
          </div>`
      }
    ];
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
          case "Delta":
            row[key] = parseFloat(row[key]);
            break;
          case "Af":
            row[key] = parseFloat(row[key]);
            break;
          case "Bf":
            row[key] = parseFloat(row[key]);
            break;
          default:
            break;
        }
      }
    }
    return rowList;
  }
}
