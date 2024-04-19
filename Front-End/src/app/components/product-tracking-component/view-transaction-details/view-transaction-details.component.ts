import { Component, Inject, OnInit } from '@angular/core';
import { FormGroup, FormControl } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from "../../../services/api.service";
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject } from "rxjs/Subject";
import { saveAs } from 'file-saver';
import { URLS } from '../urls';
import { Data } from '@angular/router';

@Component({
  selector: 'app-view-transaction-details',
  templateUrl: './view-transaction-details.component.html',
  styleUrls: ['./view-transaction-details.component.css']
})
export class ViewTransactionDetailsComponent implements OnInit {
  httpOptions : any;
  data        : any;
  destroy$    : Subject<boolean> = new Subject<boolean>();

  /*
  asset = {
    'productName'    : '',
    'productId'      : '',
    'currentOwner'   : '',
    'transferStatus' : '',
    'transferFrom'   : '',
    'transferTo'     : '',
    'weight'         : '',
    'temperature'    : '',
    'useByDate'      : '',
    'timeStamp'      : '',
    'eventBy'        : ''
  };
  */

  asset = {
    ProductID         : null,
    PreviousProductID : null,
    RootProductID     : null,
    Owner             : null,
    ProductName       : null,
    ProductType       : null,
    Location          : null,
    Weight            : null,
    Temperature       : null,
    UseByDate         : null,
    AssetStatus       : null,
    TransferFrom      : null,
    TransferTo        : null,
    TransferWeight    : null,
    EventTimestamp    : null,
    EventBy           : null,
    LinkedExperiments : []  ,
    Hash              : null,
    PreviousHash      : null,
  };

  form = new FormGroup({
    Transaction_ID   : new FormControl(null),
    Product_ID       : new FormControl(null),
    Transaction_Type : new FormControl(null),
    User_Name        : new FormControl(null),
    Previous_Value   : new FormControl(null),
    New_Value        : new FormControl(null),
    Time             : new FormControl(null),
    Date             : new FormControl(null)
  });

  qRCodeClicked : boolean = false;

  constructor(
    private api        : ApiService,
    private router     : Router,
    public  dialogRef  : MatDialogRef<any, any>,
    @Inject(MAT_DIALOG_DATA)
    public  dialogdata : Data,
    private snackBar   : MatSnackBar,
    private _http      : HttpClient,
    ) {
    console.log('[view-transaction-details.component.ts/ViewTransactionDetailsComponent()] Dialog data:');
    console.log(dialogdata);
    this.data = dialogdata;
  }

  ngOnInit(): void {
    // Get asset info
    (this.asset).ProductID         =  (this.data).ProductID        ;
    (this.asset).PreviousProductID =  (this.data).PreviousProductID;
    (this.asset).RootProductID     =  (this.data).RootProductID    ;
    (this.asset).Owner             =  (this.data).Owner            ;
    (this.asset).ProductName       =  (this.data).ProductName      ;
    (this.asset).ProductType       =  (this.data).ProductType      ;
    (this.asset).Location          =  (this.data).Location         ;
    (this.asset).Weight            =  (this.data).Weight           ;
    (this.asset).Temperature       =  (this.data).Temperature      ;
    (this.asset).UseByDate         =  (this.data).UseByDate        ;
    (this.asset).AssetStatus       =  (this.data).AssetStatus      ;
    (this.asset).TransferFrom      =  (this.data).TransferFrom     ;
    (this.asset).TransferTo        =  (this.data).TransferTo       ;
    (this.asset).TransferWeight    =  (this.data).TransferWeight   ;
    (this.asset).EventTimestamp    =  (this.data).EventTimestamp   ;
    (this.asset).EventBy           =  (this.data).EventBy          ;
    (this.asset).LinkedExperiments =  (this.data).LinkedExperiments;
    (this.asset).Hash              =  (this.data).Hash             ;
    (this.asset).PreviousHash      =  (this.data).PreviousHash     ;
    //console.log(this.asset);

    // Check if this product has been transfered
    if ((this.asset).TransferFrom === null) {(this.asset).TransferFrom = 'This product has not been transferred yet.'}
    if ((this.asset).TransferTo   === null) {(this.asset).TransferTo   = 'This product has not been transferred yet.'}

    // Check if previous product ID is null
    if ((this.asset).PreviousProductID === null) {(this.asset).PreviousProductID = 'This product has not been transferred yet.'}
  }

  viewTxHistory() {
    //console.log(this.data);

    // Define viewTransactionHistory URL with query product ID
    const urlWithProductId = 'tracking/viewTransactionHistory' +
    '?productid=' +
    (this.data).ProductID;
    //console.log(urlWithProductId);

    // Go!
    this.router.navigateByUrl(urlWithProductId);

    // Close dialog form window
    setTimeout(() => this.dialogRef.close(), 0);

    /* This code block is not used anymore !!!
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        //console.log(result);
        //this.dataSource.data[index]=(result)
        //this.dataSource._updateChangeSubscription();
      }
    });
    */
  }

  createAndDownloadQrcode () {
    // Define HTTP options
    this.httpOptions = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        //'Access-Control-Allow-Origin': '*'
      }),
      responseType:'text'
    };

    // Send the request to generate QR code
    const request = this.asset;
    this._http.post<any>(URLS.CreateQrCode, JSON.stringify(request), this.httpOptions).subscribe((filePath: any) => {
      //console.log(file_path);

      // Define filename
      const timeNow  = (new Date()).toISOString();
      const fileName =
        'sorfml2_product_tracking_qrcode_'  +
        timeNow.replace(/-|T|:|\.|Z/g, '') +
        '.png';
      //console.log(file_name);

      this.api
        .downloadQR(filePath)
        .takeUntil(this.destroy$)
        .subscribe(
          data => {
            saveAs(data, fileName);
            console.log("saveAs: end");
          }, err => {
            alert('Problem while downloading the file.');
            console.error(err);
          }
        );

    });

  }

  /*
  donloadQrCode = async function(url, filepath) {
    return new Promise((resolve, reject) => {
      client.get(url, (res) => {
        if (res.statusCode === 200) {
          res.pipe(fs.createWriteStream(filepath))
            .on('error', reject)
            .once('close', () => resolve(filepath));
        } else {
          res.resume();
          reject(new Error(`Request Failed With a Status Code: ${res.statusCode}`));
        }
      })
    });
  }
  */

  close() {
    this.dialogRef.close();
  }
}
