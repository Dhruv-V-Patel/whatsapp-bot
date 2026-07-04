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

    const lead = await whatsappService.findLead(phone);
    const isFirstMessage = !lead;

    const messageType = message.type;

    let text = "";
    let mediaId = null;
    let fileName = null;
    let mimeType = null;

    switch (messageType) {
      case "text":
        text = message.text?.body || "";
        break;

      case "image":
        mediaId = message.image?.id;
        text = message.image?.caption || "";
        mimeType = message.image?.mime_type;
        break;

      case "document":
        mediaId = message.document?.id;
        fileName = message.document?.filename;
        mimeType = message.document?.mime_type;
        break;

      case "video":
        mediaId = message.video?.id;
        text = message.video?.caption || "";
        mimeType = message.video?.mime_type;
        break;

      case "audio":
        mediaId = message.audio?.id;
        mimeType = message.audio?.mime_type;
        break;

      case "sticker":
        mediaId = message.sticker?.id;
        break;

      case "location":
        text = JSON.stringify(message.location);
        break;

      case "contacts":
        text = JSON.stringify(message.contacts);
        break;

      case "button":
        text = message.button?.text;
        break;

      case "interactive":
        text = JSON.stringify(message.interactive);
        break;

      default:
        text = JSON.stringify(message);
    }

    const result = await pool.query(
      `
  INSERT INTO whatsapp_messages
  (
      phone,
      name,
      message_type,
      message,
      media_id,
      file_name,
      mime_type,
      payload,
      direction,
    is_first_message
  )
  VALUES
  (
      $1,$2,$3,$4,$5,$6,$7,$8,'incoming', $9
  ) 
      RETURNING *
  `,
      [
        phone,
        name,
        messageType,
        text,
        mediaId,
        fileName,
        mimeType,
        JSON.stringify(message),
        isFirstMessage,
      ],
    );

    const savedMessage = result.rows[0];

    const io = req.app.get("io");

    if (io) {
      io.emit("new-message", savedMessage);
    }

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
      console.log(`[${phone}] ✓ Welcome message sent`);

      await delay(1000);

      await whatsappService.sendBrochure(phone);
      console.log(`[${phone}] ✓ Brochure sent`);

      await delay(2000);

      await whatsappService.sendCustomeMessage(phone);
      console.log(`[${phone}] ✓ Custom message sent`);

      await pool.query(
        `
        UPDATE whatsapp_leads
        SET
          welcome_sent = true,
          brochure_sent = true,
          status = 'New Lead',
          updated_at = NOW(),
          unread_count = COALESCE(unread_count, 0) + 1,
          last_message_at = NOW()
        WHERE phone = $1
        `,
        [phone],
      );
    } else {
      console.log(
        `[${phone}] Lead already exists. Welcome message already sent.`,
      );
      await pool.query(
        `
        UPDATE whatsapp_leads
        SET
          status= 'Repeated',
          last_message_at = NOW(),
          unread_count = COALESCE(unread_count, 0) + 1,
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
