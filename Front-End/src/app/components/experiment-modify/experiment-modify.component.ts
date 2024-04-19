import { Component, OnInit, OnDestroy } from "@angular/core";
import { ApiService } from "../../services/api.service";
import { Router, ActivatedRoute } from "@angular/router";
import { AuthenticationService } from "../../services/authentication.service";
import { SharedService } from "../../services/shared.service";
import { Subject } from "rxjs/Subject";
import "rxjs/add/operator/takeUntil";

@Component({
  selector: "app-experiment-modify",
  templateUrl: "./experiment-modify.component.html",
  styleUrls: ["./experiment-modify.component.css"]
})
export class ExperimentModifyComponent implements OnInit {
  step = 0;
  destroy$: Subject<boolean> = new Subject<boolean>();
  experiment: any = {};
  author = {};
  display = false;
  currentExperimentId: string;
  currentUserId;
  users: any = [];
  visible: any;
  showError = false;

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
    private router: Router,
    private route: ActivatedRoute,
    private auth: AuthenticationService,
    private shared: SharedService
  ) {}

  ngOnInit() {
    this.currentUserId = this.auth.getUserDetails()._id;
    this.shared.changeExperimentId(this.route.snapshot.params["experimentid"]);
    this.shared.changeShowInfo(false);
    this.shared.currentExperimentId
      .takeUntil(this.destroy$)
      .subscribe(experimentId => (this.currentExperimentId = experimentId));

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
          this.getExperimentDetails(this.currentExperimentId);
        },
        err => {
          console.log(err);
        }
      );
  }

  getExperimentDetails(experimentid) {
    this.api
      .getExperiment(experimentid)
      .takeUntil(this.destroy$)
      .subscribe(
        data => {
          this.showError = false;
          this.display = true;
          this.experiment.name = data.name;
          this.experiment.description = data.description;
          this.experiment.type = data.type;
          this.experiment.date = data.date.replace(/\//g, "-");
          this.displayVisibility(data);
          console.log(data);
        },
        err => {
          this.shared.changeExperimentId("noId");
          this.showError = true;
          this.display = true;
          console.log(err);
        }
      );
  }

  displayVisibility(data) {
    if (data.is_public) {
      this.visible = "1";
    } else {
      if (data.user_permission.length == 0) {
        this.visible = "2";
      } else {
        this.visible = "3";
        let usersList = [];
        for (let user of data.user_permission) {
          usersList.push(user._id);
        }
        this.experiment.previous_user_permission = usersList;
        this.experiment.user_permission = usersList;
      }
    }
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

  update() {
    this.determineVisibility();
    this.experiment.experimentId = this.currentExperimentId;
    this.experiment.author_id = this.currentUserId;
    this.experiment.date = this.experiment.date.replace(/-/g, "/");
    console.log(this.experiment);
    this.display = false;
    this.api
      .updateExperiment(this.currentExperimentId, this.experiment)
      .takeUntil(this.destroy$)
      .subscribe(
        res => {
          this.display = true;
          let url = "experiment/detail/" + this.currentExperimentId;
          this.router.navigate([url]);
        },
        err => {
          this.display = true;
          alert("Error to submit to experiment");
          console.log(err);
        }
      );
  }
}
