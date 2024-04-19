const { exec } = require("child_process");
const express = require("express");
const bodyParser = require("body-parser");
const multer = require("multer");
const upload = multer();
const router = express();
const path = require("path");
const fs = require("fs");


router.use(express.json());
router.use(bodyParser.json());
router.use(express.urlencoded({ extended: true }));

router.get("/regression", (req, res) => {
  // Define the path to the models folder
  const modelsPath = path.join(__dirname,'..','machineLearning','models','reg');
  // Read the contents of the models folder
  fs.readdir(modelsPath, (err, files) => {
    if (err) {
      console.log(modelsPath);
      console.error(`error reading models folder: ${err}`);
      res.status(500).send("There is no folder named 'reg' in the Back-End");
      return;
    }

    // Filter the list of files to only include .rda and .rds files
    const rFiles = files.filter((file) => file.endsWith(".rda") || file.endsWith(".rds"));

    // Send the list of .rda and .rds files back to the client
    res.send(rFiles);
  });
});

router.get("/classification", (req, res) => {
  // Define the path to the models folder
  const modelsPath = path.join(__dirname,'..','machineLearning','models','class');
  // Read the contents of the models folder
  fs.readdir(modelsPath, (err, files) => {
    if (err) {
      console.log(modelsPath);
      console.error(`error reading models folder: ${err}`);
      res.status(500).send("There is no folder named 'class' in the Back-End");
      return;
    }

    // Filter the list of files to only include .rda and .rds files
    const rFiles = files.filter((file) => file.endsWith(".rda") || file.endsWith(".rds"));

    // Send the list of .rda and .rds files back to the client
    res.send(rFiles);
  });
});

// Endpoint for handling incoming data
router.post("/predict", upload.single("file"), (req, res) => {
  // Get product and model name from request parameters
  const { platform, model, type } = req.query;
  const bacteria = req.query.bacteria || "_"; // use "_" string as default value if bacteria is not provided
  console.log(req.query);
  // Check if file was uploaded
  if (!req.file) {
    res.status(400).send("No file uploaded");
    return;
  }

  // Save uploaded file as a temporary JSON file
  const tmpFile = req.file.buffer.toString("utf8");
  const filePath = `./${req.file.originalname}`;
  fs.writeFileSync(filePath, tmpFile);

  let cmd;
  if (model === "best") {
    // Construct R script command with "best" option as the model name
    cmd = `Rscript /Users/lea/sorfML/sorfml2.0.1/Back-End/machineLearning/predict.R ${platform} ${bacteria} best ${filePath} ${type}`;
  } else {
    // Construct R script command with specified model name
    cmd = `Rscript /Users/lea/sorfML/sorfml2.0.1/Back-End/machineLearning/predict.R ${platform} ${bacteria} ${model} ${filePath} ${type}`;
  }
  
  console.log(cmd);
  // Execute R script command
  exec(cmd, (error, stdout, stderr) => {
    if (error) {
      console.error(`exec error: ${error}`);
      res.status(500).send("Error executing R script");
      return;
    }

    // Parse the stdout string into an array of objects
    const results = JSON.parse(stdout);

    // Concatenate each sample and label into a string
    const responseString = results
      .map((result) => `${result.id}: ${result.label}`)
      .join("\n");
    
    // Extract the model_file from the results
    const model_file = results[0].model_file;
    // Remove the model_file key from the first object in the results array
    delete results[0].model_file;
    // Send prediction results and model_file back to client
    res.send(`${model_file}:\n${responseString}`);
  });
});

// Export the router
module.exports = router;







