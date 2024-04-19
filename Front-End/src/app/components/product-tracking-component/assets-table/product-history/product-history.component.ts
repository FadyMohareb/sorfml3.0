import { Component, OnInit, Input, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from "@angular/router";
import { ActivatedRoute } from "@angular/router";
import { ApiService } from "../../../../services/api.service";
// import { SharedService } from "../../../services/shared.service";
import { AuthenticationService } from "../../../../services/authentication.service";
import { Subscription } from "rxjs/Subscription";
import { Observable } from "rxjs/Observable";
import { Subject } from "rxjs/Subject";
import { SharedService } from '../../../../services/shared.service';

@Component({
  selector: 'app-product-history',
  templateUrl: './product-history.component.html',
  styleUrls: ['./product-history.component.css']
})
export class ProductHistoryComponent implements OnInit {
  // @Input() assetID: any;

  data: any;
  operation: any;
  bigchainURL: any;
  productSelected = false;
  updateLocation = false;
  transferOwnership = false;
  currentAssetId;
  isLoggedIn = false;
  isProductOwner = false;
  checkOwner: any = {};
  



  constructor(
    private httpClient: HttpClient,
    private route: ActivatedRoute,
    private shared: SharedService,
    public router: Router,
    public auth: AuthenticationService,
    private api: ApiService
  ) {}

  ngOnInit() {
    if (this.auth.isLoggedIn()){
      this.isLoggedIn = true;
    }
    this.shared.changeAssetId(this.route.snapshot.params["assetid"]);
    this.shared.currentAssetId.subscribe(
      assetId => (this.currentAssetId = assetId)
    );
    
    if (this.isLoggedIn === true){
        this.checkOwner.assetID = this.currentAssetId
        this.checkOwner.user_id = this.auth.getUserDetails()._id;

        this.api.postCheckOwnership(this.checkOwner).subscribe(
          res => {
            console.log(res);
            if (res.isOwner === 'yes'){
              this.isProductOwner = true;
          }
        })
  }
    this.bigchainURL = 'https://test.ipdb.io/api/v1/transactions?asset_id='+this.currentAssetId;
    console.log(this.bigchainURL);
    this.httpClient.get<any>(this.bigchainURL)
    .subscribe(
      res =>{
        this.data = res;
        console.log(this.data)
      }
    )
  }

  selectedUpdateLocation(flag) {
    if (flag) {
      let url = "tracking/updatelocation/" + this.currentAssetId;
      this.router.navigate([url]);
    }
  }
  selectedLinkExperiment(flag) {
    if (flag) {
      let url = "tracking/linkexperiment/" + this.currentAssetId;
      this.router.navigate([url]);
    }
  }
  selectedTransferOwnership(flag) {
    if (flag) {
      let url = "tracking/transferownership/" + this.currentAssetId;
      this.router.navigate([url]);
    }
  }

}
