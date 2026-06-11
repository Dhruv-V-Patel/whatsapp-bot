require("dotenv").config();

const express = require("express");
const path = require("path");

const webhookRoute =
  require("./routes/webhook");

const app = express();
app.use(express.static(path.join(__dirname, "../public")));

app.use(express.json());

app.use("/webhook", webhookRoute);


module.exports=app;
