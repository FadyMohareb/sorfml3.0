import { Component, OnInit } from "@angular/core";
import { Router } from "@angular/router";

@Component({
  selector: "app-experiment-list-nav",
  templateUrl: "./experiment-list-nav.component.html",
  styleUrls: ["./experiment-list-nav.component.scss"]
})
export class ExperimentListNavComponent implements OnInit {
  constructor(public router: Router) {}
  appitems = [
    {
      label: "Browse Experiments",
      icon: "list",
      items: [
        {
          label: "All Experiments",
          link: `experiments/all`,
          icon: "all_inclusive"
        },
        {
          label: "My Experiments",
          link: `experiments/mine`,
          icon: "lock"
        },
        {
          label: "Shared Experiments",
          link: `experiments/share`,
          icon: "share"
        },
        {
          label: "Public Experiments",
          link: `experiments/public`,
          icon: "public"
        }
      ]
    }
  ];

  redirect($event) {
    this.router.navigateByUrl($event.link);
  }

  ngOnInit() {}
}
