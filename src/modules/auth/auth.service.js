const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const prisma = require("../../config/prisma");
const env = require("../../config/env");
const ApiError = require("../../utils/ApiError");
const {
  signAccessToken,
  generateRefreshToken,
  hashToken,
  durationMs,
} = require("../../utils/tokens");
const { sendMail } = require("../../utils/mailer");

function publicUser(user) {
  return {
    id: user.id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    avatar: user.avatarUrl || null,
  };
}

async function issueTokens(user, ctx = {}) {
  const accessToken = signAccessToken(user);
  const { raw, hash } = generateRefreshToken();
  const expiresAt = new Date(Date.now() + durationMs(env.jwt.refreshExpires));

  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash: hash,
      userAgent: (ctx.userAgent || "").slice(0, 250),
      ip: (ctx.ip || "").slice(0, 60),
      expiresAt,
    },
  });

  return { accessToken, refreshToken: raw, expiresAt };
}

async function login(email, password, ctx) {
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (!user || !user.isActive) throw ApiError.unauthorized("Invalid email or password.");

  const matches = await bcrypt.compare(password, user.passwordHash);
  if (!matches) throw ApiError.unauthorized("Invalid email or password.");

  await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });

  const tokens = await issueTokens(user, ctx);
  return { user: publicUser(user), ...tokens };
}

/** Rotate a refresh token: validate, revoke the old one, issue a fresh pair. */
async function refresh(rawToken, ctx) {
  if (!rawToken) throw ApiError.unauthorized("Refresh token is required.");
  const hash = hashToken(rawToken);
  const record = await prisma.refreshToken.findUnique({ where: { tokenHash: hash } });

  if (!record || record.revokedAt || record.expiresAt < new Date()) {
    throw new ApiError(401, "Refresh token is invalid or expired.", "REFRESH_INVALID");
  }

  const user = await prisma.user.findUnique({ where: { id: record.userId } });
  if (!user || !user.isActive) throw ApiError.unauthorized("Account is inactive.");

  const tokens = await issueTokens(user, ctx);
  // Revoke the old token and link it to its replacement (rotation trail).
  await prisma.refreshToken.update({
    where: { id: record.id },
    data: { revokedAt: new Date(), replacedBy: hashToken(tokens.refreshToken) },
  });

  return { user: publicUser(user), ...tokens };
}

async function logout(rawToken) {
  if (!rawToken) return;
  const hash = hashToken(rawToken);
  await prisma.refreshToken.updateMany({
    where: { tokenHash: hash, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

async function logoutAll(userId) {
  await prisma.refreshToken.updateMany({
    where: { userId: BigInt(userId), revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

async function getMe(userId) {
  const user = await prisma.user.findUnique({ where: { id: BigInt(userId) } });
  if (!user) throw ApiError.notFound("User not found.");
  return publicUser(user);
}

async function updateProfile(userId, { name, email, avatar }) {
  const id = BigInt(userId);
  if (email) {
    const clash = await prisma.user.findFirst({
      where: { email: email.toLowerCase(), NOT: { id } },
      select: { id: true },
    });
    if (clash) throw ApiError.conflict("That email is already in use.", { field: "email" });
  }
  const user = await prisma.user.update({
    where: { id },
    data: {
      name,
      email: email ? email.toLowerCase() : undefined,
      avatarUrl: avatar !== undefined ? avatar || null : undefined,
    },
  });
  return publicUser(user);
}

async function changePassword(userId, currentPassword, newPassword) {
  const id = BigInt(userId);
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw ApiError.notFound("User not found.");

  const matches = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!matches) throw ApiError.badRequest("Your current password is incorrect.");

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({ where: { id }, data: { passwordHash } });
  // Security: invalidate ALL sessions (including this one) so the user must
  // sign in again everywhere with the new password.
  await prisma.refreshToken.updateMany({
    where: { userId: id, revokedAt: null },
    data: { revokedAt: new Date() },
  });
  return { ok: true };
}

async function requestPasswordReset(email) {
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  // Always behave the same to avoid leaking which emails exist.
  if (user && user.isActive) {
    const raw = crypto.randomBytes(32).toString("hex");
    await prisma.passwordReset.create({
      data: {
        userId: user.id,
        tokenHash: hashToken(raw),
        expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
      },
    });
    const link = `${env.adminUrl}/reset-password?token=${raw}`;
    try {
      await sendMail({
      to: user.email,
      subject: "Reset your R&D Therm CMS password",
      text: `Reset your password using this link (valid for 15 minutes):\n${link}\n\nIf you didn't request this, you can safely ignore this email.`,
      html: `
        <div style="font-family:Arial,Helvetica,sans-serif;max-width:480px;margin:0 auto;padding:24px">
          <h2 style="margin:0 0 8px;color:#111">Reset your password</h2>
          <p style="color:#444;line-height:1.6">We received a request to reset your R&amp;D Therm CMS password. Click the button below to choose a new one. This link is valid for <strong>15 minutes</strong>.</p>
          <p style="margin:24px 0">
            <a href="${link}" style="background:#C8370B;color:#fff;text-decoration:none;padding:12px 22px;border-radius:8px;display:inline-block;font-weight:600">Reset password</a>
          </p>
          <p style="color:#777;font-size:13px;line-height:1.6">Or paste this link into your browser:<br><a href="${link}" style="color:#C8370B;word-break:break-all">${link}</a></p>
          <p style="color:#999;font-size:12px;margin-top:24px">If you didn't request this, you can safely ignore this email — your password won't change.</p>
        </div>`,
      });
    } catch (err) {
      // Never fail the request if email delivery breaks — log so the link is
      // still recoverable, and keep the response identical for security.
      // eslint-disable-next-line no-console
      console.error(`[password-reset] email send failed: ${err.message}\nReset link: ${link}`);
    }
  }
  return { ok: true };
}

/** Check a reset token without consuming it — powers the "is this link still valid?" page check. */
async function verifyResetToken(rawToken) {
  if (!rawToken) return { valid: false };
  const record = await prisma.passwordReset.findUnique({ where: { tokenHash: hashToken(rawToken) } });
  return { valid: !!record && !record.usedAt && record.expiresAt >= new Date() };
}

async function resetPassword(rawToken, newPassword) {
  const record = await prisma.passwordReset.findUnique({ where: { tokenHash: hashToken(rawToken) } });
  if (!record || record.usedAt || record.expiresAt < new Date()) {
    throw ApiError.badRequest("This reset link is invalid or has expired.");
  }
  const passwordHash = await bcrypt.hash(newPassword, 12);
  await prisma.$transaction([
    prisma.user.update({ where: { id: record.userId }, data: { passwordHash } }),
    prisma.passwordReset.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
    // Security: invalidate all existing sessions on password change.
    prisma.refreshToken.updateMany({
      where: { userId: record.userId, revokedAt: null },
      data: { revokedAt: new Date() },
    }),
  ]);
  return { ok: true };
}

module.exports = {
  login,
  refresh,
  logout,
  logoutAll,
  getMe,
  updateProfile,
  changePassword,
  requestPasswordReset,
  verifyResetToken,
  resetPassword,
  publicUser,
};
