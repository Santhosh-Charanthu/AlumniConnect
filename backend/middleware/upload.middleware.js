const multer = require("multer");
const cloudinary = require("../config/cloudinary");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const path = require("path");

// ── Profile image upload (images only) ──────────────────────
const profileStorage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => ({
    folder: "alumniconnect",
    allowed_formats: ["jpg", "jpeg", "png", "webp", "avif"],
    public_id: `${Date.now()}-${path.parse(file.originalname).name.replace(/\s+/g, "_")}`,
  }),
});

const upload = multer({
  storage: profileStorage,
  fileFilter: (req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/avif"];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error("Only JPG, PNG, WEBP, and AVIF images are allowed"), false);
  },
  limits: { fileSize: 10 * 1024 * 1024 },
});

// ── Chat media upload — store in memory, upload manually ─────
// Using memoryStorage so we can call cloudinary.uploader.upload_stream
// with the correct resource_type per file type (avoids URL corruption)
const chatUpload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    const mime = file.mimetype.toLowerCase();
    if (mime.startsWith("image/") || mime.startsWith("video/") || mime === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Unsupported file type. Allowed: images, videos, PDFs"), false);
    }
  },
  limits: { fileSize: 50 * 1024 * 1024 },
});

module.exports = upload;
module.exports.chatUpload = chatUpload;
