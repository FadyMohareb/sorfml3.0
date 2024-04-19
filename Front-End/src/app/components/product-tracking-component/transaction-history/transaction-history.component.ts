import { Component, OnInit, ViewChild } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
//import { ConfirmDialogComponent, ConfirmDialogModel } from '../approve-dialog/approve-dialog.component';
import { ApproveTransactionComponent, ApproveTransactionModel } from '../approve-transaction/approve-transaction.component';
import { ProductTemplate } from '../product-template';
import { AssetDialogComponent } from '../asset-dialog/asset-dialog.component';
import { UpdateAssetComponent } from '../update-asset/update-asset.component';
import { ViewAssetComponent } from '../view-asset/view-asset.component';
import { URLS } from '../urls';
import { AuthenticationService } from 'src/app/services/authentication.service';
import { ViewTransactionDetailsComponent } from '../view-transaction-details/view-transaction-details.component';

@Component({
  selector: 'app-transaction-history',
  templateUrl: './transaction-history.component.html',
  styleUrls: ['./transaction-history.component.css']
})
export class TransactionHistoryComponent implements OnInit {
  currentUserId = this.auth.getUserDetails()._id;

  isRd                                    : boolean; // Whether or not the current user is RD (Regulatory Department)
  result                                  : string;
  @ViewChild(MatSort, {}) sort!           : MatSort;
  @ViewChild(MatPaginator, {}) paginator! : MatPaginator;
  processedData = [];                       // Processed data which removes 'Deleted' assets.
  dataSource    = new MatTableDataSource(); // Data source for front-end
  httpOptions;

  displayedcolumns: String[] = [
    'productName',
    'owner',
    'assetStatus',
    'transferFrom',
    'transferTo',
    'username',
    'approvalButton',
    'view'
  ];

  constructor(private _http: HttpClient, private dialog: MatDialog, private snackBar: MatSnackBar, public auth: AuthenticationService) {
    this.httpOptions = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
      }),
      responseType:'json'
    };
    console.log('TransactionDetails component constructed');
  }

  ngOnInit() {
    // Check if the user is RD (Regulatory Department)
    this._http.get<any>(URLS.CheckRd, {params:new HttpParams().append('userId', this.currentUserId)}).subscribe(data => {
      this.isRd = data.isRd;
      //console.log('[transaction-history.components.ts/ngOnInit()]: Check Regulatory Department:');
      //console.log(data);
    });

    // Get transaction information
    //console.log(this.currentUserId);
    this._http.get<any>(URLS.OrgTransactionHistory, {params:new HttpParams().append('userId', this.currentUserId)}).subscribe(data => {
      this.dataSource.data = data;
      //console.log('[transaction-history.components.ts/ngOnInit()]: Transaction details:');
      //console.log(data);

      // Remove 'Deleted' status asset from the raw data.
      for (var asset of data) {
        if (asset.AssetStatus !== 'Deleted') {(this.processedData).push(asset);}
      }
      //console.log('[transaction-history.component.ts/ngOnInit()]: processedData:');
      //console.log(this.processedData);

      // Then, assign processedData into dataSource
      (this.dataSource).data = this.processedData;
      //console.log('transaction-history.component.ts/ngOnInit()]: dataSource:');
      //console.log(this.dataSource);

    });
  }

  view(asset:any, index:number) {
    const dialogRef = this.dialog.open(ViewTransactionDetailsComponent, {
      width: '500px', height: '100vh',position:{right:'0'}, data:asset
    });
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  approveDialog(asset:any, index:number) {
    //const message    = 'Are you sure to approve the transaction?';
    //const dialogData = new ApproveTransactionModel('Confirm Transaction', message);
    const dialogRef  = this.dialog.open(ApproveTransactionComponent, {
      minWidth : '400px',
      data     : asset
      //data     : dialogData,
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        //console.log(result);
        //this.dataSource.data[index]=(result)
        //this.dataSource._updateChangeSubscription();
      }
    });
  }
}
