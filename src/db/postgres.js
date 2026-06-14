const { Pool } = require("pg");

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
        last_message_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS whatsapp_messages (
        id SERIAL PRIMARY KEY,
        phone VARCHAR(32) NOT NULL,
        name VARCHAR(255),
        message TEXT,
        direction VARCHAR(16) DEFAULT 'incoming',
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_phone_created_at
      ON whatsapp_messages (phone, created_at DESC)
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
