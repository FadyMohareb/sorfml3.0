import { Component, OnInit, Input } from '@angular/core';
import { AuthenticationService } from '../../../../../services/authentication.service';
import { ApiService } from '../../../../../services/api.service'
import { SharedService } from '../../../../../services/shared.service';
import { ActivatedRoute } from "@angular/router";

@Component({
  selector: 'app-update-location',
  templateUrl: './update-location.component.html',
  styleUrls: ['./update-location.component.css']
})

export class UpdateLocationComponent implements OnInit {
  // @Input() currentAssetId: any;
  updateComplete = false;
  currentAssetId;
  user_name = this.auth.getUserDetails().firstname;
  user_id = this.auth.getUserDetails()._id;
  emptyFields = false;
  details = {
    owner_id: this.user_id,
    username: this.user_name,
    assetID: '',
    newLocation: '',
    temperature:'',
  };

  constructor(
    public auth: AuthenticationService,
    private api: ApiService,
    private route: ActivatedRoute,
    private shared: SharedService,
  ) { }

  ngOnInit() {
    this.shared.changeAssetId(this.route.snapshot.params["assetid"]);
    this.shared.currentAssetId.subscribe(
      assetId => (this.currentAssetId = assetId)
    );
  }


  UpdateLocation() {
    if(
      this.details.newLocation === '' ||
      this.details.temperature === ''
    ){
      this.emptyFields = true;
    }else{
      this.details.assetID = this.currentAssetId;
    console.log(this.details);
    this.api.postUpdateLocation(this.details)
        .subscribe(
          res => {
            console.log(res);
            this.updateComplete = true;
          })
    }
  };
}
