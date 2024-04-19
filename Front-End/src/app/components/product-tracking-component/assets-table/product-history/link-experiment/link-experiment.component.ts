import { Component, OnInit, Input } from '@angular/core';
import { AuthenticationService } from '../../../../../services/authentication.service';
import { ApiService } from '../../../../../services/api.service'
import { SharedService } from '../../../../../services/shared.service';
import { ActivatedRoute } from "@angular/router";

@Component({
  selector: 'app-link-experiment',
  templateUrl: './link-experiment.component.html',
  styleUrls: ['./link-experiment.component.css']
})
export class LinkExperimentComponent implements OnInit {

  updateComplete = false;
  currentAssetId;
  emptyFields = false;
  user_name = this.auth.getUserDetails().firstname;
  user_id = this.auth.getUserDetails()._id;
  details = {
    owner_id: this.user_id,
    username: this.user_name,
    assetID: '',
    experimentID: '',
    sampleID:'',
  }

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

  linkExperiment() {
    if(
      this.details.experimentID === '' ||
      this.details.sampleID === ''
        ){
      this.emptyFields = true;
    }else{
      this.details.assetID = this.currentAssetId;
    console.log(this.details);
    this.api.postLinkExperiment(this.details)
        .subscribe(
          res => {
            console.log(res);
            this.updateComplete = true;
          })
    }         
  };
}
