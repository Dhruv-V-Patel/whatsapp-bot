const multer = require("multer");
const path = require("path");
const fs = require("fs");

// const getFolder = (mimeType) => {
//   if (mimeType.startsWith("image/")) return "image";
//   if (mimeType.startsWith("video/")) return "video";
//   if (mimeType.startsWith("audio/")) return "audio";
//   return "document";
// };

const getFolder = (file) => {
  const ext = path.extname(file.originalname).toLowerCase();

  let mimeType = file.mimetype;

  // Some browsers report MP3/MPEG audio as video/mpeg
  if (
    mimeType === "video/mpeg" &&
    [".mp3", ".mpeg"].includes(ext)
  ) {
    mimeType = "audio/mpeg";
    file.mimetype = mimeType; // normalize for later use
  }

  if (
    mimeType.startsWith("image/") &&
    mimeType !== "image/svg+xml"
  ) {
    return "image";
  }

  if (mimeType.startsWith("video/")) {
    return "video";
  }

  if (mimeType.startsWith("audio/")) {
    return "audio";
  }

  return "document";
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // const folder = getFolder(file.mimetype);
    // const folder = getFolder(file);

    // const uploadPath = path.join(
    //   process.cwd(),
    //   "public",
    //   "uploads",
    //   "whatsapp",
    //   folder
    // );
    let uploadPath;

    // Save brochure in its own folder
    if (req.originalUrl.includes("/whatsapp-config/brochure")) {
      uploadPath = path.join(
        process.cwd(),
        "public",
        "uploads",
        "whatsapp",
        "brochure"
      );
    } else {
      const folder = getFolder(file);

      uploadPath = path.join(
        process.cwd(),
        "public",
        "uploads",
        "whatsapp",
        folder
      );
    }

    fs.mkdirSync(uploadPath, { recursive: true });

    cb(null, uploadPath);
  },

  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);

    const filename =
      Date.now() +
      "-" +
      Math.random().toString(36).substring(2, 8) +
      ext;

    cb(null, filename);
  },
});

module.exports = multer({
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100 MB
  },
});