const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const prisma = require("../../config/prisma");
const env = require("../../config/env");
const ApiError = require("../../utils/ApiError");
const asyncHandler = require("../../utils/asyncHandler");
const { ok, created } = require("../../utils/response");
const { validate } = require("../../middleware/validate");
const { stripTags } = require("../../utils/helpers");
const { publicWriteLimiter } = require("../../middleware/rateLimit");
const { requireCaptcha, verifyToken } = require("../../middleware/recaptcha");
const { getSettingsPayload } = require("../settings/settings.routes");

const router = express.Router();

/* ── Resume upload (Careers page) — PDF / DOC / DOCX up to 5 MB ── */
const resumeRoot = path.resolve(process.cwd(), env.upload.dir);
fs.mkdirSync(resumeRoot, { recursive: true });
const RESUME_MIME = {
  "application/pdf": ".pdf",
  "application/msword": ".doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
};
const RESUME_MAX_BYTES = 5 * 1024 * 1024;
const resumeUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, resumeRoot),
    filename: (req, file, cb) => {
      const ext = (path.extname(file.originalname) || RESUME_MIME[file.mimetype] || "").toLowerCase();
      cb(null, `resume-${Date.now()}-${crypto.randomBytes(8).toString("hex")}${ext}`);
    },
  }),
  limits: { fileSize: RESUME_MAX_BYTES, files: 1 },
  fileFilter: (req, file, cb) => {
    if (RESUME_MIME[file.mimetype]) return cb(null, true);
    cb(new ApiError(400, "Resume must be a PDF, DOC or DOCX file.", "INVALID_FILE_TYPE"));
  },
});

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

const mapBlog = (r) => ({
  id: r.id, slug: r.slug, title: r.title, excerpt: r.excerpt, category: r.category, author: r.author,
  date: r.publishedAt ? r.publishedAt.toISOString().slice(0, 10) : null, readTime: r.readTime,
  cover: r.coverUrl, cardImage: r.cardImageUrl || r.coverUrl,
});

// Server-side paginated list — scales to any number of posts.
// `?page` (1-based) and `?limit` (default 6, max 50). Returns the page slice
// plus total/hasMore so the client can lazily load more on demand.
router.get("/blogs", asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 6));
  const [total, rows] = await Promise.all([
    prisma.blogPost.count({ where: PUBLISHED }),
    prisma.blogPost.findMany({
      where: PUBLISHED,
      orderBy: { publishedAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);
  return ok(res, { items: rows.map(mapBlog), total, page, limit, hasMore: page * limit < total });
}));

router.get("/blogs/:slug", asyncHandler(async (req, res) => {
  const r = await prisma.blogPost.findFirst({ where: { slug: req.params.slug, ...PUBLISHED } });
  if (!r) return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Article not found." } });
  // Best-effort view counter.
  prisma.blogPost.update({ where: { id: r.id }, data: { views: { increment: 1 } } }).catch(() => {});
  return ok(res, { id: r.id, slug: r.slug, title: r.title, excerpt: r.excerpt, category: r.category, author: r.author, date: r.publishedAt ? r.publishedAt.toISOString().slice(0, 10) : null, readTime: r.readTime, cover: r.coverUrl, cardImage: r.cardImageUrl || r.coverUrl, content: r.content });
}));

router.get("/case-studies", listPublished("caseStudy", (r) => ({ id: r.id, slug: r.slug, title: r.title, client: r.client, industry: r.industry, summary: r.summary, cover: r.coverUrl, metrics: r.metrics || [] })));

router.get("/case-studies/:slug", asyncHandler(async (req, res) => {
  const r = await prisma.caseStudy.findFirst({ where: { slug: req.params.slug, ...PUBLISHED } });
  if (!r) return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Case study not found." } });
  return ok(res, { id: r.id, slug: r.slug, title: r.title, client: r.client, industry: r.industry, summary: r.summary, cover: r.coverUrl, metrics: r.metrics || [] });
}));

router.get("/settings", asyncHandler(async (req, res) => ok(res, await getSettingsPayload())));

/* Contact form submission (public write). */
router.post(
  "/leads",
  publicWriteLimiter,
  requireCaptcha,
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

/* Air Receiver quote request (public write) — configurator & custom builder. */
router.post(
  "/quotes",
  publicWriteLimiter,
  validate({
    name: { type: "name", required: true, min: 2, max: 150, label: "Name" },
    email: { type: "email", required: true, label: "Email" },
    mobile: { type: "mobile", required: true, label: "Mobile number" },
    company: { type: "string", required: true, min: 1, max: 190, label: "Company" },
    country: { type: "string", required: true, min: 1, max: 120, label: "Country" },
    city: { type: "string", required: true, min: 1, max: 120, label: "City" },
    message: { type: "string", max: 300, label: "Message" },
    productName: { type: "string", max: 150, label: "Product" },
    quoteType: { type: "enum", values: ["standard", "custom"], label: "Quote type" },
    configuration: { type: "array", itemType: "object", label: "Configuration" },
    source: { type: "string", max: 120, label: "Source" },
  }),
  asyncHandler(async (req, res) => {
    const b = req.body;
    // Sanitise each configuration line's label/value (free user input).
    const configuration = Array.isArray(b.configuration)
      ? b.configuration
          .filter((l) => l && typeof l === "object")
          .map((l) => ({ label: stripTags(String(l.label ?? "")), value: stripTags(String(l.value ?? "")) }))
      : [];

    await prisma.quoteRequest.create({
      data: {
        name: stripTags(b.name),
        email: b.email,
        mobile: stripTags(b.mobile),
        company: stripTags(b.company),
        country: stripTags(b.country),
        city: stripTags(b.city),
        message: stripTags(b.message || ""),
        productName: stripTags(b.productName || "Air Receiver"),
        quoteType: b.quoteType === "custom" ? "custom" : "standard",
        configuration,
        source: stripTags(b.source || "Air Receiver quote"),
        quoteStatus: "new",
      },
    });
    return created(res, { message: "Thank you — your quote request has been received." });
  }),
);

/* Careers application (public write, multipart — fields + resume file). */
router.post(
  "/careers/apply",
  publicWriteLimiter,
  (req, res, next) => {
    resumeUpload.single("resume")(req, res, (err) => {
      if (err) {
        if (err.code === "LIMIT_FILE_SIZE")
          return next(new ApiError(400, "Resume is too large. Maximum size is 5MB.", "FILE_TOO_LARGE"));
        return next(err);
      }
      next();
    });
  },
  asyncHandler(async (req, res) => {
    const b = req.body || {};

    // Verify reCAPTCHA first; discard the uploaded resume if it fails.
    if (!(await verifyToken(b.recaptchaToken, req.ip))) {
      if (req.file) fs.unlink(path.join(resumeRoot, req.file.filename), () => {});
      throw ApiError.badRequest("Captcha verification failed. Please try again.");
    }

    const name = stripTags((b.name || "").trim());
    const email = (b.email || "").trim();
    const phone = (b.phone || "").replace(/\D/g, "");
    const role = stripTags((b.role || "").trim());
    const portfolio = (b.portfolio || "").trim();
    const message = stripTags((b.message || "").trim());

    const errors = {};
    if (name.length < 2) errors.name = "Please enter your full name.";
    if (!/^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/.test(email)) errors.email = "Please enter a valid email address.";
    if (!/^[6-9]\d{9}$/.test(phone)) errors.phone = "Enter a valid 10-digit mobile number.";
    if (!role) errors.role = "Please select a role.";
    if (!req.file) errors.resume = "Please attach your resume (PDF / DOC).";

    if (Object.keys(errors).length) {
      // Discard the uploaded file if the rest of the submission is invalid.
      if (req.file) fs.unlink(path.join(resumeRoot, req.file.filename), () => {});
      throw ApiError.validation(errors);
    }

    try {
      await prisma.jobApplication.create({
        data: {
          name,
          email,
          phone,
          role,
          portfolio: stripTags(portfolio).slice(0, 255),
          message,
          resumeUrl: `${env.apiUrl}/uploads/${req.file.filename}`,
          resumeName: req.file.originalname.slice(0, 255),
          source: "Careers page",
          appStatus: "new",
        },
      });
    } catch (err) {
      // Don't leave an orphaned resume on disk if the DB write fails.
      fs.unlink(path.join(resumeRoot, req.file.filename), () => {});
      throw err;
    }
    return created(res, { message: "Thank you — your application has been received." });
  }),
);

module.exports = router;
