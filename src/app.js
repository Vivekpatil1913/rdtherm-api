const path = require("path");
const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const morgan = require("morgan");
const compression = require("compression");
const cookieParser = require("cookie-parser");

const env = require("./config/env");
const apiRoutes = require("./routes");
const { apiLimiter } = require("./middleware/rateLimit");
const { notFound, errorHandler } = require("./middleware/errorHandler");

const app = express();

app.set("trust proxy", 1);

// Security headers. crossOriginResourcePolicy relaxed so uploaded images can be
// embedded by the admin (3001) and website (3000) which are different origins.
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: false,
  }),
);

// CORS allowlist.
app.use(
  cors({
    origin(origin, cb) {
      if (!origin || env.corsOrigins.includes(origin)) return cb(null, true);
      return cb(new Error(`Origin ${origin} not allowed by CORS`));
    },
    credentials: true,
  }),
);

app.use(compression());
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
if (!env.isProd) app.use(morgan("dev"));

// Static uploads.
app.use("/uploads", express.static(path.resolve(process.cwd(), env.upload.dir)));

// Health check.
app.get("/health", (req, res) => res.json({ success: true, data: { status: "ok", uptime: process.uptime() } }));

// API.
app.use("/api", apiLimiter, apiRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
