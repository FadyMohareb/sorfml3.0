const mongoose = require("mongoose"),
  Schema = mongoose.Schema;

/* Experiment schema */
const modelSchema = new Schema({
  _id: {
    type: Schema.Types.ObjectId,
    required: true
  },
  path: {
    type: String,
    required: true
  },
  pathPDFReport: {
    type: String,
    required: true
  },
  pretreatment: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true
  },
  bacteria: {
    type: String
  },
  platform: {
    type: String,
    required: true
  },
  ml: {
    type: String,
    required: true
  },
  options: {
    type: String
  },
  RMSE: {
    type: Schema.Types.Mixed
  },
  Acc: {
    type: Schema.Types.Mixed,
    required: true
  },
  Af: {
    type: Schema.Types.Mixed
  },
  Bf: {
    type: Schema.Types.Mixed
  },
  Delta: {
    type: Schema.Types.Mixed
  },
  experiment_id: {
    type: Schema.Types.ObjectId,
    ref: "Experiment",
    required: true
  }
});

/* Compiling the model from experimentSchema */
module.exports = mongoose.model("Model", modelSchema);
