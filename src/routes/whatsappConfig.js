const express = require("express");
const router = express.Router();
const upload = require("../middleware/upload");
const pool = require("../db/postgres");
const path = require("path");
const uploadWhatsappMedia = require("../services/uploadWhatsappMediaService")

router.get("/whatsapp-config", async (req, res) => {
    try {
        const { rows } = await pool.query(`
            SELECT *
            FROM whatsapp_configs
            WHERE id = 1
            LIMIT 1
        `);

        if (!rows.length) {
            return res.status(404).json({
                error: "WhatsApp configuration not found."
            });
        }

        res.json(rows[0]);

    } catch (err) {
        console.error(err);

        res.status(500).json({
            error: "Failed to load configuration."
        });
    }
});

router.put("/whatsapp-config", async (req, res) => {
    try {
        const {
            phone_number_id,
            wa_verify_token,
            whatsapp_access_token,
            welcome_message_gu,
            welcome_message_hi,
            location_message,
            custom_message
        } = req.body;

        await pool.query(
            `
            UPDATE whatsapp_configs
            SET
                phone_number_id = $1,
                wa_verify_token = $2,
                whatsapp_access_token = $3,
                welcome_message_gu = $4,
                welcome_message_hi = $5,
                custom_message = $6,
                location_message= $7,
                updated_at = NOW()
            WHERE id = 1
            `,
            [
                phone_number_id,
                wa_verify_token,
                whatsapp_access_token,
                welcome_message_gu,
                welcome_message_hi,
                custom_message,
                location_message
            ]
        );

        const io = req.app.get("io");

        if (io) {
            io.emit("config-updated");
        }

        res.json({
            success: true,
            message: "Configuration saved successfully."
        });

    } catch (err) {
        console.error(err);

        res.status(500).json({
            error: "Failed to save configuration."
        });
    }
});

router.post(
    "/whatsapp-config/brochure",
    upload.single("brochure"),
    async (req, res) => {
        try {

            if (!req.file) {
                return res.status(400).json({
                    error: "Please upload a PDF brochure."
                });
            }

            const { mediaId }  = await uploadWhatsappMedia(req.file);
            const brochureUrl = `/uploads/whatsapp/brochure/${req.file.filename}`;

            //console.log(brochureUrl)

            await pool.query(
                `
                UPDATE whatsapp_configs
                SET
                    brochure_file_name = $1,
                    brochure_file_url = $2,
                    brochure_media_id = $3,
                    brochure_uploaded_at = NOW(),
                    updated_at = NOW()
                WHERE id = 1
                `,
                [
                    req.file.originalname,
                    // req.file.path,
                    brochureUrl,
                    mediaId
                ]
            );

            // Notify all connected clients
            const io = req.app.get("io");

            if (io) {
                io.emit("config-updated");
            }

            res.json({
                success: true,
                brochure_file_name: req.file.originalname,
                brochure_media_id: mediaId
            });

        } catch (err) {
            console.error(err);

            res.status(500).json({
                error: "Failed to upload brochure."
            });
        }
    }
);

module.exports = router;