const express = require("express");
const path = require("path");
const cors = require("cors");

let app = express();

const port = process.env.PORT || 5000;
app.set("port", port);

app.use(cors());
app.use("/sorfml2", express.static(path.join(__dirname, "dist/sorfml")));
app.use("*", express.static(path.join(__dirname, "dist/sorfml")));
app.listen(port);
console.log("Server started on port " + port);
