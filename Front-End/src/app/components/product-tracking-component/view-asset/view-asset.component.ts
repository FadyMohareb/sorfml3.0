
import { Component, Inject, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Data } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Component({
  selector    : 'app-view-asset',
  templateUrl : './view-asset.component.html',
  styleUrls   : ['./view-asset.component.scss']
})
export class ViewAssetComponent implements OnInit {
  httpOptions : any;
  data        : any;
  Experiment_ID_string : String = '';

  // Asset template:
  // It will take a piece of asset info from Hyperledger
  asset = {
    'ProductID'         : null,
    'PreviousProductID' : null,
    'RootProductID'     : null,
    'Owner'             : null,
    'ProductName'       : null,
    'ProductType'       : null,
    'Location'          : null,
    'Weight'            : null,
    'Temperature'       : null,
    'UseByDate'         : null,
    'AssetStatus'       : null,
    'TransferFrom'      : null,
    'TransferTo'        : null,
    'EventTimestamp'    : null,
    'EventBy'           : null,
    'LinkedExperiments' : null,
    'Hash'              : null,
    'PreviousHash'      : null,
  };

  constructor(public dialogRef: MatDialogRef<any, any>,
    @Inject(MAT_DIALOG_DATA) public dialogdata: Data, private snackBar: MatSnackBar, private _http: HttpClient) {
    console.log('dialogdata');
    console.log(dialogdata);
    this.data = dialogdata;
    this.httpOptions = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        //'Access-Control-Allow-Origin': '*'
      }),
    }
  }

  ngOnInit(): void {
    (this.asset).ProductID         = (this.data).ProductID        ;
    (this.asset).PreviousProductID = (this.data).PreviousProductID;
    (this.asset).RootProductID     = (this.data).RootProductID    ;
    (this.asset).Owner             = (this.data).Owner            ;
    (this.asset).ProductName       = (this.data).ProductName      ;
    (this.asset).ProductType       = (this.data).ProductType      ;
    (this.asset).Location          = (this.data).Location         ;
    (this.asset).Weight            = (this.data).Weight           ;
    (this.asset).Temperature       = (this.data).Temperature      ;
    (this.asset).UseByDate         = (this.data).UseByDate        ;
    (this.asset).AssetStatus       = (this.data).AssetStatus      ;
    (this.asset).TransferFrom      = (this.data).TransferFrom     ;
    (this.asset).TransferTo        = (this.data).TransferTo       ;
    (this.asset).EventTimestamp    = (this.data).EventTimestamp   ;
    (this.asset).EventBy           = (this.data).EventBy          ;
    (this.asset).LinkedExperiments = (this.data).LinkedExperiments;
    (this.asset).Hash              = (this.data).Hash             ;
    (this.asset).PreviousHash      = (this.data).PreviousHash     ;

    // Check if this product has been transfered
    if ((this.asset).TransferFrom === null) {(this.asset).TransferFrom = 'This product has not been transferred yet.'}
    if ((this.asset).TransferTo   === null) {(this.asset).TransferTo   = 'This product has not been transferred yet.'}

    // Check if this block is root block
    if ((this.asset).PreviousProductID === null) {(this.asset).PreviousProductID = 'This is a root product.'}
  }

  close() {
    this.dialogRef.close();
  }
}
