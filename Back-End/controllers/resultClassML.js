const fs = require("fs");
const utilsFromML = require("./newClassML.js");
const rimraf = require("rimraf");
const mongoose = require("mongoose");
const path = require("path");
const Model = require("../models/model");
const Experiment = require("../models/experiment");
const async = require("async");

/**
 * Function to get the result of ML with a new model
 * @param {*} req
 * @param {*} res
 */
 const getResultNew = function (req, res) {
  if (req.params.path == "" || !req.params.path) {
    console.log("Error: No R Path");
    sendJSONresponse(res, 404, { message: "No R Path in the parameter" });
    return;
  } else {
    let path = req.params.path + "HEATMAPS/rankAccuracy.csv";
    let n = 0;
    let rank = [];

    const lineReader = require("readline").createInterface({
      input: fs.createReadStream(path),
    });

    lineReader.on("line", function (line) {
      if (n === 0) {
        n++;
      } else {
        // Split the line
        let splitLine = line.split(",");

        if (splitLine.length >= 7) { // Check if there are enough elements in the split line
          // Get the values from the split line
          let rankValue = splitLine[0].trim();
          let method = splitLine[1].trim();
          let platform = splitLine[2].trim();
          let Accuracy = Math.ceil(parseFloat(splitLine[3].trim()) * 100) / 100; //values will be rounded to two decimal places
          let Precision = Math.ceil(parseFloat(splitLine[4].trim()) * 100) / 100;
          let Recall = Math.ceil(parseFloat(splitLine[5].trim()) * 100) / 100;
          let F1 = Math.ceil(parseFloat(splitLine[6].trim()) * 100) / 100;

          // Create an object with the extracted values
          let object = {
            rank: rankValue,
            method: method,
            platform: platform,
            Accuracy: Accuracy,
            Precision: Precision,
            Recall: Recall,
            F1: F1
          };

          rank.push(object);
          console.log(object);
        } else {
          console.log("Error: Invalid line format");
        }
      }
    });

    lineReader.on("close", function () {
      console.log("Ranking file read.");
      sendJSONresponse(res, 200, rank);
      return;
    });
  }
};

/**
 * Function to get the result of ML with a trained model
 * @param {*} req
 * @param {*} res
 */
const getResultTrain = function(req, res) {
  let error = null;
  if (req.params.path == "" || !req.params.path) {
    console.log("Error: No R Path");
    sendJSONresponse(res, 404, { message: "No R Path in the parameter" });
    return;
  } else {
    let path = req.params.path + "result.csv";
    let n = 0;
    let results = [];

    const lineReader = require("readline").createInterface({
      input: fs.createReadStream(path)
    });

    lineReader.on("line", function(line) {
      if (n === 0) {
        n++;
      } else {
        // Split the line
        let splitLine = line.split(",");

        let details = splitLine[1].replace(/\"/g, " ").split("\\\\");

        let object = {};

        for (let i = 1; i < details.length; i++) {
          extractInfo(details[i], false, function(err, keyValue) {
            if (err) {
              error = err;
              lineReader.close();
              return;
            } else {
              object[keyValue[0]] = keyValue[1];
            }
          });
        }
        results.push(object);
      }
    });

    lineReader.on("close", function() {
      if (error) {
        console.log("Error to get the results: " + error);
        sendJSONresponse(res, 404, error);
        return;
      } else {
        console.log("Get results done.");
        sendJSONresponse(res, 200, results);
        return;
      }
    });
  }
};

/**
 * Function to save the model selected after a Machine Learning
 *
 * @param {*} req
 * @param {*} res
 */
const saveModel = function(req, res) {
  if (
    !req.body.type ||
    !req.body.path ||
    !req.body.pretreatment ||
    !req.body.experimentid
  ) {
    console.log("Missing parameters.");
    sendJSONresponse(res, 400, {
      message: "Missing parameters to save the model"
    });
    return;
  }

  let type = req.body.type;
  let modelList = req.body.model;
  let tempPath = req.body.path + "temp/";

  // Check if the experiment still exists in the DB
  Experiment.count(
    { _id: mongoose.Types.ObjectId(req.body.experimentid) },
    function(err, count) {
      if (err) {
        console.log(
          "Error to get the experiment during the model saving: " + err
        );
        sendJSONresponse(res, 404, err);
        return;
      } else if (count != 1) {
        console.log("Error: No experiment found to save the model into DB.");
        sendJSONresponse(res, 404, {
          message: "No experiment found to save the model into DB"
        });
      } else {
        // Create the path for the pdf report
        let newPdfPath =
          utilsFromML.createFolderPath("machineLearning/reports/") +
          "report.pdf";

        moveFile(req.body.path + "report.pdf", newPdfPath, err => {
          if (err) {
            // If an error occurs remove the pdf file from reports folder
            console.log("Error moving the pdf report: " + err);
            rimraf(newPdfPath, () => {
              sendJSONresponse(res, 404, {
                message: "Error moving the pdf report."
              });
              return;
            });
          } else {
            console.log("Moving the model file in the model folder.");
            async.each(
              modelList,
              function(model, callback) {
                let filename = "";

                // Create the filename of the model
                if (type === "regression") {
                  filename =
                    model.platform +
                    "_" +
                    model.bacteria.replace(/[^a-zA-Z0-9]/g, "_") +
                    "_" +
                    model.name +
                    ".rda";
                } else {
                  filename = model.platform + "_" + model.name + ".rda";
                }

                // Join the path and the filename
                let newFilePath =
                  utilsFromML.createFolderPath("machineLearning/models/") +
                  "_" +
                  filename;

                model.filename = newFilePath; // Add it to the model object in order to save it
                moveFile(tempPath + filename, newFilePath, callback); // Function to move the file
              },
              function(err) {
                if (err) {
                  // If an error occurs remove all the files into the models folder
                  console.log("Error moving the model file: " + err);
                  removeModels(modelList, () => {
                    rimraf(newPdfPath, () => {
                      sendJSONresponse(res, 404, {
                        message: "Error moving the files."
                      });
                      return;
                    });
                  });
                } else {
                  console.log("All models are saved in the folder.");

                  let modelListForDB = [];

                  // Create the list of models object to save it into the DB
                  // If type is regression the model object is not the same than sensory or authenticity
                  if (type === "regression") {
                    // If regression
                    for (model of modelList) {
                      let temp = {
                        _id: mongoose.Types.ObjectId(),
                        path: model.filename,
                        pathPDFReport: newPdfPath,
                        pretreatment: req.body.pretreatment,
                        type: type,
                        platform: model.platform,
                        ml: model.name,
                        RMSE:
                          model.RMSE == "NaN" ? "NaN" : parseFloat(model.RMSE),
                        Acc: model.Acc == "NaN" ? "NaN" : parseFloat(model.Acc),
                        Af:
                          model["$A_{f}$"] == "NaN"
                            ? "NaN"
                            : parseFloat(model["$A_{f}$"]),
                        Bf:
                          model["$B_{f}$"] == "NaN"
                            ? "NaN"
                            : parseFloat(model["$B_{f}$"]),
                        Delta:
                          model["$\\Delta_{max}$"] == "NaN"
                            ? "NaN"
                            : parseFloat(model["$\\Delta_{max}$"]),
                        experiment_id: req.body.experimentid
                      };

                      if (model.options) {
                        temp.options = model.options;
                      }
                      modelListForDB.push(temp);
                    }
                  } else {
                    // If sensory or authenticity
                    for (model of modelList) {
                      let temp = {
                        _id: mongoose.Types.ObjectId(),
                        path: model.filename,
                        pathPDFReport: newPdfPath,
                        pretreatment: req.body.pretreatment,
                        type: type,
                        platform: model.platform,
                        ml: model.name,
                        Accuracy: model.Accuracy == "NaN" ? "NaN" : parseFloat(model.Acc),
                        experiment_id: req.body.experimentid
                      };

                      if (model.options) {
                        temp.options = model.options;
                      }
                      modelListForDB.push(temp);
                    }
                  }

                  console.log(modelListForDB);

                  // Save the list at the same time to gain time
                  Model.insertMany(modelListForDB, (err, mdl) => {
                    if (err) {
                      // If an error occurs remove all the files into the models folder
                      console.log("Error model creation for the DB: " + err);
                      removeModels(modelList, () => {
                        rimraf(newPdfPath, () => {
                          sendJSONresponse(res, 404, err);
                          return;
                        });
                      });
                    } else {
                      console.log("All models saved in the DB");
                      sendJSONresponse(res, 200, mdl);
                      return;
                    }
                  });
                }
              }
            );
          }
        });
      }
    }
  );
  // Remove the analysis folder to save space
  rimraf(path.join(req.body.path, ".."), function() {
    console.log("Analysis folder removed.");
  });
};

/**
 * Function to download the report done when a new model is done
 * @param {*} req
 * @param {*} res
 */
const downloadReport = function(req, res) {
  res.sendFile(req.body.filename);
};

module.exports = {
  getResultNew,
  getResultTrain,
  downloadReport,
  saveModel
};

/**
 * Function to extract all the information of a string
 *
 * @param {*} str string to extract
 * @param {*} flag boolean to know if it is the last part of the line or not
 */
const extractInfo = function(str, flag, callback) {
  let value = "";
  try {
    let key = str
      .match(/ (.*): /g)[0]
      .trim()
      .replace(":", "");
    if (flag) {
      value = str
        .match(/: (.*)}/g)[0]
        .trim()
        .replace("}", "")
        .replace(": ", "");
    } else {
      value = str
        .match(/: (.*) /g)[0]
        .trim()
        .replace(": ", "");
    }
    callback(null, [key, value]);
  } catch (err) {
    callback(err);
  }
};

const moveFile = function(oldPath, newPath, callback) {
  fs.rename(oldPath, newPath, function(err) {
    if (err) {
      callback(err);
      return;
    }
    console.log(newPath + " copied");
    callback(null);
  });
};

const removeModels = function(list, callback) {
  async.each(
    list,
    function(filePathList, callb) {
      rimraf(filePathList.filename, callb);
    },
    function(err) {
      callback();
    }
  );
  callback;
};

/**
 * Function to send the JSON response to the client
 * @param {*} res
 * @param {*} status
 * @param {*} content
 */
const sendJSONresponse = function(res, status, content) {
  res.status(status);
  res.json(content);
};
