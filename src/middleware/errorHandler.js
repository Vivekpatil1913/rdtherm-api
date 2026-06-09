const ApiError = require("../utils/ApiError");
const env = require("../config/env");

/** 404 for unmatched routes. */
function notFound(req, res, next) {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
}

/** Centralized error handler — emits the uniform error envelope. */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  let error = err;

  // Translate common Prisma errors into clean API errors.
  if (err && err.code && typeof err.code === "string" && err.code.startsWith("P")) {
    if (err.code === "P2002") {
      const field = err.meta?.target?.[0] || "field";
      error = ApiError.conflict(`A record with this ${field} already exists.`, { field });
    } else if (err.code === "P2025") {
      error = ApiError.notFound("Record not found.");
    } else {
      error = new ApiError(400, "Database request failed.", "DB_ERROR");
    }
  }

  if (!(error instanceof ApiError)) {
    error = new ApiError(
      err.statusCode || 500,
      err.message || "Internal server error",
      "INTERNAL_ERROR",
    );
  }

  if (!error.isOperational && error.statusCode >= 500) {
    // eslint-disable-next-line no-console
    console.error("[UNHANDLED ERROR]", err);
  }

  const body = {
    success: false,
    error: {
      code: error.code,
      message: error.message,
    },
  };
  if (error.details) body.error.details = error.details;
  if (!env.isProd && error.statusCode >= 500) body.error.stack = err.stack;

  res.status(error.statusCode || 500).json(body);
}

module.exports = { notFound, errorHandler };
