import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";

import { HomeComponent } from "../components/home/home.component";
import { ExperimentsListComponent } from "../components/experiments-list/experiments-list.component";
import { LoginComponent } from "../components/login/login.component";
import { RegisterComponent } from "../components/register/register.component";
import { ProfileComponent } from "../components/profile/profile.component";
import { AuthGuardService } from "../services/auth-guard.service";
import { ExperimentDetailComponent } from "../components/experiment-detail/experiment-detail.component";
import { ExperimentCreateComponent } from "../components/experiment-create/experiment-create.component";//
import { ExperimentDatasetComponent } from "../components/experiment-dataset/experiment-dataset.component";
import { ExperimentPcaComponent } from "../components/experiment-pca/experiment-pca.component";
import { ExperimentMetadataComponent } from "../components/experiment-metadata/experiment-metadata.component";
import { ExperimentHcaComponent } from "../components/experiment-hca/experiment-hca.component";
import { ExperimentRegressionComponent } from "../components/experiment-regression/experiment-regression.component";
import { ExperimentClassificationComponent } from "../components/experiment-classification/experiment-classification.component";
import { ExperimentResultMLComponent } from "../components/experiment-result-ml/experiment-result-ml.component";
import { ExperimentModifyComponent } from "../components/experiment-modify/experiment-modify.component";
import { ProductTrackingComponentComponent } from "../components/product-tracking-component/product-tracking-component.component";
import { ProductRegFormComponent } from "../components/product-tracking-component/product-reg-form/product-reg-form.component";
import { AssetsTableComponent } from "../components/product-tracking-component/assets-table/assets-table.component";
import { ProductHistoryComponent } from "../components/product-tracking-component/assets-table/product-history/product-history.component";
import { UpdateLocationComponent } from "../components/product-tracking-component/assets-table/product-history/update-location/update-location.component";
import { LinkExperimentComponent } from "../components/product-tracking-component/assets-table/product-history/link-experiment/link-experiment.component";
import { TransferOwnershipComponent } from "../components/product-tracking-component/assets-table/product-history/transfer-ownership/transfer-ownership.component";
import { TransactionHistoryComponent } from "../components/product-tracking-component/transaction-history/transaction-history.component";
import { ViewTransactionHistoryComponent } from "../components/product-tracking-component/view-transaction-history/view-transaction-history.component";
import { ViewTrackingGoogleMapComponent } from '../components/product-tracking-component/view-tracking-google-map/view-tracking-google-map.component';
//Sid's imports

import { ListAssetTableComponent } from "../components/product-tracking-component/list-asset-table/list-asset-table.component";

/**
 * Handle the routes of Angular with the component to load according to the path
 */
const routes: Routes = [
  {
    path: "",
    redirectTo: "home",
    pathMatch: "full"
  },
  {
    path: "home",
    component: HomeComponent,
    data: { title: "Home" }
  },
  {
    path: "experiments/:browse",
    component: ExperimentsListComponent,
    data: { title: "Experiments List" }
  },
  {
    path: "login",
    component: LoginComponent,
    data: { title: "Log in" }
  },
  {
    path: "register",
    component: RegisterComponent,
    data: { title: "Register" }
  },
  {
    path: "profile",
    component: ProfileComponent,
    data: { title: "Profile" },
    canActivate: [AuthGuardService]
  },
  {
    path: "experiment/detail/:experimentid",
    component: ExperimentDetailComponent,
    data: { title: "Details Experiment" }
  },
  {
    path: "experiment/create",
    component: ExperimentCreateComponent,
    data: { title: "Create Experiment" }
  },
  {
    path: "tracking",
    component: ProductTrackingComponentComponent,
    data: { title: "Product Tracking" }
  },
  {
    path:"tracking/listassets",
    component:ListAssetTableComponent,
    data:{title: "List Assets"}
  },
  {
    path:"tracking/SeeOrgTransactionHistory",
    component: TransactionHistoryComponent,
    data:{title: "See Org Transaction History"}
  },
  {
    path: "tracking/viewTransactionHistory",
    component: ViewTransactionHistoryComponent,
    data: {title: "View transaction history"}
  },
  {
    path: "tracking/viewTrackingGoogleMap",
    component: ViewTrackingGoogleMapComponent,
    data: {title: "View tracking google map"}
  },
  {
    path: "tracking/register",
    component: ProductRegFormComponent,
    data: { title: "Product registration" }
  },
  {
    path: "tracking/seeproducts",
    component: AssetsTableComponent,
    data: { title: "See Products" }
  },
  {
    path: "tracking/seehistory/:assetid",
    component: ProductHistoryComponent,
    data: { title: "See History" }
  },
  {
    path: "tracking/updatelocation/:assetid",
    component: UpdateLocationComponent,
    data: { title: "Update Location" }
  },
  {
    path: "tracking/linkexperiment/:assetid",
    component: LinkExperimentComponent,
    data: { title: "Link Experiment" }
  },
  {
    path: "tracking/transferownership/:assetid",
    component: TransferOwnershipComponent,
    data: { title: "Transfer Ownership" }
  },
  {
    path: "experiment/dataset/:experimentid",
    component: ExperimentDatasetComponent,
    data: { title: "Dataset Experiment" }
  },
  {
    path: "experiment/pca/:experimentid",
    component: ExperimentPcaComponent,
    data: { title: "PCA Experiment" }
  },
  {
    path: "experiment/metadata/:experimentid",
    component: ExperimentMetadataComponent,
    data: { title: "Metadata Experiment" }
  },
  {
    path: "experiment/hca/:experimentid",
    component: ExperimentHcaComponent,
    data: { title: "HCA Experiment" }
  },
  {
    path: "experiment/regression/:experimentid",
    component: ExperimentRegressionComponent,
    data: { title: "Regression Experiment" }
  },
  {
    path: "experiment/classification/:type/:experimentid",
    component: ExperimentClassificationComponent,
    data: { title: "Classification Experiment" }
  },
  {
    path:
      "experiment/resultml/:type/:model/:pretreatment/:ismetafile/:experimentid",
    component: ExperimentResultMLComponent,
    data: { title: "Result Experiment" }
  },
  {
    path: "experiment/modify/:experimentid",
    component: ExperimentModifyComponent,
    data: { title: "Modify Experiment" }
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
