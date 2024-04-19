import {
  Component,
  OnInit,
  OnDestroy,
  Output,
  EventEmitter,
  Input
} from "@angular/core";
import { COMMA, ENTER } from "@angular/cdk/keycodes";
import { Subscription } from "rxjs/Subscription";
import { Observable } from "rxjs/Observable";
import "rxjs/add/observable/timer";
import { MatChipInputEvent } from "@angular/material";
import { Subject } from "rxjs/Subject";
import "rxjs/add/operator/takeUntil";
import { saveAs } from "file-saver";

import { SharedService } from "../../../services/shared.service";
import { ApiService } from "../../../services/api.service";
import { ActivatedRoute, Router } from "@angular/router";

//inserted 
import { AuthenticationService } from "../../../services/authentication.service";
import { NotificationService } from "../../../services/notification.service";





@Component({
  selector: 'app-product-reg-form',
  templateUrl: './product-reg-form.component.html',
  styleUrls: ['./product-reg-form.component.css']
})
export class ProductRegFormComponent implements OnInit, OnDestroy {
  destroy$: Subject<boolean> = new Subject<boolean>();
  @Output()
  emitSpinner: EventEmitter<boolean> = new EventEmitter<boolean>();
  @Output()
  emitError: EventEmitter<any> = new EventEmitter<any>();

  subscription: Subscription;
  timer: Observable<any>;
  visible = true;
  selectable = true;
  removable = true;
  addOnBlur = true;
  readonly separatorKeysCodes: number[] = [ENTER, COMMA];
  step = 0;
  optionsChecked = false;
  logList = [{ name: "Yes", value: "TRUE" }, { name: "No", value: "FALSE" }];
  regComplete = false;
  user_name = this.auth.getUserDetails().firstname;
  user_id = this.auth.getUserDetails()._id;
  registrationResults;
  emptyFields = false;
  QRpath;
  product = {
    owner_id: this.user_id,
    username: this.user_name,
    locations: '',
    productName: '',
    productType: '',
    weight: '',
    temperature:'',
    useByDate:''
  };

  constructor(
    public auth: AuthenticationService,
    private router: Router,
    private shared: SharedService,
    private api: ApiService,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {

  }

  registerTheProduct() {
    if (
      this.product.productName === '' ||
      this.product.locations   === '' ||
      this.product.productType === '' ||
      this.product.weight      === '' ||
      this.product.temperature === '' ||
      this.product.useByDate   === ''
      )
      {
        this.emptyFields = true;
      } else {
        console.log(this.product);
        this.api.postProductRegistration(this.product)
            .subscribe(
              res => {
                // console.log(res);
                this.regComplete = true;
                this.registrationResults = res;
                this.QRpath = this.registrationResults.QRpath;
              })}
  };

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

  ngOnDestroy() {
    this.destroy$.next(true);
    // Now let's also unsubscribe from the subject itself:
    this.destroy$.unsubscribe();
  }

  setStep(index: number) {
    // this.checkOptions();
    this.step = index;
  }

  nextStep() {
    this.step++;
  }

  prevStep() {
    this.step--;
  }
}

