const express = require("express");
const prisma = require("../../config/prisma");
const asyncHandler = require("../../utils/asyncHandler");
const { ok, created } = require("../../utils/response");
const { validate } = require("../../middleware/validate");
const { stripTags } = require("../../utils/helpers");
const { publicWriteLimiter } = require("../../middleware/rateLimit");
const { getSettingsPayload } = require("../settings/settings.routes");

const router = express.Router();

// Only active, non-deleted records are ever exposed publicly.
const PUBLISHED = { isActive: true, isDeleted: false };
const byOrder = { sortOrder: "asc" };

function listPublished(model, mapper, opts = {}) {
  return asyncHandler(async (req, res) => {
    const rows = await prisma[model].findMany({ where: PUBLISHED, orderBy: byOrder, ...opts });
    return ok(res, rows.map(mapper));
  });
}

/* Collections */
router.get("/testimonials", listPublished("testimonial", (r) => ({ id: r.id, author: r.author, role: r.role, body: r.body, rating: r.rating, avatarUrl: r.avatarUrl })));
router.get("/industries", listPublished("industry", (r) => ({ id: r.id, key: r.key, label: r.label, description: r.description, cover: r.coverUrl })));
router.get("/faqs", listPublished("faq", (r) => ({ id: r.id, question: r.question, answer: r.answer })));
router.get("/team", listPublished("teamMember", (r) => ({ id: r.id, name: r.name, role: r.role, bio: r.bio, photo: r.photoUrl, group: r.group })));
router.get("/logos", listPublished("logo", (r) => ({ id: r.id, name: r.name, imageUrl: r.imageUrl, kind: r.kind })));
router.get("/careers", listPublished("jobOpening", (r) => ({ id: r.id, title: r.title, department: r.department, location: r.location, type: r.type, description: r.description })));

router.get(
  "/products",
  listPublished(
    "product",
    (r) => ({
      id: r.id,
      slug: r.slug,
      title: r.title,
      summary: r.summary,
      cover: r.coverUrl,
      featured: r.featured,
      specs: r.specs || [],
      applications: r.applications || [],
      materials: r.materials || [],
      compliance: r.compliance || [],
      benefits: r.benefits || [],
      inclusions: r.inclusions || [],
      images: (r.images || []).map((i) => ({ url: i.url, alt: i.alt, label: i.label || undefined })),
      content: r.content,
    }),
    { include: { images: { orderBy: { sortOrder: "asc" } } } },
  ),
);

router.get("/products/:slug", asyncHandler(async (req, res) => {
  const r = await prisma.product.findFirst({ where: { slug: req.params.slug, ...PUBLISHED }, include: { images: { orderBy: { sortOrder: "asc" } } } });
  if (!r) return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Product not found." } });
  return ok(res, { id: r.id, slug: r.slug, title: r.title, summary: r.summary, cover: r.coverUrl, content: r.content, featured: r.featured, specs: r.specs || [], applications: r.applications || [], materials: r.materials || [], compliance: r.compliance || [], benefits: r.benefits || [], inclusions: r.inclusions || [], images: (r.images || []).map((i) => ({ url: i.url, alt: i.alt, label: i.label || undefined })) });
}));

router.get("/blogs", listPublished("blogPost", (r) => ({
  id: r.id, slug: r.slug, title: r.title, excerpt: r.excerpt, category: r.category, author: r.author,
  date: r.publishedAt ? r.publishedAt.toISOString().slice(0, 10) : null, readTime: r.readTime, cover: r.coverUrl,
}), { orderBy: { publishedAt: "desc" } }));

router.get("/blogs/:slug", asyncHandler(async (req, res) => {
  const r = await prisma.blogPost.findFirst({ where: { slug: req.params.slug, ...PUBLISHED } });
  if (!r) return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Article not found." } });
  // Best-effort view counter.
  prisma.blogPost.update({ where: { id: r.id }, data: { views: { increment: 1 } } }).catch(() => {});
  return ok(res, { id: r.id, slug: r.slug, title: r.title, excerpt: r.excerpt, category: r.category, author: r.author, date: r.publishedAt ? r.publishedAt.toISOString().slice(0, 10) : null, readTime: r.readTime, cover: r.coverUrl, content: r.content });
}));

router.get("/case-studies", listPublished("caseStudy", (r) => ({ id: r.id, slug: r.slug, title: r.title, client: r.client, industry: r.industry, summary: r.summary, cover: r.coverUrl, metrics: r.metrics || [] })));

router.get("/settings", asyncHandler(async (req, res) => ok(res, await getSettingsPayload())));

/* Contact form submission (public write). */
router.post(
  "/leads",
  publicWriteLimiter,
  validate({
    name: { type: "string", required: true, min: 2, max: 150, label: "Name" },
    email: { type: "email", required: true, label: "Email" },
    message: { type: "string", required: true, min: 5, label: "Message" },
    phone: { type: "string", max: 60, label: "Phone" },
    company: { type: "string", max: 190, label: "Company" },
    subject: { type: "string", max: 255, label: "Subject" },
    source: { type: "string", max: 120, label: "Source" },
  }),
  asyncHandler(async (req, res) => {
    const b = req.body;
    await prisma.lead.create({
      data: {
        name: stripTags(b.name),
        email: b.email,
        phone: stripTags(b.phone || ""),
        company: stripTags(b.company || ""),
        subject: stripTags(b.subject || "New enquiry"),
        message: stripTags(b.message),
        source: stripTags(b.source || "Website contact form"),
        leadStatus: "new",
      },
    });
    return created(res, { message: "Thank you — your enquiry has been received." });
  }),
);

module.exports = router;
