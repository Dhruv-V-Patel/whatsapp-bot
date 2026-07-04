# WhatsApp Bot

A Node.js and Express WhatsApp webhook bot for capturing incoming WhatsApp leads, storing them in PostgreSQL, and sending automated welcome messages and a brochure through the Meta WhatsApp Cloud API.

## Features

- Receives WhatsApp webhook verification and message callbacks.
- Saves lead phone number, name, and first message in PostgreSQL.
- Sends automated welcome messages.
- Sends a brochure document link.
- Updates lead activity timestamps after repeat messages.
- Serves static files from the `public` folder.

## Project Structure

```text
.
|-- public/
|   |-- index.html
|   `-- someshwar.pdf
|-- src/
|   |-- app.js
|   |-- controllers/
|   |   `-- webhookController.js
|   |-- db/
|   |   `-- postgres.js
|   |-- routes/
|   |   `-- webhook.js
|   |-- services/
|   |   `-- whatsappService.js
|   `-- utils/
|       `-- delay.js
|-- server.js
|-- package.json
`-- requirement.txt
```

## Requirements

- Node.js 18 or newer
- npm
- PostgreSQL
- Meta WhatsApp Cloud API access
- A public HTTPS domain for webhook callbacks
- SSL certificate files when running the current `server.js` in production

## Installation

```bash
npm install
```

## Environment Variables

Create a `.env` file in the project root:

```env
PORT=3000

DB_USER=your_postgres_user
DB_HOST=localhost
DB_NAME=your_database_name
DB_PASSWORD=your_database_password
DB_PORT=5432

PHONE_NUMBER_ID=your_whatsapp_phone_number_id
WHATSAPP_ACCESS_TOKEN=your_whatsapp_cloud_api_token
WA_VERIFY_TOKEN=your_webhook_verify_token
```

## Database Tables

The app creates these tables automatically on startup when PostgreSQL is connected. You can also create them manually:

```sql
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
```

```sql
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
ALTER TABLE whatsapp_messages
ADD COLUMN is_first_message BOOLEAN DEFAULT FALSE;
```

## Running The App

For production:

```bash
npm start
```

For development:

```bash
npm run dev
```

The webhook endpoint is:

```text
https://your-domain.com/webhook
```

The frontend inbox is available at:

```text
https://your-domain.com/
```

## SSL Notes

The current `server.js` starts an HTTPS server using certificate files from:

```text
/etc/letsencrypt/live/yourdomain.com/privkey.pem
/etc/letsencrypt/live/yourdomain.com/cert.pem
```

Update these paths if your production domain or certificate location is different.

## Webhook Setup

In the Meta developer dashboard:

1. Set the callback URL to `https://your-domain.com/webhook`.
2. Set the verify token to the same value as `WA_VERIFY_TOKEN`.
3. Subscribe to WhatsApp message webhook events.

## Static Files

Files in `public` are served directly by Express. The brochure PDF is available from:

```text
https://your-domain.com/someshwar.pdf
```
