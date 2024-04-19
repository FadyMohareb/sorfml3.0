import { Component, OnInit, Input } from '@angular/core';
import { AuthenticationService } from '../../../../../services/authentication.service';
import { ApiService } from '../../../../../services/api.service'
import { SharedService } from '../../../../../services/shared.service';
import { ActivatedRoute } from "@angular/router";
import { AssetsTableComponent } from '../../assets-table.component';

@Component({
  selector: 'app-transfer-ownership',
  templateUrl: './transfer-ownership.component.html',
  styleUrls: ['./transfer-ownership.component.css']
})
export class TransferOwnershipComponent implements OnInit {
  updateComplete = false;
  currentAssetId;
  newOwnerKeypair;
  emptyFields = false;
  user_name = this.auth.getUserDetails().firstname;
  user_id = this.auth.getUserDetails()._id;
  details = {
    owner_id: this.user_id,
    username: this.user_name,
    assetID: '',
    email: ''
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

  transferOwnership() {
    if(
      this.details.email === '' 
    ){
      this.emptyFields = true;
    } else {
      this.details.assetID = this.currentAssetId;
    console.log(this.details);
    this.api.postTransferOwnership(this.details)
        .subscribe(
          res => {
            if(res.newOwnerKeypair === null || res.userExists === null){
              this.newOwnerKeypair = false;
            }else{
              // console.log(res);
              this.updateComplete = true;
              console.log(this.updateComplete)
            }
        })
    }        
  };

}
