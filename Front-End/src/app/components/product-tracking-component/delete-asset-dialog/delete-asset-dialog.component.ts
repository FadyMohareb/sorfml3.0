import { Component, OnInit, Inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Data } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { URLS } from '../urls';
import { AuthenticationService } from 'src/app/services/authentication.service';

@Component({
  selector: 'app-delete-asset-dialog',
  templateUrl: './delete-asset-dialog.component.html',
  styleUrls: ['./delete-asset-dialog.component.css']
})
export class DeleteAssetDialogComponent implements OnInit {
    // Get current user ID
    currentUserId = this.auth.getUserDetails()._id;

    // Set several variables for constructor
    httpOptions      : any;
    data             : any;
    hiddenSpinner    : boolean = true;
    alreadyRequested : boolean = false;

  constructor(
    public  dialogRef  : MatDialogRef<any, any>,
    @Inject(MAT_DIALOG_DATA)
    public  dialogdata : Data,
    private snackBar   : MatSnackBar,
    private _http      : HttpClient,
    public  auth       : AuthenticationService
  ) {
    // Check contents of the asset
    console.log('[delete-asset-dialog.components.ts]: dialogdata:');
    console.log(dialogdata);

    // Get dialogdata
    this.data = dialogdata;

    // Check if the asset status is 'Requested'
    // Then the button will be disabled
    if ( (this.data).AssetStatus === 'Requested' ) {this.alreadyRequested = true;}

    // Create HTTP options
    this.httpOptions = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        //'Access-Control-Allow-Origin': '*'
      }),
      responseType:'text',
    };
  }

  onDismiss(): void {
    // Close the dialog, return false
    this.dialogRef.close(false);
  }

  onDelete(): void {
    // Create request in JSON
    const jsonToSend = {
      'productId' : (this.data).ProductID,
      'userId'    : this.currentUserId,
    };

    // Show loading spinner
    this.hiddenSpinner = false;

    // Post the request
    console.log('[approve-transaction.component.ts/onDelete()]: Request info:');
    console.log(JSON.stringify(jsonToSend));
    this._http.post(URLS.DeleteAsset, JSON.stringify(jsonToSend), this.httpOptions).subscribe((data:any) => {
      // Hide the loading spinner
      this.hiddenSpinner = true;

      console.log(data);

      // Show nortification
      this.snackBar.open(data, 'Close', {duration:3000});

      // Close the dialog window
      setTimeout(() => this.dialogRef.close('successfull'), 3000);

      // Reload the page
      setTimeout(() => window.location.reload(), 3000);
    });
  }

  ngOnInit() {
  }

}
