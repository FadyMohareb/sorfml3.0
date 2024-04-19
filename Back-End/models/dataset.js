const mongoose = require("mongoose"),
  Schema = mongoose.Schema;

/* Value schema */
const valueSchema = new Schema(
  {
    name: {
      type: String,
      required: true
    },
    sample: {
      type: Schema.Types.Mixed,
      required: true
    }
  },
  {
    _id: false // By default Mongoose inserts an ID for each value which is useless
  }
);

/* Dataset schema */
const datasetSchema = new Schema(
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
    experiment_id: {
      type: String,
      required: true
    },
    type: {
      type: String,
      required: true
    },
    is_metadata: {
      type: Boolean,
      required: true,
      default: false
    },
    row_file_link: {
      type: String,
      required: true
    },
    headers: {
      type: [String],
      required: true
    },
    values_file: {
      type: [valueSchema],
      required: true
    }
  },
  {
    versionKey: false // By default Mongoose inserts a new field __v to avoid this field versionKey has to be set to false
  }
);

/* Compiling the model from datasetSchema */
module.exports = mongoose.model("Dataset", datasetSchema);
