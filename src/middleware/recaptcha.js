const env = require("../config/env");
const ApiError = require("../utils/ApiError");

const VERIFY_URL = "https://www.google.com/recaptcha/api/siteverify";

/**
 * Verify a Google reCAPTCHA v2 token against Google. Returns true when the
 * secret isn't configured (dev) so local flows aren't blocked.
 */
async function verifyToken(token, ip) {
  if (!env.recaptcha.secret) return true; // not configured → skip
  if (!token || typeof token !== "string") return false;
  try {
    const params = new URLSearchParams({ secret: env.recaptcha.secret, response: token });
    if (ip) params.append("remoteip", ip);
    const res = await fetch(VERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params,
    });
    const data = await res.json();
    return !!data.success;
  } catch {
    return false;
  }
}

/**
 * Express middleware: rejects the request with 400 unless a valid reCAPTCHA
 * token is present in `recaptchaToken` (body or `x-recaptcha-token` header).
 */
function requireCaptcha(req, res, next) {
  const token = req.body?.recaptchaToken || req.headers["x-recaptcha-token"];
  verifyToken(token, req.ip)
    .then((ok) =>
      ok ? next() : next(ApiError.badRequest("Captcha verification failed. Please try again.")),
    )
    .catch(() => next(ApiError.badRequest("Captcha verification failed. Please try again.")));
}

module.exports = { verifyToken, requireCaptcha };
