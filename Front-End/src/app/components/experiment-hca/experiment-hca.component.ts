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
import { MAT_DATEPICKER_SCROLL_STRATEGY_FACTORY_PROVIDER } from "@angular/material";
declare let d3: any;
import { Subject } from "rxjs/Subject";
import "rxjs/add/operator/takeUntil";

@Component({
  selector: "app-experiment-hca",
  templateUrl: "./experiment-hca.component.html",
  styleUrls: [
    "../../../../node_modules/nvd3/build/nv.d3.css",
    "./experiment-hca.component.css"
  ],
  encapsulation: ViewEncapsulation.None
})
export class ExperimentHcaComponent implements OnInit, OnDestroy {
  destroy$: Subject<boolean> = new Subject<boolean>();
  currentListData;
  currentTooltips;
  currentExperimentId;
  datasetList = [];
  metadataList = [];
  legendSensory = false;
  legendAuthenticity = false;
  showLegend = false;
  isGCMS = false;
  error = { show: false, title: "", message: "" };
  hca;
  samples;
  nbClasses;
  display = false;
  indexSelected = 0;
  height = 70;
  @ViewChild("g")
  g;

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

      this.getHCA(this.datasetList[this.indexSelected]._id, "Raw");
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

  getHCA(datasetId, type) {
    this.isGCMS = false;
    this.showLegend = false;
    this.legendSensory = false;
    this.legendAuthenticity = false;
    this.height = 70;

    // Call the funciton in API service to get the HCA from the server
    this.api
      .getHCA(datasetId, type)
      .takeUntil(this.destroy$)
      .subscribe(
        res => {
          this.samples = res.sampleNames;
          this.hca = res.hcaComponent;
          this.drawTree(this.colorDefault);
          this.display = true;
        },
        err => {
          this.error = {
            show: true,
            title: "HCA Error.",
            message:
              "Error while getting the HCA from the server.<br/>Check the console."
          };
          this.display = true;
          console.log(err);
        }
      );
  }

  drawTree = function(
    functionColour,
    metadata?,
    type?,
    addlegend?,
    nbClasses?
  ) {
    let json;
    let root = this.hca;
    let samples = this.samples;
    let tooltips = this.currentTooltips;
    let duration = 500;
    let i = 0;
    this.isGCMS = false;

    if (this.datasetList[this.indexSelected].type === "GCMS") {
      this.isGCMS = true;
    }

    // remove the previous chart
    d3.selectAll("svg > *").remove();

    //compute min max and step
    if (metadata != undefined) {
      json = this.compute_interval(metadata, type);
    }

    // console.log(this.samples);
    let longest = samples.reduce((a, b) => (a.length > b.length ? a : b), "");
    let div = document.getElementById("lengthOfNodeText");
    div.innerHTML = longest;

    // console.log(longest);
    // console.log(div.clientWidth + 1);

    let margin = { top: 100, right: 50, bottom: 60, left: 50 };
    let width =
      document.getElementById("HCA").offsetWidth -
      margin.left -
      margin.right -
      div.clientWidth +
      1;
    let height = 1800 - margin.top - margin.bottom;

    console.log(width);

    // find a way to compute the height according to the number of nodes

    function float2int(value) {
      return value | 0;
    }

    let newHeight = float2int(samples.length / 3) * 80; // 100 pixels per line

    // cluster the leaves to have all of them at the same deepth
    let cluster = d3.layout.cluster().size([height, width]);

    if (samples.length > 50) {
      cluster = cluster.size([newHeight / (samples.length / 150), width]);
    } else {
      cluster = cluster.size([newHeight, width]);
    }

    height = float2int(samples.length / 2.2) * 80;

    /**
     * Function to have the dendrogram
     */
    function elbow(d) {
      return (
        "M" +
        d.source.y +
        "," +
        d.source.x +
        "V" +
        d.target.x +
        "H" +
        d.target.y
      );
    }

    let svg = d3
      .select("#HCA svg")
      .attr("width", document.getElementById("HCA").offsetWidth)
      .append("g")
      .attr("transform", "translate(40," + margin.bottom + ")");

    root.x0 = height / 2;
    root.y0 = 0;

    /**
     * Function to create the tooltip according to the metadata in the DB
     */
    function textTooltip(d) {
      if (d.children === undefined) {
        // this is a leaf
        var sample = samples[d.index];
        var tooltip = "<p>" + sample + "<br>";
        for (var i = 0; i < tooltips.length; i++) {
          if (
            sample === tooltips[i].name.slice(0, sample.length) ||
            tooltips[i].name === sample.slice(0, tooltips[i].name.length)
          ) {
            tooltip += tooltips[i].labels;
          }
        }
        // if no label
        return tooltip + "</p>";
      } else {
        // if not a leaf
        return "";
      }
    }

    function update(source) {
      // Compute the new tree layout.
      var nodes = cluster.nodes(root),
        links = cluster.links(nodes);

      // for adding CSS to the tooltip
      var p = d3
        .select("body")
        .append("p")
        .attr("class", "nvtooltip")
        .style("opacity", 0);

      // Update the nodes…
      var node = svg.selectAll("g.node").data(nodes, function(d) {
        return d.id || (d.id = ++i);
      });

      // Enter any new nodes at the parent's previous position.
      var nodeEnter = node
        .enter()
        .append("g")
        .attr("class", "node")
        .attr("transform", function(d) {
          return "translate(" + source.y0 + "," + source.x0 + ")";
        })
        .on("click", click);

      nodeEnter
        .append("circle")
        .attr("r", function(d) {
          return d.children ? 0 : 5;
        })
        .style("fill", function(d) {
          return d._children
            ? "white"
            : functionColour(d, metadata, type, json, nbClasses, samples);
        });

      nodeEnter
        .append("text")
        .attr("x", function(d) {
          var spacing = 8;
          return d.children || d._children ? -spacing : spacing;
        })
        .attr("dy", "3")
        .attr("text-anchor", function(d) {
          return d.children || d._children ? "end" : "start";
        })
        .text(function(d) {
          return d.children ? "" : samples[d.index];
        })
        .style("fill-opacity", 0);

      nodeEnter
        .on("mouseover", function(d) {
          p.transition()
            .duration(200)
            .style("opacity", 1);
          p.html(textTooltip(d))
            .style("left", d3.event.pageX + "px")
            .style("top", d3.event.pageY - 28 + "px");
        })
        .on("mouseout", function(d) {
          p.transition()
            .duration(500)
            .style("opacity", 0);
        });

      // Transition nodes to their new position.
      var nodeUpdate = node
        .transition()
        .duration(duration)
        .attr("transform", function(d) {
          return "translate(" + d.y + "," + d.x + ")";
        });

      nodeUpdate
        .select("circle")
        .attr("r", function(d) {
          return d.children ? 0 : 5;
        })
        .style("fill", function(d) {
          return d._children
            ? "white"
            : functionColour(d, metadata, type, json, nbClasses, samples);
        });

      nodeUpdate.select("text").style("fill-opacity", 1);

      // Transition exiting nodes to the parent's new position.
      var nodeExit = node
        .exit()
        .transition()
        .duration(duration)
        .attr("transform", function(d) {
          return "translate(" + source.y + "," + source.x + ")";
        })
        .remove();

      nodeExit.select("circle").attr("r", 0);
      nodeExit.select("text").style("fill-opacity", 0);

      // Update the links…
      var link = svg.selectAll("path.link").data(links, function(d) {
        return d.target.id;
      });

      // Enter any new links at the parent's previous position.
      link
        .enter()
        .insert("path", "g")
        .attr("class", "link")
        .attr("d", function(d) {
          return (
            "M" +
            source.x0 +
            "," +
            source.y0 +
            "V" +
            source.y0 +
            "H" +
            source.x0
          );
        });

      // Transition links to their new position.
      link
        .transition()
        .duration(duration)
        .attr("d", elbow);

      // Transition exiting nodes to the parent's new position.
      link
        .exit()
        .transition()
        .duration(duration)
        .attr("d", function(d) {
          return (
            "M" + source.x + "," + source.y + "V" + source.y + "H" + source.x
          );
        })
        .remove();

      // Stash the old positions for transition.
      nodes.forEach(function(d) {
        d.y0 = d.x;
        d.x0 = d.y;
      });

      // add legend only when assign colours not for the default plot
      if (metadata != undefined) {
        let svgLegend = d3
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

        addlegend(json, width, height, svgLegend, margin.bottom, type);
      }
      d3.select(self.frameElement).style("height", height + "px");

      // Set the height of the HCA
      var elements = d3.select("#HCA svg g").selectAll("g"); // Get all the nodes elements in the html
      let yList = [];
      for (let i = 0; i < elements[0].length; i++) {
        yList.push(elements[0][i]["__data__"].y0); // Through all the nodes push the y position
      }
      // Difference between the first and the last node + the margin
      let h =
        Math.max(...yList) - Math.min(...yList) + margin.top + margin.bottom;
      d3.select("#HCA svg").attr("height", h); // Add attribute to svg element
    }

    function click(d) {
      console.log(d);
      if (d.children) {
        d._children = d.children;
        d.children = null;
      } else {
        d.children = d._children;
        d._children = null;
      }
      update(d);
    }

    update(root);
  };

  /**
   * Function to display the new HCA according to the dataset chosen in the tab
   *
   * @param idx number of the tab index
   */
  onTabChanged(idx) {
    this.display = false; // Display the spinner
    this.indexSelected = idx; // Save the index

    // Call the function to create the new data and option
    this.getHCA(this.datasetList[this.indexSelected]._id, "Raw");
  }

  /**
   * Function to display the HCA according to the linkage chosen
   *
   * @param linkage string of the linkage selected
   */
  changeLinkage(linkage) {
    this.display = false;
    this.legendSensory = false;
    this.showLegend = false;
    this.legendAuthenticity = false;
    console.log(linkage);
    // recover the cluster for the chosen type of method for each sample
    this.getHCA(this.datasetList[this.indexSelected]._id, linkage);
  }

  /**
   * Function to plot the dots according to the invervals of the bacterial count metadata
   * Specific function for bacterial count because the user select the type of the bacterial
   * count which is a nested element in the JSOn object
   */
  sampleActionBC(type) {
    this.api
      .getMetadataOneType(this.currentExperimentId, "bacterialCount")
      .takeUntil(this.destroy$)
      .subscribe(
        res => {
          this.height = 58;
          this.legendSensory = false;
          this.showLegend = true;
          this.legendAuthenticity = false;
          this.drawTree(this.colorRange, res, type, this.rangeLegend);
          this.display = true;
        },
        err => {
          this.shared.changeShowInfo(false);
          this.error = {
            show: true,
            title: "Metadata Error.",
            message:
              "Error while getting the metadata for HCA from the server.<br/>Check the console."
          };
          this.display = true;
          console.log(err);
        }
      );
  }

  /**
   * Function to plot the dots according to the invervals of the bacterial count metadata
   */
  sampleAction(type) {
    console.log(type);
    this.api
      .getMetadataOneType(this.currentExperimentId, type)
      .takeUntil(this.destroy$)
      .subscribe(
        res => {
          this.height = 68;
          this.legendSensory = false;
          this.showLegend = false;
          this.legendAuthenticity = false;
          if (type === "sensoryScore") {
            this.legendSensory = true;
            this.nbClasses = res.nbClasses;
            this.drawTree(
              this.colorNodeSensory,
              res.values,
              type,
              this.empty,
              res.nbClasses
            );
            this.display = true;
          } else if (type === "authenticityClass") {
            this.legendAuthenticity = true;
            this.nbClasses = res.nbClasses;
            this.drawTree(
              this.colorNodeAuthenticity,
              res.values,
              type,
              this.empty,
              this.nbClasses
            );
            this.display = true;
          } else {
            this.drawTree(this.colorRange, res, type, this.rangeLegend);
            this.display = true;
          }
        },
        err => {
          this.shared.changeShowInfo(false);
          this.error = {
            show: true,
            title: "Metadata Error.",
            message:
              "Error while getting the metadata for HCA from the server.<br/>Check the console."
          };
          this.display = true;
          console.log(err);
        }
      );
  }

  /**
   * Function to range values of bacteria d=node and metadata contains the range of values
   * change the color of the leaf node according to the sensory score
   *
   * @param d
   * @param metadata
   * @param type
   * @param json
   */
  colorRange(d, metadata, type, json, nbClasses, samples) {
    var colors = [
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
    if (d.children === undefined) {
      // this is a leaf
      var sample = samples[d.index];
      for (var i = 0; i < metadata.length; i++) {
        if (
          sample === metadata[i].name.slice(0, sample.length) ||
          metadata[i].name === sample.slice(0, metadata[i].name.length)
        ) {
          for (
            var j = 0;
            j < Math.floor(1 / (json.step / (json.max - json.min)));
            j++
          ) {
            // equal and greater than are important for the min and max values
            if (
              metadata[i].sample[type] >= json.min + json.step * j &&
              metadata[i].sample[type] <= json.min + json.step * (j + 1)
            )
              return colors[j];
          }
        }
      }
    }
  }

  /*for Sensory Score d=node and metadata contains the class*/
  // change the color of the leaf node according to the sensory score
  colorNodeSensory(d, metadata, type, json, nbClasses, samples) {
    if (nbClasses == 3) {
      var colors = ["green", "brown", "red"];
    }
    if (nbClasses == 2) {
      var colors = ["green", "red"];
    }

    if (d.children === undefined) {
      // this is a leaf
      var sample = samples[d.index];
      var keys = Object.keys(metadata[0].sample);
      for (var i = 0; i < metadata.length; i++) {
        if (
          sample === metadata[i].name.slice(0, sample.length) ||
          metadata[i].name === sample.slice(0, metadata[i].name.length)
        ) {
          var sensory = metadata[i].sample[keys[0]];
          return colors[sensory - 1];
        }
      }
    }
    // if other node than leaf, don't use colour
    else return "white";
  }

  /*for Authenticity class d=node and metadata contains the class*/
  // change the color of the leaf node according to the Authenticity Class
  colorNodeAuthenticity(d, metadata, type, json, nbClasses, samples) {
    if (nbClasses == 3) {
      var colors = ["green", "brown", "red"];
    }
    if (nbClasses == 2) {
      var colors = ["green", "red"];
    }

    if (d.children === undefined) {
      // this is a leaf
      var sample = samples[d.index];
      var keys = Object.keys(metadata[0].Sample);
      for (var i = 0; i < metadata.length; i++) {
        if (
          sample === metadata[i].name.slice(0, sample.length) ||
          metadata[i].name === sample.slice(0, metadata[i].name.length)
        ) {
          //if(sample===$metadata[i].name)
          var sensory = metadata[i].sample[keys[0]];
          return colors[sensory - 1];
        }
      }
    }
    // if other node than leaf, don't use colour
    else return "white";
  }

  /**
   * Function to return the default node color
   */
  colorDefault = function(d, metadata?, type?, json?) {
    // default colour
    return "lightsteelblue";
  };

  empty() {}

  rangeLegend(json, width, height, svg, bottom, type) {
    let values = [];

    // put the values for the interval in the array
    // Math Floor cast the value to an integer to avoid having 12 instead of 11 intervals
    for (
      let j = 0;
      j < Math.floor(1 / (json.step / (json.max - json.min)));
      j++
    ) {
      values.push((json.min + j * json.step).toPrecision(2));
    }
    var minrange = d3.min(values, function(d, i) {
        return values[i];
      }),
      maxrange = d3.max(values, function(d, i) {
        return values[i];
      });

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
    let x = d3.scale
      .ordinal()
      .domain(values)
      .rangeBands([0, width]);
    let z = d3.scale.linear().range(values);

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

  /**
   * Function to create 11 intervals of values according
   * to the min and the max values of the metadata
   */
  compute_interval = function(metadata, type) {
    var json = {};
    var max = 0;
    var min = 1000000000000000000000;
    for (var i = 0; i < metadata.length; i++) {
      if (metadata[i].sample[type] > max) max = metadata[i].sample[type];
      if (metadata[i].sample[type] < min) min = metadata[i].sample[type];
    }
    var step = (max - min) / 11;

    // export the data
    json["max"] = max;
    json["min"] = min;
    json["step"] = step;
    return json;
  };

  /**
   * Change the position of the ink bar for the tab
   */
  inkBarPosition() {
    return { left: this.indexSelected * 160 + "px" };
  }

  ngOnDestroy() {
    this.destroy$.next(true);
    // Now let's also unsubscribe from the subject itself:
    this.destroy$.unsubscribe();
  }
}
