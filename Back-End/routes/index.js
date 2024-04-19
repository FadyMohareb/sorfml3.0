const express = require("express");
const router = express.Router();
const jwt = require("express-jwt");
const auth = jwt({
  secret: "MY_SECRET",
  userProperty: "payload"
});

const ctrlUser = require("../controllers/user");
const ctrlAuth = require("../controllers/authentication");
const ctrlExperiment = require("../controllers/experiment");
const ctrlDataset = require("../controllers/dataset");
const ctrlNotification = require("../controllers/notification");
const ctrlPCA = require("../controllers/pca");
const ctrlHCA = require("../controllers/hca");
const ctrlMetadata = require("../controllers/metadata");
const ctrlNewClassML = require("../controllers/newClassML");
const ctrlNewRegML = require("../controllers/newRegML");
const ctrlTrainML = require("../controllers/trainedML");
const ctrlResultClassML = require("../controllers/resultClassML");
const ctrlResultRegML = require("../controllers/resultRegML");
const ctrlProductTracking = require("../controllers/HyperLedgerProductTracking")


// Product Tracking
router.post('/tracking/SeeOrgTransactionHistory/downloadQR', ctrlProductTracking.DownloadQrCode);
// router.post("/tracking/registerproduct", ctrlProductTracking.registerProduct);
// router.post('/tracking/updatelocation', ctrlProductTracking.updateLocation);
// router.post('/tracking/createkeypair', ctrlProductTracking.registerUserKeypair);
// router.post('/tracking/registersamples', ctrlProductTracking.registerSamples);
// router.get('/tracking/getassets/:userid', ctrlProductTracking.getAllAssets);
// router.post('/tracking/checkkeypair', ctrlProductTracking.checkKeypair)
// router.post('/tracking/linkexperiment', ctrlProductTracking.linkExperiment)
// router.post('/tracking/checkownership', ctrlProductTracking.checkOwnership)
// router.post('/tracking/transferownership', ctrlProductTracking.transferOwnership)

//Product Tracking Hyperledger

//router.post('/tracking/checkUserExists', ctrlProductTracking.checkUserExist);
//router.post('/tracking/registerNew',ctrlProductTracking.registerNewUser);

// List Experiments
router.get(
  "/experiments/:browse/:currentUserId?",
  ctrlExperiment.experimentsList
);

// Experiment
router.post("/experiment", ctrlExperiment.experimentCreate);
router
  .route("/experiment/:experimentid")
  .get(ctrlExperiment.experimentDetail)
  .put(ctrlExperiment.experimentUpdate)
  .delete(ctrlExperiment.experimentDelete);

// Dataset
router.get("/experiment/dataset/:experimentid", ctrlDataset.datasetDetail);
router.get("/experiment/alldata/:experimentid", ctrlDataset.allData);

// User
router.get("/profile", auth, ctrlUser.profileRead);
router.get("/users", ctrlUser.findAllUsers);
router.put("/updateProfile", ctrlUser.updateProfile);
router.put("/updatePassword", ctrlUser.updatePassword);
router.delete("/deleteAccount/:currentUserId", ctrlUser.deleteAccount);

// authentication
router.post("/register", ctrlAuth.register);
router.post("/login", ctrlAuth.login);

// Notification
router.get("/notification/:currentUserId", ctrlNotification.getNotification);
router
  .route("/notification")
  .delete(ctrlNotification.deleteNotification)
  .put(ctrlNotification.seenNotification);

// PCA
router.get("/experiment/pca/:datasetid/:type", ctrlPCA.getPCA);

// HCA
router.get("/experiment/hca/:datasetid/:type", ctrlHCA.getHCA);

// Metadata
router.get(
  "/experiment/metadataOneType/:experimentid/:type",
  ctrlMetadata.metadataOneType
);

// MACHINE LEARNING

//classification
router.post("/experiment/newclassml", ctrlNewClassML.performNewML);
router.get("/experiment/resultclassMLNew/:type/:path?", ctrlResultClassML.getResultNew);
router.get("/experiment/resultMLTrain/:type/:path?",ctrlResultClassML.getResultTrain); // no change needed??
router.post("/experiment/resultML/downloadReport", ctrlResultClassML.downloadReport); // no change needed
router.post("/experiment/model", ctrlResultClassML.saveModel); 

//Regression
router.post("/experiment/newregml", ctrlNewRegML.performNewML);
router.get("/experiment/resultregMLNew/:type/:path?", ctrlResultRegML.getResultNew);

//other
router.post("/experiment/trainml", ctrlTrainML.performTrainML); //change
router.post("/experimentmodel", ctrlTrainML.getModels); //change
router.delete("/deleteModel/:modelId", ctrlTrainML.deleteModel);

module.exports = router;
