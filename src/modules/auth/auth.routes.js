const express = require("express");
const ctrl = require("./auth.controller");
const { validate } = require("../../middleware/validate");
const { requireAuth } = require("../../middleware/auth");
const { authLimiter } = require("../../middleware/rateLimit");

const router = express.Router();

router.post(
  "/login",
  authLimiter,
  validate({
    email: { type: "email", required: true, label: "Email" },
    password: { type: "string", required: true, min: 6, label: "Password" },
  }),
  ctrl.login,
);

router.post("/refresh", authLimiter, ctrl.refresh);

router.post("/logout", ctrl.logout);

router.post("/logout-all", requireAuth, ctrl.logoutAll);

router.get("/me", requireAuth, ctrl.me);

router.put(
  "/profile",
  requireAuth,
  validate({
    name: { type: "string", required: true, min: 2, max: 150, label: "Name" },
    email: { type: "email", required: true, label: "Email" },
    avatar: { type: "string", label: "Avatar" },
  }),
  ctrl.updateProfile,
);

router.put(
  "/password",
  requireAuth,
  validate({
    currentPassword: { type: "string", required: true, label: "Current password" },
    newPassword: { type: "string", required: true, min: 8, max: 100, label: "New password" },
  }),
  ctrl.changePassword,
);

router.post(
  "/forgot-password",
  authLimiter,
  validate({ email: { type: "email", required: true, label: "Email" } }),
  ctrl.forgotPassword,
);

router.post(
  "/reset-password",
  authLimiter,
  validate({
    token: { type: "string", required: true, label: "Token" },
    password: { type: "string", required: true, min: 8, max: 100, label: "New password" },
  }),
  ctrl.resetPassword,
);

module.exports = router;
