const mongoose = require("mongoose");
const Dataset = require("../models/dataset");
const utilsDataset = require("./dataset");

const metadataCreate = function(list, experimentid, callback) {
  let metadataList = [];

  for (item of list) {
    let headersFormatted = [];
    for (let header of item.headers) {
      headersFormatted.push(utilsDataset.replaceDot(header));
    }
    let temp = {
      _id: mongoose.Types.ObjectId(),
      name: item.name,
      description: item.description,
      experiment_id: experimentid,
      type: item.type,
      headers: headersFormatted,
      is_metadata: item.is_metadata,
      row_file_link: item.filename,
      values_file: utilsDataset.readJSON(item.values, item.headers)
    };
    metadataList.push(temp);
  }

  Dataset.insertMany(metadataList, (err, md) => {
    if (err) {
      console.log("Error metadata creation: " + err);
      callback(err, null);
    } else {
      console.log("All metadata created.");
      callback(null, md);
    }
  });
};

const metadataDelete = function(experimentid, callback) {
  Dataset.deleteMany({ experiment_id: experimentid }, (err, ds) => {
    if (err) {
      console.log("Error metadata deleting: " + err);
      callback(err, null);
    } else {
      console.log("All metadata deleted.");
      callback(null, ds);
    }
  });
};

const metadataOneType = function(req, res) {
  jsonObject = {};
  if (req.params && req.params.experimentid) {
    Dataset.findOne({
      experiment_id: req.params.experimentid,
      is_metadata: true,
      type: req.params.type
    }).exec((err, data) => {
      // Catch errors
      if (!data) {
        console.log("Error: Experiment id not found for metadataOneType.");
        sendJSONresponse(res, 404, {
          message: "experimentid not found"
        });
        return;
      } else if (err) {
        console.log("Error to get the metadataonetype: " + err);
        sendJSONresponse(res, 404, err);
        return;
      }
      // No error send response
      console.log("Metadata One Type success.");
      let values = data.values_file;

      if (
        req.params.type === "sensoryScore" ||
        req.params.type === "authenticityClass"
      ) {
        let keys = Object.keys(values[0].sample);
        let different = [];

        for (let i = 0; i < values.length; i++) {
          if (different.indexOf(values[i].sample[keys[0]]) === -1) {
            different.push(values[i].sample[keys[0]]);
          }
        }

        let json = {};
        json["values"] = values;
        json["nbClasses"] = different.length;
        values = json;
        console.log(values);
      }
      sendJSONresponse(res, 200, values);
    });
  } else {
    console.log("Error: No experiment id in the request metadata one type.");
    sendJSONresponse(res, 404, {
      message: "No experimentid in request for metadata one type"
    });
  }
};

module.exports = {
  metadataCreate,
  metadataDelete,
  metadataOneType
};

// Function to send the Json response to the client
const sendJSONresponse = function(res, status, content) {
  res.status(status);
  res.json(content);
};
