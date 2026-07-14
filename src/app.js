require("dotenv").config();

const express = require("express");
const path = require("path");
const fs = require("fs");
const webhookRoute = require("./routes/webhook");
const messagesRoute = require("./routes/messages");
const whatsappConfigRoute = require("./routes/whatsappConfig");

const app = express();
const startUploadCleanup = require("./utils/cleanupUploads");

startUploadCleanup();

app.use(express.static(path.join(__dirname, "../public")));
app.use(express.json());
app.use(
  "/uploads",
  express.static(path.join(process.cwd(), "public", "uploads"))
);
app.use("/webhook/whatsapp", webhookRoute);
app.use("/api/messages", messagesRoute);
app.use("/api",whatsappConfigRoute);

app.get("/:page", (req, res, next) => {
  const filePath = path.join(__dirname, "../public", `${req.params.page}.html`);

  if (!fs.existsSync(filePath)) {
    return next();
  }

  res.sendFile(filePath);
});


// app.listen(process.env.PORT,() => {
// console.log(`server is running ${process.env.PORT}`);
// });


module.exports = app;
