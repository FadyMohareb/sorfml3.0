import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  ViewChild
} from "@angular/core";
import { Router } from "@angular/router";
import { Subject } from "rxjs/Subject";
import "rxjs/add/operator/takeUntil";

import { ApiService } from "../../services/api.service";
import { AuthenticationService } from "../../services/authentication.service";
import { SharedService } from "../../services/shared.service";
import { MatTabChangeEvent } from "@angular/material";

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: "app-experiment-create",
  templateUrl: "./experiment-create.component.html",
  styleUrls: ["./experiment-create.component.scss"]
})
export class ExperimentCreateComponent implements OnInit, OnDestroy {
  destroy$: Subject<boolean> = new Subject<boolean>();
  data: any = {};
  regSamplesData: any = {};
  experiment: any = {};
  datasetList: any = [{ fileValid: false }];
  metadataList: any = [{ fileValid: false }];
  visible: any;
  users: any = [];
  currentUserId: any;
  currentUsername: any;
  step = 0;
  hiddenSpinner = true;
  experimentID: any;
  messageError = { display: false, message: "" };
  keyModel: any = [];
  keypairExists = false;

  @ViewChild("CreationDatasetComponent")
  CreationDatasetComponent;
  @ViewChild("CreationMetadataComponent")
  CreationMetadataComponent;

  visibility = [
    {
      value: "1",
      viewValue: "Public"
    },
    {
      value: "2",
      viewValue: "Private"
    },
    {
      value: "3",
      viewValue: "Share with"
    }
  ];

  constructor(
    private api: ApiService,
    private auth: AuthenticationService,
    public router: Router,
    private shared: SharedService
  ) {}

  ngOnInit() {
    this.currentUserId = this.auth.getUserDetails()._id;
    this.currentUsername = this.auth.getUserDetails().firstname;
    this.shared.changeShowInfo(false);
    this.api
      .getAllUsers()
      .takeUntil(this.destroy$)
      .subscribe(
        data => {
          for (let item in data) {
            if (data[item]._id !== this.currentUserId) {
              data[item].bindName =
                data[item].firstname + " " + data[item].lastname;
              this.users.push(data[item]);
            }
          }
        },
        err => {
          console.log(err);
        }
      );
  }

  displaySubmit(formValid) {
    this.metadataList = this.CreationMetadataComponent.giveDataToParent();
    this.nextStep();
    if (!formValid) {
      this.messageError = {
        display: true,
        message: "All the fields are not filled. Check the form."
      };
      this.timer();
    } else if (!this.isMetadataFilesValid()) {
      this.messageError = {
        display: true,
        message: "Metadata files are not all selected. Check the form."
      };
      this.timer();
    } else if (!this.isDatasetFilesValid()) {
      this.messageError = {
        display: true,
        message: "Dataset files are not all selected. Check the form."
      };
      this.timer();
    } else {
      this.createExperiment();
    }
  }

  timer() {
    setTimeout(
      function() {
        this.messageError = { display: false, message: "" };
      }.bind(this),
      1000
    );
  }

  // Function to create the experiment and add the
  // last values to the data to send to the back-end
  createExperiment() {
    this.determineVisibility();
    this.formatDate();
    this.experiment.author_id = this.currentUserId;

    this.data.experiment = this.experiment;
    this.data.datasetList = this.datasetList;
    this.data.metadataList = this.metadataList;
    console.log("Data", this.data);
    this.hiddenSpinner = false;
    this.api
      .postExperiment(this.data)
      .takeUntil(this.destroy$)
      .subscribe(
        res => {
          this.hiddenSpinner = true;
          this.shared.changeExperimentId(res.experiment._id);
          this.experimentID = res.experiment._id;
          let url = "experiment/detail/" + res.experiment._id;

          // make object for registering samples
          this.regSamplesData.experimentID = this.experimentID;
          this.regSamplesData.productType = this.experiment.product;
          this.regSamplesData.experimentLocation = this.experiment.location;
          this.regSamplesData.owner_id = this.currentUserId;
          this.regSamplesData.username = this.currentUsername;
          this.router.navigate([url]);
        },
      );
  }

  //Function to determine if experiment is public or not
  // and create empty user permission if needed
  determineVisibility() {
    switch (this.visible) {
      case "1": {
        this.experiment.is_public = true;
        this.experiment.user_permission = [];
        break;
      }
      case "2": {
        this.experiment.is_public = false;
        this.experiment.user_permission = [];
        break;
      }
      case "3": {
        this.experiment.is_public = false;
        break;
      }
      default: {
        console.log("Invalid choice");
        alert("Invalid choice for the visibility");
        break;
      }
    }
  }

  // Format the date
  formatDate() {
    let date = new Date(this.experiment.date);
    let dtString = "";
    let monthString = "";
    if (date.getDate() < 10) {
      dtString = "0" + date.getDate();
    } else {
      dtString = String(date.getDate());
    }
    if (date.getMonth() + 1 < 10) {
      monthString = "0" + Number(date.getMonth() + 1);
    } else {
      monthString = String(date.getMonth() + 1);
    }
    this.experiment.date =
      date.getFullYear() + "/" + monthString + "/" + dtString;
  }

  // Functions to navigate through the expansion panels
  setStep(index: number) {
    this.step = index;
  }

  nextStep() {
    this.step++;
  }

  nextDataset() {
    this.step++;
    this.datasetList = this.CreationDatasetComponent.giveDataToParent();
  }

  prevStep() {
    this.step--;
  }

  isDatasetFilesValid() {
    let index = this.datasetList.findIndex(function(item, i) {
      return item.fileValid == false;
    });
    // console.log("Dataset", index);
    return index === -1 ? true : false;
  }

  isMetadataFilesValid() {
    let index = this.metadataList.findIndex(function(item, i) {
      return item.fileValid == false;
    });
    // console.log("Metadata", index);
    return index === -1 ? true : false;
  }

  ngOnDestroy() {
    this.destroy$.next(true);
    // Now let's also unsubscribe from the subject itself:
    this.destroy$.unsubscribe();
  }
}
