// Modules import
import { BrowserModule } from "@angular/platform-browser";
import { NgModule } from "@angular/core";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { LayoutModule } from "@angular/cdk/layout";
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from "@angular/common/http";
import { ToastrModule } from "ngx-toastr";
import "hammerjs";
import {
  MatToolbarModule,
  MatInputModule,
  MatSelectModule,
  MatExpansionModule,
  MatButtonModule,
  MatSidenavModule,
  MatIconModule,
  MatListModule,
  MatSlideToggleModule,
  MatTabsModule,
  MatMenuModule,
  MatProgressSpinnerModule,
  MatDialogModule,
  MatCheckboxModule,
  MatRadioModule,
  MatChipsModule,
  MatTableModule,
  MatSnackBarModule,
  MatPaginatorModule,
} from "@angular/material";
import { MatCardModule } from "@angular/material/card";
import { NgMaterialMultilevelMenuModule } from "ng-material-multilevel-menu";
import { NgSelectModule } from "@ng-select/ng-select";
import { AgGridModule } from "ag-grid-angular";
import { PapaParseModule } from "ngx-papaparse";
import { NvD3Module } from "ng2-nvd3";

// d3 and nvd3 should be included somewhere
import "d3";
import "nvd3";

// Components import
import { AppComponent } from "./app.component";
import { MainNavComponent } from "./components/main-nav/main-nav.component";
import { HomeComponent } from "./components/home/home.component";
import { ProfileComponent } from "./components/profile/profile.component";
import { RegisterComponent } from "./components/register/register.component";
import { LoginComponent } from "./components/login/login.component";
import { ExperimentsListComponent } from "./components/experiments-list/experiments-list.component";
import { ExperimentDetailComponent } from "./components/experiment-detail/experiment-detail.component";
import { ExperimentNavComponent } from "./components/main-nav/sidenav/experiment-nav/experiment-nav.component";
import { ExperimentListNavComponent } from "./components/main-nav/sidenav/experiment-list-nav/experiment-list-nav.component";
import { ExperimentCreateComponent } from "./components/experiment-create/experiment-create.component"; // replicate
import { CreationDetailsComponent } from "./components/experiment-create/creation-details/creation-details.component";
import { CreationDatasetComponent } from "./components/experiment-create/creation-dataset/creation-dataset.component";
import { CreationMetadataComponent } from "./components/experiment-create/creation-metadata/creation-metadata.component";
import { ExperimentDatasetComponent } from "./components/experiment-dataset/experiment-dataset.component";
import { ProductTrackingComponentComponent } from "./components/product-tracking-component/product-tracking-component.component";

// Services import + routing
import { AppRoutingModule } from "./routes/app-routing.module";
import { AuthenticationService } from "./services/authentication.service";
import { AuthGuardService } from "./services/auth-guard.service";
import { SharedService } from "./services/shared.service";
import { NotificationService } from "./services/notification.service";
import { ExperimentPcaComponent } from "./components/experiment-pca/experiment-pca.component";
import { ExperimentHcaComponent } from "./components/experiment-hca/experiment-hca.component";
import { ExperimentMetadataComponent } from "./components/experiment-metadata/experiment-metadata.component";
import { ExperimentInfoComponent } from "./components/experiment-info/experiment-info.component";
import { ExperimentRegressionComponent } from "./components/experiment-regression/experiment-regression.component";
import { ExperimentClassificationComponent } from './components/experiment-classification/experiment-classification.component';
import { ExperimentResultMLComponent } from './components/experiment-result-ml/experiment-result-ml.component';
import { NewRegressionComponent } from './components/experiment-regression/new-regression/new-regression.component';
import { ModelRegressionComponent } from './components/experiment-regression/model-regression/model-regression.component';
import { NewClassificationComponent } from './components/experiment-classification/new-classification/new-classification.component';
import { ModelClassificationComponent } from './components/experiment-classification/model-classification/model-classification.component';
import { ExperimentModifyComponent } from './components/experiment-modify/experiment-modify.component';
import { CheckPasswordDirective } from './directives/check-password.directive';
import { ProductRegFormComponent } from './components/product-tracking-component/product-reg-form/product-reg-form.component';
import { AssetsTableComponent } from './components/product-tracking-component/assets-table/assets-table.component';
import { ProductHistoryComponent } from './components/product-tracking-component/assets-table/product-history/product-history.component';
import { UpdateLocationComponent } from './components/product-tracking-component/assets-table/product-history/update-location/update-location.component';
import { TransferOwnershipComponent } from './components/product-tracking-component/assets-table/product-history/transfer-ownership/transfer-ownership.component';
import { LinkExperimentComponent } from './components/product-tracking-component/assets-table/product-history/link-experiment/link-experiment.component';
import { ListAssetTableComponent } from './components/product-tracking-component/list-asset-table/list-asset-table.component';
import { AssetDialogComponent } from "./components/product-tracking-component/asset-dialog/asset-dialog.component";
import { ViewAssetComponent } from "./components/product-tracking-component/view-asset/view-asset.component";
import { UpdateAssetComponent } from "./components/product-tracking-component/update-asset/update-asset.component";
import { TransactionHistoryComponent } from './components/product-tracking-component/transaction-history/transaction-history.component';
import { ViewTransactionDetailsComponent } from './components/product-tracking-component/view-transaction-details/view-transaction-details.component';
import { TransferProductComponent } from './components/product-tracking-component/transfer-product/transfer-product.component';
import { ApproveTransactionComponent } from './components/product-tracking-component/approve-transaction/approve-transaction.component';
import { ViewTransactionHistoryComponent } from './components/product-tracking-component/view-transaction-history/view-transaction-history.component';
import { ViewTrackingGoogleMapComponent } from './components/product-tracking-component/view-tracking-google-map/view-tracking-google-map.component';
import { DeleteAssetDialogComponent } from './components/product-tracking-component/delete-asset-dialog/delete-asset-dialog.component';

@NgModule({
  declarations: [
    AppComponent,
    ProfileComponent,
    LoginComponent,
    RegisterComponent,
    HomeComponent,
    MainNavComponent,
    ExperimentsListComponent,
    ExperimentDetailComponent,
    ExperimentNavComponent,
    ExperimentListNavComponent,
    ExperimentCreateComponent,
    CreationDetailsComponent,
    CreationDatasetComponent,
    CreationMetadataComponent,
    ExperimentDatasetComponent,
    ExperimentPcaComponent,
    ExperimentHcaComponent,
    ExperimentMetadataComponent,
    ExperimentInfoComponent,
    ExperimentRegressionComponent,
    ExperimentClassificationComponent,
    ExperimentResultMLComponent,
    NewRegressionComponent,
    ModelRegressionComponent,
    NewClassificationComponent,
    ModelClassificationComponent,
    ExperimentModifyComponent,
    CheckPasswordDirective,
    ProductTrackingComponentComponent,
    ProductRegFormComponent,
    AssetsTableComponent,
    ProductHistoryComponent,
    UpdateLocationComponent,
    TransferOwnershipComponent,
    LinkExperimentComponent,
    ListAssetTableComponent,
    AssetDialogComponent,
    ViewAssetComponent,
    UpdateAssetComponent,
    TransactionHistoryComponent,
    ViewTransactionDetailsComponent,
    TransferProductComponent,
    ApproveTransactionComponent,
    ViewTransactionHistoryComponent,
    ViewTrackingGoogleMapComponent,
    DeleteAssetDialogComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    LayoutModule,
    MatToolbarModule,
    MatButtonModule,
    MatSidenavModule,
    MatIconModule,
    MatListModule,
    MatCardModule,
    MatExpansionModule,
    NgMaterialMultilevelMenuModule,
    MatSelectModule,
    MatInputModule,
    NgSelectModule,
    AgGridModule.withComponents([]),
    PapaParseModule,
    MatSlideToggleModule,
    ToastrModule.forRoot(),
    MatTabsModule,
    MatProgressSpinnerModule,
    MatMenuModule,
    MatDialogModule,
    MatTableModule,
    MatPaginatorModule,
    MatSnackBarModule,
    NvD3Module,
    MatCheckboxModule,
    MatRadioModule,
    MatChipsModule,
    //GoogleMapsModule,
    //AgmCoreModule.forRoot({apiKey: 'AIzaSyAn4BoDz7n2LV3O0zfdvv5ZqgWL0VcwUMg'})
    //Loader
  ],
  providers: [
    AuthenticationService,
    AuthGuardService,
    SharedService,
    NotificationService
  ],
  bootstrap: [AppComponent],
  entryComponents: [
    AssetDialogComponent,
    UpdateAssetComponent,
    ViewAssetComponent,
    TransactionHistoryComponent,
    ViewTransactionDetailsComponent,
    TransferProductComponent,
    ApproveTransactionComponent,
    ViewTransactionHistoryComponent,
    ViewTrackingGoogleMapComponent,
    DeleteAssetDialogComponent
  ],

})
export class AppModule {}
