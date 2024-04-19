const mongoose = require("mongoose");
const Dataset = require("../models/dataset");
const PCA = require("ml-pca");

const getPCA = function(req, res) {
  // var to save the different part of the data
  let jsonData = {};
  let pca;

  if (req.params && req.params.datasetid) {
    Dataset.findById(req.params.datasetid).exec((err, dataset) => {
      // Catch error
      if (!dataset) {
        console.log("Error: Dataset id not found.");
        sendJSONresponse(res, 520, { message: "Datasetid not found" });
      } else if (err) {
        console.log("Error to get one dataset: " + err);
        sendJSONresponse(res, 404, err);
      } else {
        // No error
        console.log("Dataset for PCA found.");
        jsonData["columnNames"] = dataset.headers.slice(1);
        jsonData["sampleNames"] = sampleName(dataset.values_file);
        console.log("Column and Sample names done.");
        jsonData["datapoints"] = dataArray(dataset, jsonData);
        console.log("Datapoints done.");

        if (req.params.type === "AS") {
          console.log("AS");
          pca = new PCA(jsonData["datapoints"], {
            scale: true,
            center: true,
            useCovarianceMatrix: false
          });
        } else if (req.params.type === "MC") {
          console.log("MC");
          pca = new PCA(jsonData["datapoints"], {
            scale: false,
            center: true,
            useCovarianceMatrix: false
          });
        } else if (req.params.type === "Raw") {
          console.log("Raw");
          pca = new PCA(jsonData["datapoints"], {
            scale: false,
            center: false,
            useCovarianceMatrix: false
          });
        }

        var loadings = pca.getLoadings();
        var variance = pca.getExplainedVariance();
        for (var i = 0; i < variance.length; i++) {
          // to have a percentage
          variance[i] = variance[i] * 100;
          // keep only 2 decimal
          variance[i] = variance[i].toPrecision(2);
        }

        jsonData["variance"] = variance;
        var pcaComponents = pca.predict(jsonData["datapoints"]);
        jsonData["pcaComponents"] = pcaComponents;

        console.log("PCA success.");
        sendJSONresponse(res, 200, jsonData);
      }
    });
  } else {
    console.log("Error: No dataset id in the request.");
    sendJSONresponse(res, 404, {
      message: "No datasetid in request"
    });
  }
};

// Function retrieve the sample names in a dataset
const sampleName = function(values) {
  var samName = [];
  //go through the names and save the values
  for (i = 0; i < values.length; ++i) {
    samName[i] = values[i].name;
  }
  // return the result
  return samName;
};

// Function to put all the datapoints in a two dimensional array to compute calculations on it
const dataArray = function(dataset, jsonData) {
  // Create an array to save the datapoints in a two dimensional array
  var k = 0;
  var points = new Array(dataset.values_file.length);

  // For each sample
  for (j = 0; j < points.length; ++j) {
    // create an array in an array to have a two dimensional array
    points[j] = new Array(jsonData.columnNames.length);

    // retrieve the values associated with a sample
    var s = dataset.values_file[j].sample;

    // for each value associated with a sample
    for (key in s) {
      if (s.hasOwnProperty(key)) {
        points[j][k] = s[key];
        k++;
      }
    }
    k = 0;
  }

  return points;
};

module.exports = {
  getPCA,
  sampleName,
  dataArray
};

// Function to send the Json response to the client
const sendJSONresponse = function(res, status, content) {
  res.status(status);
  res.json(content);
};
