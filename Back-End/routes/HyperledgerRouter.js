const express = require('express');
const router = express.Router();
const ctrlProductTracking = require('../controllers/HyperLedgerProductTracking');

router.post('/tracking/checkUserExists', ctrlProductTracking.checkUserExist);
router.post('/tracking/registerNew', ctrlProductTracking.registerNewUser);
router.post('/tracking/createproduct', ctrlProductTracking.CreateAsset);
router.get('/tracking/list_assets', ctrlProductTracking.GetAssets);
router.post('/tracking/updateasset', ctrlProductTracking.UpdateAsset);
//router.post('/tracking/updatetemperature', ctrlProductTracking.UpdateTemperature);
//router.post('/tracking/updateWeight', ctrlProductTracking.UpdateWeight);
//router.post('/tracking/updateloc', ctrlProductTracking.UpdateLocation);
//router.post('/tracking/LE', ctrlProductTracking.LinkExperiment);
router.get('/tracking/orgtransactionhistory', ctrlProductTracking.OrganisationTransactionHistory);
router.get('/tracking/checkrd', ctrlProductTracking.CheckRegulatoryDepartment);
router.get('/tracking/getorganisationnames', ctrlProductTracking.GetOrganisationNames);
router.post('/tracking/transfer', ctrlProductTracking.RequestTransfer);
router.post('/tracking/completetransfer', ctrlProductTracking.CompleteTransfer);
router.get('/tracking/viewtransactionhistory', ctrlProductTracking.ViewTransactionHistory);
router.post('/tracking/createqrcode', ctrlProductTracking.CreateQrCode);
router.post('/tracking/deleteasset', ctrlProductTracking.DeleteAsset);
router.get('/tracking/getallbranches', ctrlProductTracking.GetAllBranches);

module.exports = router;
