const prisma = require("../config/prisma");

/**
 * Record an admin action for the dashboard activity feed.
 * Fire-and-forget: a logging failure must never break the main request.
 */
async function logActivity({ actor, actorId, action, target, module }) {
  try {
    await prisma.auditLog.create({
      data: {
        actorId: actorId ? BigInt(actorId) : null,
        actor: actor || "System",
        action,
        target: String(target || "").slice(0, 250),
        module,
      },
    });
  } catch {
    /* swallow — auditing is best-effort */
  }
}

module.exports = { logActivity };
