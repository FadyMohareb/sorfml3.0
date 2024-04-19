import { Component, OnInit } from "@angular/core";
import { SharedService } from "../../services/shared.service";

@Component({
  selector: "app-home",
  templateUrl: "./home.component.html",
  styleUrls: ["./home.component.scss"]
})
export class HomeComponent implements OnInit {
  constructor(private shared: SharedService) {}

  ngOnInit() {
    this.shared.changeShowInfo(false);
  }
}
