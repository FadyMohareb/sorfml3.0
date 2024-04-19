const {Wallets} = require('fabric-network');
const FabricCAServices = require('fabric-ca-client');
const path = require('path');
const fs = require('fs');
const {buildCAClient, registerAndEnrollUser, enrollAdmin} = require('../ProductTrackingUtils/CAUtil');
const {buildCCPOrg1, buildWallet} = require('../ProductTrackingUtils/AppUtil');
const walletPath = path.join(__dirname, '..', 'ProductTrackingUtils', 'Wallet');
const ccp = buildCCPOrg1();
const caClient = buildCAClient(FabricCAServices, ccp, 'ca.org1.example.com');
const mongoDbUser = require('../models/user');
const transactionModel = require('../models/transaction');
const fabricNetwork = require('../ProductTrackingUtils/fabricNetwork');
const transaction = require('../models/transaction');
const { trace } = require('console');
const { rejects } = require('assert');
const qr_code = require('qrcode');
//const wallet = buildWallet(Wallets, walletPath);

// Global variables for creating product IDs
const PRODUCT_ID_SOURCE = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const PRODUCT_ID_LENGTH = 8;

// RD name
const RD_NAME = 'REGULATORY DEPARTMENT OF SORFML2';

// Function to create JSON file function
const createFile = (pathName, source) => {
  const toJSON = JSON.stringify(source);
  fs.writeFile(pathName, toJSON, (err) => {
    if (err)  { console.log('Created JSON file failed') };
    if (!err) { console.log('Created JSON file successful') };
  });
};

// Function for creating product ID by generating random
// sequence which is composed of 7 numbers or capital characters
function createProductId() {
  let   productId    = '';
  const sourceLength = PRODUCT_ID_SOURCE.length;

  for (let i = 0; i < PRODUCT_ID_LENGTH; i++) {
    const index = Math.floor(Math.random() * sourceLength);
    productId   = productId.concat(PRODUCT_ID_SOURCE.charAt(index));
  }

  return productId;
}

// Function to show the assets in the Back-end
function prettyJSONString(inputString) {
  return JSON.stringify(JSON.parse(inputString), null, 2);
}

// Function to check if user exists
const checkUserExist = async function(req, res) {
  if (!req.body) {
    console.log('Error getting data');
    sendJSONresponse(res, 404, {message: 'No parameters'});
    return;
  } else {
    const userId = req.body.userId;
    // Build wallet first
    const wallet = await buildWallet(Wallets, walletPath);
    const userIdentity = await wallet.get(userId);
    if (userIdentity) {
      console.log(`Identity for the user ${userId} exists in the wallet`);
      sendJSONresponse(res, 200, {exists:true})
    } else {
      sendJSONresponse(res, 200, {exists:false})
    }
  }
}

// Function to register new user
const registerNewUser = async function(req, res) {
  console.log('\n[HyperLedgerProductTracking.js/registerNewUser()]: Request recieved.');
  //console.log('[HyperLedgerProductTracking.js/registerNewUser()]: Request body:');
  //console.log(req.body);

  if (!req.body) {
    console.log('Error getting data');
    sendJSONresponse(res, 404, {message: 'No parameters'});
    return;
  } else {
    const userId = req.body.userId;
    try {
      // Get user information from MongoDB
      const user         = await mongoDbUser.findOne({_id: userId});
      const organisation = user.organisation;
      const username     = `${user.firstname}-${user.lastname}`;

      console.log('[HyperLedgerProductTracking.js/registerNewUser()]: Organisation => ' + organisation);
      console.log('[HyperLedgerProductTracking.js/registerNewUser()]: Username     => ' + username);

      // Register and enroll the user
      const wallet = await buildWallet(Wallets, walletPath);
      let   result = await registerAndEnrollUser(caClient, wallet, 'Org1MSP', userId, 'org1.department1', organisation, username);
      sendJSONresponse(res, result.status, {message:result.message});
    }
    catch (err) {
      console.error(err);
      sendJSONresponse(res, err.status, {message:err.message});
    }
  }
}

// Function for creating a new asset
const CreateAsset = async function(req, res) {
  console.log('[HyperLedgerProductTracking.js/CreateAsset()] : Request received.');
  //console.log(req.body);

  var userId      = req.body.userId;
  var productName = req.body.productName;
  var productType = req.body.productType;
  var location    = req.body.location;
  var weight      = req.body.weight;
  var temperature = req.body.temperature;
  var useByDate   = req.body.useByDate.toString();

  console.log('[HyperLedgerProductTracking.js/CreateAsset()]: Creating a new asset...');
  const contract = await fabricNetwork.connectNetworkOrg1(userId);

  // Get current time for timestamp
  const timeNow    = new Date();
  const timeNowStr = timeNow.toISOString();
  //console.log('[HyperLedgerProductTracking.js/CreateAsset()]: Time information for creating ID =>', timeNowStr);

  // Now create a new asset!
  // Create a new asset ID at the first place
  let productId = createProductId();
  while (true) {
    const exists = await contract.evaluateTransaction('AssetExists', productId);
    //console.log(exists.toString());
    if (exists.toString().toLowerCase() === 'false') { // If NOT exists; break
      //console.log(`[HyperLedgerProductTracking.js/CreateAsset()]: The ID \x1b[32m${productId}\x1b[39m is available!`);
      break;
    }
    // If already exists; create another one and try again
    productId = createProductId();
  }

  // 'CreateAsset' function is in 'Chaincode/lib/TransactionContract.js'
  let result = JSON.parse((await contract.submitTransaction('CreateAsset',
    productId,   // Product ID
    productName, // Product name
    productType, // Product type (primary or derived)
    location,    // Location
    weight,      // Weight / Kg
    temperature, // Temperature / ℃
    useByDate,   // Use-by date
    timeNowStr,  // Time information as timestamp
  )));
  console.log('[HyperLedgerProductTracking.js/CreateAsset()]: Creating new asset in Hyperledger was committed.');

  // Chack the created asset
  //const assetView = await contract.evaluateTransaction('ReadAsset', result.product_id);
  //console.log(JSON.parse(assetView.toString()));

  // Register the new asset into Mongo DB
  await transactionModel.create(result);
  console.log('[HyperLedgerProductTracking.js/CreateAsset()]: Asset data was registered into MongoDB.');
  //console.log(result);

  console.log('[HyperLedgerProductTracking.js/CreateAsset()]: A new asset is \x1b[32msuccessfully\x1b[39m created.');

  res.send(result.product_id);
}

// Function fetching a existing asset by using 'ProductID'
const GetAssets = async function(req, res) {
  const userId = req.query.userid;
  //console.log(`\n[HyperLedgerProductTracking.js/GetAssets()]: userId => ${userId}`);

  var assetsToSend = [];
  try {
    // Get a User information via its 'userId'
    const user = await mongoDbUser.findOne({_id: userId});
    console.log(`[HyperLedgerProductTracking.js/GetAssets()]: Fetched\x1b[32m ${userId} \x1b[39minformation.`);
    //console.log(user + '\n');

    // Get the user's organisation name
    const organisation = user.organisation;

    // Get all the assets belong to the ${organisation}
    console.log(`[HyperLedgerProductTracking.js/GetAssets()]: Fetching assets belong to \x1b[32m${organisation}\x1b[39m...`);
    const transactions = await transactionModel.find({organisation_name:organisation});
    console.log(`[HyperLedgerProductTracking.js/GetAssets()]: \x1b[32m${transactions.length}\x1b[39m assets were fetched.`);

    // After getting the user info, now connect network to get asset information
    const contract = await fabricNetwork.connectNetworkOrg1(userId);

    // Iterate every single asset using for loop
    for (iter in transactions) {
      const transaction = transactions[iter];
      //console.log(transaction);

      // Let's get product asset information from Blockchain layers wallet via product ID
      const result     = await contract.evaluateTransaction('ReadAsset', transaction.product_id);
      const resultJson = JSON.parse(result.toString());
      //console.log('[HyperLedgerProductTracking.js/GetAssets()]: Fetched the asset of the following product ID...:');
      //console.log(` => \x1b[32m${transaction.product_id}\x1b[39m`);
      //console.log(resultJson);

      // Extract asset JSON and get each property to send
      const jsonToSend = {
        ProductID         : resultJson.ProductID        ,
        PreviousProductID : resultJson.PreviousProductID,
        RootProductID     : resultJson.RootProductID    ,
        Owner             : resultJson.Owner            ,
        ProductName       : resultJson.ProductName      ,
        ProductType       : resultJson.ProductType      ,
        Location          : resultJson.Location         ,
        Weight            : resultJson.Weight           ,
        Temperature       : resultJson.Temperature      ,
        UseByDate         : resultJson.UseByDate        ,
        AssetStatus       : resultJson.AssetStatus      ,
        TransferFrom      : resultJson.TransferFrom     ,
        TransferTo        : resultJson.TransferTo       ,
        TransferWeight    : resultJson.TransferWeight   ,
        EventTimestamp    : resultJson.EventTimestamp   ,
        EventBy           : resultJson.EventBy          ,
        LinkedExperiments : resultJson.LinkedExperiments,
        Hash              : resultJson.Hash             ,
        PreviousHash      : resultJson.PreviousHash     ,
      };
      //console.log(jsonToSend);

      // Push the asset into the vector
      assetsToSend.push(jsonToSend);

      console.log(`[HyperLedgerProductTracking.js/GetAssets()]: Fetched \x1b[32m${transaction.product_id}\x1b[39m.`);
    }

    res.type('json');
    res.json(assetsToSend);
  } catch(err) {
    console.log(err);
  }
  console.log('[HyperLedgerProductTracking.js/GetAssets()]: Fetched all assets.');
}

// Function for editting an existing asset
const UpdateAsset = async function(req, res) {
  console.log('[HyperLedgerProductTracking.js/UpdateAsset()]: Request received.');
  //console.log(req.body);

  try {
    const userId      = req.body.userId;
    const productId   = req.body.productId;
    const productName = req.body.productName;
    const temperature = req.body.temperature;
    const weight      = req.body.weight;
    const location    = req.body.location;
    const useByDate   = req.body.useByDate;

    // Get a Blockchain contract as this user ID
    const contract = await fabricNetwork.connectNetworkOrg1(userId);

    // See the current asset
    let result = await contract.evaluateTransaction('ReadAsset', productId);
    //console.log('[HyperLedgerProductTracking.js/UpdateAsset()]: Read current asset \x1b[36mBEFORE\x1b[39m edit:');
    //console.log(JSON.parse(result.toString()));

    // Check if asset status is NOT 'Requested', 'Finished' or 'Deleted'
    const assetStatus = JSON.parse(result.toString()).assetStatus;
    if      (assetStatus === 'Requested') {throw new Error('The asset status is Requested, this is weird!');}
    else if (assetStatus === 'Finished' ) {throw new Error('The asset status is Finished, this is weird!'); }
    else if (assetStatus === 'Deleted'  ) {throw new Error('The asset status is Deleted, this is weird!');  }

    // Now edit the asset
    // Get current time for timestamp at the first place
    const timeNow    = new Date();
    const timeNowStr = timeNow.toISOString();
    //console.log('[HyperLedgerProductTracking.js/UpdateAsset()]: Time information for asset updating =>', timeNowStr);

    result = JSON.parse((await contract.submitTransaction('UpdateAsset',
      productId,
      productName,
      temperature,
      weight,
      location,
      useByDate,
      timeNowStr
    )));
    console.log('[HyperLedgerProductTracking.js/UpdateAsset()]: Updating asset in Hyperledger was committed.');

    // Store the data into Mongo DB
    await transactionModel.updateOne({'_id':productId}, result);
    console.log('[HyperLedgerProductTracking.js/UpdateAsset()]: Data in MongoDB was updated.');

    // See the asset again to check if transaction is successful.
    //result = await contract.evaluateTransaction('ReadAsset', productId);
    //console.log('[HyperLedgerProductTracking.js/UpdateAsset()]: Read current asset \x1b[36mAFTER\x1b[39m edit:');
    //console.log(JSON.parse(result.toString()));

    // Check the content of newly created asset being registered in Mongo DB side.
    //const resultMongoDb = await transactionModel.findOne({'_id':productId});
    //console.log('\n[HyperLedgerProductTracking.js/UpdateAsset()]: Asset information registered to Mongo DB side:');
    //console.log(resultMongoDb);

    console.log('[HyperLedgerProductTracking.js/UpdateAsset()]: Asset was \x1b[32msuccessfully\x1b[39m updated.');

    res.type('html');
    res.send('Asset was successfully updated!');
  } catch(err) {
    console.log(err);
    res.send('Asset Update Failed');
  }
}

// This is a function for ownership transaction request.
// NOTE that the owner is NOT changed in this function yet:
// Once a RD accept it, then the actural ownership transaction event happens
// via 'CompleteTransfer()' function
const RequestTransfer = async function(req, res) {
  // Check the request component
  console.log('[HyperLedgerProductTracking.js/RequestTransfer()]: Request received.');
  //console.log(req.body);

  const userId    = (req.body).userId;    // User ID
  var   productId = (req.body).productId; // Product ID

  // Get contarct with the Blockchain network via 'userId'
  const contract = await fabricNetwork.connectNetworkOrg1(userId);

  // Read the target asset at the first place
  let result = await contract.evaluateTransaction('ReadAsset', productId);
  //console.log('[HyperLedgerProductTracking.js/RequestTransfer()]: Read asset \x1b[36mBEFORE\x1b[39m transfer request:');
  //console.log(JSON.parse(result.toString()));

  // Get current and requested new organisation name
  const currentOwner = (JSON.parse(result.toString())).Owner;
  const newOwner     = (req.body).transferTo;

  // Get requested transferred weight
  const transferWeight = (req.body).transferWeight;

  // Get current time for timestamp
  const timeNow    = new Date();
  const timeNowStr = timeNow.toISOString();
  //console.log('[HyperLedgerProductTracking.js/RequestTransfer()]: Time information for creating ID =>', timeNowStr);

  // Request transfer!
  result = JSON.parse((await contract.submitTransaction('RequestTransfer',
    currentOwner,   // Current owner
    newOwner,       // Requested new owner
    transferWeight, // Requested being transferred weight
    timeNowStr,     // Current recorded time as timestamp
    productId       // Product ID
  )));
  console.log('[HyperLedgerProductTracking.js/RequestTransfer()]: Updating asset in Hypeledger was committed.');

  // Update the result data into Mongo DB
  await transactionModel.updateOne({'_id':productId}, result);
  console.log('[HyperLedgerProductTracking.js/RequestTransfer()]: Data in MongoDB was updated.');

  // See the asset again to check if transaction is successful.
  result = await contract.evaluateTransaction('ReadAsset', productId);
  //console.log('[HyperLedgerProductTracking.js/RequestTransfer()]: Read current asset \x1b[36mAFTER\x1b[39m transfer request:');
  //console.log(JSON.parse(result.toString()));

  // Check the content of requested asset being registered in Mongo DB side.
  const resultMongoDb = await transactionModel.findOne({'_id':productId});
  //console.log('\n[HyperLedgerProductTracking.js/RequestTransfer()]: Asset information registered to Mongo DB side:');
  //console.log(resultMongoDb);

  console.log('[HyperLedgerProductTracking.js/UpdateAsset()]: Asset was \x1b[32msuccessfully\x1b[39m requested.');

  // Message sent to Front-end
  res.type('html');
  res.send('Transaction request was successfully sent!');
}

// This is a function for complete transaction of ownership
// after receiving the transaction request by a standard user, and Regulatory Department accepted it
const CompleteTransfer = async function(req, res) {
  const userId    = req.body.userId;    // User ID
  const productId = req.body.productId; // Product ID
  console.log('[HyperLedgerProductTracking.js/CompleteTransfer()]: Request received.');
  //console.log(`[HyperLedgerProductTracking.js/CompleteTransfer()]: userId    => ${userId}`);
  //console.log(`[HyperLedgerProductTracking.js/CompleteTransfer()]: productId => ${productId}`);

  try {
    // Get contarct with the Blockchain network via 'userId'
    const contract = await fabricNetwork.connectNetworkOrg1(userId);

    // Read current asset at the first place
    let result = await contract.evaluateTransaction('ReadAsset', productId);
    //console.log('[HyperLedgerProductTracking.js/CompleteTransfer()]: Read previous asset \x1b[36mBEFORE\x1b[39m transaction:');
    //console.log(JSON.parse(result.toString()));

    // Create a new asset ID
    let newProductId = createProductId();
    while (true) {
      const exists = await contract.evaluateTransaction('AssetExists', newProductId);
      //console.log(exists.toString());
      if (exists.toString().toLowerCase() === 'false') { // If NOT exists; break
        //console.log(`[HyperLedgerProductTracking.js/CompleteTransfer()]: The ID \x1b[32m${newProductId}\x1b[39m is available!`);
        break;
      }
      newProductId = createProductId();
    }

    // Get current and transferred weights
    let originalWeight = (JSON.parse(result.toString())).Weight;
    let transferWeight = (JSON.parse(result.toString())).TransferWeight;
    originalWeight     = parseInt(originalWeight);
    transferWeight     = parseInt(transferWeight);
    let balancedWeight = (originalWeight - transferWeight);

    // Check if original weight is still larger than transferred weight
    if (balancedWeight < 0) {throw new Error('The amount of balanced weight is less than zero. This is NOT acceptable.');}
    balancedWeight = balancedWeight.toString();
    transferWeight = transferWeight.toString();

    // Get current time for timestamp
    const timeNow    = new Date();
    const timeNowStr = timeNow.toISOString();
    //console.log('[HyperLedgerProductTracking.js/CompleteTransfer()]: Time information for creating ID =>', timeNowStr);

    // transfer the ownership!
    result = JSON.parse((await contract.submitTransaction('ApproveTransfer',
      productId,      // Current product ID which is requested transaction
      newProductId,   // New product ID for follow-on transferred asset
      transferWeight, // Amount of weight which is being transferred
      timeNowStr      // Time information for asset timestamp as 'String'
    )));
    console.log('[HyperLedgerProductTracking.js/CompleteTransfer()]: Approving transaction in Hyperledger was committed.');

    // Store the data into Mongo DB
    await transactionModel.create(result);
    console.log('[HyperLedgerProductTracking.js/CompleteTransfer()]: Data was registered in MongoDB.');

    // See the asset again to check if transaction is successful.
    result = await contract.evaluateTransaction('ReadAsset', newProductId);
    //console.log('[HyperLedgerProductTracking.js/CompleteTransfer()]: Read new asset \x1b[36mAFTER\x1b[39m transaction:');
    //console.log(JSON.parse(result.toString()));

    // Check the content of newly created asset being registered in Mongo DB side.
    let resultMongoDb = await transactionModel.findOne({'_id': newProductId});
    //console.log('\n[HyperLedgerProductTracking.js/CompleteTransfer()]: Asset information registered to Mongo DB side:')
    //console.log(resultMongoDb);

    // Update the original asset's status into 'Transferred'
    // and its transferred weight
    result = JSON.parse((await contract.submitTransaction('UpdateAssetStatusAndWeight',
      productId,      // Current product ID
      balancedWeight, // Balanced weight
      timeNowStr      // Timestamp
    )));
    console.log('[HyperLedgerProductTracking.js/CompleteTransfer()]: Updating asset in Hyperledger was committed.');

    // Store the data into Mongo DB
    await transactionModel.updateOne({'_id': productId}, result);
    console.log('[HyperLedgerProductTracking.js/CompleteTransfer()]: Data in MongoDB was updated.');

    // See the asset again to check if transaction is successful.
    result = await contract.evaluateTransaction('ReadAsset', productId);
    //console.log('[HyperLedgerProductTracking.js/CompleteTransfer()]: Read previous asset \x1b[36mAFTER\x1b[39m transaction:');
    //console.log(JSON.parse(result.toString()));

    // Check the content of newly created asset being registered in Mongo DB side.
    resultMongoDb = await transactionModel.findOne({'_id': productId});
    //console.log('\n[HyperLedgerProductTracking.js/CompleteTransfer()]: Asset information registered to Mongo DB side:')
    //console.log(resultMongoDb);

    console.log('[HyperLedgerProductTracking.js/CompleteTransfer()]: Asset was \x1b[32msuccessfully\x1b[39m transferred.');

    res.type('html');
    res.send('Ownership transaction was successfully completed!');
  } catch(err) {
    res.send(err);
  }
}

// A function to check if the user is RD (Regulatory Department)
// It returns boolean value (true or false)
const CheckRegulatoryDepartment = async function(req, res) {
  // Get user ID
  const userId = req.query.userId;
  try {
    // Get a User information via its 'userId'
    const user = await mongoDbUser.findOne({_id: userId});
    //console.log(`[HyperLedgerProductTracking.js/CheckRegulatoryDepartment()]: Fetched\x1b[32m ${userId} \x1b[39minformation:`);

    // Check if the user is RD
    const isRd = user.isregulatorydepartment;
    res.json({'isRd': isRd});
  } catch(err) {
    res.send(err);
  }
}

const GetOrganisationNames = async function(req, res) {
  console.log('[HyperLedgerProductTracking.js/GetOraganisationNames()]: Request received.');
  const userId = req.query.userId;

  try {
    // Get current user's org name
    const user    = await mongoDbUser.findOne({_id: userId});
    const userOrg = user.organisation;
    //console.log(`[HyperLedgerProductTracking.js/GetOraganisationNames()]: Current user org: ${userOrg}`);

    // Get all user data from MongoDB
    const allUsers = await mongoDbUser.find();
    //console.log('[HyperLedgerProductTracking.js/GetOraganisationNames()]: allUsers');
    //console.log(allUsers);

    // Extract 'orgName' from fetched dataset
    let orgNames = [];
    for (var obj of allUsers) {
      const orgName = obj.organisation;
      //console.log(orgName);
      if      (orgName === userOrg )        { /* DO NOTHING !!! */  }
      else if (orgName === RD_NAME )        { /* DO NOTHING !!! */  }
      else if (!orgNames.includes(orgName)) {orgNames.push(orgName);}
    }

    console.log('[HyperLedgerProductTracking.js/GetOraganisationNames()]: All the organisation names were fetched.');

    res.json(orgNames);
  } catch(err) {
    res.send(err);
  }
}

// Organise transaction history from MongoDB
const OrganisationTransactionHistory = async function (req, res) {
  console.log('[HyperLedgerProductTracking.js/OrganisationTransactionHistory()]: Request received.');

  const userId = req.query.userId;
  //console.log(`\n[HyperLedgerProductTracking.js/OrganisationTransactionHistory()]: userId: ${userId}`);

  var transactionsToSend = [];
  try {
    // Get a User information via its 'userId'
    const user = await mongoDbUser.findOne({'_id': userId});
    //console.log(`[HyperLedgerProductTracking.js/OrganisationTransactionHistory()]: Fetched\x1b[32m ${userId} \x1b[39minformation:`);
    //console.log(user + '\n');

    // Check if the user is Regulatory Department
    console.log('[HyperLedgerProductTracking.js/OrganisationTransactionHistory()]: Fetching assets...');

    var organisation = '';
    var transactions = '';
    if (user.isregulatorydepartment) {
      console.log('[HyperLedgerProductTracking.js/OrganisationTransactionHistory()]: \x1b[33mThis user is a Regulatory Department\x1b[39m.');
      // If the user is RD, show ALL the assets registerd REGARDLESS of oraganisations
      organisation = user.organisation;             // Define the user's organisation name
      transactions = await transactionModel.find(); // Get ALL assets from MongoDB!
    } else {
      console.log('[HyperLedgerProductTracking.js/OrganisationTransactionHistory()]: This user is not a Regulatory Department.');
      // If the user is not RD, show ONLY assets which has been registerd by the organisation to which the user belongs
      organisation = user.organisation;                                             // Define the user's organisation name
      transactions = await transactionModel.find({'organisation_name': organisation}); // Get ONLY the user's org assets from MongoDB!
    }
    console.log(`[HyperLedgerProductTracking.js/OrganisationTransactionHistory()]: \x1b[32m${transactions.length}\x1b[39m assets were fetched.`);

    // After getting the user info, now connect network to get asset information
    const contract = await fabricNetwork.connectNetworkOrg1(userId);

    for (iter in transactions) {
      let transaction = transactions[iter];
      //console.log(`[HyperLedgerProductTracking.js/OrganisationTransactionHistory()]: Fetching one asset registerd by \x1b[32m ${organisation} \x1b[39m...`);
      //console.log(transaction);

      // Let's get product asset information from Blockchain layers wallet via product ID
      const result     = await contract.evaluateTransaction('ReadAsset', transaction.product_id);
      const resultJson = JSON.parse(result.toString());
      //console.log('[HyperLedgerProductTracking.js/OrganisationTransactionHistory()]: Fetched the asset of the following product ID...:');
      //console.log(` => \x1b[32m${transaction.product_id}\x1b[39m`);
      //console.log(resultJson);

      // Extract asset JSON and get each property to send
      const jsonToSend = {
        ProductID         : resultJson.ProductID        ,
        PreviousProductID : resultJson.PreviousProductID,
        RootProductID     : resultJson.RootProductID    ,
        Owner             : resultJson.Owner            ,
        ProductName       : resultJson.ProductName      ,
        ProductType       : resultJson.ProductType      ,
        Location          : resultJson.Location         ,
        Weight            : resultJson.Weight           ,
        Temperature       : resultJson.Temperature      ,
        UseByDate         : resultJson.UseByDate        ,
        AssetStatus       : resultJson.AssetStatus      ,
        TransferFrom      : resultJson.TransferFrom     ,
        TransferTo        : resultJson.TransferTo       ,
        TransferWeight    : resultJson.TransferWeight   ,
        EventTimestamp    : resultJson.EventTimestamp   ,
        EventBy           : resultJson.EventBy          ,
        LinkedExperiments : resultJson.LinkedExperiments,
        Hash              : resultJson.Hash             ,
        PreviousHash      : resultJson.PreviousHash     ,
      };

      //console.log(jsonToSend);
      transactionsToSend.push(jsonToSend);

    }
    //console.log(transactionsToSend);

    console.log('[HyperLedgerProductTracking.js/OrganisationTransactionHistory()]: Fetching assets was \x1b[32msuccessfully\x1b[39m finished.');

    res.json(transactionsToSend);
  } catch(err) {
    console.log(err);
    res.send(err)
  }
}

const ViewTransactionHistory = async function (req, res) {
  console.log('[HyperLedgerProductTracking.js/ViewTransactionHistory()]: Request received.');

  const userId    = req.query.userId;
  const productId = req.query.productId;
  //console.log(userId);
  //console.log(productId);

  try {
    // Get contarct with the Blockchain network via 'userId'
    const contract = await fabricNetwork.connectNetworkOrg1(userId);

    // Get transaction history of the given asset ID
    const result = await contract.evaluateTransaction('GetTxHistory', productId);
    console.log('[HyperLedgerProductTracking.js/ViewTransactionHistory()]: Fetching transaction history in Hyperledger was committed.');
    //console.log(JSON.parse(result.toString()));

    // Get the result data as JSON format
    const txHistory = JSON.parse(result.toString());

    res.json(txHistory);
  } catch (err) {
    console.log(err);
    res.send(err);
  }
}

const CreateQrCode = async function(req, res) {
  try {
    // Make QR code content
    const content = JSON.stringify(req.body);
    //console.log(content);

    // Set PNG file path
    const file_path = path.join(__dirname, '../', 'qrcode_result', '/', 'product-tracking-qrcode.png');
    console.log();
    qr_code.toFile( file_path, content, {color: {dark: '#3B3486'}} , function(qr_err, qr_code) {
      if (qr_err) {
        return console.log(`[HyperledgerProductTracking/CreateQrCode]: Error in generating QR code: ${qr_err}`);
      } else {
        // If successful, send QR code file path as response
        res.send(file_path);
      }
    });
  } catch(err) {
    console.log('ERROR :', err);
    res.send(err);
  }
}

const DownloadQrCode = function(req, res) {
  res.sendFile(req.body.filename);
};

// Function for editting an existing asset
const DeleteAsset = async function(req, res) {
  console.log('[HyperLedgerProductTracking.js/DeleteAsset()]: Request received.');
  //console.log(req.body);
  const userId    = req.body.userId;
  const productId = req.body.productId;

  try {
    // Get a Blockchain contract as this user ID
    const contract = await fabricNetwork.connectNetworkOrg1(userId);

    // See the current asset
    let result = await contract.evaluateTransaction('ReadAsset', productId);
    console.log('[HyperLedgerProductTracking.js/DeleteAsset()]: Read asset \x1b[36mBEFORE\x1b[39m edit:');
    console.log(JSON.parse(result.toString()));

    // Check if asset status is NOT 'Requested' or 'Deleted'
    const assetStatus = JSON.parse(result.toString()).assetStatus;
    if      (assetStatus === 'Requested') {throw new Error('The asset status is Requested, this is not acceptable!');}
    else if (assetStatus === 'Deleted'  ) {throw new Error('The asset status is Deleted, this is weird!');}

    // Now edit the asset
    // Get current time for timestamp at the first place
    const timeNow    = new Date();
    const timeNowStr = timeNow.toISOString();
    //console.log('[HyperLedgerProductTracking.js/DeleteAsset()]: Time information for asset updating =>', timeNowStr);

    // Update asset as 'Deleted'
    result = JSON.parse((await contract.submitTransaction('DeleteAsset', productId, timeNowStr)));
    console.log('[HyperLedgerProductTracking.js/DeleteAsset()]: Updating asset in Hyperledger was committed.');

    // Store the data into Mongo DB
    await transactionModel.updateOne({'_id':productId}, result);
    console.log('[HyperLedgerProductTracking.js/DeleteAsset()]: Data in MongoDB was updated.');

    // See the asset again to check if transaction is successful.
    result = await contract.evaluateTransaction('ReadAsset', productId);
    console.log('[HyperLedgerProductTracking.js/DeleteAsset()]: Read asset \x1b[36mAFTER\x1b[39m edit:');
    console.log(JSON.parse(result.toString()));

    // Check the content of newly created asset being registered in Mongo DB side.
    const resultMongoDb = await transactionModel.findOne({'_id':productId});
    console.log('\n[HyperLedgerProductTracking.js/DeleteAsset()]: Asset information updated in MongoDB side:');
    console.log(resultMongoDb);

    console.log('[HyperLedgerProductTracking.js/DeleteAsset()]: Asset was \x1b[32msuccessfully\x1b[39m deleted.');

    res.type('html');
    res.send('Asset was successfully deleted!');
  } catch(err) {
    console.log(err);
    res.send('Asset Delete Failed');
  }
}

// This function returns JSON data containing
// all the assets which share the same 'RootProductID' to
// monitor all the assets distributed from the root product.
const GetAllBranches = async function(req, res) {
  console.log('[HyperLedgerProductTracking.js/GetAllBranches()]: Request received.');
  //console.log(req.query);
  const userId    = req.query.userId;
  const productId = req.query.productId;

  try {
    // Get a User information via its 'userId'
    const user = await mongoDbUser.findOne({'_id': userId});
    console.log(`[HyperLedgerProductTracking.js/GetAllBranches()]: Fetched\x1b[32m ${userId} \x1b[39minformation.`);
    //console.log(user + '\n');

    // Get query product info from mongoDB
    const productInfo = await transactionModel.findOne({'product_id': productId});
    console.log('[HyperLedgerProductTracking.js/GetAllBranches()]: Product information was fetched from MongoDB.');
    //console.log(productInfo);

    // Get root_product_id of this product
    const rootProductId = productInfo.root_product_id;

    // Get all the assets whose 'root_product_id' is 'rootProductId'
    const branches = await transactionModel.find({'root_product_id': rootProductId});
    console.log('[HyperLedgerProductTracking.js/GetAllBranches()]: Fetched all product IDs of branch assets.');
    console.log(`[HyperLedgerProductTracking.js/GetAllBranches()]: \x1b[32m${branches.length}\x1b[39m assets were fetched.`);
    //console.log(branches);

    // Get a Blockchain contract as this user ID
    const contract = await fabricNetwork.connectNetworkOrg1(userId);

    // Collect all the transaction histories in the branches
    let resultBranch = [];
    for (var assetIter of branches) {
      // Get product ID
      const productIdIter = assetIter.product_id;
      console.log(assetIter);
      console.log(productIdIter);

      // Get this asset's trasaction history
      const result = await contract.evaluateTransaction('GetAssetHistory', productIdIter);
      console.log(`[HyperLedgerProductTracking.js/GetAllBranches()]: Fetched transaction history of \x1b[32m${productIdIter}\x1b[39m.`);
      const resultJson = JSON.parse(result.toString());
      //console.log(resultJson);

      // Push to resultBranch
      resultBranch = resultBranch.concat(resultJson);
    }
    console.log('[HyperLedgerProductTracking.js/GetAllBranches()]: Fetched all branch assets Tx history.');

    console.log('[HyperLedgerProductTracking.js/GetAllBranches()]: Finish getting all branch asset history.');
    //console.log(resultBranch);
    //console.log(JSON.stringify(resultBranch));

    // Get the target product ID's transaction history again
    // This is for dashboard visualisation
    const resultTargetTx     = await contract.evaluateTransaction('GetTxHistory', productId);
    const resultTargetTxJson = JSON.parse(resultTargetTx.toString());
    console.log('[HyperLedgerProductTracking.js/GetAllBranches()]: Fetching transaction history in Hyperledger was committed.');

    // Finally, combine these two objectcs (txHistory and branches)
    const resultFinal = { 'txHistory' : resultTargetTxJson, 'branches' : resultBranch }
    console.log('[HyperLedgerProductTracking.js/GetAllBranches()]: txHistory and branches were combined.');
    //console.log(resultFinal)
    console.log(JSON.stringify(resultFinal))

    // Create the result file in ../dashboard
    createFile('./dashboard/dashboard_input.json', resultFinal);
    console.log('[HyperLedgerProductTracking.js/GetAllBranches()]: Saved dashboard input file.');

    res.json(resultFinal);
  } catch(err) {
    console.log(err);
    res.send('Get Branches Failed.');
  }
}

const sendJSONresponse = function(res, status, content) {
  res.status(status);
  res.json(content);
};


module.exports = {
  checkUserExist,
  registerNewUser,
  CreateAsset,
  GetAssets,
  UpdateAsset,
  CheckRegulatoryDepartment,
  GetOrganisationNames,
  OrganisationTransactionHistory,
  RequestTransfer,
  CompleteTransfer,
  ViewTransactionHistory,
  CreateQrCode,
  DownloadQrCode,
  DeleteAsset,
  GetAllBranches
}