// const fs = require('fs')
// const path = require("path");
// //const ProductModel = require("../models/product");
// //const KeypairModel = require("../models/keypair");
// const TransactionModel=require("../models/transaction");
// const DatasetModel = require("../models/dataset");
// const User = require("../models/user");
// const dataset = require('../models/dataset');
// /* const {Wallets} = require('fabric-network');
// const FabricCAServices = require('fabric-ca-client');
// const { buildCAClient, registerAndEnrollUser, enrollAdmin } = require('../ProductTrackingUtils/CAUtil');
// const { buildCCPOrg1, buildWallet } = require('../ProductTrackingUtils/AppUtil');
// const walletPath =path.join('..','ProdcutTrackingUtils','Wallet');
// const ccp = buildCCPOrg1();
// const caClient = buildCAClient(FabricCAServices, ccp, 'ca.org1.example.com');
// const wallet = buildWallet(Wallets, walletPath);
//  */


// const checkKeypair = function(req, res){
//     if (!req.body) {
//         console.log("Error getting data");
//         sendJSONresponse(res, 404, { message: "No parameters" });
//         return;
//       } else {
//         KeypairModel.count({ owner_id: req.body.owner_id }, function(err, count){
//             console.log('current keypair count:' +count);

//             // send count in JSON
//             sendJSONresponse(res, 200, { count: count});
//         })

//       }

// }

// const checkUserExist= async function(req,res){
//     if (!req.body) {
//         console.log("Error getting data");
//         sendJSONresponse(res, 404, { message: "No parameters" });
//         return;
//       } else {
//         const userId=req.body.userId;
//         //build wallet first
//         const userIdentity= await wallet.get(userId);
//         if (userIdentity) {
// 			console.log(`Identity for the user ${userId}  exists in the wallet`);
//             sendJSONresponse(res,200,{exists:true})}
//             else{
//                 sendJSONresponse(res,200,{exists:false})
//             }

//       }
// }


// const checkOwnership = function(req, res){
//     if (!req.body) {
//         console.log("Error getting data");
//         sendJSONresponse(res, 404, { message: "No parameters" });
//         return;
//       } else {
//         ProductModel.find({ assetID: req.body.assetID }, function(err, asset){
//             let asset1 = asset[0]
//             if (asset1.owner_id === req.body.user_id){
//                 // send count in JSON
//                 sendJSONresponse(res, 200, { isOwner: 'yes'});
//             } else {
//                 // send count in JSON
//                 sendJSONresponse(res, 200, { isOwner: 'no'});
//             }
//         })
//       }
// }

// const registerNewUser= async function(req,res){
//     var org;
//     var username;
//     if (!req.body) {
//         console.log("Error getting data");
//         sendJSONresponse(res, 404, { message: "No parameters" });
//         return;
//       }
//       else{
//         const UserId=req.body.userId
//         User.findOne({_id:UserId},function(err,user){
//             if (err){
//                 console.log(err);
//                 sendJSONresponse(res,404,'User not found');
//             }
//             console.log(user);
//             org=user.organisation;
//             username=`${user.firstname}-${user.lastname}`})
//             let result = await registerAndEnrollUser(caClient,wallet,'Org1MSP',UserId,org,org,username);
//             sendJSONresponse(res,result.status,{message:result.message});
//         }
//       }   


// const registerUserKeypair = function(req, res) {
//     if (!req.body) {
//       console.log("Error getting data");
//       sendJSONresponse(res, 404, { message: "No parameters" });
//       return;
//     } else {
    
//     KeypairModel.count({ owner_id: req.body.owner_id }, function(err, count){
//         console.log('current keypair count:' +count)
//         if (count == 0){
//             // Create a new keypair.
//             const userKeyPair = new driver.Ed25519Keypair();

//             // save to mongoDB
//             const newKeyPair = new KeypairModel({ publicKey: userKeyPair.publicKey,
//                                             privateKey: userKeyPair.privateKey, // need to add enryption
//                                             owner_id: req.body.owner_id})
//             newKeyPair.save().then(() => console.log("new keypair saved to DB"))

//             // save to JSON
//             let results = {}
//             results.publicKey = userKeyPair.publicKey;
//             results.privateKey = userKeyPair.privateKey;
//             results.count = count

//             // send JSON 
//             sendJSONresponse(res, 200, results);
//             return;
//         } else {
//             console.log('keypair already exists')
//             sendJSONresponse(res, 200, { count: count});
//         }
//     });
// }
// }


// const registerProduct = function(req, res) {
//     if (!req.body) {
//       console.log("Error getting product data");
//       sendJSONresponse(res, 404, { message: "No parameters" });
//       return;
//     } else {
//         // BigchainDB server
//         const API_PATH = 'https://test.ipdb.io/api/v1/'

//         //get product JSON
//         let product = {};
//         product.username = req.body.username; // this needs to change for auto input of key pairs 
//         product.location = req.body.locations;
//         product.productType = req.body.productType;
//         product.weight = req.body.weight;
//         product.temperature = req.body.temperature;
//         product.useByDate = req.body.useByDate;

//         // get user's keypair.
//         KeypairModel.findOne({ owner_id: req.body.owner_id }, function(err, userKeypair){
//             console.log(userKeypair);
//             // Construct a transaction payload
//             const tx = driver.Transaction.makeCreateTransaction(
//                 { product },

//                 // Metadata
//                 { transaction: 'Product Registered',
//                 datetime: new Date().toString() },

//                 // output
//                 [ driver.Transaction.makeOutput(
//                         driver.Transaction.makeEd25519Condition(userKeypair.publicKey))
//                 ],
//                 userKeypair.publicKey
//             )

//             // Sign the transaction with private keys
//             var txSigned = driver.Transaction.signTransaction(tx, userKeypair.privateKey)
//             console.log(txSigned)

//             // Send the transaction off to BigchainDB
//             const conn = new driver.Connection(API_PATH)
//             conn.postTransactionCommit(txSigned)
//                 .then(retrievedTx => console.log('Transaction', retrievedTx.id, 'successfully posted.'))



//             // make QR code with transaction ID
//             const generateQRterminal = async text => { // print QR to terminal
//                 try {
//                     console.log(await QRcode.toString(text, {type:'terminal'}))
//                 } catch(err){
//                     console.log(err)
//                 }
//             }
//             const generateQRpng = async text => { // make QR png file
//                 try {
//                     console.log(await QRcode.toFile('./productTrackingData/QRcodes/'+txSigned.id+'.svg', text, {
//                         // color: {
//                         //     light: '#F2B0D4'
//                         // }
//                     }))
//                 } catch(err){
//                     console.log(err)
//                 }
//             }

//             // save the transaction ID to a text file
//             fs.writeFile('./productTrackingData/latest_IDs/'+txSigned.id+'.txt', txSigned.id, function(err, result) {
//                 if(err) console.log('error', err);
//             });

//             //  get transation URL
//             transactionURL = 'http://localhost:4200/tracking/seehistory/' + txSigned.id

//             // Use transaction URL to make QR code
//             generateQRterminal(transactionURL)
//             generateQRpng(transactionURL)

//             // get QRcode file directory
//             currentpath = __dirname.split('controllers');
//             let QRpath = path.join(currentpath[0], 'productTrackingData', 'QRcodes', txSigned.id + '.svg');


//             // save to JSON
//             let results = {}
//             results.assetID = txSigned.id;
//             results.assetURL = transactionURL;
//             results.QRpath = QRpath

//             // save asset to mongoDB
//             const newProduct = new ProductModel({ assetID: txSigned.id, 
//                                             productType: req.body.productType,
//                                             weight: req.body.weight,
//                                             owner_id: req.body.owner_id,
//                                             ownerName: req.body.username,
//                                             QRpath: QRpath })
//             newProduct.save().then(() => console.log("new product saved to DB"))



//             // print info to terminal
//             console.log('transaction ID: ', txSigned.id)
//             console.log(transactionURL)
//             console.log('Product registration complete.')

//             // send JSON 
//             sendJSONresponse(res, 200, results);
//             return;
//             })
        
//         }
// };

// const registerSamples = function(req, res){
//     if (!req.body) {
//         console.log("Error getting data");
//         sendJSONresponse(res, 404, { message: "No parameters" });
//         return;
//       } else {
//         console.log('REGISTERING SAMPLES TO BLOCKCHAIN');

//         // Get JSON info
//         let experimentID = req.body.experimentID;
//         let productType = req.body.productType;
//         let experimentLocation = req.body.experimentLocation;
//         let owner_id = req.body.owner_id;
//         let username = req.body.username;

//         // get user's keypair.
//         KeypairModel.findOne({ owner_id: owner_id }, function(err, userKeypair){
//             console.log('user keypair: ' + userKeypair);

//             // First get JSON array of each dataset linked to experiment ID
//             DatasetModel.find({ experiment_id: experimentID }, function(err, datasetArray){
//                 if (err){
//                     console.log(err);
//                 }
//                 // console.log('datasets: ' + datasetArray)
//                 let datasetTypeList = [];
//                 let datasetArrayNotMeta = [];
//                 console.log('hello')
//                 // loop through JSON array of datasets to get list of analytical platforms


//                 for (d of datasetArray){
//                     // check to make sure its not a metadata dataset
//                     if (d.is_metadata === false){
//                     datasetTypeList.push(d.type);
//                     datasetArrayNotMeta.push(d);
//                     }
//                 }
//                 let datasetTypeListString = datasetTypeList.toString();
//                 console.log(datasetTypeListString)

//                 // take the first dataset ONLY and register samples.
//                 let Dataset = datasetArrayNotMeta[0];
                        
//                 // get array of samples
//                 let samplesArray = Dataset.values_file;
                
//                 samplesMongoArray = [];
//                 // loop through samples array 
//                 for (sample of samplesArray){
                    
//                             console.log('SAMPLES: '+ sample)

//                             // console.log('product count: ' + count)
//                             // REGISTER TO BLOCKCHAIN
//                             const API_PATH = 'https://test.ipdb.io/api/v1/'

//                             // make product JSON
//                             let linkedExperiment = {}
//                             linkedExperiment.sampleID = sample.name;
//                             linkedExperiment.experimentID = experimentID
//                             linkedExperiment.datasetTypes = datasetTypeListString
//                             linkedExperiment.location = experimentLocation

//                             let product = {};
//                             product.username = username;
//                             product.productType = productType;
//                             product.linkedExperiment = linkedExperiment;

//                             // Construct a transaction payload
//                             const tx = driver.Transaction.makeCreateTransaction(
//                                 { product },

//                                 // Metadata
//                                 { transaction: 'Auto Registered',
//                                 datetime: new Date().toString() },

//                                 // output
//                                 [ driver.Transaction.makeOutput(
//                                         driver.Transaction.makeEd25519Condition(userKeypair.publicKey))
//                                 ],
//                                 userKeypair.publicKey
//                             )

//                             // Sign the transaction with private keys
//                             var txSigned = driver.Transaction.signTransaction(tx, userKeypair.privateKey)
//                             console.log(txSigned)

//                             // Send the transaction off to BigchainDB
//                             const conn = new driver.Connection(API_PATH)
//                             conn.postTransactionCommit(txSigned)
//                                 .then(retrievedTx => console.log('Transaction', retrievedTx.id, 'successfully posted.'))
                            
//                             // make QR code with transaction ID
//                             const generateQRpng = async text => { // make QR png file
//                                 try {
//                                     console.log(await QRcode.toFile('./productTrackingData/QRcodes/'+txSigned.id+'.svg', text, {
//                                         // color: {
//                                         //     light: '#F2B0D4'
//                                         // }
//                                     }))
//                                 } catch(err){
//                                     console.log(err)
//                                 }
//                             }

//                             // save the transaction ID to a text file
//                             fs.writeFile('./productTrackingData/latest_IDs/'+txSigned.id+'.txt', txSigned.id, function(err, result) {
//                                 if(err) console.log('error', err);
//                             });

//                             //  get transation URL
//                             let transactionURL ='http://localhost:4200/tracking/seehistory/' + txSigned.id
                           
//                             // Use transaction URL to make QR code
//                             generateQRpng(transactionURL)

//                             // get QRcode file directory
//                             let currentpath = __dirname.split('controllers');
//                             let QRpath = path.join(currentpath[0], 'productTrackingData', 'QRcodes', txSigned.id + '.svg');
                            

//                             // make JSON to save to mongo
//                             let newProduct = {};
//                             newProduct.assetID = txSigned.id;
//                             newProduct.productType = productType;
//                             newProduct.owner_id = req.body.owner_id;
//                             newProduct.ownerName = username;
//                             newProduct.QRpath = QRpath;
//                             newProduct.linkedExperiment = linkedExperiment;

//                             samplesMongoArray.push(newProduct);

                                    
//                         }
//                         // save new assests to mongo
//                         // console.log(samplesMongoArray);
//                         ProductModel.insertMany(samplesMongoArray).then(function(){
//                             console.log('samples saved to mongo')
//                         })
                            
//                     // }
//                 // }
//                 // send JSON 
//                 sendJSONresponse(res, 200, { message: 'samples registered.' });
//                 return;
//             })
//         })
        
    
// }

// }


// const updateLocation = function(req, res) {
//     if (!req.body) {
//       console.log("Error getting data");
//       sendJSONresponse(res, 404, { message: "No parameters" });
//       return;
//     } else {
//         // BigchainDB server
//         const API_PATH = 'https://test.ipdb.io/api/v1/'

//         // connect 
//         const conn = new driver.Connection(API_PATH)

//         //get JSON info
//         const assetID = req.body.assetID;
//         const newLocation = req.body.newLocation;
//         const temp = req.body.temperature;
//         const username = req.body.username;

//         // get user's keypair.
//         KeypairModel.findOne({ owner_id: req.body.owner_id }, function(err, userKeypair){
//             console.log(userKeypair);
//             // get latest transaction ID from the text file
//             fs.readFile('./productTrackingData/latest_IDs/'+assetID+'.txt', function(err, ID) {
//                 if(err){ 
//                     console.log('error', err);
//                 }

//                 // Perform the new transfer
//                 conn.getTransaction(ID)
//                 .then((txCreated) => {
//                     const createTranfer = driver.Transaction.
//                         makeTransferTransaction(
//                             [{
//                                 tx: txCreated,
//                                 output_index: 0
//                             }],
//                             [driver.Transaction.makeOutput(
//                                 driver.Transaction.makeEd25519Condition(
//                                     userKeypair.publicKey))],
//                             {
//                                 transaction: 'Location Update',
//                                 datetime: new Date().toString(), 
//                                 updatedLocation: newLocation,
//                                 Temperature: temp,
//                                 updatedBy: username
//                             }
//                         )
//                         // Sign with the key of the owner 
//                         const signedTransfer = driver.Transaction
//                             .signTransaction(createTranfer, userKeypair.privateKey)
                            
//                         // save the update to latest transaction ID in txt file
//                         fs.writeFile('./productTrackingData/latest_IDs/'+assetID+'.txt', signedTransfer.id, function(err) {
//                         if(err) console.log('error', err);
//                         });
//                         conn.postTransactionCommit(signedTransfer)
//                         console.log('Transfer complete.');
//                         // console.log(metadata)

//                         // save to JSON
//                         let results = {}
//                         results.newID = signedTransfer.id;

//                         // send JSON 
//                         sendJSONresponse(res, 200, results);
//                         return;

//                 })
//         });

//     })

// }}

// const linkExperiment = function(req, res) {
//     if (!req.body) {
//       console.log("Error getting data");
//       sendJSONresponse(res, 404, { message: "No parameters" });
//       return;
//     } else {
//         // BigchainDB server
//         const API_PATH = 'https://test.ipdb.io/api/v1/'

//         // connect 
//         const conn = new driver.Connection(API_PATH)

//         //get JSON info
//         const assetID = req.body.assetID;
//         const experimentID = req.body.experimentID;
//         const sampleID = req.body.sampleID;
//         const username = req.body.username;

//         // get user's keypair.
//         KeypairModel.findOne({ owner_id: req.body.owner_id }, function(err, userKeypair){
//             console.log(userKeypair);
//             // get latest transaction ID from the text file
//             fs.readFile('./productTrackingData/latest_IDs/'+assetID+'.txt', function(err, ID) {
//                 if(err){ 
//                     console.log('error', err);
//                 }

//                 // Perform the new transfer
//                 conn.getTransaction(ID)
//                 .then((txCreated) => {
//                     const createTranfer = driver.Transaction.
//                         makeTransferTransaction(
//                             [{
//                                 tx: txCreated,
//                                 output_index: 0
//                             }],
//                             [driver.Transaction.makeOutput(
//                                 driver.Transaction.makeEd25519Condition(
//                                     userKeypair.publicKey))],
//                             {
//                                 transaction: 'Experiment Linked',
//                                 datetime: new Date().toString(), 
//                                 experimentID: experimentID,
//                                 sampleID: sampleID,
//                                 updatedBy: username
//                             }
//                         )
//                         // Sign with the key of the owner 
//                         const signedTransfer = driver.Transaction
//                             .signTransaction(createTranfer, userKeypair.privateKey)
                            
//                         // save the update to latest transaction ID in txt file
//                         fs.writeFile('./productTrackingData/latest_IDs/'+assetID+'.txt', signedTransfer.id, function(err) {
//                         if(err) console.log('error', err);
//                         });
//                         conn.postTransactionCommit(signedTransfer)
//                         console.log('Transfer complete.');
//                         // console.log(metadata)

//                         // save to JSON
//                         let results = {}
//                         results.newID = signedTransfer.id;

//                         // send JSON 
//                         sendJSONresponse(res, 200, results);
//                         return;

//                 })
//         });

//     })

// }}

// const transferOwnership = function(req, res){
//     if (!req.body) {
//         console.log("Error getting data");
//         sendJSONresponse(res, 404, { message: "No parameters" });
//         return;
//       } else {
//         // BigchainDB server
//         const API_PATH = 'https://test.ipdb.io/api/v1/'

//         // connect 
//         const conn = new driver.Connection(API_PATH)

//         //get JSON info
//         const assetID = req.body.assetID;
//         const newEmail = req.body.email;
//         const owner_id = req.body.owner_id;
//         const username = req.body.username;

//         // get current owner's keypair
//         KeypairModel.findOne({ owner_id: owner_id }, function(err, userKeypair){
//             console.log(userKeypair);
//             // get latest transaction ID from the text file
//             fs.readFile('./productTrackingData/latest_IDs/'+assetID+'.txt', function(err, ID) {
//                 if(err){ 
//                     console.log('error', err);
//                 }
            
//                 // get new owner's ID using email
//                 User.findOne({ email: newEmail}, function(err, newOwner){
//                     if (newOwner === null){
//                         sendJSONresponse(res, 200, {userExists: null});
//                                 return;
//                     }else{
//                     // get new owner's keypair
//                     KeypairModel.findOne({ owner_id: newOwner._id}, function(err, newOwnerKeypair){
//                         console.log('new key   '+newOwnerKeypair)
//                         if (newOwnerKeypair === null){
//                             sendJSONresponse(res, 200, {newOwnerKeypair: null});
//                                 return;
//                         }else{
//                         // Perform the new transfer
//                         conn.getTransaction(ID)
//                         .then((txCreated) => {
//                             const createTranfer = driver.Transaction.
//                                 makeTransferTransaction(
//                                     [{
//                                         tx: txCreated,
//                                         output_index: 0
//                                     }],
//                                     [driver.Transaction.makeOutput(
//                                         driver.Transaction.makeEd25519Condition(
//                                             newOwnerKeypair.publicKey))],
//                                     {
//                                         transaction: 'Ownership Transfer',
//                                         datetime: new Date().toString(),
//                                         transferredTo: newOwner.firstname,
//                                         transferredFrom: username
//                                     }
//                                 )
//                                 // Sign with the key of the owner 
//                                 const signedTransfer = driver.Transaction
//                                     .signTransaction(createTranfer, userKeypair.privateKey)
                                    
//                                 // save the update to latest transaction ID in txt file
//                                 fs.writeFile('./productTrackingData/latest_IDs/'+assetID+'.txt', signedTransfer.id, function(err) {
//                                 if(err) console.log('error', err);
//                                 });
//                                 conn.postTransactionCommit(signedTransfer)
//                                 console.log('Transfer complete.');
//                                 // console.log(metadata)

//                                 // update owner ID of product in mongo
//                                 ProductModel.findOneAndUpdate({assetID: assetID}, {owner_id: newOwner._id}, function(err, productUpdate){
//                                     console.log(productUpdate);
//                                 })
                                
//                                 // update owner name in mongo
//                                 ProductModel.findOneAndUpdate({assetID: assetID}, {ownerName: newOwner.firstname}, function(err, productUpdate){
//                                     console.log(productUpdate);
//                                 })

//                                 // save to JSON
//                                 let results = {}
//                                 results.newID = signedTransfer.id;

//                                 // send JSON 
//                                 sendJSONresponse(res, 200, results);
//                                 return;

//                         })

//                     }
//                     })
//                 }
//                 })
//             })
//         })


//       }


// }

// const getAllAssets = function(req, res) {
//     if (!req.params) {
//       console.log("Error getting data");
//       sendJSONresponse(res, 404, { message: "No parameters" });
//       return;
//     } else {
//         let owner_id = req.params.userid;
//         console.log('owner id: ' + owner_id)

//         // mongoose query to get all assets registered by user
//         ProductModel.find({ owner_id: owner_id }, function(err, products){
        
//             // console.log('products:' + products);
//             console.log('products queried sucessfully')
//             sendJSONresponse(res, 200, products);
//             return;
        

//         })
//     }
// }




// /**
//  * Function to send the JSON response to the client
//  * @param {*} res
//  * @param {*} status
//  * @param {*} content
//  */
//  const sendJSONresponse = function(res, status, content) {
//     res.status(status);
//     res.json(content);
//   };




//  const downloadQR = function(req, res){
//     res.sendFile(req.body.filename);
//  }
  

// module.exports = {
// registerProduct,
// updateLocation,
// registerUserKeypair,
// registerSamples,
// getAllAssets,
// transferOwnership,
// checkKeypair,
// linkExperiment,
// downloadQR,
// checkOwnership,
// };