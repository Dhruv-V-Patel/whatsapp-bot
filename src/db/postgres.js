const { Pool } = require("pg");
const { types } = require("pg");

types.setTypeParser(1114,(value) => value);
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
  // ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
});

async function initializeDatabase() {
  const client = await pool.connect();

  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS whatsapp_leads (
        id SERIAL PRIMARY KEY,
        phone VARCHAR(32) UNIQUE NOT NULL,
        name VARCHAR(255),
        first_message TEXT,
        status VARCHAR(50),
        welcome_sent BOOLEAN DEFAULT FALSE,
        brochure_sent BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        unread_count INTEGER DEFAULT 0,
        last_message_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await client.query(`
     CREATE TABLE IF NOT EXISTS whatsapp_messages (
        id SERIAL PRIMARY KEY,
        phone VARCHAR(32) NOT NULL,
        name VARCHAR(255),
        message TEXT,
        direction VARCHAR(16) DEFAULT 'incoming',
        message_type VARCHAR(50),
        media_id TEXT,
        media_url TEXT,
        file_name TEXT,
        mime_type TEXT,
        payload JSONB,
        is_first_message BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_phone_created_at
      ON whatsapp_messages (phone, created_at DESC)
    `);

    await client.query(`
    CREATE TABLE IF NOT EXISTS whatsapp_configs (
    id SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),

    phone_number VARCHAR(20) NOT NULL,
    phone_number_id VARCHAR(100) NOT NULL,
    wa_verify_token TEXT NOT NULL,
    whatsapp_access_token TEXT NOT NULL,

    welcome_message_gu TEXT,
    welcome_message_hi TEXT,
    location_message TEXT,

    brochure_media_id VARCHAR(100),
    brochure_file_name TEXT,
    brochure_file_url TEXT,
    brochure_uploaded_at TIMESTAMP,

    custom_message TEXT,

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
      `);

      await client.query(`
INSERT INTO whatsapp_configs (
    id,
    phone_number,
    phone_number_id,
    wa_verify_token,
    whatsapp_access_token,
    welcome_message_gu,
    welcome_message_hi,
    brochure_media_id,
    brochure_file_name,
    brochure_file_url,
    brochure_uploaded_at,
    custom_message
)
SELECT
    1,
    '919876543210',
    '123456789012345',
    'someshwar_ai_verify_token',
    'EAAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    'નમસ્તે! સોમેશ્વર AI સોલ્યુશનમાં આપનું સ્વાગત છે. કૃપા કરીને જણાવો કે અમે તમારી કેવી રીતે મદદ કરી શકીએ.',
    'नमस्ते! सोमेश्वर AI सॉल्यूशन में आपका स्वागत है। कृपया बताइए कि हम आपकी किस प्रकार सहायता कर सकते हैं।',
    NULL,
    NULL,
    NULL,
    NULL,
    'Thank you for contacting Someshwar AI Solution. Our team will get back to you shortly.'
WHERE NOT EXISTS (
    SELECT 1 FROM whatsapp_configs
)
ON CONFLICT (id) DO NOTHING;
        `);


    console.log("PostgreSQL connected and tables ready");
  } finally {
    client.release();
  }
}

initializeDatabase().catch((err) => {
  console.error("PostgreSQL connection error:", err);
});

module.exports = pool;
