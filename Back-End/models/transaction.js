
const mongoose = require("mongoose"),
Schema = mongoose.Schema;

const transactionSchema = new Schema(
  {
    _id: { // MongoDB's data ID: now it is same as 'product_id'.
      type     : String,
      required : true,
    },
    product_id: { // Product ID: same as  Hyperledger's 'ProductID'
      type     : String,
      required : true,
    },
    previous_product_id: { // Previous product ID: this is the same as Fabric Samples' 'PreviousProductID'
      type     : String,
      required : false,
    },
    root_product_id: {  // Root product ID: this is the same as Fabric Samples' 'RootProductID'
      type     : String,
      required : true,
    },
    organisation_name: { // Organisation name: same as Hyperledger's 'Owner'
      type     : String,
      required : true,
    },
    asset_status: { // Asset status ('Created', 'Edited', 'Requested', 'Transferred' or 'Deleted')
      type     : String,
      required : true,
    },
  }, {
    versionKey : false, // By default Mongoose inserts a new field __v to avoid this field versionKey has to be set to false
    _id        : false,
  }
);

module.exports = mongoose.model("TransactionModel",transactionSchema);
