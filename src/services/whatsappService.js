require("dotenv").config();
const axios = require("axios");
const pool = require("../db/postgres");
const fs = require("fs");
const path = require("path");
const FormData = require("form-data");
const mime = require("mime-types");
const uploadWhatsappMedia = require("./uploadWhatsappMediaService");

class WhatsAppService {

  async saveOutgoingMessage({
    phone,
    messageType,
    message = "",
    mediaId = null,
    mediaUrl = null,
    fileName = null,
    mimeType = null,
    payload,
  }) {
    const { rows } = await pool.query(
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
        messageType,
        message,
        mediaId,
        mediaUrl,
        fileName,
        mimeType,
        JSON.stringify(payload),
      ],
    );

    return rows[0];
  }
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
    const response = await axios.post(
      `https://graph.facebook.com/v25.0/${process.env.PHONE_NUMBER_ID}/messages`,
      {
        messaging_product: "whatsapp",
        to: phone,
        type: "text",
        text: {
          preview_url: true,
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
    if (response.status === 200 && response.data?.messages?.length) {
      await this.saveOutgoingMessage({
        phone,
        messageType: "text",
        message: `🏡 સોમેશ્વર ગાર્ડન સિટી, મહેસાણા માં આપનું હાર્દિક સ્વાગત છે!

30+ વર્ષના વિશ્વાસ અને ગુણવત્તાની પરંપરા ધરાવતા Someshwar Group દ્વારા પ્રસ્તુત પ્રીમિયમ રહેણાંક પ્રોજેક્ટ.

✨ 2 BHK Proud Living Apartments માત્ર ₹17.81 લાખથી શરૂ

🏢 G+7 આધુનિક ટાવર્સ
🏘️ 18 રેસિડેન્શિયલ વિંગ્સ
🌳 લાઇફસ્ટાઇલ ગાર્ડન
🏡 ક્લબ હાઉસ અને જીમ
🛡️ 24×7 સુરક્ષા
🛍️ સોમેશ્વર આર્કેડ કોમર્શિયલ સ્પેસ
🚗 વિશાળ પાર્કિંગ વ્યવસ્થા

📞 +91 98257 14677
📞 +91 98250 15196

🌐 https://sgardencity.in/

📜 RERA: PR/GJ/MEHSANA/MAHESANA/Others/MAA08916/180821

✨ આપના સપનાનું ઘર હવે મહેસાણામાં. આજે જ મુલાકાત લો!`,
        payload: response.data,
      });
    }

    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Hindi
    const responseHi = await axios.post(
      `https://graph.facebook.com/v25.0/${process.env.PHONE_NUMBER_ID}/messages`,
      {
        messaging_product: "whatsapp",
        to: phone,
        type: "text",
        text: {
          preview_url: true,
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

    if (responseHi.status === 200 && responseHi.data?.messages?.[0]?.id) {
      await this.saveOutgoingMessage({
        phone,
        messageType: "text",
        message: `सोमेश्वर गार्डन सिटी, मेहसाणा में आपका हार्दिक स्वागत है! 🙏

30+ वर्षों के विश्वास और गुणवत्ता के साथ Someshwar Group प्रस्तुत करता है —

✨ प्रीमियम 2 BHK अपार्टमेंट्स मात्र ₹17.81 लाख से शुरू

🏢 G+7 प्रीमियम टावर्स
🏘️ 18 विंग्स टाउनशिप
🌳 लाइफस्टाइल गार्डन
🏋️ क्लब हाउस एवं जिम
🛡️ 24×7 सुरक्षा
🛍️ सोमेश्वर आर्केड कमर्शियल स्पेस
🚗 विशाल पार्किंग सुविधा

📞 +91 98257 14677
📞 +91 98250 15196

🌐 https://sgardencity.in/

📜 RERA: PR/GJ/MEHSANA/MAHESANA/Others/MAA08916/180821

✨ अपने सपनों का घर आज ही बुक करें।`,
        payload: responseHi.data,
      });
    }

    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Location
    const responseLocation = await axios.post(
      `https://graph.facebook.com/v25.0/${process.env.PHONE_NUMBER_ID}/messages`,
      {
        messaging_product: "whatsapp",
        to: phone,
        type: "text",
        text: {
          preview_url: true,
          body: `📍 Prime Location – Someshwar Garden City

અમારો પ્રોજેક્ટ ધારા વિદ્યાલય સામે, T.B. રોડ, મહેસાણા ખાતે પ્રાઇમ લોકેશન પર આવેલો છે, જ્યાંથી શહેરની તમામ જરૂરી સુવિધાઓ સરળતાથી ઉપલબ્ધ છે.

हमारा प्रोजेक्ट मेहसाणा में T.B. रोड पर धारा विद्यालय के ठीक सामने एक बेहतरीन लोकेशन पर स्थित है, जहाँ से शहर की सभी ज़रूरी सुविधाओं तक आसानी से पहुँचा जा सकता है।

🗺️ Click here to view the location on Google Maps:
https://maps.app.goo.gl/k3ujcVXA3LUzFAWt6`,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
        },
      },
    );

    if (
      responseLocation.status === 200 &&
      responseLocation.data?.messages?.[0]?.id
    ) {
      await this.saveOutgoingMessage({
        phone,
        messageType: "text",
        message: `📍 Prime Location – Someshwar Garden City

અમારો પ્રોજેક્ટ ધારા વિદ્યાલય સામે, T.B. રોડ, મહેસાણા ખાતે પ્રાઇમ લોકેશન પર આવેલો છે, જ્યાંથી શહેરની તમામ જરૂરી સુવિધાઓ સરળતાથી ઉપલબ્ધ છે.

हमारा प्रोजेक्ट मेहसाणा में T.B. रोड पर धारा विद्यालय के ठीक सामने एक बेहतरीन लोकेशन पर स्थित है, जहाँ से शहर की सभी ज़रूरी सुविधाओं तक आसानी से पहुँचा जा सकता है।

🗺️ Click here to view the location on Google Maps:
https://maps.app.goo.gl/k3ujcVXA3LUzFAWt6`,
        payload: responseLocation.data,
      });
    }
  }

  async sendBrochure(phone) {
    const response = await axios.post(
      `https://graph.facebook.com/v25.0/${process.env.PHONE_NUMBER_ID}/messages`,
      {
        messaging_product: "whatsapp",
        to: phone,
        type: "document",
        document: {
          link:`https://someshwarai.in/someshwar.pdf`,
          //id: process.env.BROCHURE_MEDIA_ID,
          filename: "Brochure.pdf",
        },
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
        },
      },
    );
    console.log("Send Brochure Response:",response.data);
    if (response.status === 200 && response.data?.messages?.[0]?.id) {
      await this.saveOutgoingMessage({
        phone,
        messageType: "document",
        // mediaId: process.env.BROCHURE_MEDIA_ID,
        fileName: "Brochure.pdf",
        mediaUrl: "/someshwar.pdf",
        mimeType: "application/pdf",
        payload: response.data,
      });
    }

    return response;
  }

  async sendCustomeMessage(phone) {
    const response = await axios.post(
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
    if (response.status === 200 && response.data?.messages?.[0]?.id) {
      await this.saveOutgoingMessage({
        phone,
        messageType: "text",
        message:
          "આ AI જનરેટેડ મેસેજ છે, વધુ માહિતી માટે +91 98250 15196 પર સંપર્ક કરો.",
        payload: response.data,
      });
    }

    return response;
  }

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

      if (
        response.status === 200 &&
        response.data?.messages?.length > 0 &&
        response.data.messages[0].id
      ) {
        return await this.saveOutgoingMessage({
          phone,
          messageType: "text",
          message,
          payload: response.data,
        });
      }
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
const {
  mediaId,
  mimeType,
  ext,
} = await uploadWhatsappMedia(file);
    
// const form = new FormData();

    // form.append("messaging_product", "whatsapp");

    // let contentType = file.mimetype;

    // const ext = path.extname(file.originalname || "").toLowerCase() || `.${mime.extension(file.mimetype || "")}` || "";

    // if (
    //   contentType === "video/mpeg" &&
    //   [".mp3", ".mpeg"].includes(ext)
    // ) {
    //   contentType = "audio/mpeg";
    // }
    // form.append("file", fs.createReadStream(file.path), {
    //   filename: file.originalname,
    //   contentType,
    // });

    // const uploadResponse = await axios.post(
    //   `https://graph.facebook.com/v25.0/${process.env.PHONE_NUMBER_ID}/media`,
    //   form,
    //   {
    //     headers: {
    //       Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
    //       ...form.getHeaders(),
    //     },
    //   },
    // );
    //
    // const mediaId = uploadResponse.data.id;

    // Detect WhatsApp media type
    //let type = "document";

    // if (file.mimetype.startsWith("image/")) {
    //   type = "image";
    // } else if ( file.mimetype.startsWith("audio/") || (file.mimetype === "video/mpeg" && file.originalname.toLowerCase().endsWith(".mpeg"))) {
    //   type = "audio";
    // } else if (file.mimetype.startsWith("video/")) {
    //   type = "video";
    // }

const IMAGE_EXTENSIONS = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
]);

const VIDEO_EXTENSIONS = new Set([
  ".mp4",
  ".3gp",
]);

const AUDIO_EXTENSIONS = new Set([
  ".mp3",
  ".mpeg",
  ".m4a",
  ".aac",
  ".amr",
  ".ogg",
  ".opus",
]);

let type = "document";

if (IMAGE_EXTENSIONS.has(ext)) {
  type = "image";
} else if (VIDEO_EXTENSIONS.has(ext)) {
  type = "video";
} else if (AUDIO_EXTENSIONS.has(ext)) {
  type = "audio";
} else {
  if (
    file.mimetype.startsWith("image/") &&
    file.mimetype !== "image/svg+xml"
  ) {
    type = "image";
  } else if (file.mimetype.startsWith("video/")) {
    type = "video";
  } else if (file.mimetype.startsWith("audio/")) {
    type = "audio";
  }
}

    const payload = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: phone,
      type,
      [type]: {
        id: mediaId,
        ...(type === "document" ? { filename: file.originalname } : {}),
        ...(caption && ["image", "video", "document"].includes(type)
          ? { caption }
          : {}),
      },
    };

    // Images, videos and documents support captions
    if (
      caption &&
      (type === "image" || type === "video" || type === "document")
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
      },
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
    const folder = type === "document" ? "document" : type;

    const mediaUrl = `/uploads/whatsapp/${folder}/${file.filename}`;

    // Save message
    return await this.saveOutgoingMessage({
      phone,
      messageType: type,
      message: caption,
      mediaId,
      mediaUrl,
      fileName: file.originalname,
      mimeType: mimeType || contentType || file.mimetype,
      payload: sendResponse.data,
    });
  }

  async downloadIncomingMedia(mediaId, mimeType, fileName = "") {
    try {
      // Get WhatsApp download URL
      const { data } = await axios.get(
        `https://graph.facebook.com/v25.0/${mediaId}`,
        {
          headers: {
            Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
          },
        },
      );

      // Download media
      const response = await axios.get(data.url, {
        responseType: "stream",
        headers: {
          Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
        },
      });
      // Safe filename
      const actualMimeType = data.mime_type || mimeType;

      const ext = path.extname(fileName || "") || mime.extension(actualMimeType || "") || "";

      // Select folder
      // let folder = "document";

      // if (mimeType?.startsWith("image/")) {
      //   folder = "image";
      // } else if (mimeType?.startsWith("video/")) {
      //   folder = "video";
      // } else if (mimeType?.startsWith("audio/")) {
      //   folder = "audio";
      // }

      const IMAGE_EXTENSIONS = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
]);

const VIDEO_EXTENSIONS = new Set([
  ".mp4",
  ".3gp",
]);

const AUDIO_EXTENSIONS = new Set([
  ".mp3",
  ".mpeg",
  ".m4a",
  ".aac",
  ".amr",
  ".ogg",
  ".opus",
]);

let folder = "document";

if (IMAGE_EXTENSIONS.has(ext)) {
  folder = "image";
} else if (VIDEO_EXTENSIONS.has(ext)) {
  folder = "video";
} else if (AUDIO_EXTENSIONS.has(ext)) {
  folder = "audio";
} else {
  if (
    mimeType?.startsWith("image/") //&& file.mimetype !== "image/svg+xml"
  ) {
    folder = "image";
  } else if (mimeType?.startsWith("video/")) {
    folder = "video";
  } else if (mimeType?.startsWith("audio/")) {
    folder = "audio";
  }
}
      const uploadDir = path.join(
        process.cwd(),
        "public",
        "uploads",
        "whatsapp",
        folder,
      );

      fs.mkdirSync(uploadDir, { recursive: true });

      
      const extension = ext ? `.${ext.replace(/^\./, "")}` : "";

      // const baseName = fileName
      //   ? path.basename(fileName, path.extname(fileName))
      //   : `${folder}-${mediaId}`;

      // const safeName =
      //   `${Date.now()}-${baseName.replace(/[<>:"/\\|?*\x00-\x1F]/g, "_")}${extension}`;

      const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");

      let prefix = "FILE";

      switch (folder) {
        case "image":
          prefix = "IMG";
          break;
        case "video":
          prefix = "VID";
          break;
        case "audio":
          prefix = "AUD";
          break;
        case "document":
          prefix = "DOC";
          break;
      }

      const baseName = fileName
        ? path.basename(fileName, path.extname(fileName))
        : mediaId;

      const safeName =
        folder === "document" && fileName
          ? `${prefix}-${today}-${baseName.replace(/[<>:"/\\|?*\x00-\x1F]/g, "_")}${extension}`
          : `${prefix}-${today}-${mediaId}${extension}`;

      const savePath = path.join(uploadDir, safeName);

      // Save file
      await new Promise((resolve, reject) => {
        const writer = fs.createWriteStream(savePath);

        response.data.pipe(writer);

        writer.on("finish", resolve);
        writer.on("error", reject);
      });

      //console.log("Downloaded:", savePath);

      // Return URL for frontend
      return `/uploads/whatsapp/${folder}/${safeName}`;
    } catch (err) {
      console.error(
        "downloadIncomingMedia:",
        err.response?.data || err.message,
      );

      return null;
    }
  }
}

module.exports = new WhatsAppService();
