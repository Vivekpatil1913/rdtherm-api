const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const sizeOf = require("image-size");
const env = require("../../config/env");
const ApiError = require("../../utils/ApiError");
const asyncHandler = require("../../utils/asyncHandler");
const { ok } = require("../../utils/response");
const { requireAuth } = require("../../middleware/auth");

const uploadRoot = path.resolve(process.cwd(), env.upload.dir);
fs.mkdirSync(uploadRoot, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadRoot),
  filename: (req, file, cb) => {
    const ext = (path.extname(file.originalname) || "").toLowerCase() || mimeExt(file.mimetype);
    const base = crypto.randomBytes(10).toString("hex");
    cb(null, `${Date.now()}-${base}${ext}`);
  },
});

function mimeExt(mime) {
  return { "image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp", "image/gif": ".gif", "image/svg+xml": ".svg" }[mime] || "";
}

const upload = multer({
  storage,
  limits: { fileSize: env.upload.maxBytes, files: 1 },
  fileFilter: (req, file, cb) => {
    if (env.upload.allowedMime.includes(file.mimetype)) return cb(null, true);
    cb(new ApiError(400, `Unsupported file type: ${file.mimetype}. Allowed: JPG, PNG, WEBP, GIF, SVG.`, "INVALID_FILE_TYPE"));
  },
});

const router = express.Router();

router.post(
  "/",
  requireAuth,
  (req, res, next) => {
    upload.single("file")(req, res, (err) => {
      if (err) {
        if (err.code === "LIMIT_FILE_SIZE") {
          return next(new ApiError(400, `Image is too large. Maximum size is ${env.upload.maxMb}MB.`, "FILE_TOO_LARGE"));
        }
        return next(err);
      }
      next();
    });
  },
  asyncHandler(async (req, res) => {
    if (!req.file) throw ApiError.badRequest("No file uploaded. Use form field `file`.");

    const filePath = path.join(uploadRoot, req.file.filename);

    // Optional per-request size cap (e.g. gallery images limited to 1MB).
    // `?maxKb=1024` is clamped to the global ceiling so it can only tighten the limit.
    const requestedKb = parseInt(req.query.maxKb, 10);
    if (Number.isFinite(requestedKb) && requestedKb > 0) {
      const cap = Math.min(requestedKb * 1024, env.upload.maxBytes);
      if (req.file.size > cap) {
        fs.unlink(filePath, () => {});
        const capMb = +(cap / (1024 * 1024)).toFixed(cap % (1024 * 1024) === 0 ? 0 : 1);
        throw new ApiError(400, `Image is too large. Maximum size is ${capMb}MB.`, "FILE_TOO_LARGE");
      }
    }

    // Validate pixel dimensions for raster images (skip SVG — vector).
    if (req.file.mimetype !== "image/svg+xml") {
      try {
        const { width, height } = sizeOf(filePath);
        const { minDim, maxDim } = env.upload;
        if (!width || !height || width < minDim || height < minDim || width > maxDim || height > maxDim) {
          fs.unlink(filePath, () => {});
          throw new ApiError(
            400,
            `Image dimensions must be between ${minDim}×${minDim}px and ${maxDim}×${maxDim}px (uploaded ${width || "?"}×${height || "?"}px).`,
            "INVALID_DIMENSIONS",
          );
        }
      } catch (err) {
        if (err instanceof ApiError) throw err;
        fs.unlink(filePath, () => {});
        throw new ApiError(400, "Could not read the image. Please upload a valid image file.", "INVALID_IMAGE");
      }
    }

    const url = `${env.apiUrl}/uploads/${req.file.filename}`;
    return ok(res, {
      url,
      name: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size,
      mime: req.file.mimetype,
    });
  }),
);

module.exports = router;
