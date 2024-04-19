
import { Component, Inject, OnInit } from '@angular/core';
import { FormGroup, FormControl } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Data } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { URLS } from '../urls';
import { AuthenticationService } from 'src/app/services/authentication.service';
import { Loader } from "@googlemaps/js-api-loader";
import {} from 'google.maps';
import { GoogleMapsAPIKey } from '../google-api-key';

@Component({
  selector: 'app-asset-dialog',
  templateUrl: './asset-dialog.component.html',
  styleUrls: ['./asset-dialog.component.scss']
})

export class AssetDialogComponent implements OnInit {
  // Get user ID
  currentUserID = this.auth.getUserDetails()._id;

  // productType options, default "Primary"
  productTypeSelected = 'Primary';

  // Set available asset component
  asset = {
    'productName' : '',
    'productType' : '',
    'location'    : '',
    'weight'      : '',
    'temperature' : '',
    'useByDate'   : '',
  };

  buttonText = 'Save';

  form = new FormGroup({
    productName      : new FormControl(''),
    productType      : new FormControl(''),
    location         : new FormControl(''),
    weight           : new FormControl(''),
    temperature      : new FormControl(''),
    useByDate        : new FormControl(''),
  });

  // Asset number as integer
  assetWeightNum : number;
  assetTempNum   : number;

  // Add product type
  productTypeOptions = [
    {
      value     : 'Primary',
      viewValue : 'Primary',
    },
    {
      value     : 'Derived',
      viewValue : 'Derived',
    },
    {
      value     : 'Others',
      viewValue : 'Others',
    }
  ];

  // If the loading spinner is shown
  hiddenSpinner : boolean = true;

  // Google Maps API location search box
  googleSearchBox : google.maps.places.SearchBox;

  httpOptions: any;
  data: any;

  constructor(
    public dialogRef: MatDialogRef<any, any>,
    @Inject(MAT_DIALOG_DATA) public dialogdata: Data,
    private snackBar: MatSnackBar,
    private _http: HttpClient,
    public auth:AuthenticationService
  ) {
    //console.log('dialogdata:');
    //console.log(dialogdata);
    this.data = dialogdata;
    if (dialogdata) {
      var data = dialogdata;
      this.asset.productName = data['productName'];
      this.asset.location    = data['location'];
      this.asset.weight      = data['weight'];
      this.asset.temperature = data['temperature'];
      this.asset.useByDate   = data['useByDate'];
      this.assetWeightNum    = parseInt(this.asset.weight);
      this.assetTempNum      = parseInt(this.asset.temperature);
    }
  }

  async ngOnInit() {
    // Define Google API loader
    const loader = new Loader({
      apiKey    : GoogleMapsAPIKey.Key,
      version   : 'weekly',
      libraries : ['places'],
    });

    // Activate Google Maps API
    await loader.load().then( () => {console.log('Google Maps API is activated.');});

    // Set Google Search Box
    const googleInput    = document.getElementById('google-search') as HTMLInputElement;
    this.googleSearchBox = new google.maps.places.SearchBox(googleInput);
  }

  onSubmit() {
    this.httpOptions = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        //'Access-Control-Allow-Origin': '*'
      }),
      responseType:'text'
    };
    if (this.data) {
      // Set request values being submitted
      var request = {
        'productName' : this.form.value.productName,
        'productType' : this.asset.productType,
        'location'    : this.form.value.location,
        'weight'      : this.assetWeightNum,
        'temperature' : this.form.value.temperature,
      };

      // Chack the content of submitted request
      //console.log('[asset-dialog.component.ts/onSubmit()]: content of request:');
      //console.log(request);

      this._http.post<any>(URLS.UPDATE, JSON.stringify(request), this.httpOptions).subscribe((data: any) => {
        console.log(data);
        var response = {
          'productName' : this.form.value.productName,
          'productType' : this.asset.productType,
          'location'    : this.form.value.location,
          'weight'      : this.assetWeightNum,
          'temperature' : this.form.value.temperature
        };
        this.dialogRef.close(response)
      })
    } else {
      // Show loading spinner
      this.hiddenSpinner = false;

      // Define a data to sent a request as JSON
      var jsonToSend         = this.form.value;
      jsonToSend.userId      = this.currentUserID;       // Add user ID
      jsonToSend.productType = this.productTypeSelected; // Add product type

      // Change product mane all lownercase and trim white spaces
      jsonToSend.productName = (this.form.value.productName).toString().toLowerCase().trim();

      // Round weight value if its numeric, and convert to String
      this.assetWeightNum = Math.round(this.assetWeightNum);
      jsonToSend.weight   = (this.assetWeightNum).toString();

      // Round temperature and convert temperature into String
      this.assetTempNum      = Math.round(this.assetTempNum);
      jsonToSend.temperature = (this.assetTempNum).toString();

      // Get Google Maps search result
      const googleSearchResult = (this.googleSearchBox.getPlaces())[0];
      const googlePlaceName    = googleSearchResult['formatted_address'];
      this.form.value.location = googlePlaceName;

      // Now post the request
      //console.log('jsonToSend:');
      //console.log( jsonToSend );
      this._http.post<any>(URLS.CREATE, JSON.stringify(jsonToSend), this.httpOptions).subscribe((data: any) => {
        console.log('[asset-dialog.component.ts/onSubmit()]: content of request:');
        console.log(jsonToSend);

        // Hide spinner
        this.hiddenSpinner = true;

        //console.log('data:', data);

        // Show notification
        this.snackBar.open('Product was succesfully registered!', 'Close', {duration:3000});

        // Close dialog form window
        setTimeout(() => this.dialogRef.close('success'), 3000);

        // Reload the page
        setTimeout(() => window.location.reload(), 3000);
      });
    }
  }
  close() {
    this.dialogRef.close();
  }
}
