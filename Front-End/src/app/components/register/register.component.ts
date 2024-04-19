import { Component, OnInit, OnDestroy } from "@angular/core";
import { AuthenticationService } from "../../services/authentication.service";
import { ApiService } from "../../services/api.service";
import { Router } from "@angular/router";
import { SharedService } from "../../services/shared.service";
import { Subject } from "rxjs/Subject";
import "rxjs/add/operator/takeUntil";

const RD_NAME = 'REGULATORY DEPARTMENT OF SORFML2';

@Component({
  selector    : "app-register",
  templateUrl : "./register.component.html",
  styleUrls   : ["./register.component.scss"]
})
export class RegisterComponent implements OnInit, OnDestroy {
  destroy$ : Subject<boolean>  = new Subject<boolean>();
  credentials : any            = {};
  existingEmailsList : boolean = false;
  organisationList             = [];
  organisationOptions          = [];
  organisationSelected         = '';
  newOrganisationName          = '';
  isOrgNameValid : boolean     = true;

  constructor(
    private api    : ApiService,
    private auth   : AuthenticationService,
    private router : Router,
    private shared : SharedService
  ) {}

  ngOnInit() {
    this.shared.changeShowInfo(false);
    // Set Regulatory Department checkbox FALSE as default
    this.credentials.isregulatorydepartment = false;

    // Get organisation list
    this.api.getAllUsers().takeUntil(this.destroy$).subscribe(data => {
      for (let elem of data) {
        const orgName = elem.organisation;
        // If orgName is not 'REGULATORY DEPARTMENT OF SORFML2', and not included in the list, push it
        if (orgName !== RD_NAME && !(this.organisationList).includes(orgName)) {(this.organisationList).push(orgName);}
      }
      (this.organisationList).sort();         // Sort alphabetically
      (this.organisationList).push('Others'); // Add 'Others' at the end
      //console.log(this.organisationList);

      // Create organisation list options
      this.organisationSelected = (this.organisationList)[0];
      for (var orgName of (this.organisationList)) {
        (this.organisationOptions).push({value : orgName, viewValue : orgName});
      }
    }, err => {
      console.log(err);
    });

    console.log(this.organisationOptions);
  }

  register() {
    // Before sending the form, let's purify the organisation name.
    let organisation = '';
    if      (this.organisationSelected === 'Others') {organisation = this.newOrganisationName }
    else if (this.organisationSelected !== 'Others') {organisation = this.organisationSelected}

    // Remove depulicated white spaces into one
    organisation = organisation.replace(/\s\s+/g, ' ');

    // Remove white spaces at the start and/or end if found
    organisation = organisation.trim();

    // Finally, CAPITALISE it
    organisation = organisation.toUpperCase();

    // Define this.credentials.organisation
    (this.credentials).organisation = organisation;

    // Check if organisation name is valid: 'OTHERS' or 'REGULATORY DEPARTMENT OF SORFML2'
    // are NOT acceptable.
    if      ((this.credentials).organisation === 'OTHERS') {this.isOrgNameValid = false;}
    else if ((this.credentials).organisation === RD_NAME)  {this.isOrgNameValid = false;}
    else                                                   {this.isOrgNameValid = true; }

    // If the user wants to register as RD, the organisation name is 
    // automatically changed into 'REGULATORY DEPARTMENT OF SORFML2'
    if ((this.credentials).isregulatorydepartment === true ) {
      (this.credentials).organisation = RD_NAME;
    }

    console.log('[register.component.ts/register()]: credentials:');
    console.log(this.credentials);

    // Now register!
    if (this.isOrgNameValid) {
      this.auth.register(this.credentials).takeUntil(this.destroy$).subscribe(() => {
        this.router.navigateByUrl('profile');
      }, err => {
        if (err.status === 528) {this.existingEmailsList = true;}
        console.error(err);
      });
    }
  }

  ngOnDestroy() {
    this.destroy$.next(true);
    // Now let's also unsubscribe from the subject itself:
    this.destroy$.unsubscribe();
  }
}
