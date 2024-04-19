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
  selector: "app-experiment-pca",
  templateUrl: "./experiment-pca.component.html",
  styleUrls: [
    "../../../../node_modules/nvd3/build/nv.d3.css",
    "./experiment-pca.component.css"
  ],
  encapsulation: ViewEncapsulation.None
})
export class ExperimentPcaComponent implements OnInit, OnDestroy {
  destroy$: Subject<boolean> = new Subject<boolean>();
  currentListData;
  currentTooltips;
  currentExperimentId;
  datasetList = [];
  metadataList = [];
  error = { show: false, title: "", message: "" };
  chart;
  pca;
  data;
  display = false;
  showLabels = false;
  showLegend = false;
  indexSelected = 0;
  height = 70;
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
      for (let item of this.currentListData) {
        if (item.is_metadata) {
          this.metadataList.push(item);
        } else {
          this.datasetList.push(item);
        }
      }
      this.getPCA(this.datasetList[this.indexSelected]._id, "Raw", () => {
        this.data = this.generateData(1, this.pca);
        this.chart = this.scatterChart(false, this.pca, this.currentTooltips);
        this.display = true;
      });
    });
  }

  getAllData(experimentid, callback) {
    this.api
      .getAllData(experimentid)
      .takeUntil(this.destroy$)
      .subscribe(
        data => {
          this.currentListData = data.datasetMetaList;
          this.currentTooltips = data.tooltips;
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

  getPCA(datasetId, type, callback) {
    // Call the function in API service to get the PCA from the server
    this.api
      .getPCA(datasetId, type)
      .takeUntil(this.destroy$)
      .subscribe(
        res => {
          this.pca = res;
          if (callback && typeof callback === "function") {
            callback();
          }
        },
        err => {
          this.error = {
            show: true,
            title: "PCA Error.",
            message:
              "Error while getting the PCA from the server.<br/>Check the console."
          };
          this.display = true;
          console.log(err);
        }
      );
  }

  /**
   * Function to generate the data per group
   * only used for the first display of the data, without any colours or groups
   *
   * @param groups
   * @param points
   */
  generateData(groups, points) {
    //# groups,# points per group
    let samples = points.sampleNames;
    points = points.pcaComponents;
    let data = [];
    for (let i = 0; i < groups; i++) {
      data.push({
        values: []
      });
      for (let j = 0; j < points.length; j++) {
        data[i].values.push({
          x: points[j][0], //PC1
          y: points[j][1], // PC2
          label: samples[j],
          shape: "circle"
        });
      }
    }
    return data;
  }

  /**
   * Function to create the option json object for the chart
   *
   * @param legend boolean to know if the legend is displayed or not
   * @param pca json object of the pca calculated on the server
   */
  scatterChart(legend, pca, tooltips) {
    return {
      chart: {
        type: "scatterChart",
        color: d3.scale.category10().range(),
        interactive: true,
        showLegend: legend,
        showLabels: this.showLabels,
        useInteractiveGuideline: false,
        style: "expand",
        scatter: {
          onlyCircles: false
        },
        showDistX: true,
        showDistY: true,
        duration: 500,
        xAxis: {
          axisLabel: "PC1 (" + pca.variance[0] + "%)",
          tickFormat: function(d) {
            return d3.format(",.3g")(d);
          }
        },
        yAxis: {
          axisLabel: "PC2 (" + pca.variance[1] + "%)",
          tickFormat: function(d) {
            return d3.format(",.3g")(d);
          },
          axisLabelDistance: -5
        },
        tooltip: {
          contentGenerator: function(d) {
            let index = tooltips.findIndex(function(item, i) {
              return item.name === d.point.label;
            });
            if (index !== -1) {
              let label =
                '<div class="text-center text-bold">' +
                tooltips[index].name +
                '</div><div class="text-center">' +
                tooltips[index].labels +
                "</div>";
              return label;
            } else {
              return d.point.label;
            }
          }
        }
      }
    };
  }

  /**
   * Function to display the new chart according to the dataset chosen in the tab
   *
   * @param idx number of the tab index
   */
  onTabChanged(idx) {
    this.display = false; // Display the spinner
    this.height = 70;
    this.indexSelected = idx; // Save the index
    this.nvd3.clearElement(); // Delete the previous chart
    // Remove legend
    let legend = d3.select("#legend svg");
    legend.selectAll(".legend").remove();
    legend.selectAll("text").remove();
    this.showLegend = false;

    // Call the function to create the new data and option
    this.getPCA(this.datasetList[this.indexSelected]._id, "Raw", () => {
      this.data = this.generateData(1, this.pca);
      this.chart = this.scatterChart(false, this.pca, this.currentTooltips);
      this.display = true;
    });
  }

  /**
   * Change the position of the ink bar for the tab
   */
  inkBarPosition() {
    return { left: this.indexSelected * 160 + "px" };
  }

  displayLabel(boolean) {
    this.display = false;
    this.nvd3.clearElement();
    this.showLabels = boolean;
    this.data = this.data;
    this.chart = this.scatterChart(false, this.pca, this.currentTooltips);
    this.display = true;
  }

  changeScaling(scale) {
    // Remove legend
    let legend = d3.select("#legend svg");
    legend.selectAll(".legend").remove();
    legend.selectAll("text").remove();
    this.showLegend = false;

    this.height = 70;
    this.nvd3.clearElement();
    this.display = false;

    // Call the function to create the new data and option
    this.getPCA(this.datasetList[this.indexSelected]._id, scale, () => {
      this.data = this.generateData(1, this.pca);
      this.display = true;
    });
  }

  sampleActionBC(type) {
    console.log(type);
    this.nvd3.clearElement();
    this.height = 55;
    this.display = false;
    this.api
      .getMetadataOneType(this.currentExperimentId, "bacterialCount")
      .takeUntil(this.destroy$)
      .subscribe(
        res => {
          let json = this.changeColor(res, type);
          let svg = d3
            .select("#legend svg")
            .attr("width", "100%")
            .attr("height", "100px")
            .append("g")
            .append("g")
            .attr("transform", "translate(10," + 60 + ")");

          // avoid multiple legends
          let svg2 = d3.select("#legend svg");
          svg2.selectAll(".legend").remove();
          svg2.selectAll("text").remove();
          this.rangeLegend(json, svg, 60, type);
          this.display = true;
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

  // plot the dots according to the intervals of their metadata
  sampleAction(type) {
    console.log(type);

    // Remove legend
    let legend = d3.select("#legend svg");
    legend.selectAll(".legend").remove();
    legend.selectAll("text").remove();
    this.showLegend = false;

    this.height = 70;
    this.nvd3.clearElement();
    this.display = false;

    this.api
      .getMetadataOneType(this.currentExperimentId, type)
      .takeUntil(this.destroy$)
      .subscribe(
        res => {
          if (type === "sensoryScore" || type === "authenticityClass") {
            // in a case of sensory score or authenticity class the server also computes the nb of classes
            // and put the values and the nbClasses in a JSON object
            console.log("nbClasses=" + res.nbClasses);
            this.generateDataMeta(this.pca, res.values, res.nbClasses, type);
            this.display = true;
          } else {
            // just change the color compute_color_on_linear_scale
            let json = this.changeColor(res, type);

            let svg = d3
              .select("#legend svg")
              // .style("width", "100%")
              // .style("height", "100px")
              .append("g")
              .attr("width", 800)
              .attr("height", 100)
              .append("g")
              .attr("transform", "translate(10," + 60 + ")");

            // avoid multiple legends
            let svg2 = d3.select("#legend svg");
            svg2.selectAll(".legend").remove();
            svg2.selectAll("text").remove();

            this.rangeLegend(json, svg, 60, type);
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

  changeColor(metadata, type) {
    var max = 0;
    var min = 1000000000000000000000;

    for (var i = 0; i < metadata.length; i++) {
      if (metadata[i].sample[type] > max) {
        max = metadata[i].sample[type];
      }
      if (metadata[i].sample[type] < min) {
        min = metadata[i].sample[type];
      }
    }

    let step = (max - min) / 11;

    // export the data
    var json = {};
    json["max"] = max;
    json["min"] = min;
    json["step"] = step;

    // show the svg part to put the heatmap legend
    this.showLegend = true;

    // change the data
    this.data = this.generateDataMetaRange(
      min,
      max,
      step,
      this.pca,
      metadata,
      type
    );

    this.chart = this.scatterChart(false, this.pca, this.currentTooltips);

    return json;
  }

  /*For range of values $points contains pcaComponents and sampleNames*/
  generateDataMetaRange(min, max, step, points, metadata, type) {
    //# groups,# points per group
    var data = [];
    var samples = points.sampleNames;
    points = points.pcaComponents;
    // color red to green
    var colours = [
      "#006837",
      "#1a9850",
      "#66bd63",
      "#a6d96a",
      "#d9ef8b",
      "#ffffbf",
      "#fee08b",
      "#fdae61",
      "#f46d43",
      "#d73027",
      "#a50026"
    ];

    // retrieve the nb of intervals
    // for each interval
    for (var i = 0; i < 1 / (step / (max - min)); i++) {
      //push the data associated to the first interval
      data.push({
        key: i,
        values: [],
        color: colours[i]
      });
      for (var j = 0; j < points.length; j++) {
        // put the dot in the group according to its metadata values
        //need to match the sample with the class
        for (var k = 0; k < metadata.length; k++) {
          if (
            metadata[k].name === samples[j].slice(0, metadata[k].name.length) ||
            samples[j] === metadata[k].name.slice(0, samples[j].length)
          ) {
            if (
              metadata[k].sample[type] >= min + step * i &&
              metadata[k].sample[type] <= min + step * (i + 1)
            ) {
              data[i].values.push({
                x: points[j][0], //PC1
                y: points[j][1], // PC2
                label: samples[j]
              });
            }
          }
        }
      }
    }
    return data;
  }

  /*for Sensory Score points= PC and metadata contains the class*/
  // modify also the chart to display the legend and to have 3 colors.
  // $points contains the samples names and the PCA points
  generateDataMeta(points, metadata, nbClasses, type) {
    // make the keys dynamic
    var keys = Object.keys(metadata[0].sample);

    let samples = points.sampleNames;
    points = points.pcaComponents;
    var data = [];
    // change the legend and colors according to the number of classes
    if (nbClasses == 3) {
      if (type === "authenticityClass") {
        var colors = ["green", "red", "brown"];
        var groups = ["Beef", "Pork", "Mix Beef & Pork (70/30)"];
      } else {
        var colors = ["green", "brown", "red"];
        var groups = ["Fresh", "Semi Fresh", "Spoiled"];
      }
    }
    if (nbClasses === 2) {
      var colors = ["green", "red"];
      var groups = ["Fresh", "Spoiled"];
    }

    for (var i = 0; i < groups.length; i++) {
      //push the data associated to the first group
      data.push({
        key: groups[i],
        values: [],
        color: colors[i]
      });
      for (var j = 0; j < points.length; j++) {
        //need to match the sample with the class
        for (var k = 0; k < metadata.length; k++) {
          if (
            metadata[k].name === samples[j].slice(0, metadata[k].name.length) ||
            samples[j] === metadata[k].name.slice(0, samples[j].length)
          ) {
            if (metadata[k].sample[keys[0]] === i + 1) {
              data[i].values.push({
                x: points[j][0], //PC1
                y: points[j][1], // PC2
                label: samples[j]
              });
            }
          }
        }
      }
    }
    this.data = data;
    this.chart = this.scatterChart(true, this.pca, this.currentTooltips);
  }

  /*Add the heatmap legend */
  rangeLegend(json, svg, bottom, type) {
    let values = [];
    // put the values for the interval in the array
    for (let j = 0; j < 1 / (json.step / (json.max - json.min)); j++) {
      values.push((json.min + j * json.step).toPrecision(2));
    }

    let colors = [
      "#006837",
      "#1a9850",
      "#66bd63",
      "#a6d96a",
      "#d9ef8b",
      "#ffffbf",
      "#fee08b",
      "#fdae61",
      "#f46d43",
      "#d73027",
      "#a50026"
    ];

    // Add a legend for the color values.
    let legend = svg
      .selectAll(".legend")
      .data(values)
      .enter()
      .append("g")
      .attr({
        class: "legend",
        transform: function(d, i) {
          return "translate(" + i * 40 + "," + (bottom - 95) + ")";
        }
      });

    legend.append("rect").attr({
      width: 40,
      height: 20,
      fill: function(d, i) {
        return colors[i];
      }
    });

    legend
      .append("text")
      .attr({
        "font-size": 10,
        x: 0,
        y: 30
      })
      .text(String);

    svg
      .append("text")
      .attr({
        class: "text-bold",
        "font-size": 15,
        x: 0,
        y: bottom - 105
      })
      .text(type + ": ");
  }

  ngOnDestroy() {
    this.destroy$.next(true);
    // Now let's also unsubscribe from the subject itself:
    this.destroy$.unsubscribe();
  }
}
