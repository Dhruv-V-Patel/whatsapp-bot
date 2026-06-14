require("dotenv").config();

const express = require("express");
const path = require("path");

const webhookRoute = require("./routes/webhook");
const messagesRoute = require("./routes/messages");

const app = express();

app.use(express.static(path.join(__dirname, "../public")));
app.use(express.json());

app.use("/webhook/whatsapp", webhookRoute);
app.use("/api/messages", messagesRoute);

app.get("/:page", (req, res) => {
  res.sendFile(
    path.join(__dirname, "../public", `${req.params.page}.html`),
  );
});


// app.listen(process.env.PORT,() => {
// console.log(`server is running ${process.env.PORT}`);
// });


module.exports = app;
