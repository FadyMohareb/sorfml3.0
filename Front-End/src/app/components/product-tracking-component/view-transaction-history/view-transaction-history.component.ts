import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { MatTableDataSource } from '@angular/material/table';
import { URLS } from '../urls';
import { AuthenticationService } from 'src/app/services/authentication.service';
import { MatPaginator } from '@angular/material/paginator';
import { DOCUMENT } from '@angular/common';

// Function to convert ISO Date String into custom date
function convertTimeFormat(dateIso) {
  const dateIsoArray = dateIso.split('T', 2);
  const substrDate   = dateIsoArray[0];
  const substrTime   = dateIsoArray[1];
  //console.log(substrSate);
  //console.log(substrTime);

  // Extract date
  const substrDateArray = substrDate.split('-', 3);
  const date  = substrDateArray[2];
  const month = substrDateArray[1];
  const year  = substrDateArray[0];

  // Extract time
  const substrTimeArray = substrTime.split(':', 3);
  const minute = substrTimeArray[1];
  const hour   = substrTimeArray[0];

  // Covert!
  const timeModified = date + '/' + month + '/' + year + ' ' + hour + ':' + minute + ' (GMT)';
  //console.log(time_modified);

  return timeModified;
}

@Component({
  selector: 'app-view-transaction-history',
  templateUrl: './view-transaction-history.component.html',
  styleUrls: ['./view-transaction-history.component.css']
})
export class ViewTransactionHistoryComponent implements OnInit {

  displayedcolumns : String[] = [
    'position',
    'owner',
    'assetStatus',
    'timestamp',
    'transferTo',
    'weight',
    'location',
    'temperature',
    'useByDate'
  ];

  currentUserId = this.auth.getUserDetails()._id;
  productId        : string;
  titleProductName : string;
  titleProductId   : string;
  httpOptions;

  @ViewChild(MatPaginator, {}) paginator!: MatPaginator;
  dataSource = new MatTableDataSource();

  googleMapClicked : boolean = false;

  constructor(
    private router         : Router,
    private _http          : HttpClient,
    private activatedRoute : ActivatedRoute,
    public  auth           : AuthenticationService,
    //private document       : Document
  ) {
    this.httpOptions = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
      }),
      responseType:'json'
    };
  }

  ngOnInit() {
    this.activatedRoute.queryParams.subscribe(params => {
      console.log("Query param:");
      console.log(params.productid);
      this.productId      = params.productid;
      this.titleProductId = params.productid;
    });

    // Get transaction history
    let httpParams = new HttpParams();
    httpParams = httpParams.append('userId', this.currentUserId);
    httpParams = httpParams.append('productId', this.productId);
    console.log(httpParams);

    // Go !!!
    this._http.get<any>(URLS.ViewTransactionHistory, {params: httpParams}).subscribe(data => {
      console.log('[view-transaction-history.components.ts/ngOnInit()]: Result data:');
      console.log(data);
      this.dataSource.data = data;
      this.titleProductName = (data[0]).ProductName;

      // Convert the time format
      for (var i = 0; i < (this.dataSource.data).length; i++) {
        const dateIso = ((this.dataSource.data)[i])['EventTimestamp'];
        ((this.dataSource.data)[i])['EventTimestamp'] = convertTimeFormat(dateIso);
      }

      // Add data column position
      for (var i = 0; i < (this.dataSource.data).length; i++ ) {
        ((this.dataSource.data)[i])['position'] = (i + 1).toString();
      }

    });
  }

  viewGoogleMap() {
    // Define URL to access 
    const urlWithProductId = 'tracking/viewTrackingGoogleMap' + 
    '?productid=' +
    this.productId;

    // Go !!!
    this.router.navigateByUrl(urlWithProductId);

  }

  getAllBranchesTest() {
    // Get transaction history
    let httpParams = new HttpParams();
    httpParams = httpParams.append('userId', this.currentUserId);
    httpParams = httpParams.append('productId', this.productId );
    //console.log(httpParams);


    // Go !!!
    this._http.get<any>(URLS.GetAllBranches, {params: httpParams}).subscribe(data => {
      console.log('[view-transaction-history.components.ts/agetAllBranchesTest()]: Result data:');
      console.log(data);
      this.launchPythonDash(data);
    });

  }

  launchPythonDash(response) {
    console.log('launchPythonDash():');
    console.log(response);

    // Go !!!
    window.location.href = 'http://localhost:4649';

  }

}
