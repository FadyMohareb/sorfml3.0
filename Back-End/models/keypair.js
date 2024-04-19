const mongoose = require("mongoose"),
Schema = mongoose.Schema

   /* user product tracking keypair schema */
   const keypairSchema = new Schema(
    {
      publicKey: {
        type: String,
        required: true
      },
      privateKey: {
        type: String,
        required: true
      },
      date_creation: {
        type: Date,
        require: true,
        default: Date.now()
      },
      owner_id: {
        type: String,
        required: true
    }
    }
  );

  // compile schemas
  
module.exports = mongoose.model("KeypairModel", keypairSchema);