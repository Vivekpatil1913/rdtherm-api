const asyncHandler = require("../../utils/asyncHandler");
const { ok } = require("../../utils/response");
const service = require("./auth.service");

function ctxFrom(req) {
  return { userAgent: req.headers["user-agent"], ip: req.ip };
}

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const result = await service.login(email, password, ctxFrom(req));
  return ok(res, result);
});

const refresh = asyncHandler(async (req, res) => {
  const token = req.body.refreshToken || req.cookies?.refreshToken;
  const result = await service.refresh(token, ctxFrom(req));
  return ok(res, result);
});

const logout = asyncHandler(async (req, res) => {
  const token = req.body.refreshToken || req.cookies?.refreshToken;
  await service.logout(token);
  return ok(res, { message: "Logged out." });
});

const logoutAll = asyncHandler(async (req, res) => {
  await service.logoutAll(req.user.id);
  return ok(res, { message: "Logged out from all devices." });
});

const me = asyncHandler(async (req, res) => {
  const user = await service.getMe(req.user.id);
  return ok(res, user);
});

const updateProfile = asyncHandler(async (req, res) => {
  const { name, email, avatar } = req.body;
  const user = await service.updateProfile(req.user.id, { name, email, avatar });
  return ok(res, user);
});

const changePassword = asyncHandler(async (req, res) => {
  await service.changePassword(req.user.id, req.body.currentPassword, req.body.newPassword);
  return ok(res, { message: "Password updated." });
});

const forgotPassword = asyncHandler(async (req, res) => {
  await service.requestPasswordReset(req.body.email);
  return ok(res, { message: "If that email exists, a reset link has been sent." });
});

const resetPassword = asyncHandler(async (req, res) => {
  await service.resetPassword(req.body.token, req.body.password);
  return ok(res, { message: "Password updated. You can now sign in." });
});

module.exports = { login, refresh, logout, logoutAll, me, updateProfile, changePassword, forgotPassword, resetPassword };
