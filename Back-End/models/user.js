
const mongoose = require("mongoose"),
  Schema = mongoose.Schema,
  crypto = require("crypto"),
  jwt = require("jsonwebtoken");

const notificationSchema = new Schema(
  {
    experiment_id: {
      type     : Schema.Types.ObjectId,
      ref      : "Experiment",
      required : false
    },
    seen: {
      type: Boolean,
      required : true,
      default  : false
    }
  }, {
    _id : false // By default Mongoose inserts an ID for each value which is useless
  }
);

const userSchema = new Schema(
  {
    _id: {
      type     : Schema.Types.ObjectId,
      required : true
    },
    firstname: {
      type     : String,
      required : true
    },
    lastname: {
      type     : String,
      required : true
    },
    email: {
      type     : String,
      unique   : true,
      required : true
    },
    role: {
      type     : String,
      enum     : ["User", "Admin"],
      default  : "User",
      required : true
    },
    hash : String,
    salt : String,
    organisation: {
      type     : String,
      default  : "No organisation",
      required : true
    },
    notification: {
      type     : [notificationSchema],
      required : true
    },
    isregulatorydepartment : {
      type     : Boolean,
      default  : false,
      required : true
    }
  }
);

userSchema.methods.setPassword = function(password) {
  this.salt = crypto.randomBytes(16).toString("hex");
  this.hash = crypto
    .pbkdf2Sync(password, this.salt, 1000, 64, "sha512")
    .toString("hex");
};

userSchema.methods.validPassword = function(password) {
  let hash = crypto
    .pbkdf2Sync(password, this.salt, 1000, 64, "sha512")
    .toString("hex");
  return this.hash === hash;
};

userSchema.methods.generateJwt = function() {
  let expiry = new Date();
  expiry.setDate(expiry.getDate() + 7);

  return jwt.sign(
    {
      _id: this._id,
      email: this.email,
      firstname: this.firstname,
      role: this.role,
      exp: parseInt(expiry.getTime() / 1000)
    },
    "MY_SECRET"
  ); // DO NOT KEEP YOUR SECRET IN THE CODE!
};

module.exports = mongoose.model("User", userSchema);
