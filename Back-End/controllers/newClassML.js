const child_process = require("child_process");
const fs = require("fs");
const latex = require("node-latex");
const path = require("path");
const async = require("async");
const Dataset = require("../models/dataset");
const { spawn } = require("child_process");

const performNewML = function (req, res) {
  if (!req.body) {
    console.log("No parameter to perform the ML.");
    sendJSONresponse(res, 404, { message: "No parameters to perform the ML." });
    return;
  } else {
    // Format the parameters for the command line
    let mlmList = cleanList(req.body.mlmList, false);
    let platformsList = cleanList(req.body.platformsList, true);
    let percentage = req.body.percentage / 100;

    ML(
      res,
      mlmList,
      platformsList,
      percentage,
      req.body.title,
      req.body.experimentId,
      req.body.pretreatment,
      req.body.log,
      req.body.iteration,
      true,
      "",
      null,
      req.body.is_metaFile
    );
  }
};

const ML = function (
  res,
  mlmList,
  platformsList,
  percentage,
  title,
  experimentId,
  pretreatment,
  log,
  iteration,
  newModel,
  modelPath,
  contentForTrainModel,
  is_metaFile
) {
  let nameFolder, typeMeta, RFolder, scriptPath, MetaDataFile; //count for saving the name of the files

  savedFileNames = []; //Save the name of the created CSV files to use them with the R script

  // Variable to iterate in async.each()
  let filesToCopy = Array.from(platformsList);

  switch (title) {
    case "regression":
      typeMeta = "bacterialCount";
      scriptPath = path.join(
        __dirname,
        "..",
        "machineLearning/regressionScript.R"
      );
      break;
    case "sensory":
      typeMeta = "sensoryScore";
      scriptPath = path.join(
        __dirname,
        "..",
        "machineLearning/classificationScript.R"
      );
      break;
    case "authenticity":
      typeMeta = "authenticityClass";
      scriptPath = path.join(
        __dirname,
        "..",
        "machineLearning/classificationScript.R"
      );
      break;
    default:
      console.log("Error in the meta type");
      sendJSONresponse(res, 404, {
        message: "Meta type does not exist"
      });
      return false;
  }

  if (is_metaFile) {
    filesToCopy.push(typeMeta);
  }

  /* To allow multiple user to execute Regression/Classification at the 
  same time, creation of a folder with the time and in this folder
  the CSV files are temporary created the R script creates the PDF report */

  // generate the folder name with the timestamp to avoid concurrency
  nameFolder = createFolderPath("machineLearning/analysis/");

  // Check if the folder path does not exist
  while (fs.existsSync(nameFolder)) {
    // If exist generate another one until to make one which does not exist
    nameFolder = createFolderPath("machineLearning/analysis/");
  }

  // Create the folders for the ML
  mkdirSync(nameFolder, res);
  RFolder = nameFolder + "/R/";
  mkdirSync(RFolder, res);
  // change slashes incase its a windows directory 
  let RFolder2 = RFolder.replace(/\\/g, "/");
  RFolder = RFolder2.toString();

  if (newModel) {
    mkdirSync(RFolder + "temp/", res);
  }
  // Save the folder path in a variable to use JSON Config File for FQC
  const folderPath = RFolder;
  console.log(folderPath);

  console.log("R Folder created.");

  platformsList = [];
  async.each(
    filesToCopy,
    function (type, callback) {
      Dataset.findOne({
        experiment_id: experimentId,
        type: type
      }).exec((err, dataset) => {
        console.log(experimentId + "  " + type);
        // Catch errors
        if (!dataset) {
          console.log("Error: Experiment id not found for the ML.");
          sendJSONresponse(res, 404, {
            message: "experimentid not found"
          });
          return;
        } else if (err) {
          console.log("Error to get datasets for the ML: " + err);
          sendJSONresponse(res, 404, err);
          return;
        }
        // No error send response
        console.log("Dataset detail success.");
        copyFileFromDB(dataset, type, nameFolder, function (err, fileName) {
          if (err) {
            callback(err);
          } else {
            // Save the name of the file to retrieve them easily in the cmd
            if (type !== typeMeta) {
              savedFileNames.push(fileName);
              platformsList.push(type);
            } else {
              MetaDataFile = fileName;
              metaFileName = fileName;
            }
            callback(null);
          }
        });
      });
    },
    function (err) {
      if (err) {
        // One of the iterations produced an error. Stop processing.
        console.log("A file failed to process: " + err);
        sendJSONresponse(res, 404, {
          message: "Failed to copy files"
        });
        return false;
      } else {
        console.log("End of async. All files have been processed successfully");

        res.connection.setTimeout(0); // this could take a while

        console.log(platformsList);
        console.log(savedFileNames);
        console.log("@@@@@ metaFileName @@@@@");
        console.log(metaFileName);

        // Calling MakeJsonConfig function To make config File For FQC
        makeJsonConfig(
          mlmList,        // Random forest
          platformsList,  // FTIR
          percentage,     // 0.7
          pretreatment,   // auto-scale
          iteration,      // 20
          savedFileNames, // Full path of dataset
          metaFileName,   // Full path of metadata
          folderPath      // Full path to save the results
        );
        console.log("json file created");

        let args = [
          scriptPath,
          typeMeta,
          commaArg(platformsList),
          commaArg(mlmList),
          pretreatment,
          log,
          percentage,
          iteration,
          RFolder,
          commaArg(savedFileNames),
          MetaDataFile,
          newModel,
          modelPath,
          is_metaFile
        ];

        // now execute the command line
        commandLine(title, args, function (err) {
          if (err) {
            sendJSONresponse(res, 404, {
              message: "Error during the R script."
            });
            return false;
          } else {
            // If it's a new model write the report
            if (newModel) {
              writeLatexContent(RFolder, typeMeta, function (err, content) {
                if (err) {
                  sendJSONresponse(res, 404, err);
                } else {
                  fs.writeFile(RFolder + "report.tex", content, err => {
                    // throws an error, you could also catch it here
                    if (err) {
                      console.log("Error writing the latex file: " + err);
                      sendJSONresponse(res, 404, {
                        message: "Error while writing the latex file. " + err
                      });
                    } else {
                      // success case, the file was saved
                      console.log("Latex success");

                      const input = fs.createReadStream(
                        path.resolve(RFolder + "report.tex")
                      );
                      const output = fs.createWriteStream(
                        path.resolve(RFolder + "report.pdf")
                      );

                      const pdf = latex(input);

                      pdf.pipe(output);
                      pdf.on("error", function (err) {
                        console.error("Error while creating the PDF: " + err);
                        sendJSONresponse(res, 404, {
                          message:
                            "Error while creating the pdf after the machine learning. " +
                            err
                        });
                      });
                      pdf.on("finish", function () {
                        console.log("PDF generated!");
                        sendJSONresponse(res, 200, [RFolder, pretreatment]);
                        console.log("Finish.");
                        return true;
                      });
                    }
                  });
                }
              });
            } else {
              if (typeMeta === "sensoryScore") {
                content =
                  '"2", "2\\\\ Acc: ' +
                  contentForTrainModel.Acc +
                  " \\\\ Precision: " +
                  contentForTrainModel.Precision +
                  "% \\\\ Recall: " +
                  contentForTrainModel.Recall +
                  " \\\\ F1: " +
                  contentForTrainModel.F1 +
                  " \\\\ Bf: " +
                  contentForTrainModel.Bf +
                  '"\r\n' +
                  '"3", "3\\\\ ML: ' +
                  mlmList[0] +
                  " \\\\ Platform: " +
                  platformsList[0] +
                  '"\r\n';
              } else {
                content =
                  '"2", "2\\\\ Acc: "' +
                  contentForTrainModel.Acc +
                  '%"\r\n' +
                  '"3", "3\\\\ ML: ' +
                  mlmList[0] +
                  " \\\\ Platform: " +
                  platformsList[0] +
                  '"\r\n';
              }

              if (is_metaFile) {
                fs.appendFile(RFolder + "result.csv", content, function (err) {
                  if (err) {
                    console.log(
                      "Error to write the result of the machine learning: " +
                      err
                    );
                    sendJSONresponse(res, 404, err);
                    return;
                  } else {
                    console.log("CSV completed.");
                    sendJSONresponse(res, 200, [RFolder, pretreatment]);
                    console.log("Finish.");
                  }
                });
              } else {
                fs.writeFile(
                  RFolder + "result.csv",
                  '"x"\r\n' + content,
                  function (err) {
                    if (err) {
                      console.log(
                        "Error to write the result of the machine learning: " +
                        err
                      );
                      sendJSONresponse(res, 404, err);
                      return;
                    } else {
                      console.log("CSV completed.");
                      sendJSONresponse(res, 200, [RFolder, pretreatment]);
                      console.log("Finish.");
                    }
                  }
                );
              }
            }
          }
        });
      }
    }
  );
};

/**
 * Function to create a random folder path on the server
 * @param {*} rootFolder string of the name of the folder
 */
const createFolderPath = function (rootFolder) {
  generatedPath = rootFolder + Math.floor(Date.now() / 1000);
  return path.join(__dirname, "..", generatedPath);
};

/**
 * Function to execute the command line with child process
 *
 * @param {*} data
 */
const commandLine = function (title, args, callback) {
  try {
    let rspawn = child_process.spawn("Rscript", args);


    rspawn.stdout.on("data", function (data) {
      console.log("STDOUT: \n");
      console.log(data.toString());
    });

    rspawn.stderr.on("data", function (data) {
      console.log("STDERR: \n");
      console.log(data.toString());
    });

    rspawn.on("close", function (code) {
      if (code == 0) {
        console.log("child process exited with code " + code);
        console.log("Machine Learning " + title + " success.");
        callback(null);
      } else {
        console.log("Error during the Machine learning.");
        console.log("child process exited with code " + code);
        callback(true);
      }
    });

    let stdin = process.openStdin();

    stdin.addListener("data", function (data) {
      rspawn.stdin.write(data.toString());
    });
  } catch (err) {
    console.log("Error during the Machine learning.");
    callback(true);
  }
};

/**
 * Function to copy the file needed for the ML
 *
 * @param {*} dataset
 * @param {*} type
 * @param {*} callback
 */
const copyFileFromDB = function (dataset, type, nameFolder, callback) {
  try {
    let columnNames = Object.keys(dataset.values_file[0].sample);
    let firstLine = "Sample,";
    for (let j = 0; j < columnNames.length; j++) {
      firstLine += columnNames[j] + ",";
    }
    // remove the last comma
    firstLine = firstLine.slice(0, -1);
    firstLine += "\n";

    // now write all the valuesin a file
    let fieldsCSV = firstLine;
    for (let i = 0; i < dataset.values_file.length; i++) {
      fieldsCSV += dataset.values_file[i].name + ",";
      for (let j = 0; j < columnNames.length; j++) {
        fieldsCSV += dataset.values_file[i].sample[columnNames[j]] + ",";
      }
      // remove the last comma
      fieldsCSV = fieldsCSV.slice(0, -1);
      fieldsCSV += "\n";
    }

    // extract name of the file
    let row_file_link = dataset.row_file_link.split("/");
    if (row_file_link.length > 0) {
      row_file_link = row_file_link[row_file_link.length - 1];
      row_file_link = row_file_link.split(".");
    }

    // equivalent to replace all which does not exist in JS
    row_file_link[0] = row_file_link[0].split(" ").join("_");

    let fileName = nameFolder + "/" + row_file_link[0] + ".csv";

    fs.writeFile(fileName, fieldsCSV, function (err) {
      if (err) {
        callback(err, null);
      } else {
        console.log(type + ".csv has been copied.");
        callback(null, fileName);
      }
    });
  } catch (err) {
    callback(err, null);
  }
};

/**
 * Function to only have the selected name of the json object in the list
 *
 * @param {*} list
 */
const cleanList = function (list, flag) {
  let newList = [];
  for (let item of list) {
    if (item.selected && flag) {
      newList.push(item.name.replace(/[^a-zA-Z0-9]/g, ""));
    } else if (item.selected && !flag) {
      newList.push(item.name);
    }
  }
  return newList;
};

/**
 * Function to create a folder
 * @param {*} path
 */
const mkdirSync = function (path, res) {
  try {
    fs.mkdirSync(path);
  } catch (e) {
    if (e.code != "EEXIST") {
      console.log("Error while creating the R Folder: " + e);
      sendJSONresponse(res, 404, e);
    }
  }
};

/**
 * Function to create a string with all the element of the array separated by a comma except at the end
 * @param {*} array
 */
const commaArg = function (array) {
  let str = "";
  for (let i = 0; i < array.length; i++) {
    str += array[i];
    if (i != array.length - 1) str += ",";
  }
  return str;
};

/**
 * Function to write the latex content to generate the pdf
 * @param {*} type string for the machine learning's type
 */
const writeLatexContent = function (RFolder, type, callback) {
  let custom;

  if (type === "bacterialCount") {
    custom = "metabolomics";
  } else if (type === "sensoryScore") {
    custom = "sensory";
  } else if (type === "authenticityClass") {
    custom = "authenticity";
  }

  console.log("Starting to write latex.");

  async.parallel(
    {
      //Create the first part
      part1: function (callback) {
        setTimeout(function () {
          try {
            let contentPart1 =
              "\\documentclass[a4paper, 11pt]{article}\n\n\\marginparwidth = 5pt\n\n\\" + // Start of document
              "usepackage{graphicx}\n\\usepackage{fixltx2e}\n\\usepackage{longtable}\n\\usepackage[margin=0.5 in]{geometry}" + // Packages
              "\n\n\n\\title{\\textbf{Report for " + // Title
              custom + // custom value for the title
              " data coupled to machine learning}\\\n}\n" +
              "\\author{}\n" + //Author
              "\\date{\\today}\n\n" + // Date
              "\\begin{document}\n" +
              "\\begin{centering}\n" +
              "\\maketitle\n\n\n" +
              "\\section*{Best machine learning methods for each scenario}\n\n";

            // Add the heatmap's figure if exists
            if (
              fs.existsSync(RFolder + "HEATMAPS/Best_ML_method_by_RMSE.pdf")
            ) {
              // If regression
              contentPart1 +=
                "\\hfill\n\\begin{figure}[htb]\n\t\\centering\n" +
                "\t\t\\includegraphics[width=1\\textwidth]{" +
                RFolder +
                "HEATMAPS/Best_ML_method_by_RMSE.pdf}\n" +
                "\t\t\\caption{Best machine learning method by RMSE}\n" +
                "\\end{figure}\n\n\\clearpage\n\n";
            } else if (
              fs.existsSync(RFolder + "HEATMAPS/Best_ML_method_by_Accuracy.pdf")
            ) {
              // If classification
              content +=
                "\\hfill\n\\begin{figure}[htb]\n\t\\centering\n" +
                "\t\t\\includegraphics[width=1\\textwidth]{" +
                RFolder +
                "HEATMAPS/Best_ML_method_by_Accuracy.pdf}\n" +
                "\t\t\\caption{Best machine learning method by Accuracy}\n" +
                "\\end{figure}\n\n\\clearpage";
            }
            console.log("First part done.");
            callback(null, contentPart1);
          } catch (err) {
            callback(err, null);
          }
        }, 100);
      },
      //Create the second part (reading csv file)
      part2: function (callback) {
        setTimeout(function () {
          if (type === "sensoryScore") {
            readFileForLatex(
              RFolder + "HEATMAPS/rankAccuracy.csv",
              "Ranking of machine methods by Accuracy",
              false,
              function (err, content) {
                if (err) {
                  callback(err, null);
                } else {
                  content += "\\end{longtable}\n\n\\clearpage\n\n";
                  console.log("Second part done.");
                  callback(null, content);
                }
              }
            );
          } else {
            readFileForLatex(
              RFolder + "HEATMAPS/rankAccuracy.csv",
              "Ranking of machine methods by Accuracy.",
              false,
              function (err, content) {
                if (err) {
                  callback(err, null);
                } else {
                  content += "\\end{longtable}\n\n\\clearpage\n\n";
                  console.log("Second part done.");
                  callback(null, content);
                }
              }
            );
          }
        }, 100);
      },
      // Create the third part only for classification
      /*part3: function (callback) {
        setTimeout(function () {
          let contentPart3 = "";
          if (type != "bacterialCount") {
            let title = "";
            contentPart3 += "\\section*{Confusion Matrix for each method}\n";
            try {
              let path = RFolder + "ConfusionMatrix/";
              let files = fs.readdirSync(path);
              let loop = 0;
              for (let file of files) {
                title = file.replace(/_/g, " ").replace(".csv", "");
                readFileForLatex(path + file, title, true, function (
                  err,
                  content
                ) {
                  if (err) {
                    callback(err, null);
                  } else {
                    loop++;
                    content += "\\end{longtable}\n\n";
                    contentPart3 += content;
                    if (loop === files.length) {
                      contentPart3 += "\\clearpage\n\n";
                      console.log("Third part done.");
                      callback(null, contentPart3);
                    }
                  }
                });
              }
            } catch (err) {
              callback(err, null);
            }
          } else {
            console.log("Third part done.");
            callback(null, contentPart3);
          }
        }, 100);
      },*/
      // Create the fourth part
      part4: function (callback) {
        setTimeout(function () {
          let contentPart4 =
            "\\section*{Accumulative means with best machine learning method per dataset plots}\n\n" +
            filesInFolderLatex(RFolder + "PerformancePlots/", "[scale=0.5]", 10);

          contentPart4 +=
            "\\clearpage\n\n\\section*{Principal Component Analysis (PCA) plots}\n\n" +
            filesInFolderLatex(RFolder + "PCAPlots/", "[width=1\\textwidth]", 14);

          contentPart4 +=
            "\\clearpage\\tableofcontents\n\\listoffigures\n\\end{centering}\n\\end{document}";

          console.log("Fourth part done.");
          callback(null, contentPart4);
        });
      }
    },
    // Callback function
    function (err, answer) {
      // Get the error
      if (err) {
        console.log("Error while creating the latex file: " + err);
        callback(err, content);
      } else {
        // No error. Join all the part together and create the latex
        let content = answer.part1 + answer.part2 + answer.part3 + answer.part4;
        callback(null, content);
      }
    }
  );
};

/**
 * Function to display the plots for the latex
 *
 * @param {*} folder string of the folder path
 * @param {*} dim string of the dimension for the includegraphics
 * @param {*} newPage number to know when to display a new page with the modulo
 */
const filesInFolderLatex = function (folder, dim, newPage) {
  let content = "";
  let n = 0;
  fs.readdirSync(folder).forEach(file => {
    content +=
      "\\begin{figure}[htb]\n\\centering\n" +
      "\\includegraphics" +
      dim +
      "{" +
      folder +
      file +
      "}\n\\caption{" +
      file.replace(".png", "").replace(/_/g, " ") +
      "}\n\\end{figure}\n\n";
    n++;
    if (n % newPage == 0) {
      content += "\\clearpage\n\n";
    }
  });
  return content;
};

/**
 * Function to read the files to create tables for the latex
 * @param {*} path string of path's file to read
 * @param {*} title string of the title
 * @param {*} newLine boolean to know if a new line has to be added
 * @param {*} callback function callback
 */
const readFileForLatex = function (path, title, newLine, callback) {
  try {
    let n = 0;
    let content = "";
    const lineReader = require("readline").createInterface({
      input: fs.createReadStream(path)
    });

    lineReader.on("line", function (line) {
      if (line.trim().length > 2) {
        splitLine = line.split(",");
        if (n === 0) {
          content +=
            "\\tiny\n" +
            "\\begin{longtable}{|" +
            "l|".repeat(splitLine.length + 1) +
            "}\n" +
            "\\caption{" +
            title +
            "} \\\\\n" +
            "\\hline " + splitLine.join(" & ") + " \\\\\n" +
            "\\hline";
        } else {
          content +=
            splitLine
              .map(value => value.replace(/"/g, ""))
              .join(" & ") +
            " \\\\\n\\hline\n\n";
        }
        n++;

        if (newLine && n % 10 == 0) {
          content += "\\clearpage\n\n";
        }
      }
    });

    lineReader.on("close", function () {
      callback(null, content);
    });
  } catch (err) {
    callback(err, null);
  }
};

/**
 * Function to send the JSON response to the client
 * @param {*} res
 * @param {*} status
 * @param {*} content
 */
const sendJSONresponse = function (res, status, content) {
  res.status(status);
  res.json(content);
};

// Long → short name dictionary
/*
const shortname_dist = {
  "XGBoost"                           : "XGBoost",
  "SVR-Radial"                        : "SVR-Radial",
  "Random Forest"                     : "RFR",
  "Neural Network"                    : "NN",
  "SVR-Polynomial"                    : "SVR-Polynomial",
  "PCA Regression"                    : "PCR",
  "Regression Tree"                   : "RT",
  "Lasso Regression"                  : "LR",
  "Ridge Regression"                  : "RR",
  "Elastic Regression"                : "ER",
  "k-nearest neighbors"               : "KNN",
  "Stepwise Regression"               : "SR",
  "Partial least squares Regression"  : "PLS",
  "Ordinary Least Squares Regression" : "OLS"
};
*/

//  Short → long name dictionary of MLM Methods
const longname_dist = {
  "XGBoost": "XGBoost",
  "SVM": "SVM",
  "RFC": "Random Forest Classification",
  "KNN": "k-nearest neighbors",
  "LDA": "Linear Discriminant Analysis",
  "PLSDA": "Partial least squares Discriminant Analysis",
  "SLC": "Stepwise Linear Classification"
};

// Create JSON file function
const createFile = (pathName, source) => {
  const toJSON = JSON.stringify(source);
  fs.writeFile(pathName, toJSON, (err) => {
    if (err) { rej(err) };
    if (!err) { console.log("Create JSON file") };
  });
};

const createPlatformObj = (arg_platname, arg_platpath, arg_metapath, arg_metadataType) => {
  var platformList = [];

  if (arg_platname.length !== arg_platpath.length) {
    console.log("Error: Lengths of input arrays do not match.");
  } else {
    for (let i = 0; i < arg_platname.length; i++) {
      let platform_elem = {
        platformName: arg_platname[i],
        dataFileName: arg_platpath[i],
        metaFileName: arg_metapath,
        typeMetaData: arg_metadataType,
      };
      platformList.push(platform_elem);
    }
  }

  return platformList;
};

// Create machineLearningModels property function
const createMLListObj = (
  arg_models,
  arg_iter,
  arg_prop,
  arg_pret
) => {
  var machineLearningModels = [];
  /*
  if      ( arg_models.length != arg_iter.length ) { console.log( "error" ); }
  else if ( arg_models.length != arg_prop.length ) { console.log( "error" ); }
  else if ( arg_models.length != arg_pret.length ) { console.log( "error" ); }
  else {
      for ( let i = 0; i < arg_models.length; i++ ) {
          let models_elem = {
              name                    : arg_models[ i ],
              shortName               : shortname_dist[ arg_models[ i ] ],
              numberOfIterations      : arg_iter[ i ],
              proportionOfTrainingSet : arg_prop[ i ],
              pretreatment            : arg_pret[ i ]
          };
          machineLearningModels.push( models_elem );
      }
  }
  */

  for (let i = 0; i < arg_models.length; i++) {
    let models_elem = {
      name: longname_dist[arg_models[i]],
      shortName: arg_models[i],
      numberOfIterations: arg_iter,
      proportionOfTrainingSet: arg_prop,
      pretreatment: arg_pret
    };
    machineLearningModels.push(models_elem);
  }

  //console.log( machineLearningModels );
  return machineLearningModels;
};

// Modified by Shintaro Kinoshita
const makeJsonConfig = function (
  mlmList,        // PCR,PLS,RFR,SVR
  platformsList,  // Enose
  percentage,     // 0.7
  pretreatment,   // auto-scale
  iteration,      // 20
  savedFileNames, // Full-path of dataset
  metaFileName,    // Full-path of metaFile name
  folderPath       // Full path to save the Results
) {

  // Show logs
  console.log("mlmList       : " + mlmList);
  console.log("platformsList : " + platformsList);
  console.log("percentage    : " + percentage);
  console.log("pretreatment  : " + pretreatment);
  console.log("iteration     : " + iteration);

  // Define JSON template of FQC config
  var templateJSON = {
    name: null, // default_name,     Title of JSON
    outputDirectory: null, // default_outdir,   Output directory path
    createStatisticsFile: null, // default_stats,    Create Statistics files
    createPerformancePlots: null, // default_perplots, Create performance plots
    createPCAPlots: null, // default_pca,      Create PCA plots
    platformList: [],   // default_plat,     Platform list
    machineLearningModels: []    // default_models,   ML models list
  };

  // Update template JSON
  templateJSON["name"] = "test_name";
  templateJSON["outputDirectory"] = folderPath;
  templateJSON["createStatisticsFile"] = true;
  templateJSON["createPerformancePlots"] = true;
  templateJSON["createPCAPlots"] = true;

  // Add "platformList" property into template JSON
  templateJSON["platformList"] = createPlatformObj(platformsList, savedFileNames, metaFileName, "sensory");

  // Add "machineLearningModels" property into template JSON
  templateJSON["machineLearningModels"] = createMLListObj(mlmList, iteration, percentage, pretreatment);


  // Show and save the result JSON file
  console.log(templateJSON);
  createFile("config_test.json", templateJSON);
};

module.exports = {
  performNewML,
  createFolderPath,
  commandLine,
  copyFileFromDB,
  commaArg,
  mkdirSync,
  createFolderPath,
  ML,
  makeJsonConfig
};
