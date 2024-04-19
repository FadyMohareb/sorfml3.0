const mongoose = require("mongoose"),
Schema = mongoose.Schema

 /* Product  schema */
const productSchema = new Schema(
    {
      assetID: {
        type: String,
        required: true
      },
      productType: {
        type: String,
        required: true
      },
      weight: {
        type: String,
        required: false
      },
      QRpath: {
        type:String,
        required: false
      },
      date_creation: {
        type: Date,
        required: true,
        default: Date.now()
      },
      owner_id: {
        type: String,
        required: true
      },
      ownerName: {
        type: String,
        required: false
      },
      linkedExperiment: {
        type: Schema.Types.Mixed,
        required: false
      }
    }
);


  // compile schemas
module.exports = mongoose.model("ProductModel", productSchema);
