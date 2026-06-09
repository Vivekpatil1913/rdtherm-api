const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const env = require("../config/env");

/** Sign a short-lived access token (default 24h). */
function signAccessToken(user) {
  return jwt.sign(
    { sub: user.id.toString(), email: user.email, role: user.role, name: user.name },
    env.jwt.accessSecret,
    { expiresIn: env.jwt.accessExpires },
  );
}

/** Verify an access token; throws on invalid/expired. */
function verifyAccessToken(token) {
  return jwt.verify(token, env.jwt.accessSecret);
}

/**
 * Create an opaque refresh token (random string). We store only its SHA-256
 * hash in the DB; the raw value is returned to the client once. This supports
 * rotation and "logout from all devices".
 */
function generateRefreshToken() {
  const raw = crypto.randomBytes(48).toString("hex");
  const hash = hashToken(raw);
  return { raw, hash };
}

function hashToken(raw) {
  return crypto.createHash("sha256").update(raw).digest("hex");
}

/** Parse a duration like "24h"/"7d"/"30m" into milliseconds. */
function durationMs(str) {
  const m = /^(\d+)([smhd])$/.exec(String(str).trim());
  if (!m) return 24 * 60 * 60 * 1000;
  const n = parseInt(m[1], 10);
  const unit = { s: 1000, m: 60000, h: 3600000, d: 86400000 }[m[2]];
  return n * unit;
}

module.exports = {
  signAccessToken,
  verifyAccessToken,
  generateRefreshToken,
  hashToken,
  durationMs,
};
