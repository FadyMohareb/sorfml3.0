
import { Component, OnInit, ViewChild, Inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { ProductTemplate } from '../product-template';
import { AssetDialogComponent } from '../asset-dialog/asset-dialog.component';
import { UpdateAssetComponent } from '../update-asset/update-asset.component';
import { ViewAssetComponent } from '../view-asset/view-asset.component';
import { DeleteAssetDialogComponent } from '../delete-asset-dialog/delete-asset-dialog.component';
import { URLS } from '../urls';//fix
import { AuthenticationService } from 'src/app/services/authentication.service';
import 'rxjs/add/operator/toPromise';
import { TransferProductComponent } from '../transfer-product/transfer-product.component';

@Component({
  selector: 'app-list-asset-table',
  templateUrl: './list-asset-table.component.html',
  styleUrls: ['./list-asset-table.component.css']
})
export class ListAssetTableComponent implements OnInit {
  // Several required variables for connection
  currentUserID = this.auth.getUserDetails()._id;
  @ViewChild(MatSort, {}) sort!: MatSort ;
  @ViewChild(MatPaginator, {}) paginator!: MatPaginator;
  processedData = [];                       // Processed data which removes 'Deleted' assets.
  dataSource    = new MatTableDataSource(); // Data source for front-end
  httpOptions;

  // Display columns for HTML
  displayedColumns: String[] = [
    'position',
    'productName',
    'owner',
    'assetStatus',
    'location',
    'temperature',
    'view',
    'requestTransfer',
    'edit',
    'delete',
  ];

  // Boolean value for asset delete dialog
  showDeleteDialog : boolean = false;

  constructor(
    private _http     : HttpClient,
    private dialog    : MatDialog,
    private snackBar  : MatSnackBar,
    public  auth      : AuthenticationService,
    ) {
    this.httpOptions = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
      }),
      responseType:'json'
    }
  }

  ngOnInit() {
    this._http.get<any>(URLS.LIST+`?userid=${this.currentUserID}`).subscribe(data => {

      // Remove 'Deleted' status asset from the raw data.
      for (var asset of data) {
        if (asset.AssetStatus !== 'Deleted') {(this.processedData).push(asset);}
      }
      //console.log('[list-asset-table.component.ts/ngOnInit()]: processedData:');
      //console.log(this.processedData);

      // Then, assign processedData into dataSource
      (this.dataSource).data = this.processedData;
      //console.log('[list-asset-table.component.ts/ngOnInit()]: dataSource:');
      //console.log(this.dataSource);

      //console.log(URLS.LIST+`?userid=${this.currentUserID}`);
    })
  }

  addNewAsset() {
    // AssetDialogComponent : class in 'asset-dialog.components.ts'
    const dialogRef = this.dialog.open(AssetDialogComponent, {
      width: '500px', height: '100vh',position:{right:'0'},
    });
    //console.log( dialogRef );

    dialogRef.afterClosed().subscribe(result => {
      //console.log(result);
      if (result) {
        //this.dataSource.data.push(result);
        console.log('Creating asset is successfull!');
        this.dataSource._updateChangeSubscription();
      } else {
        console.log('Something is wrong with creating asset.');
        //console.log('result:');
        //console.log(result);
      }
    });
  }

  editRow(asset: ProductTemplate, index: number){
    const dialogRef = this.dialog.open(UpdateAssetComponent, {
      width: '500px', height: '100vh',position:{right:'0'},data:asset
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        console.log(result);
        this.dataSource.data[index]=(result)
        this.dataSource._updateChangeSubscription();
      }
    });
  }

  requestTransfer(asset: ProductTemplate, index: number) {
    console.log('[list-asset-table-components.ts/requestTransfer()]: asset:');
    console.log(asset);

    const dialogRef = this.dialog.open(TransferProductComponent, {
      width: '500px', height: '100vh',position:{right:'0'}, data:asset
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        console.log(result);
        this.dataSource.data[index]=(result)
        this.dataSource._updateChangeSubscription();
      }
    });
  }

  view(asset: ProductTemplate, index: number) {
    const dialogRef = this.dialog.open(ViewAssetComponent, {
      width: '500px', height: '100vh',position:{right:'0'},data:asset

    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.dataSource.data[index]=(result)
        this.dataSource._updateChangeSubscription();
      }
    });
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  openDeleteDialog(asset: any, index: number) {
    const dialogRef = this.dialog.open(DeleteAssetDialogComponent, {
      maxWidth : '550px',
      data     : asset,
    });
  }

}
