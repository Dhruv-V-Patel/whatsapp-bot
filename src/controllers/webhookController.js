const whatsappService = require("../services/whatsappService");
const delay = require("../utils/delay");
const pool = require("../db/postgres");
exports.handleMessage = async (req, res) => {
  try {
    const message = req.body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];

    if (!message) {
      return res.sendStatus(200);
    }

    const phone = message.from;

    const name =
      req.body.entry?.[0]?.changes?.[0]?.value?.contacts?.[0]?.profile?.name ||
      "Customer";

    const text = message.text?.body || "";

    const lead = await whatsappService.findLead(phone);

    if (!lead) {
      await whatsappService.saveLead(phone, name, text);
    }

    const currentLead = await whatsappService.findLead(phone);
    
    console.log("====== Contact Details ==========");
    console.log(`    Name: ${name}`);
    console.log(`    Phone: ${phone}`);
    console.log(`    Message: ${text}`);

    if (currentLead && !currentLead.welcome_sent) {
      await whatsappService.sendWelcome(phone);
      console.log(`[${phone}] ✅ Welcome message sent`);

      await delay(1000);

      await whatsappService.sendBrochure(phone);
      console.log(`[${phone}] ✅ Brochure sent`);

      await delay(2000);

      await whatsappService.sendCustomeMessage(phone);
      console.log(`[${phone}] ✅ Custom message sent`);

      await pool.query(
        `
    UPDATE whatsapp_leads
    SET
      welcome_sent = true,
      brochure_sent = true,
      updated_at = NOW(),
      last_message_at = NOW()
    WHERE phone = $1
    `,
        [phone],
      );
    } else {
      console.log(
        `[${phone}] ⚠️ Lead already exists. Welcome message already sent.`,
      );
      await pool.query(
        `
    UPDATE whatsapp_leads
    SET
      last_message_at = NOW(),
      updated_at = NOW()
    WHERE phone = $1
    `,
        [phone],
      );
    }

    return res.sendStatus(200);
  } catch (error) {
    console.error(error);
    return res.sendStatus(500);
  }
};
