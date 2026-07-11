const express = require("express");
const pool = require("../db/postgres");
const whatsappService = require("../services/whatsappService");
const router = express.Router();
const upload = require("../middleware/upload");

router.get("/", async (req, res) => {
  try {
    const result = await pool.query(`
      WITH message_rows AS (
    SELECT
        m.id,
        m.phone,
        COALESCE(m.name, l.name, 'Customer') AS name,
        m.message,
        m.mime_type,
        m.media_id,
        m.file_name,
        m.media_url,
        COALESCE(l.unread_count, 0) AS unread_count,
        COALESCE(m.direction, 'incoming') AS direction,
        m.created_at,
        FALSE AS is_placeholder

    FROM whatsapp_messages m
    LEFT JOIN whatsapp_leads l
        ON l.phone = m.phone
),

lead_rows AS (
    SELECT
        l.id,
        l.phone,
        COALESCE(l.name, 'Customer') AS name,

        '' AS message,

        NULL::text AS mime_type,
        NULL::text AS media_id,
        NULL::text AS file_name,
        NULL::text AS media_url,

        COALESCE(l.unread_count, 0) AS unread_count,

        'incoming' AS direction,

        COALESCE(l.last_message_at, l.created_at, NOW()) AS created_at,

        TRUE AS is_placeholder

    FROM whatsapp_leads l

    WHERE NOT EXISTS (
        SELECT 1
        FROM whatsapp_messages m
        WHERE m.phone = l.phone
    )
)

SELECT *
FROM message_rows

UNION ALL

SELECT *
FROM lead_rows

ORDER BY created_at DESC

LIMIT 200;
    `);

    return res.json({
      messages: result.rows,
    });
  } catch (error) {
    console.error("Unable to load WhatsApp messages:", error);
    return res.status(500).json({
      error: "Unable to load messages",
    });
  }
});


router.get("/logs", async (req, res) => {
  try {

    //  CASE WHEN l.welcome_sent THEN 'Sent' ELSE 'Not Sent' END AS welcome_sent,
    // CASE WHEN l.brochure_sent THEN 'Sent' ELSE 'Not Sent' END AS brochure_sent,
    //COALESCE(l.status, 'New Lead') AS status
// SELECT
//     m.name,
//     m.phone,
//     m.message,
//     m.created_at,
//     l.created_at AS lead_created_at,

//    CASE
//     WHEN m.is_first_message THEN 'Sent'
//     ELSE 'Already Sent'
// END AS welcome_sent,

// CASE
//     WHEN m.is_first_message THEN 'Sent'
//     ELSE 'Already Sent'
// END AS brochure_sent,

// CASE
//     WHEN m.is_first_message THEN 'New Lead'
//     ELSE 'Repeated'
// END AS status

//   FROM whatsapp_messages m
//   LEFT JOIN whatsapp_leads l ON l.phone = m.phone
//   WHERE m.direction = 'incoming'
//   ORDER BY m.created_at DESC
    const result = await pool.query(`
  SELECT
    m.name,
    m.phone,
    m.message,
    m.message_type,
    m.file_name,
    m.mime_type,
    m.created_at,
    l.created_at AS lead_created_at,

    CASE
        WHEN m.is_first_message THEN 'Sent'
        ELSE 'Already Sent'
    END AS welcome_sent,

    CASE
        WHEN m.is_first_message THEN 'Sent'
        ELSE 'Already Sent'
    END AS brochure_sent,

    CASE
        WHEN m.is_first_message THEN 'New Lead'
        ELSE 'Repeated'
    END AS status

FROM whatsapp_messages m
LEFT JOIN whatsapp_leads l
    ON l.phone = m.phone

WHERE m.direction = 'incoming'

ORDER BY m.created_at DESC;
`);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: err.message,
    });
  }
});

router.post("/mark-read/:phone", async (req, res) => {
  try {
    await pool.query(
      `
      UPDATE whatsapp_leads
      SET unread_count = 0
      WHERE phone = $1
      `,
      [req.params.phone],
    );

    res.json({
      success: true,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: err.message,
    });
  }
});

router.delete("/clear/:phone", async (req, res) => {
  try {
    await pool.query(
      `
      DELETE FROM whatsapp_messages
      WHERE phone = $1
      `,
      [req.params.phone],
    );
    // await pool.query(
    //   `
    //   UPDATE whatsapp_leads
    //   SET
    //     first_message = NULL,
    //     unread_count = 0
    //   WHERE phone = $1
    //   `,
    //   [req.params.phone],
    // );
     await pool.query(
      `
      UPDATE whatsapp_leads
      SET
          unread_count = 0
      WHERE phone = $1;
      `,
      [req.params.phone],
    )

    res.json({
      success: true,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: err.message,
    });
  }
});

router.delete("/contact/:phone", async (req, res) => {
  try {
    await pool.query(
      `
      DELETE FROM whatsapp_messages
      WHERE phone = $1
      `,
      [req.params.phone],
    );

    await pool.query(
      `
      DELETE FROM whatsapp_leads
      WHERE phone = $1
      `,
      [req.params.phone],
    );

    res.json({
      success: true,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: err.message,
    });
  }
});

router.post("/send", async (req, res) => {
  try {
    const { phone, message } = req.body;

    if (!phone || !message?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Phone and message are required",
      });
    }

    // Send WhatsApp message and save it to DB
    const savedMessage = await whatsappService.sendTextMessage(
      phone,
      message.trim()
    );

    // Notify all connected clients
    const io = req.app.get("io");

    if (io) {
      io.emit("new-message", savedMessage);
    }

    res.json({
      success: true,
      message: savedMessage,
    });

  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

router.post(
  "/send-file",
  upload.array("files", 30),
  async (req, res) => {
    try {
      const { phone, caption = "" } = req.body;
      const files = req.files || [];
      
      files.forEach(file => {
        file.originalname = Buffer.from(
          file.originalname,
          "latin1"
        ).toString("utf8");
      });
      
      if (!phone) {
        return res.status(400).json({
          success: false,
          message: "Phone is required",
        });
      }

      if (files.length === 0) {
        return res.status(400).json({
          success: false,
          message: "No files uploaded",
        });
      }

      const io = req.app.get("io");

      const results = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        try {
          const savedMessage =
            await whatsappService.sendFileMessage(
              phone,
              file,
              i === 0 ? caption : ""
            );

          results.push({
            file: file.originalname,
            success: true,
            message: savedMessage,
          });

          io?.emit("new-message", savedMessage);

        } catch (err) {

          console.error(
            `Failed to send ${file.originalname}`,
            err.response?.data || err.message
          );

          results.push({
            file: file.originalname,
            success: false,
            error: err.response?.data || err.message,
          });
        }
      }

      const successCount = results.filter(r => r.success).length;
      const failedCount = results.length - successCount;

      return res.status(successCount > 0 ? 200 : 500).json({
        success: failedCount === 0,
        total: results.length,
        sent: successCount,
        failed: failedCount,
        results,
      });

    } catch (err) {

      console.error(err);

      return res.status(500).json({
        success: false,
        message: "Failed to process uploaded files",
        error: err.message,
      });
    }
  }
);

module.exports = router;
