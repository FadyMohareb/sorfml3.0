const mongoose = require("mongoose");
const Dataset = require("../models/dataset");

const datasetCreate = function(list, experimentid, callback) {
  let datasetList = [];

  for (item of list) {
    let heardersFormatted = [];
    for (let header of item.headers) {
      heardersFormatted.push(replaceDot(header));
    }
    let temp = {
      _id: mongoose.Types.ObjectId(),
      name: item.name,
      description: item.description,
      experiment_id: experimentid,
      type: item.type,
      headers: heardersFormatted,
      is_metadata: item.is_metadata,
      row_file_link: item.filename,
      values_file: readJSON(item.values, item.headers)
    };
    datasetList.push(temp);
  }

  Dataset.insertMany(datasetList, (err, ds) => {
    if (err) {
      console.log("Error dataset creation: " + err);
      callback(err, null);
    } else {
      console.log("All dataset created.");
      callback(null, ds);
    }
  });
};

const datasetDetail = function(req, res) {
  // Check if the request parameters are not empty and exist
  if (req.params && req.params.experimentid) {
    Dataset.find({
      experiment_id: req.params.experimentid,
      is_metadata: false
    }).exec((err, dataset) => {
      // Catch errors
      if (typeof dataset === "undefined" || dataset.length === 0) {
        console.log("Error: Experiment id not found for the dataset.");
        sendJSONresponse(res, 404, {
          message: "experimentid not found"
        });
        return;
      } else if (err) {
        console.log("Error to get datasets: " + err);
        sendJSONresponse(res, 404, err);
        return;
      }
      // No error send response
      console.log("Dataset detail success.");
      sendJSONresponse(res, 200, dataset);
    });
  } else {
    console.log("Error: No experiment id in the request dataset.");
    sendJSONresponse(res, 404, {
      message: "No experimentid in request for dataset"
    });
  }
};

const datasetDelete = function(experimentid, callback) {
  Dataset.deleteMany({ experiment_id: experimentid }, (err, ds) => {
    if (err) {
      console.log("Error dataset deleting: " + err);
      callback(err, null);
    } else {
      console.log("All dataset deleted.");
      callback(null, ds);
    }
  });
};

const allData = function(req, res) {
  jsonObject = {};
  if (req.params && req.params.experimentid) {
    Dataset.find({
      experiment_id: req.params.experimentid
    }).exec((err, data) => {
      // Catch errors
      if (typeof data === "undefined" || data.length === 0) {
        console.log("Error: Experiment id not found for all data.");
        sendJSONresponse(res, 404, {
          message: "experimentid not found"
        });
        return;
      } else if (err) {
        console.log("Error to get all data: " + err);
        sendJSONresponse(res, 404, err);
        return;
      }
      // No error send response
      console.log("Dataset detail success.");
      datasetMetaList = [];
      for (item of data) {
        datasetMetaList.push({
          is_metadata: item.is_metadata,
          name: item.name,
          experiment_id: item.experiment_id,
          type: item.type,
          _id: item._id,
          headers: item.headers
        });
      }
      jsonObject.datasetMetaList = datasetMetaList;
      jsonObject.tooltips = tooltip(data);
      sendJSONresponse(res, 200, jsonObject);
    });
  } else {
    console.log("Error: No experiment id in the request all data.");
    sendJSONresponse(res, 404, {
      message: "No experimentid in request for all data"
    });
  }
};

const tooltip = function(datasetMetaList) {
  let tooltips = [];
  let metadataList = [];

  for (datasetMeta of datasetMetaList) {
    if (datasetMeta.is_metadata) {
      metadataList.push(datasetMeta);
    }
  }

  for (metadata of metadataList) {
    for (values of metadata.values_file) {
      let index = tooltips.findIndex(function(item, i) {
        return item.name === values.name;
      });
      if (index === -1) {
        let label = "";
        for (key in values.sample) {
          label = label + key + ": " + values.sample[key] + "<br>";
        }
        tooltips.push({ name: values.name, labels: label });
      } else {
        let label = tooltips[index].labels;
        for (key in values.sample) {
          label = label + key + ": " + values.sample[key] + "<br>";
        }
        tooltips[index].labels = label;
      }
    }
  }
  return tooltips;
};

const replaceDot = function(input) {
  return input.replace(/[^a-zA-Z0-9]/g, "_");
};

// Function to read the JSON and put it in the proper format for the database
const readJSON = function(values_file, headers) {
  let valuesList = [];
  for (let values of values_file) {
    let temp = {};
    temp.sample = {};
    temp.name = values[headers[0]];
    if(temp.name != ""){
      for (let i = 1; i < headers.length; i++) {
        let key = replaceDot(headers[i]);
        temp.sample[key] = parseFloat(values[headers[i]]);
      }
      valuesList.push(temp);
    }
  }
  return valuesList;
};

module.exports = {
  datasetCreate,
  datasetDetail,
  datasetDelete,
  allData,
  replaceDot,
  readJSON
};

const sendJSONresponse = function(res, status, content) {
  res.status(status);
  res.json(content);
};
