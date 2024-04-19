const mongoose = require("mongoose"),
  Schema = mongoose.Schema;

/* Experiment schema */
const experimentSchema = new Schema(
  {
    _id: {
      type: Schema.Types.ObjectId,
      required: true
    },
    name: {
      type: String,
      required: true
    },
    description: {
      type: String,
      required: true,
      default: "No Description"
    },
    author_id: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    type: {
      type: String,
      required: true
    },
    date: {
      type: String,
      required: true
    },
    is_public: {
      type: Boolean,
      required: true,
      default: false
    },
    date_creation: {
      type: Date,
      require: true,
      default: Date.now()
    },
    user_permission: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
      }
    ]
  },
  {
    versionKey: false // By default Mongoose inserts a new field __v to avoid this field versionKey has to be set to false
  }
);

/* Compiling the model from experimentSchema */
module.exports = mongoose.model("Experiment", experimentSchema);
