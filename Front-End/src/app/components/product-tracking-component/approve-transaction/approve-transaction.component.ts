import { Component, Inject, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Data } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { URLS } from '../urls';
import { AuthenticationService } from 'src/app/services/authentication.service';

@Component({
  selector    : 'app-approve-transaction',
  templateUrl : './approve-transaction.component.html',
  styleUrls   : ['./approve-transaction.component.css'],
})

export class ApproveTransactionComponent implements OnInit {
  // Get current user ID
  currentUserID = this.auth.getUserDetails()._id;

    // Set several variables for constructor
    httpOptions   : any;
    data          : any;
    hiddenSpinner : boolean = true;

  constructor(
    public  dialogRef  : MatDialogRef<any, any>,
    @Inject(MAT_DIALOG_DATA)
    public  dialogdata : Data,
    private snackBar   : MatSnackBar,
    private _http      : HttpClient,
    public  auth       : AuthenticationService
  ) {
    // Check contents of the asset
    console.log(dialogdata);

    // Get dialogdata
    this.data = dialogdata;

    // Create HTTP options
    this.httpOptions = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        //'Access-Control-Allow-Origin': '*'
      }),
      responseType:'text',
    };
  }

  onApprove(): void {
    // Create the request info
    const jsonToSend = {
      'productId' : this.data.ProductID, // Product ID
      'userId'    : this.currentUserID,  // User ID
    };

    // Show loading spinner
    this.hiddenSpinner = false;

    // Post the request
    console.log('[approve-transaction.component.ts/ApproveTransactionComponent()]: Entered Transfer Product:');
    console.log(JSON.stringify(jsonToSend));
    this._http.post(URLS.CompleteTransfer, JSON.stringify(jsonToSend), this.httpOptions).subscribe((data:any) => {
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

  onDismiss(): void {
    // Close the dialog, return false
    this.dialogRef.close(false);
  }

  ngOnInit() {
  }
}

export class ApproveTransactionModel {
  constructor(public title: string, public message: string) {
  }
}

/*
export class ApproveTransactionComponent {
  constructor(public dialog: MatDialog) {}

  openDialog() {
    const dialogRef = this.dialog.open(ApproveTransactionModel);

    dialogRef.afterClosed().subscribe(result => {
      console.log(`Dialog result: ${result}`);
    });
  }
}

export class ApproveTransactionModel {}
*/