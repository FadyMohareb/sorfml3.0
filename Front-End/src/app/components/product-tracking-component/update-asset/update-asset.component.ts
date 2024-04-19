import { Component, Inject, OnInit } from '@angular/core';
import { FormGroup, FormControl} from '@angular/forms';
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
  selector    : 'app-update-asset',
  templateUrl : './update-asset.component.html',
  styleUrls   : ['./update-asset.component.scss']
})
export class UpdateAssetComponent implements OnInit {

  currentUserId = this.auth.getUserDetails()._id;

  asset = {
    'productName' : '',
    'location'    : '',
    'weight'      : '',
    'temperature' : '',
    'useByDate'   : '',
  };

  form = new FormGroup({
    productName : new FormControl(null),
    location    : new FormControl(null),
    weight      : new FormControl(null),
    temperature : new FormControl(null),
    useByDate   : new FormControl(null),
  });

  httpOptions       : any;
  data              : any;
  orignalData       : any;
  alreadyRequested  : boolean = false;
  zeroWeight        : boolean = false;
  hiddenSpinner     : boolean = true;
  googleSearchBox   : google.maps.places.SearchBox;

  // Weight and temp values as integer
  assetWeightNum : number;
  assetTempNum   : number;
  dataWeightNum  : number;

  constructor(public dialogRef: MatDialogRef<any, any>,
    @Inject(MAT_DIALOG_DATA)
    public  dialogdata : Data,
    private snackBar   : MatSnackBar,
    private _http      : HttpClient,
    public  auth       : AuthenticationService
  ) {
    this.data = dialogdata;
    console.log('this.data');
    console.log(this.data);

    this.httpOptions = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        //'Access-Control-Allow-Origin': '*'
      }),
      responseType:'text',
    }

    if (dialogdata) {
      this.asset.productName = this.data.ProductName;
      this.asset.location    = this.data.Location;
      this.asset.weight      = this.data.Weight;
      this.asset.temperature = this.data.Temperature;
      this.asset.useByDate   = this.data.UseByDate;
      this.assetWeightNum    = parseInt(this.asset.weight);
      this.assetTempNum      = parseInt(this.asset.temperature);
      this.dataWeightNum     = parseInt(this.asset.weight);
    }

    // If asset status is 'Requested', let form disabled
    if (this.data.AssetStatus === 'Requested') {this.alreadyRequested = true;}

    // If asset weight is less 0 Kg
    // or transaction status is 'Finished', let form disabled
    if (this.assetWeightNum === 0 || this.data.AssetStatus === 'Finished') {this.zeroWeight = true;}
  }

  async ngOnInit() {
    // Define Google API loader
    const loader = new Loader({
      apiKey    : GoogleMapsAPIKey.Key,
      version   : 'weekly',
      libraries : ['places']
    });

    // Activate Google Maps API
    await loader.load().then( () => {console.log('Google Maps API is activated.');});

    // Set Google Search Box
    const googleInput      = document.getElementById('google-search') as HTMLInputElement;
    this.googleSearchBox  = new google.maps.places.SearchBox(googleInput);
  }

  // Check is asset is changed
  CheckIfAssetChanged() {
    var changed = false;
    if (
      this.asset.productName === this.data.ProductName           &&
      this.asset.location    === this.data.Location              &&
      this.assetWeightNum    === parseInt(this.data.Weight)      &&
      this.assetTempNum      === parseInt(this.data.Temperature) &&
      this.asset.useByDate   === this.data.UseByDate
    ) {
      changed = false;
    } else {
      changed = true;
    }

    return changed;
  }

  UpdateAsset() {
    // Show loading spinner
    this.hiddenSpinner = false;

    // Define JSON object as request
    var jsonToSend       = this.form.value;
    jsonToSend.userId    = this.currentUserId;  // Add user ID
    jsonToSend.productId = this.data.ProductID; // Add product ID

    // If product name is brank, set original name instead
    if (this.asset.productName === '') {
      jsonToSend.productName = this.data.ProductName;
      this.asset.productName = this.data.ProductName;
    }

    // Change product name lowercase and trim white spaces
    this.asset.productName = (this.asset.productName).toString().toLowerCase().trim();
    jsonToSend.productName = this.asset.productName;

    // Round weight value if its numeric, and convert to String
    this.assetWeightNum = Math.round(this.assetWeightNum);
    jsonToSend.weight   = (this.assetWeightNum).toString();

    // Round temperature and convert temperature into String
    this.assetTempNum      = Math.round(this.assetTempNum);
    jsonToSend.temperature = (this.assetTempNum).toString();

    // Get Google Maps search result
    // If this.googleSearchBox.getPlaces() === undefined,
    // (this means if the user does not touched the 'location' form
    // not to activate Google Maps Search API)
    // assign the location name from 'this.asset.location' instead
    // to avoid the error by assigning 'undefined' object!
    if ( this.googleSearchBox.getPlaces() === undefined ) {
      jsonToSend.location = this.asset.location;
    } else {
      const googleSearchResult = (this.googleSearchBox.getPlaces())[0];
      const googlePlaceName    = googleSearchResult['formatted_address'];
      this.asset.location      = googlePlaceName;
      jsonToSend.location      = googlePlaceName;
    }

    // Check if the asset is editted in front-end:
    // If not, do not submit the request and return a warning message
    const changed = this.CheckIfAssetChanged();
    if (changed === false ) {
      // Hide loading spinner
      this.hiddenSpinner = true;

      // Show warning message
      this.snackBar.open('It looks nothing is editted - Check the form and try again.', 'Close', {duration:10000});
    } else {
      // Now post the request
      console.log('Updated asset composition:');
      console.log(jsonToSend);

      this._http.post(URLS.UpdateAsset, JSON.stringify(jsonToSend), this.httpOptions).subscribe((resultMsg:any) => {
        console.log(resultMsg);

        // Hide loading spinner
        this.hiddenSpinner = true;

        // Show notification
        this.snackBar.open(resultMsg, 'Close', {duration:3000});

        // Close dialog window
        setTimeout(() => this.dialogRef.close(), 3000);

        // Reload the page
        setTimeout(() => window.location.reload(), 3000);
      })
    }
  }

  close() {
    //console.log(this.orignal_data);
    this.dialogRef.close();
  }
}


