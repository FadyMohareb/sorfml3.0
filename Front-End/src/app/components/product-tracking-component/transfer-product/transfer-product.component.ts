
import { Component, Inject, OnInit } from '@angular/core';
import { FormGroup, FormControl} from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Data } from '@angular/router';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { URLS } from '../urls';
import { AuthenticationService } from 'src/app/services/authentication.service';

@Component({
  selector    : 'app-transfer-product',
  templateUrl : './transfer-product.component.html',
  styleUrls   : ['./transfer-product.component.css']
})
export class TransferProductComponent implements OnInit {
  // Get current user ID
  currentUserID = this.auth.getUserDetails()._id;

  // Template of form controls
  form = new FormGroup({
    transferTo     : new FormControl(''),
    transferWeight : new FormControl('')
  });

  // Set several variables for constructor
  httpOptions           : any;
  data                  : any;
  alreadyRequested      : boolean = false;
  zeroWeight            : boolean = false;
  hiddenSpinner         : boolean = true;
  transferToWeight      : number;
  dataWeightNum         : number;
  orgNames              = [];
  transferToOrgOptions  = [];
  transferToOrgSelected = '';

  constructor(public dialogRef: MatDialogRef<any, any>,
    @Inject(MAT_DIALOG_DATA)
      public  dialogdata : Data,
      private snackBar   : MatSnackBar,
      private _http      : HttpClient,
      public  auth       : AuthenticationService
    ) {
      // Get dialogdata
      this.data = dialogdata;

      this.httpOptions = {
        headers: new HttpHeaders({
          'Content-Type': 'application/json',
          //'Access-Control-Allow-Origin': '*'
        }),
        responseType:'text',
      };

      // If asset status is 'Requested', let form disabled
      if (this.data.AssetStatus === 'Requested') {this.alreadyRequested = true;}

      // If weight is already zero, or asset staus is 'Finished', let form disabled
      if      (parseInt(this.data.Weight) === 0         ) {this.zeroWeight = true;}
      else if (this.data.AssetStatus      === 'Finished') {this.zeroWeight = true;}
    }

  ngOnInit() {
    // Get organisation names list
    this._http.get<any>(URLS.GetOrganisationNames, {params:new HttpParams().append('userId', this.currentUserID)}).subscribe((data:any) => {
      console.log(data);
      this.orgNames = data;
      //this.data.transferToOrg = this.form.value.transferTo;

      // Set object of available organisation names as options
      this.transferToOrgSelected = (this.orgNames)[0];
      for (var orgName of (this.orgNames)) {(this.transferToOrgOptions).push({value : orgName, viewValue : orgName});}
      //console.log(this.transferToOrgOptions);
    });

    // Set initial weight
    this.transferToWeight = parseInt(this.data.Weight);
    this.dataWeightNum    = parseInt(this.data.Weight);
  }

  TransferProduct() {
    // Check the composition of the data
    //console.log('[transfer-product.component.ts/TransferProductComponent()]: this.data:');
    //console.log(this.data);
    //this.transferToWeight = this.form.value.transferWeight;

    // Round weight value if its numeric
    this.transferToWeight = Math.round(this.transferToWeight);

    // Create the request info
    const jsonToSend = {
      'productId'      : this.data.ProductID,                // Product ID
      'transferTo'     : this.transferToOrgSelected,         // Requested Org name defined by the user
      'originalWeight' : this.data.Weight,                   // Original weight of the product
      'transferWeight' : (this.transferToWeight).toString(), // Weight which is being transferred
      'userId'         : this.currentUserID                  // User ID
    };

    // Post the request
    console.log('[transfer-product.component.ts/TransferProductComponent()]: Entered Transfer Product:');
    console.log(jsonToSend);

    // Show loading spinner
    this.hiddenSpinner = false;
    this._http.post(URLS.TransferProduct, JSON.stringify(jsonToSend), this.httpOptions).subscribe((data:any) => {
      // Hide loading spinner
      this.hiddenSpinner = true;

      //console.log(data);
      this.data.transferToOrg = this.form.value.transferTo;

      // Show notification
      this.snackBar.open(data, 'Close', {duration:3000});

      // Close dialog window
      setTimeout(() => this.dialogRef.close('successful'), 3000);

      // Reload the page
      setTimeout(() => window.location.reload(), 3000);
    });
  }

  close() {
    //console.log(this.orignal_data);
    this.dialogRef.close();
  }
}
