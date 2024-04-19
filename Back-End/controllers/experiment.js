const mongoose = require("mongoose");
const Experiment = require("../models/experiment");
const User = require("../models/user");
const utilsDataset = require("../controllers/dataset");
const utilsNotification = require("../controllers/notification");
const utilsMetadata = require("../controllers/metadata");
let async = require("async");

// Set operations
const intersection = (set1, set2) =>
  new Set([...set1].filter(x => set2.has(x)));
const difference = (set1, set2) => new Set([...set1].filter(x => !set2.has(x)));

// Array operations, built using the set ones
// NB: Arrays are NOT Sets, and there is some information lost in the conversion.
// But Sets are the proper data structure for unordered collections of unique values.
const intersectionA = (arr1, arr2) =>
  Array.from(intersection(new Set(arr1), new Set(arr2)));
const differenceA = (arr1, arr2) =>
  Array.from(difference(new Set(arr1), new Set(arr2)));

/**
 * FIND ALL THE EXPERIMENTS
 *
 * @param {*} req
 * @param {*} res
 */
const experimentsList = function(req, res) {
  if (req.params && req.params.browse) {
    let query = createQuery(req.params);
    console.log('params: ' + req.params)
    if (query == null) {
      console.log("Error with the query. Wrong parameter.");
      sendJSONresponse(res, 404, {
        message: "Error with the query. Wrong parameter."
      });
      return;
    } else {
      console.log('QUERY: ' + query);
      Experiment.find({ $or: query })
        .populate("author_id")
        .sort({ date_creation: "desc" })
        .exec((err, experiment) => {
          // Catch errors
          if (err) {
            console.log("Error get the list experiments: " + err);
            sendJSONresponse(res, 404, err);
            return;
          }
          // No error send response
          console.log("List experiments success.");
          // console.log(experiment)
          sendJSONresponse(res, 200, experiment);
        });
    }
  } else {
    console.log("Error: No parameters in the request.");
    sendJSONresponse(res, 404, {
      message: "No parameter condition in request"
    });
  }
};

/**
 * FIND ONE EXPERIMENT BY ID
 *
 * @param {*} req
 * @param {*} res
 */
const experimentDetail = function(req, res) {
  // Check if the request parameters are not empty and exist
  if (req.params && req.params.experimentid) {
    Experiment.findById(req.params.experimentid)
      .populate("user_permission") // Populate the user_permission
      .populate("author_id")
      .exec((err, experiment) => {
        // Catch errors
        if (!experiment) {
          console.log("Error: Experiment id not found.");
          sendJSONresponse(res, 520, { message: "Experiment id not found" });
        } else if (err) {
          console.log("Error to get one experiment: " + err);
          sendJSONresponse(res, 404, err);
        } else {
          // No error send response
          console.log("Experiment detail success.");
          sendJSONresponse(res, 200, experiment);
        }
      });
  } else {
    console.log("Error: No experiment id in the request.");
    sendJSONresponse(res, 404, {
      message: "No experimentid in request"
    });
  }
};

/**
 * CREATE AN EXPERIMENT
 * Check first all the inputs from details, dataset and metadata
 * Check all the users id
 * 1. Create experiment details
 * 2. Create dataset
 * 3. Create metadata (if exist)
 *
 * @param {*} req
 * @param {*} res
 */
const experimentCreate = function(req, res) {
  let arrayUser = [];
  let resData = {};
  let experiment = req.body.experiment;
  let datasetList = req.body.datasetList;
  let metadataList = req.body.metadataList;
  let experimentid = mongoose.Types.ObjectId();

  // Check if all the elements of experiment are not empty
  for (let itemsFromExperiment in experiment) {
    if (experiment[itemsFromExperiment] == null) {
      console.log("Error: Experiment fields are required.");
      sendJSONresponse(res, 400, {
        message: "All fields in experiment details required"
      });
      return;
    }
  }

  // Check if all the elements of dataset are not empty
  if (checkEmptyItem(datasetList)) {
    console.log("Error: Dataset fields are required.");
    sendJSONresponse(res, 400, {
      message: "All fields in dataset upload required"
    });
    return;
  }

  // Check if all the elements of metadata are not empty
  if (checkEmptyItem(metadataList)) {
    console.log("Error: Metadata fields are required.");
    sendJSONresponse(res, 400, {
      message: "All fields in metadata upload required"
    });
    return;
  }
  console.log("No error in the req.body.");

  // Add all the users to an array of objectID to check if they exist
  arrayUser.push(mongoose.Types.ObjectId(experiment.author_id)); // Add the author
  // Add user_permissions
  for (let itemsFromUserPermission in experiment.user_permission) {
    let temp = mongoose.Types.ObjectId(
      experiment.user_permission[itemsFromUserPermission]
    );
    arrayUser.push(temp);
  }

  // Check if all the user_permission have an existing ID
  User.count({ _id: { $in: arrayUser } }, function(err, count) {
    // Catch the errors
    if (!count) {
      console.log("Error: No user found to create an experiment.");
      sendJSONresponse(res, 404, {
        message: "Users not found for experiment creation"
      });
      return;
    } else if (err) {
      console.log("Error to get users during the experiment creation: " + err);
      sendJSONresponse(res, 404, err);
      return;
    }
    // Compare the number of user permission of the array and the number found
    if (count !== arrayUser.length) {
      console.log(
        "Error: IDs from user_permission or author_id are not all correct."
      );
      sendJSONresponse(res, 400, {
        message: "ID from user_permission or author_id incorrect"
      });
      return;
    }

    console.log("No error with users.");

    // No error. Let's create the experiment
    Experiment.create(
      {
        _id: experimentid,
        name: experiment.name,
        description: experiment.description,
        author_id: experiment.author_id,
        type: experiment.type,
        date: experiment.date,
        is_public: experiment.is_public,
        user_permission: experiment.user_permission,
        date_creation: Date.now()
      },
      (err, exp) => {
        if (err) {
          console.log("Error experiment creation: " + err);
          sendJSONresponse(res, 404, err);
        } else {
          console.log("Experiment details created.");
          // Add experiment to the responseData when we will send the json response
          resData.experiment = exp;

          // Then add the dataset, metadata and notification in parallel
          async.parallel(
            {
              // Add the dataset calling the function in ./controllers/dataset.js
              dataset: function(callback) {
                setTimeout(function() {
                  utilsDataset.datasetCreate(
                    datasetList,
                    experimentid,
                    callback
                  );
                }, 100);
              },
              // Add the metadata calling the function in ./controllers/metadata.js
              metadata: function(callback) {
                setTimeout(function() {
                  if (metadataList.length > 0) {
                    utilsMetadata.metadataCreate(
                      metadataList,
                      experimentid,
                      callback
                    );
                  } else {
                    console.log("No metadata.");
                    callback(null, null);
                  }
                }, 100);
              },
              notification: function(callback) {
                setTimeout(function() {
                  if (experiment.user_permission.length > 0) {
                    utilsNotification.changeNotification(
                      experiment.user_permission,
                      experimentid,
                      callback
                    );
                  } else {
                    callback(null, null);
                  }
                }, 100);
              }
            },
            // Callback function
            function(err, answer) {
              // Get the error
              if (err) {
                console.log(
                  "Error dataset/metadata creation or notification update: " +
                    err
                );
                sendJSONresponse(res, 404, err);
              } else {
                // No error. Add the data in the response Data and send the answer to the front end
                resData.dataset = answer.dataset;
                resData.metadata = answer.metadata;
                resData.notification = answer.notification;
                console.log("Experiment created.");
                sendJSONresponse(res, 200, resData);

                utilsNotification.sendNotification(
                  resData.experiment.author_id,
                  resData.experiment._id,
                  resData.experiment.name,
                  resData.experiment.date_creation,
                  resData.experiment.user_permission
                );
              }
            }
          );
        }
      }
    );
  });
};

/**
 * UPDATE EXPERIMENT
 * @param {*} req
 * @param {*} res
 */
const experimentUpdate = function(req, res) {
  let arrayUser = [];
  let experiment = req.body;

  // Check if all the elements of experiment are not empty
  for (let itemsFromExperiment in experiment) {
    if (experiment[itemsFromExperiment] == null) {
      console.log("Error: Experiment fields are required.");
      sendJSONresponse(res, 400, {
        message: "All fields in experiment details required"
      });
      return;
    }
  }

  console.log("No error in the req.body.");

  // Add all the users to an array of objectID to check if they exist
  arrayUser.push(mongoose.Types.ObjectId(experiment.author_id)); // Add the author
  // Add user_permissions
  for (let itemsFromUserPermission in experiment.user_permission) {
    let temp = mongoose.Types.ObjectId(
      experiment.user_permission[itemsFromUserPermission]
    );
    arrayUser.push(temp);
  }

  // Check if all the user_permission have an existing ID
  User.count({ _id: { $in: arrayUser } }, function(err, count) {
    // Catch the errors
    if (!count) {
      console.log("Error: No user found to create an experiment.");
      sendJSONresponse(res, 404, {
        message: "Users not found for experiment creation"
      });
      return;
    } else if (err) {
      console.log("Error to get users during the experiment creation: " + err);
      sendJSONresponse(res, 404, err);
      return;
    }
    // Compare the number of user permission of the array and the number found
    if (count !== arrayUser.length) {
      console.log(
        "Error: IDs from user_permission or author_id are not all correct."
      );
      sendJSONresponse(res, 400, {
        message: "ID from user_permission or author_id incorrect"
      });
      return;
    }

    console.log("No error with users.");

    Experiment.findByIdAndUpdate(
      experiment.experimentId,
      {
        $set: {
          name: experiment.name,
          description: experiment.description,
          type: experiment.type,
          date: experiment.date,
          is_public: experiment.is_public,
          user_permission: experiment.user_permission
        }
      },
      { new: true },
      function(err, exp) {
        if (err) {
          console.log("Error experiment update: " + err);
          sendJSONresponse(res, 404, err);
        } else {
          console.log("Experiment Updated.");
          sendJSONresponse(res, 200, exp);

          let usersSorted = sortUsersPermission(
            experiment.previous_user_permission,
            experiment.user_permission
          );

          console.log(usersSorted);

          async.parallel(
            {
              addNotification: function(callback) {
                setTimeout(function() {
                  if (usersSorted.new_user_permission.length > 0) {
                    console.log(exp);
                    utilsNotification.changeNotification(
                      usersSorted.new_user_permission,
                      exp._id,
                      callback
                    );
                  } else {
                    callback(null, null);
                  }
                }, 100);
              },
              removeNotification: function(callback) {
                setTimeout(function() {
                  if (usersSorted.delete_user_permission.length > 0) {
                    utilsNotification.deleteNotificationFromAuthor(
                      usersSorted.delete_user_permission,
                      exp._id,
                      callback
                    );
                  } else {
                    callback(null, null);
                  }
                }, 100);
              }
            },
            // Callback function
            function(err, answer) {
              // Get the error
              if (err) {
                console.log("Error notification update: " + err);
              } else {
                // No error. Add the data in the response Data and send the answer to the front end
                console.log("Notifications users updated.");

                if (usersSorted.new_user_permission.length > 0) {
                  utilsNotification.sendNotification(
                    exp.author_id,
                    exp._id,
                    exp.name,
                    exp.date_creation,
                    usersSorted.new_user_permission
                  );
                }
              }
            }
          );
        }
      }
    );
  });
};

/**
 * DELETE EXPERIMENT
 * @param {*} req
 * @param {*} res
 */
const experimentDelete = function(req, res) {
  if (req.params && req.params.experimentid) {
    Experiment.findByIdAndRemove(req.params.experimentid).exec(
      (err, experiment) => {
        if (err) {
          console.log("Error to delete the experiment: " + err);
          sendJSONresponse(res, 404, err);
          return;
        }
        console.log("Experiment deleted success.");
        // Then delete the dataset, metadata and notification in parallel
        async.parallel(
          {
            // Add the dataset calling the function in ./controllers/dataset.js
            dataset: function(callback) {
              setTimeout(function() {
                utilsDataset.datasetDelete(req.params.experimentid, callback);
              }, 100);
            },
            // Add the metadata calling the function in ./controllers/metadata.js
            metadata: function(callback) {
              setTimeout(function() {
                utilsMetadata.metadataDelete(req.params.experimentid, callback);
              }, 100);
            },
            notification: function(callback) {
              setTimeout(function() {
                console.log(experiment);
                if (
                  typeof experiment.user_permission !== "undefined" &&
                  experiment.user_permission.length > 0
                ) {
                  utilsNotification.deleteNotificationFromAuthor(
                    experiment.user_permission,
                    experiment._id,
                    callback
                  );
                } else {
                  callback(null, null);
                }
              }, 100);
            }
          },
          // Callback function
          function(err, answer) {
            // Get the error
            if (err) {
              console.log(
                "Error dataset, metadata or notification deleting: " + err
              );
              sendJSONresponse(res, 404, err);
            } else {
              // No error.
              sendJSONresponse(res, 200, {
                message: req.params.experimentid + " has been deleted"
              });
            }
          }
        );
      }
    );
  } else {
    console.log("Error: No experiment id in the request.");
    sendJSONresponse(res, 404, {
      message: "No experimentid in request"
    });
  }
};

module.exports = {
  experimentsList,
  experimentDetail,
  experimentCreate,
  experimentDelete,
  experimentUpdate
};

// Function to send the Json response to the client
const sendJSONresponse = function(res, status, content) {
  res.status(status);
  res.json(content);
};

// Function to check if dataset or metadata is empty
const checkEmptyItem = function(list) {
  for (let itemsFromList of list) {
    for (let item in itemsFromList) {
      if (itemsFromList[item] == null) {
        experimentid;
        return true;
      }
    }
  }
  return false;
};

/**
 * Function to find the removed, added and existing user for shared experiment
 * during update
 * @param {*} prev
 * @param {*} curr
 */
const sortUsersPermission = function(prev, curr) {
  return {
    delete_user_permission: differenceA(prev, curr),
    new_user_permission: differenceA(curr, prev),
    still_user_permission: intersectionA(prev, curr)
  };
};

// Function to create the query according to browse condition
const createQuery = function(paramsURL) {
  let browse = paramsURL.browse;
  let query = [];
  switch (browse) {
    case "all": {
      let id = new mongoose.Types.ObjectId(paramsURL.currentUserId);
      query = [{ author_id: id }, { is_public: true }, { user_permission: id }];
      break;
    }
    case "mine": {
      let id = new mongoose.Types.ObjectId(paramsURL.currentUserId);
      query = [{ author_id: id }];
      break;
    }
    case "share": {
      let id = new mongoose.Types.ObjectId(paramsURL.currentUserId);
      query = [{ user_permission: id }];
      break;
    }
    case "alladmin": {
      query = [{}];
      break;
    }
    case "public": {
      query = [{ is_public: true }];
      break;
    }
    default: {
      query = null;
      break;
    }
  }
  return query;
};
