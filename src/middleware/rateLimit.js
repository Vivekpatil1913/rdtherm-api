const rateLimit = require("express-rate-limit");

const message = {
  success: false,
  error: { code: "RATE_LIMITED", message: "Too many requests. Please try again later." },
};

/** General API limiter. */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 600,
  standardHeaders: true,
  legacyHeaders: false,
  message,
});

/** Strict limiter for auth-sensitive endpoints (login, forgot, reset, refresh). */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message,
});

/** Limiter for the public contact form to deter spam. */
const publicWriteLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message,
});

module.exports = { apiLimiter, authLimiter, publicWriteLimiter };
