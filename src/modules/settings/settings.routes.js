const express = require("express");
const prisma = require("../../config/prisma");
const asyncHandler = require("../../utils/asyncHandler");
const { ok } = require("../../utils/response");
const { logActivity } = require("../../utils/audit");
const { requireAuth } = require("../../middleware/auth");
const { validate } = require("../../middleware/validate");

const router = express.Router();

async function getSettingsPayload() {
  const [setting, social, hours] = await Promise.all([
    prisma.siteSetting.findFirst({ orderBy: { id: "asc" } }),
    prisma.socialLink.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.businessHour.findMany({ orderBy: { sortOrder: "asc" } }),
  ]);
  return {
    name: setting?.name || "",
    shortName: setting?.shortName || "",
    parent: setting?.parent || "",
    tagline: setting?.tagline || "",
    description: setting?.description || "",
    address: setting?.address || "",
    phone: setting?.phone || "",
    email: setting?.email || "",
    social: social.map((s) => ({ label: s.label, href: s.href })),
    hours: hours.map((h) => ({ label: h.label, value: h.value })),
  };
}

router.get("/", requireAuth, asyncHandler(async (req, res) => ok(res, await getSettingsPayload())));

router.put(
  "/",
  requireAuth,
  validate({
    name: { type: "string", max: 190, label: "Company name" },
    shortName: { type: "string", max: 120, label: "Short name" },
    parent: { type: "string", max: 190, label: "Parent company" },
    tagline: { type: "string", max: 255, label: "Tagline" },
    description: { type: "string", label: "Description" },
    address: { type: "string", label: "Address" },
    phone: { type: "string", max: 60, label: "Phone" },
    email: { type: "email", label: "Email" },
    social: { type: "array", itemType: "object", label: "Social links" },
    hours: { type: "array", itemType: "object", label: "Business hours" },
  }),
  asyncHandler(async (req, res) => {
    const b = req.body;
    const existing = await prisma.siteSetting.findFirst({ orderBy: { id: "asc" } });

    const data = {
      name: b.name ?? existing?.name ?? "",
      shortName: b.shortName ?? existing?.shortName ?? "",
      parent: b.parent ?? existing?.parent ?? "",
      tagline: b.tagline ?? existing?.tagline ?? "",
      description: b.description ?? existing?.description ?? "",
      address: b.address ?? existing?.address ?? "",
      phone: b.phone ?? existing?.phone ?? "",
      email: b.email ?? existing?.email ?? "",
    };

    await prisma.$transaction(async (tx) => {
      if (existing) await tx.siteSetting.update({ where: { id: existing.id }, data });
      else await tx.siteSetting.create({ data });

      if (Array.isArray(b.social)) {
        await tx.socialLink.deleteMany({});
        await tx.socialLink.createMany({
          data: b.social.map((s, i) => ({ label: s.label || "", href: s.href || "#", sortOrder: i })),
        });
      }
      if (Array.isArray(b.hours)) {
        await tx.businessHour.deleteMany({});
        await tx.businessHour.createMany({
          data: b.hours.map((h, i) => ({ label: h.label || "", value: h.value || "", sortOrder: i })),
        });
      }
    });

    await logActivity({ actor: req.user.name, actorId: req.user.id, action: "updated", target: "Site settings", module: "Settings" });
    return ok(res, await getSettingsPayload());
  }),
);

module.exports = { router, getSettingsPayload };
