const cron = require("node-cron");
const fs = require("fs");
const path = require("path");
const pool = require("../db/postgres");

const UPLOAD_ROOT = path.join(
  process.cwd(),
  "public",
  "uploads",
  "whatsapp"
);

const MAX_AGE_DAYS = 0.5; //30;

const getAllFiles = (dir) => {
  let files = [];

  if (!fs.existsSync(dir)) {
    return files;
  }

  for (const item of fs.readdirSync(dir)) {
    const fullPath = path.join(dir, item);

    if (fs.statSync(fullPath).isDirectory()) {
      files = files.concat(getAllFiles(fullPath));
    } else {
      files.push(fullPath);
    }
  }

  return files;
};

const cleanupUploads = async () => {
  try {
    console.log("🧹 Checking WhatsApp uploads...");

    // Get all media URLs stored in DB
    // const result = await pool.query(`
    //   SELECT media_url
    //   FROM whatsapp_messages
    //   WHERE media_url IS NOT NULL
    // `);

    // const referencedFiles = new Set(
    //   result.rows.map((row) => row.media_url)
    // );

    const files = getAllFiles(UPLOAD_ROOT);

    let deleted = 0;

    for (const filePath of files) {
      const stat = fs.statSync(filePath);

      const ageDays =
        (Date.now() - stat.mtime.getTime()) /
        (1000 * 60 * 60 * 24);

      const relativeUrl =
        "/" +
        path
          .relative(
            path.join(process.cwd(), "public"),
            filePath
          )
          .replace(/\\/g, "/");

      // Delete ONLY if:
      // 1. Older than 30 days
      // 2. Not referenced in DB
      
      // console.log({
      //   file: relativeUrl,
      //   ageDays: ageDays.toFixed(2),
      //   existsInDb: referencedFiles.has(relativeUrl),
      // });

      if (ageDays >= MAX_AGE_DAYS 
        // && !referencedFiles.has(relativeUrl)
      ){
        fs.unlinkSync(filePath);

        deleted++;

        console.log(`🗑 Deleted: ${relativeUrl}`);
      }
    }

    console.log(
      `✅ Upload cleanup complete. Deleted ${deleted} file(s).`
    );

  } catch (err) {
    console.error("Upload cleanup failed:", err);
  }
};

// Every day at 2:00 AM
const startCleanupJob = () => {
  //cron.schedule("0 2 * * *", cleanupUploads);
  cron.schedule("* 2 * * *", cleanupUploads);

  console.log("🕑 Upload cleanup scheduled (2:00 AM daily)");
};

module.exports = startCleanupJob;