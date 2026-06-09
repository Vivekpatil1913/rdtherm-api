const ApiError = require("../utils/ApiError");
const { verifyAccessToken } = require("../utils/tokens");

/**
 * Require a valid, non-expired access token.
 * - Missing/invalid token → 401 UNAUTHORIZED
 * - Expired token → 401 with code TOKEN_EXPIRED (frontend uses this to refresh,
 *   then redirect to /login if the refresh also fails).
 */
function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return next(ApiError.unauthorized("Authentication token is required."));
  }

  try {
    const payload = verifyAccessToken(token);
    req.user = {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
      name: payload.name,
    };
    return next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return next(new ApiError(401, "Access token expired.", "TOKEN_EXPIRED"));
    }
    return next(ApiError.unauthorized("Invalid authentication token."));
  }
}

/** Restrict a route to specific roles. */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return next(ApiError.unauthorized());
    if (!roles.includes(req.user.role)) return next(ApiError.forbidden("Insufficient permissions."));
    next();
  };
}

module.exports = { requireAuth, requireRole };
