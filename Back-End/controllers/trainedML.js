const utilsFromML = require("./newRegML.js");
const Model = require("../models/model");
const rimraf = require("rimraf");

/**
 * Function to get the models according to the parameters
 * @param {*} req
 * @param {*} res
 */
const getModels = function(req, res) {
  if (!req.body) {
    console.log("No parameter to get the models.");
    sendJSONresponse(res, 404, { message: "No parameters to get the models." });
    return;
  }

  let query = createQuery(req.body);

  console.log(query);

  if (query == null) {
    console.log("No type for the models");
    sendJSONresponse(res, 404, { message: "No type for the models." });
    return;
  }

  Model.find(query).exec((err, mdl) => {
    // catch error
    if (err) {
      console.log("Error get the models: " + err);
      sendJSONresponse(res, 404, err);
      return;
    }
    // No error send response
    console.log("Models list success.");
    sendJSONresponse(res, 200, mdl);
  });
};

const performTrainML = function(req, res) {
  if (!req.body) {
    console.log("No parameter to perform the ML.");
    sendJSONresponse(res, 404, { message: "No parameters to perform the ML." });
    return;
  } else {
    svr = { cost: [], epsilon: [], gamma: [] };

    console.log(req.body);

    let type = req.body.type;

    if (type === "regression") {
      content = {
        RMSE: req.body.RMSE,
        Acc: req.body.Acc,
        Af: req.body.Af,
        Bf: req.body.Bf,
        Delta: req.body.Delta
      };
    } else if (type === "sensory" || type === "authenticity") {
      content = {
        Acc: req.body.Acc
      };
    } else {
      console.log("Missing the type of the machine learning.");
      sendJSONresponse(res, 404, { message: "Missing the type for the ML" });
    }

    utilsFromML.ML(
      res,
      [req.body.ml], // Machine Learning
      [req.body.bacteria], // Bacteria List
      [req.body.platform], // Platforms List
      "", // Percentage
      req.body.type, // Title
      req.body.experiment_id, // Experiment ID
      req.body.pretreatment, // Pretreatment
      "", // Log
      "", // Iteration
      "", // kForKNN
      "", // Trees
      svr, // SVR
      false, // New model or train model
      req.body.path,
      content,
      req.body.is_metaFile
    );
  }
};

const deleteModel = function(req, res) {
  if (!req.params && !req.params.modelId) {
    console.log("No parameter to delete the model.");
    sendJSONresponse(res, 404, {
      message: "No parameters to delete the model."
    });
    return;
  } else {
    Model.findByIdAndRemove(req.params.modelId).exec((err, mdl) => {
      if (err) {
        console.log("Error to delete the model: " + err);
        sendJSONresponse(res, 404, err);
        return;
      }
      console.log("Model deleted success.");
      rimraf(mdl.path, () => {
        sendJSONresponse(res, 200, mdl);
        return;
      });
    });
  }
};

module.exports = {
  getModels,
  deleteModel,
  performTrainML
};

// Function to send the Json response to the client
const sendJSONresponse = function(res, status, content) {
  res.status(status);
  res.json(content);
};

// Function to create the query according to browse condition
const createQuery = function(body) {
  let type = body.type;
  let platforms;
  let query = {};

  if (type != "all") {
    platforms = extractNameFromList(body.platformsList);
  }

  switch (type) {
    case "regression": {
      let bacterias = extractNameFromList(body.bacteriaList);
      query = {
        type: type,
        platform: { $in: platforms },
        bacteria: { $in: bacterias }
      };
      break;
    }
    case "sensory": {
      query = {
        type: type,
        platform: { $in: platforms }
      };
      break;
    }
    case "authenticity": {
      query = {
        type: type,
        platform: { $in: platforms }
      };
      break;
    }
    case "all": {
      query = {};
      break;
    }
    default: {
      query = null;
      break;
    }
  }
  return query;
};

/**
 * Function to get the name of the object list
 * @param {*} list
 */
const extractNameFromList = function(list) {
  let tempList = [];
  for (item of list) {
    tempList.push(item.name.replace(/_/g, "-"));
  }
  return tempList;
};
