import { Component, OnInit } from '@angular/core';
import { Router } from "@angular/router";
import { ActivatedRoute } from "@angular/router";
import { ApiService } from "../../../services/api.service";
import { SharedService } from "../../../services/shared.service";
import { AuthenticationService } from "../../../services/authentication.service";
import { Subscription } from "rxjs/Subscription";
import { Observable } from "rxjs/Observable";
import { Subject } from "rxjs/Subject";
import { saveAs } from "file-saver";
import {
  OnDestroy,
  Output,
  EventEmitter,
  Input
} from "@angular/core";

@Component({
  selector: 'app-assets-table',
  templateUrl: './assets-table.component.html',
  styleUrls: ['./assets-table.component.css']
})
export class AssetsTableComponent implements OnInit, OnDestroy {
  destroy$: Subject<boolean> = new Subject<boolean>();
  @Output()
  emitSpinner: EventEmitter<boolean> = new EventEmitter<boolean>();
  @Output()
  emitError: EventEmitter<any> = new EventEmitter<any>();
  subscription: Subscription;
  timer: Observable<any>;
  productHistory = false;
  public gridApi;
  public users: any;
  public gridColumnApi;
  public rowData: any;
  public browse: any;
  public message: any;
  display = false;
  error = { show: false, title: "", message: "" };
  public columnDefs;
  public columnTypes;
  user_id = this.auth.getUserDetails()._id;
  selectedAssetID: any;
  rowSelected = false;
  selectedProductType: any;
  selectedRegDate: any;
  QRpath: any;


  constructor(
    public api: ApiService,
    public router: Router,
    public route: ActivatedRoute,
    public shared: SharedService,
    public auth: AuthenticationService
  ) { 
    this.columnDefs = [
      {
        headerName: "AssetID",
        field: "assetID"
      },
      {
        headerName: "Registration Date",
        field: "date_creation"
      },
      {
        headerName: "Owner",
        field: "ownerName"
      },
      {
        headerName: "Product Type",
        field: "productType"
      },
      {
        headerName: "Sample ID (if linked experiment)",
        field: "linkedExperiment.sampleID"
      },
    ];
  }

  ngOnInit() {
    console.log(this.user_id)
    this.shared.changeShowInfo(false);
    this.api.getallassets(this.user_id).subscribe(
      res => {
        // console.log(res)
        this.rowData = res;
        this.display = true;
      },
      err => {
        this.error = {
                show: true,
                title: "Error to get the list of assets.",
                message:
                  "There is problably an error with the server.<br/>Check the console."
      }
      this.display = true;
      // console.log(err);
    }
    )

    
  }

  selectSeeHistory(flag) {
    // this.hiddenSpinner = false;
    if (flag) {
      // this.productHistory = true;
      let url = "tracking/seehistory/" + this.selectedAssetID;
      this.router.navigate([url]);
    }
  }

 onRowClicked(event: any) {
  console.log(event.data)
  this.selectedAssetID = event.data.assetID;
  this.selectedProductType = event.data.productType;
  this.selectedRegDate = event.data.date_creation;
  this.QRpath = event.data.QRpath;
  this.shared.changeAssetId(event.data.assetID);
  this.rowSelected = true;

  }

  downloadQR() {
    let filename = this.QRpath;
    this.api
      .downloadQR(filename)
      .takeUntil(this.destroy$)
      .subscribe(
        data => {
          saveAs(data, filename);
        },
        err => {
          alert("Problem while downloading the file.");
          console.error(err);
        }
      );
  }

  onGridReady(params) {
    this.gridApi = params.api;
    this.gridColumnApi = params.columnApi;
    this.gridApi.sizeColumnsToFit();
  }

  ngOnDestroy() {
    this.destroy$.next(true);
    // Now let's also unsubscribe from the subject itself:
    this.destroy$.unsubscribe();
  }
  
  }


