const express = require("express");
const prisma = require("../../config/prisma");
const asyncHandler = require("../../utils/asyncHandler");
const { ok } = require("../../utils/response");
const { requireAuth } = require("../../middleware/auth");

const router = express.Router();

/** Recent admin activity for the dashboard feed. */
router.get(
  "/",
  requireAuth,
  asyncHandler(async (req, res) => {
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit || "10", 10) || 10));
    const rows = await prisma.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: limit });
    return ok(
      res,
      rows.map((r) => ({
        id: r.id,
        actor: r.actor,
        action: r.action,
        target: r.target,
        module: r.module,
        at: r.createdAt,
      })),
    );
  }),
);

module.exports = router;
