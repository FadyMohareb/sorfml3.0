import { Component, OnInit, OnDestroy } from '@angular/core';
import { SharedService } from '../../services/shared.service';
import { ApiService } from '../../services/api.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs/Subject';
import 'rxjs/add/operator/takeUntil';
import { AuthenticationService } from '../../services/authentication.service';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-product-tracking-component',
  templateUrl: './product-tracking-component.component.html',
  styleUrls: ['./product-tracking-component.component.css']
})
export class ProductTrackingComponentComponent implements OnInit {
  destroy$: Subject<boolean> = new Subject<boolean>();
  err = { show: false, title: "", message: "" };
  hiddenSpinner = true;
  keypairComplete = false;
  keypairExists = false;
  UserExists = false;
  keypairResults;
  Register_Success = false;
  currentUserID = this.auth.getUserDetails()._id;
  keyModel = {owner_id: this.currentUserID};
  UserModel = {userId: this.currentUserID};
  //isRd = false; // Boolean for check if the user is RD (Regulatory Department)

  constructor(
    private shared     : SharedService,
    private api        : ApiService,
    public  auth       : AuthenticationService,
    private httpClient : HttpClient,
    private route      : ActivatedRoute,
    private router     : Router
  ) {}

  ngOnInit() {
    /*
    this.api.postCheckKeypair(this.keyModel).subscribe(
      res => {
        if (res.count == 1){
          this.keypairExists = true;
        }
      },
      err => {
        console.log(err);
    })
   */
    this.api.checkUserExist(this.UserModel).subscribe(
      res => {
        if(res.exists){
          this.UserExists=true;
        }
      },
      err => {
        console.log(err);
      }
    )
  }

  createKeypair() {
    console.log(this.keyModel);
    this.api.postCreateKeypair(this.keyModel)
        .subscribe(
          res => {
            console.log(res);
            // this.keypairComplete = true;
            this.keypairResults = res;
            if (this.keypairResults.count == 0) {
              this.keypairComplete = true;
            } else {
              // this.keypairExists = true
              alert('Keypair already exists');
            }
          })
  };

  /* This code block is NOT used anymore !!!
  // The function takes boolean value for 'isRd'
  // to check if the user registed as RD (Regulatory Department)
  // in the first registration part
  onCheckboxChange(event) {
    this.isRd = event.checked;
    //console.log(this.isRd);
    if (this.isRd ) {console.log("Oh, you are SorfML Regulatory Department!");}
    else            {console.log("You are general user.");}
  }
  */

  registerNewUser() {
    // Add a new property 'isRd'
    // 'isRd' is NOT used anymore !!!
    let data = {
      userId: this.UserModel.userId
      //isRd:   this.isRd
    };
    console.log('[product-tracking-component.component.ts/registerNewUser()]: Data component');
    console.log(data);

    this.api.postRegisterNewUser(data).subscribe(res => {
      console.log(res);
    })
    this.Register_Success = true;
  }

  SeeTransactionHistory() {
    this.router.navigateByUrl('tracking/SeeOrgTransactionHistory');
  }

  selectRegisterProduct() {
    this.router.navigateByUrl('tracking/register');
  }

  selectSeeAssets() {
    this.router.navigateByUrl('tracking/seeproducts');
  }

  listAssets() {
    this.router.navigateByUrl('tracking/listassets');
  }

  next() {
    this.router.navigateByUrl('tracking');
  }

}
