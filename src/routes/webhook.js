const express = require("express");
const router = express.Router();

const {
  handleMessage
} = require("../controllers/webhookController");

router.post("/", handleMessage);

router.get("/", (req, res) => {
  const mode =
    req.query["hub.mode"];

  const token =
    req.query["hub.verify_token"];

  const challenge =
    req.query["hub.challenge"];
  if (
    mode === "subscribe" &&
    token ===
      process.env.WA_VERIFY_TOKEN
  ) {
	console.log("[OK] WEBHOOK VERIFIED");
    return res.status(200).send(challenge);
  }
  return res.sendStatus(403);
});

module.exports = router;
