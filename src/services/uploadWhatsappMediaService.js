require("dotenv").config();
const pool = require("../db/postgres");
const FormData = require("form-data");
const fs = require("fs");
const path = require("path");
const mime = require("mime-types");
const axios = require("axios");

const uploadWhatsappMedia = async (file) => {
let config = {};

try {
  const { rows } = await pool.query(`
    SELECT phone_number_id, whatsapp_access_token
    FROM whatsapp_configs
    WHERE id = 1
  `);

  config = rows[0] || {};
} catch (err) {
  console.warn("Failed to load WhatsApp config from database. Falling back to .env.", err);
}

  let contentType = file.mimetype;

  // console.log("content type:", contentType);
  const ext =
    path.extname(file.originalname || "").toLowerCase() ||
    `.${mime.extension(file.mimetype || "")}` ||
    "";

  // Meta expects MP3/MPEG as audio/mpeg
  if (
    contentType === "video/mpeg" &&
    [".mp3", ".mpeg"].includes(ext)
  ) {
    contentType = "audio/mpeg";
  }

  const form = new FormData();

  form.append(
    "messaging_product",
    "whatsapp"
  );

  form.append(
    "file",
    fs.createReadStream(file.path),
    {
      filename: file.originalname,
      contentType,
    }
  );

  const { data } = await axios.post(
    `https://graph.facebook.com/v25.0/${config.phone_number_id || process.env.PHONE_NUMBER_ID}/media`,
    form,
    {
      headers: {
        Authorization: `Bearer ${config.whatsapp_access_token || process.env.WHATSAPP_ACCESS_TOKEN}`,
        ...form.getHeaders(),
      },
      maxBodyLength: Infinity,
    }
  );

  return {
    mediaId: data.id,
    mimeType: contentType || file.mimetype,
    ext: ext,
    phoneNumberId: config.phone_number_id,
    accessToken: config.whatsapp_access_token,
  };
};

module.exports = uploadWhatsappMedia;