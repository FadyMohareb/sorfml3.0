import {
  Component,
  OnInit,
  OnDestroy,
  ViewEncapsulation,
  ViewChild
} from "@angular/core";
import { SharedService } from "../../services/shared.service";
import { ApiService } from "../../services/api.service";
import { ActivatedRoute } from "@angular/router";
declare let d3: any;
import { Subject } from "rxjs/Subject";
import "rxjs/add/operator/takeUntil";

@Component({
  selector: "app-experiment-metadata",
  templateUrl: "./experiment-metadata.component.html",
  styleUrls: [
    "../../../../node_modules/nvd3/build/nv.d3.css",
    "./experiment-metadata.component.css"
  ],
  encapsulation: ViewEncapsulation.None
})
export class ExperimentMetadataComponent implements OnInit, OnDestroy {
  destroy$: Subject<boolean> = new Subject<boolean>();
  currentListData;
  currentExperimentId;
  metadataList = [];
  tabMetadata = [];
  error = { show: false, title: "", message: "" };
  chart;
  data;
  display = false;
  showLabels = false;
  showLegend = false;
  indexSelected = 0;
  @ViewChild("nvd3")
  nvd3;

  constructor(
    private shared: SharedService,
    private api: ApiService,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.shared.changeExperimentId(this.route.snapshot.params["experimentid"]);
    this.shared.currentExperimentId
      .takeUntil(this.destroy$)
      .subscribe(experimentId => (this.currentExperimentId = experimentId));

    this.getAllData(this.currentExperimentId, () => {
      this.shared.changeShowInfo(true);
      console.log(this.currentListData);
      for (let item of this.currentListData) {
        if (item.is_metadata) {
          this.metadataList.push(item);
        }
      }
      if (this.metadataList.length > 0) {
        this.changeTabName(this.metadataList);
        this.displayMetadata(this.metadataList[0].type);
      } else {
        this.error = {
          show: true,
          title: "No Metadata.",
          message:
            "There is no metadata for this experiment.<br/>Create a new experiment with metadata if you want to visualise it."
        };
        this.display = true;
      }
    });
  }

  getAllData(experimentid, callback) {
    this.api
      .getAllData(experimentid)
      .takeUntil(this.destroy$)
      .subscribe(
        data => {
          this.currentListData = data.datasetMetaList;
          callback();
        },
        err => {
          this.shared.changeExperimentId("noId");
          this.shared.changeShowInfo(false);
          this.error = {
            show: true,
            title: "No Experiment Found.",
            message:
              "The experiment as been deleted by the author or there is a problem with the server.<br/>Check the console."
          };
          this.display = true;
          console.log(err);
        }
      );
  }

  /**
   * Function to display the new chart according to the dataset chosen in the tab
   *
   * @param idx number of the tab index
   */
  onTabChanged(idx) {
    this.indexSelected = idx;
    this.displayMetadata(this.metadataList[this.indexSelected].type);
  }

  /**
   * Function display different charts according to the type of the metadata
   *
   * @param type string of the metadata type chosen in the tab
   */
  displayMetadata(type) {
    console.log("TYPE", type);
    this.display = false;
    this.api
      .getMetadataOneType(this.currentExperimentId, type)
      .takeUntil(this.destroy$)
      .subscribe(
        res => {
          this.nvd3.clearElement();

          if (type == "sensoryScore" || type == "authenticityClass") {
            let values = res.values; // return values and nb classes in case of sensory score

            // display pie chart to display the pie chart, need to have the number of samples
            // per classes and the percentage array to count the number of samples per class
            let computeValues = this.computeValuesPieChart(values);
            this.data = this.formatData(
              computeValues[0],
              computeValues[1],
              type
            );
            this.chart = this.pieChart(computeValues[0], computeValues[1]);
            this.display = true;
          } else if (
            type == "bacterialCount" ||
            type == "TVC" ||
            type == "pH"
          ) {
            let values = res;
            this.data = this.formatDataMultiBar(values);
            this.chart = this.multiBar(values);
            this.display = true;
          }
        },
        err => {
          this.shared.changeShowInfo(false);
          this.error = {
            show: true,
            title: "Metadata Error.",
            message:
              "Error while getting the metadata for PCA from the server.<br/>Check the console."
          };
          this.display = true;
          console.log(err);
        }
      );
  }

  formatDataMultiBar(values) {
    var data = [];
    var count = 0; // count the number of columns to know the number of different types of bacteria

    // save the key
    var keyArray = [];
    for (var key in values[0].sample)
      if (values[0].sample.hasOwnProperty(key)) {
        keyArray[count] = key;
        count++;
      }

    // create one group per column(different type of bacteria) in the bacterial count data
    for (var i = 0; i < count; i++) {
      data.push({
        key: keyArray[i],
        values: [] //$scope.values[j].Sample[i],
      });
      for (var j = 0; j < values.length; j++) {
        data[i].values.push({
          x: j,
          y: values[j].sample[keyArray[i]]
        });
      }
    }
    return data;
  }

  multiBar(values) {
    return {
      chart: {
        type: "multiBarChart",
        reduceXTicks: true,
        rotateLabels: 0,
        stacked: true,
        groupSpacing: 0.5,
        showControls: false,
        xAxis: {
          tickFormat: function(d) {
            return values[d].name;
          }
        },
        yAxis: {
          tickFormat: function(d) {
            return d3.format(",.3g")(d);
          }
        },
        margin: {
          left: 60
        }
      }
    };
  }

  formatData(count, percentage, type) {
    var data = [];
    if (type === "authenticityClass") {
      // make a difference between 2 and 3 classes
      if (count[2] !== 0) { // if its odd
        var labels = ["Beef", "Pork", "Mixed Beef & Pork (70/30)"];
        var colors = ["green", "red", "brown"];
      } else { // if its even
        labels = ["Beef", "Pork"];
        var colors = ["green", "red"];
        // remove the last element of the array
        count.pop();
      }
    } else if (type === "sensoryScore") {
      // make a difference between 2 and 3 classes
      if (count[2] !== 0) {
        var labels = ["Fresh", "Semi Fresh", "Spoiled"];
        var colors = ["green", "brown", "red"];
      } else {
        labels = ["Fresh", "Spoiled"];
        var colors = ["green", "red"];
        // remove the last element of the array
        count.pop();
      }
    }

    for (var i = 0; i < count.length; i++) {
      data.push({
        label: labels[i],
        value: percentage[i],
        color: colors[i]
      });
    }
    return data;
  }

  computeValuesPieChart(values) {
    let count = [0, 0, 0];
    console.log(values);

    // find the name of the key, not always class, so finding the name of the key makes it dynamic
    var keys = Object.keys(values[0].sample);
    var different = [];

    for (var i = 0; i < values.length; i++) {
      if (different.indexOf(values[i].sample[keys[0]]) === -1)
        different.push(values[i].sample[keys[0]]);
    }

    for (var i = 0; i < values.length; i++) {
      if (values[i].sample[keys[0]] === different[0]) count[0] += 1;
      else if (values[i].sample[keys[0]] === different[1]) count[1] += 1;
      else count[2] += 1;
    }

    let percentage = [0, 0, 0];
    for (var j = 0; j < count.length; j++) {
      percentage[j] = (count[j] / values.length) * 100;
    }

    return [count, percentage];
  }

  pieChart(count, percentage) {
    return {
      chart: {
        type: "pieChart",
        showLabels: true,
        x: function(d) {
          return d.label;
        },
        y: function(d) {
          return d.value;
        },
        tooltip: {
          contentGenerator: function(d) {
            return (
              "<p>" +
              count[d.index] +
              " samples (" +
              percentage[d.index].toPrecision(2) +
              "%)" +
              "</p>"
            );
          }
        }
      }
    };
  }

  /**
   * Change the position of the ink bar for the tab
   */
  inkBarPosition() {
    return { left: this.indexSelected * 160 + "px" };
  }

  /**
   * Function to display the name of the metadata in a good way
   *
   * @param metadataList list of a json object
   */
  changeTabName(metadataList) {
    for (let metadata of metadataList) {
      switch (metadata.type) {
        case "bacterialCount": {
          this.tabMetadata.push("Bacterial Count");
          break;
        }
        case "sensoryScore": {
          this.tabMetadata.push("Sensory Score");
          break;
        }
        case "pH": {
          this.tabMetadata.push("pH");
          break;
        }
        case "temperature": {
          this.tabMetadata.push("Temperature");
          break;
        }
        case "authenticityClass": {
          this.tabMetadata.push("Authenticity Class");
          break;
        }
        case "TVC": {
          this.tabMetadata.push("TVC");
          break;
        }
        case "Generic": {
          this.tabMetadata.push("Generic");
          break;
        }
        default: {
          this.tabMetadata.push("Argument Type Not Good");
          break;
        }
      }
    }
  }

  ngOnDestroy() {
    this.destroy$.next(true);
    // Now let's also unsubscribe from the subject itself:
    this.destroy$.unsubscribe();
  }
}
