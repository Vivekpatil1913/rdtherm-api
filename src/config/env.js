require("dotenv").config();

function required(name, fallback) {
  const value = process.env[name] ?? fallback;
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: parseInt(process.env.PORT || "4000", 10),
  apiUrl: process.env.API_URL || "https://rdtherm-api.sumagodemo.com",
  adminUrl: process.env.ADMIN_URL || "https://rdtherm-admin.sumagodemo.com",

  corsOrigins: (
    process.env.CORS_ORIGINS ||
    "https://rdtherm-admin.sumagodemo.com,https://rdtherm-web.sumagodemo.com,http://localhost:3001,http://localhost:3000"
  )
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean),

  jwt: {
    accessSecret: required("JWT_ACCESS_SECRET", "dev_access_secret"),
    refreshSecret: required("JWT_REFRESH_SECRET", "dev_refresh_secret"),
    accessExpires: process.env.JWT_ACCESS_EXPIRES || "24h",
    refreshExpires: process.env.JWT_REFRESH_EXPIRES || "24h",
  },

  upload: {
    dir: process.env.UPLOAD_DIR || "uploads",
    maxMb: parseInt(process.env.MAX_UPLOAD_MB || "1", 10),
    maxBytes: parseInt(process.env.MAX_UPLOAD_MB || "1", 10) * 1024 * 1024,
    minDim: parseInt(process.env.IMAGE_MIN_DIM || "100", 10),
    maxDim: parseInt(process.env.IMAGE_MAX_DIM || "4000", 10),
    allowedMime: ["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml"],
  },

  smtp: {
    host: process.env.SMTP_HOST || "",
    port: parseInt(process.env.SMTP_PORT || "587", 10),
    secure: process.env.SMTP_SECURE === "true",
    user: process.env.SMTP_USER || "",
    pass: process.env.SMTP_PASS || "",
    from: process.env.MAIL_FROM || "R&D Therm CMS <no-reply@rdtherm.com>",
  },

  seedAdmin: {
    name: process.env.SEED_ADMIN_NAME || "Site Admin",
    email: process.env.SEED_ADMIN_EMAIL || "admin@rdtherm.com",
    password: process.env.SEED_ADMIN_PASSWORD || "Admin@1234",
  },

  get isProd() {
    return this.nodeEnv === "production";
  },
};

module.exports = env;
