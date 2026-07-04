require("dotenv").config();
const axios = require("axios");
const pool = require("../db/postgres");
const fs = require("fs");
const FormData = require("form-data");
class WhatsAppService {
  async findLead(phone) {
    const result = await pool.query(
      "SELECT * FROM whatsapp_leads WHERE phone=$1",
      [phone],
    );

    return result.rows[0];
  }

  async saveLead(phone, name, firstMessage) {
    await pool.query(
      `
      INSERT INTO whatsapp_leads
      (phone,name,first_message)
      VALUES($1,$2,$3)
      ON CONFLICT(phone)
      DO NOTHING
      `,
      [phone, name, firstMessage],
    );
  }

  async sendWelcome(phone) {
    // Gujarati
    await axios.post(
      `https://graph.facebook.com/v25.0/${process.env.PHONE_NUMBER_ID}/messages`,
      {
        messaging_product: "whatsapp",
        to: phone,
        type: "text",
        text: {
          body: `🏡 સોમેશ્વર ગાર્ડન સિટી, મહેસાણા માં આપનું હાર્દિક સ્વાગત છે!

30+ વર્ષના વિશ્વાસ અને ગુણવત્તાની પરંપરા ધરાવતા Someshwar Group દ્વારા પ્રસ્તુત પ્રીમિયમ રહેણાંક પ્રોજેક્ટ.

✨ 2 BHK Proud Living Apartments માત્ર ₹17.81 લાખથી શરૂ

🏢 G+7 આધુનિક ટાવર્સ
🏘️ 18 રેસિડેન્શિયલ વિંગ્સ
🌳 લાઇફસ્ટાઇલ ગાર્ડન
🏡 ક્લબ હાઉસ અને જીમ
🛡️ 24×7 સુરક્ષા
🛍️ સોમેશ્વર આર્કેડ કોમર્શિયલ સ્પેસ
🚗 વિશાળ પાર્કિંગ વ્યવસ્થા

📍 ધારા વિદ્યાલય સામે, ટી.બી. રોડ, મહેસાણા
visit site: https://maps.app.goo.gl/k3ujcVXA3LUzFAWt6

📞 +91 98257 14677
📞 +91 98250 15196

🌐 https://sgardencity.in/

📜 RERA: PR/GJ/MEHSANA/MAHESANA/Others/MAA08916/180821

✨ આપના સપનાનું ઘર હવે મહેસાણામાં. આજે જ મુલાકાત લો!`,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
        },
      },
    );

    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Hindi
    await axios.post(
      `https://graph.facebook.com/v25.0/${process.env.PHONE_NUMBER_ID}/messages`,
      {
        messaging_product: "whatsapp",
        to: phone,
        type: "text",
        text: {
          body: `सोमेश्वर गार्डन सिटी, मेहसाणा में आपका हार्दिक स्वागत है! 🙏

30+ वर्षों के विश्वास और गुणवत्ता के साथ Someshwar Group प्रस्तुत करता है —

✨ प्रीमियम 2 BHK अपार्टमेंट्स मात्र ₹17.81 लाख से शुरू

🏢 G+7 प्रीमियम टावर्स
🏘️ 18 विंग्स टाउनशिप
🌳 लाइफस्टाइल गार्डन
🏋️ क्लब हाउस एवं जिम
🛡️ 24×7 सुरक्षा
🛍️ सोमेश्वर आर्केड कमर्शियल स्पेस
🚗 विशाल पार्किंग सुविधा

📍 धारा विद्यालय के सामने, टी. बी. रोड, मेहसाणा
visit site: https://maps.app.goo.gl/k3ujcVXA3LUzFAWt6

📞 +91 98257 14677
📞 +91 98250 15196

🌐 https://sgardencity.in/

📜 RERA: PR/GJ/MEHSANA/MAHESANA/Others/MAA08916/180821

✨ अपने सपनों का घर आज ही बुक करें।`,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
        },
      },
    );
  }

  async sendBrochure(phone) {
    return axios.post(
      `https://graph.facebook.com/v25.0/${process.env.PHONE_NUMBER_ID}/messages`,
      {
        messaging_product: "whatsapp",
        to: phone,
        type: "document",
        document: {
          link:`https://someshwarai.in/someshwar.pdf`,
          // id: process.env.BROCHURE_MEDIA_ID,
          filename: "Brochure.pdf",
        },
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
        },
      },
    );
  }

  async sendCustomeMessage(phone) {
    return await axios.post(
      `https://graph.facebook.com/v25.0/${process.env.PHONE_NUMBER_ID}/messages`,
      {
        messaging_product: "whatsapp",
        to: phone,
        type: "text",
        text: {
          body: "આ AI જનરેટેડ મેસેજ છે, વધુ માહિતી માટે +91 98250 15196 પર સંપર્ક કરો.",
        },
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
        },
      },
    );
  }
  // async sendTextMessage(phone, message) {
  //   const response = await axios.post(
  //     `https://graph.facebook.com/v25.0/${process.env.PHONE_NUMBER_ID}/messages`,
  //     {
  //       messaging_product: "whatsapp",
  //       recipient_type: "individual",
  //       to: phone,
  //       type: "text",
  //       text: {
  //         preview_url: true,
  //         body: message,
  //       },
  //     },
  //     {
  //       headers: {
  //         Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
  //         "Content-Type": "application/json",
  //       },
  //     },
  //   );

  //    // Save only if Meta accepted the message
  // if (
  //   response.status === 200 &&
  //   response.data?.messages?.length > 0 &&
  //   response.data.messages[0].id
  // ) {
  //   const result = await pool.query(
  //     `
  //   INSERT INTO whatsapp_messages
  //   (
  //     phone,
  //     name,
  //     message_type,
  //     message,
  //     direction,
  //     payload
  //   )
  //   VALUES
  //   (
  //     $1,
  //     '',
  //     'text',
  //     $2,
  //     'outgoing',
  //     $3
  //   )
  //   RETURNING *
  //   `,
  //     [phone, message, JSON.stringify(response.data)],
  //   );

  //   return result.rows[0];
  //   }

  // throw new Error("WhatsApp message was not accepted by Meta.");
  // }
  async sendTextMessage(phone, message) {
  try {
    const response = await axios.post(
      `https://graph.facebook.com/v25.0/${process.env.PHONE_NUMBER_ID}/messages`,
      {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: phone,
        type: "text",
        text: {
          preview_url: true,
          body: message,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
      },
    );

    if (!response.data?.messages?.[0]?.id) {
      throw new Error("Message was not accepted by WhatsApp.");
    }

    const { rows } = await pool.query(
      `
      INSERT INTO whatsapp_messages
      (
        phone,
        message_type,
        message,
        direction,
        payload
      )
      VALUES
      (
        $1,
        'text',
        $2,
        'outgoing',
        $3
      )
      RETURNING *
      `,
      [
        phone,
        message,
        JSON.stringify(response.data)
      ],
    );

    return rows[0];
  } catch (error) {
    console.error(
      "Failed to send WhatsApp message:",
      error.response?.data || error.message,
    );
    throw error;
  }
}

async sendFileMessage(phone, file, caption = "") {
  // Upload file to WhatsApp
  const form = new FormData();

  form.append("messaging_product", "whatsapp");

  form.append(
    "file",
    fs.createReadStream(file.path),
    {
      filename: file.originalname,
      contentType: file.mimetype,
    }
  );

  const uploadResponse = await axios.post(
    `https://graph.facebook.com/v25.0/${process.env.PHONE_NUMBER_ID}/media`,
    form,
    {
      headers: {
        Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
        ...form.getHeaders(),
      },
    }
  );

  const mediaId = uploadResponse.data.id;

  // Detect WhatsApp media type
  let type = "document";

  if (file.mimetype.startsWith("image/")) {
    type = "image";
  } else if (file.mimetype.startsWith("video/")) {
    type = "video";
  } else if (file.mimetype.startsWith("audio/")) {
    type = "audio";
  }

  // Build message payload
  const payload = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: phone,
    type,
    [type]: {
      id: mediaId,
    },
  };

  // Images, videos and documents support captions
  if (
    caption &&
    (type === "image" ||
      type === "video" ||
      type === "document")
  ) {
    payload[type].caption = caption;
  }

  if (type === "document") {
    payload.document.filename = file.originalname;
  }

  // Send media message
  const sendResponse = await axios.post(
    `https://graph.facebook.com/v25.0/${process.env.PHONE_NUMBER_ID}/messages`,
    payload,
    {
      headers: {
        Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
    }
  );

  // Only save if WhatsApp accepted the message
  if (
    sendResponse.status !== 200 ||
    !sendResponse.data?.messages?.length ||
    !sendResponse.data.messages[0].id
  ) {
    throw new Error("WhatsApp did not accept the media message.");
  }

  // Local file URL
  const folder =
    type === "document"
      ? "document"
      : type;

  const mediaUrl =
    `/uploads/whatsapp/${folder}/${file.filename}`;

  // Save message
  const result = await pool.query(
    `
    INSERT INTO whatsapp_messages
    (
      phone,
      message_type,
      message,
      media_id,
      media_url,
      file_name,
      mime_type,
      payload,
      direction,
      created_at
    )
    VALUES
    (
      $1,
      $2,
      $3,
      $4,
      $5,
      $6,
      $7,
      $8,
      'outgoing',
      NOW()
    )
    RETURNING *
    `,
    [
      phone,
      type,
      caption,
      mediaId,
      mediaUrl,
      file.originalname,
      file.mimetype,
      JSON.stringify(sendResponse.data),
    ]
  );

  return result.rows[0];
}

}

module.exports = new WhatsAppService();
