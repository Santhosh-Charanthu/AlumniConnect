const multer = require("multer");
const cloudinary = require("../config/cloudinary");
const path = require("path");
const streamifier = require("streamifier");

// ── Profile image upload — memory storage, manual upload to Cloudinary ──
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/avif"];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else
      cb(new Error("Only JPG, PNG, WEBP, and AVIF images are allowed"), false);
  },
  limits: { fileSize: 10 * 1024 * 1024 },
});

// Helper to upload a buffer to Cloudinary
const uploadToCloudinary = (buffer, options = {}) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      options,
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      },
    );
    streamifier.createReadStream(buffer).pipe(stream);
  });
};

// Factory: creates a [multer, cloudinaryUpload] middleware pair for a given field name
const makeImageUpload = (fieldName, folder = "alumniconnect") => [
  upload.single(fieldName),
  async (req, res, next) => {
    if (!req.file) return next();
    try {
      const publicId = `${Date.now()}-${path.parse(req.file.originalname).name.replace(/\s+/g, "_")}`;
      const result = await uploadToCloudinary(req.file.buffer, {
        folder,
        public_id: publicId,
        allowed_formats: ["jpg", "jpeg", "png", "webp", "avif"],
      });
      req.file.path = result.secure_url;
      req.file.filename = result.public_id;
      next();
    } catch (err) {
      next(err);
    }
  },
];

const uploadProfileImage = makeImageUpload("profileImage");
const uploadCoverImage = makeImageUpload("coverImage");

// ── Chat media upload — store in memory, upload manually ─────
const chatUpload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    const mime = file.mimetype.toLowerCase();
    if (
      mime.startsWith("image/") ||
      mime.startsWith("video/") ||
      mime === "application/pdf"
    ) {
      cb(null, true);
    } else {
      cb(
        new Error("Unsupported file type. Allowed: images, videos, PDFs"),
        false,
      );
    }
  },
  limits: { fileSize: 50 * 1024 * 1024 },
});

module.exports = upload;
module.exports.uploadProfileImage = uploadProfileImage;
module.exports.uploadCoverImage = uploadCoverImage;
module.exports.uploadToCloudinary = uploadToCloudinary;
module.exports.chatUpload = chatUpload;
