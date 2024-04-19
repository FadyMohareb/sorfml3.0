import { Component, OnInit, Input } from "@angular/core";
import { ControlContainer, NgForm } from "@angular/forms";
import { AuthenticationService } from "../../../services/authentication.service";
import { ApiService } from "../../../services/api.service";

@Component({
  selector: "app-creation-details",
  templateUrl: "./creation-details.component.html",
  styleUrls: ["../experiment-create.component.scss"],
  viewProviders: [{ provide: ControlContainer, useExisting: NgForm }]
})
export class CreationDetailsComponent implements OnInit {
  @Input() experiment: any = {};
  keypairExists = false;
  currentUserID = this.auth.getUserDetails()._id;
  keyModel = {owner_id: this.currentUserID};

  constructor(
    private api: ApiService,
    private auth: AuthenticationService
  ) {}

  ngOnInit() {
    // this.api.postCheckKeypair(this.keyModel).subscribe(
    //   res => {
    //     if (res.count == 1){
    //       this.keypairExists = true;
    //       console.log(this.keypairExists)
    //     }
    //   },
    //   err => {
    //     console.log(err);
    //   })
  }
}
