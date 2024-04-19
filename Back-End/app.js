const createError = require("http-errors");
const express = require("express");
const path = require("path");
const logger = require("morgan");
const favicon = require("serve-favicon");
const cors = require("cors");

require("./models/db");
require("./config/passport");


const passport = require("passport");
const apiRouter = require("./routes/index");
const Sid_router = require("./routes/HyperledgerRouter");

const apiPredRouter = require("./controllers/APIrouter");
const { application } = require("express");

const corsOptions = {
  origin: "*",
  optionsSuccessStatus: 200
};

const app = express();

app.use(logger("dev"));
app.use(express.json({ limit: "1gb" }));
app.use(express.urlencoded({ extended: false }));
app.use(passport.initialize());
app.use(cors(corsOptions));
app.use("/sorfml2_api/api", apiRouter);
app.use("/sorfml2_api/api", Sid_router);
app.use("/sorfml2_api/api/Ml", apiPredRouter);

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  next();
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

// error handlers
// Catch unauthorised errors
app.use(function(err, req, res, next) {
  if (err.name === "UnauthorizedError") {
    res.status(401);
    res.json({ message: err.name + ": " + err.message });
  }
});

module.exports = app;
