const mongoose = require("mongoose");
const Dataset = require("../models/dataset");
const utilsPCA = require("./pca");
const hclust = require("ml-hclust");

const getHCA = function(req, res) {
  let jsonData = {};

  if (req.params && req.params.datasetid) {
    Dataset.findById(req.params.datasetid).exec((err, dataset) => {
      // Catch error
      if (!dataset) {
        console.log("Error: Dataset id not found for HCA.");
        sendJSONresponse(res, 520, { message: "Datasetid not found HCA" });
      } else if (err) {
        console.log("Error to get one dataset for HCA: " + err);
        sendJSONresponse(res, 404, err);
      } else {
        // No error
        console.log("Dataset for HCA found.");
        jsonData["columnNames"] = dataset.headers.slice(1);
        jsonData["sampleNames"] = utilsPCA.sampleName(dataset.values_file);
        console.log("Column and Sample names done.");
        jsonData["datapoints"] = utilsPCA.dataArray(dataset, jsonData);
        console.log("Datapoints done.");

        if (dataset.type === "GCMS") {
          for (key in jsonData["datapoints"]) {
            if (jsonData["datapoints"].hasOwnProperty(key)) {
              for (let i = 0; i < jsonData["datapoints"][key].length; i++) {
                if (jsonData["datapoints"][key][i] === 0) {
                  //take care of zeros before log2
                  jsonData["datapoints"][key][i] = 0.1;
                }
                jsonData["datapoints"][key][i] = Math.log2(
                  jsonData["datapoints"][key][i]
                );
              }
            }
          }
        }

        if (req.params.type === "Raw") {
          jsonData["hcaComponent"] = new hclust.agnes(jsonData["datapoints"]);
        } else {
          jsonData["hcaComponent"] = new hclust.agnes(jsonData["datapoints"], {
            kind: req.params.type
          });
        }

        console.log("HCA success.");
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

module.exports = {
  getHCA
};

// Function to send the Json response to the client
const sendJSONresponse = function(res, status, content) {
  res.status(status);
  res.json(content);
};
