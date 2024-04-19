const mongoose = require("mongoose");

const dbURI = "mongodb://localhost:27017/sorfml2";
mongoose.connect(dbURI);

// CONNECTION EVENTS
mongoose.connection.on("connected", function() {
  console.log("Mongoose connected to " + dbURI);
});

mongoose.connection.on("error", function(err) {
  console.log("Mongoose connection error: " + err);
});

mongoose.connection.on("disconnected", function() {
  console.log("Mongoose disconnected");
});

/* CAPTURE APP TERMINATION / RESTART EVENTS
To be called when process is restarted or terminated */
const gracefulShutdown = function(msg, callback) {
  mongoose.connection.close(function() {
    console.log("Mongoose disconnected through " + msg);
    callback();
  });
};

/* For nodemon restarts -> listen for SIGUSR2 */
process.once("SIGUSR2", function() {
  gracefulShutdown("nodemon restart", function() {
    process.kill(process.pid, "SIGUSR2");
  });
});

/* For app termination -> listen for SIGINT */
process.on("SIGINT", function() {
  gracefulShutdown("app termination", function() {
    process.exit(0);
  });
});

/* For Heroku app termination -> listen for SIGTERM */
process.on("SIGTERM", function() {
  gracefulShutdown("Heroku app shutdown", function() {
    process.exit(0);
  });
});

// Require schemas and models
require("./user");
require("./experiment");
require("./dataset");
require("./product");
require("./keypair");
