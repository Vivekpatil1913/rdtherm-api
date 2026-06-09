/* eslint-disable no-console */
require("dotenv").config();
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const prisma = require("../src/config/prisma");
const env = require("../src/config/env");
const data = require("./seedData");

const uploadRoot = path.resolve(process.cwd(), env.upload.dir, "seed");
fs.mkdirSync(uploadRoot, { recursive: true });

const imageCache = new Map();

/** Download a remote image into /uploads/seed and return its local API URL.
 *  Falls back to the original URL if the download fails (e.g. offline). */
async function localizeImage(remoteUrl) {
  if (!remoteUrl) return remoteUrl;
  if (imageCache.has(remoteUrl)) return imageCache.get(remoteUrl);

  const hash = crypto.createHash("md5").update(remoteUrl).digest("hex").slice(0, 16);
  try {
    const res = await fetch(remoteUrl);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const type = res.headers.get("content-type") || "image/jpeg";
    const ext = { "image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp", "image/gif": ".gif" }[type] || ".jpg";
    const buf = Buffer.from(await res.arrayBuffer());
    const filename = `${hash}${ext}`;
    fs.writeFileSync(path.join(uploadRoot, filename), buf);
    const localUrl = `${env.apiUrl}/uploads/seed/${filename}`;
    imageCache.set(remoteUrl, localUrl);
    process.stdout.write("·");
    return localUrl;
  } catch (err) {
    console.warn(`\n  ! image download failed (${remoteUrl}): ${err.message} — keeping remote URL`);
    imageCache.set(remoteUrl, remoteUrl);
    return remoteUrl;
  }
}

async function clearAll() {
  // Order respects FKs (productImage cascades with product).
  await prisma.auditLog.deleteMany({});
  await prisma.refreshToken.deleteMany({});
  await prisma.passwordReset.deleteMany({});
  await prisma.lead.deleteMany({});
  await prisma.testimonial.deleteMany({});
  await prisma.industry.deleteMany({});
  await prisma.productImage.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.blogPost.deleteMany({});
  await prisma.caseStudy.deleteMany({});
  await prisma.faq.deleteMany({});
  await prisma.teamMember.deleteMany({});
  await prisma.logo.deleteMany({});
  await prisma.jobOpening.deleteMany({});
  await prisma.socialLink.deleteMany({});
  await prisma.businessHour.deleteMany({});
  await prisma.siteSetting.deleteMany({});
}

async function main() {
  console.log("🌱 Seeding R&D Therm database…\n");

  console.log("• Clearing existing content…");
  await clearAll();

  // ── Admin user ──────────────────────────────────────────
  const passwordHash = await bcrypt.hash(env.seedAdmin.password, 12);
  await prisma.user.upsert({
    where: { email: env.seedAdmin.email.toLowerCase() },
    update: { name: env.seedAdmin.name, passwordHash, role: "admin", isActive: true },
    create: { name: env.seedAdmin.name, email: env.seedAdmin.email.toLowerCase(), passwordHash, role: "admin", avatarUrl: "https://i.pravatar.cc/120?img=5" },
  });
  console.log(`• Admin user ready → ${env.seedAdmin.email} / ${env.seedAdmin.password}`);

  process.stdout.write("• Downloading images ");

  // ── Testimonials ───────────────────────────────────────
  for (let i = 0; i < data.testimonials.length; i++) {
    const t = data.testimonials[i];
    await prisma.testimonial.create({
      data: { author: t.author, role: t.role, body: t.body, rating: t.rating, avatarUrl: await localizeImage(t.avatarUrl), isActive: true, sortOrder: i },
    });
  }

  // ── Industries ─────────────────────────────────────────
  for (let i = 0; i < data.industries.length; i++) {
    const x = data.industries[i];
    await prisma.industry.create({
      data: { key: x.key, label: x.label, description: x.description, coverUrl: await localizeImage(x.cover), isActive: true, sortOrder: i },
    });
  }

  // ── Logos ──────────────────────────────────────────────
  await prisma.logo.createMany({
    data: data.logos.map((l, i) => ({ name: l.name, href: l.href, kind: l.kind, imageUrl: null, isActive: true, sortOrder: i })),
  });

  // ── FAQs ───────────────────────────────────────────────
  await prisma.faq.createMany({
    data: data.faqs.map((f, i) => ({ question: f.question, answer: f.answer, isActive: true, sortOrder: i })),
  });

  // ── Team ───────────────────────────────────────────────
  for (let i = 0; i < data.team.length; i++) {
    const m = data.team[i];
    await prisma.teamMember.create({
      data: { name: m.name, role: m.role, bio: m.bio, photoUrl: await localizeImage(m.photo), group: m.group, isActive: true, sortOrder: i },
    });
  }

  // ── Case studies ───────────────────────────────────────
  for (let i = 0; i < data.caseStudies.length; i++) {
    const c = data.caseStudies[i];
    await prisma.caseStudy.create({
      data: { slug: c.slug, title: c.title, client: c.client, industry: c.industry, summary: c.summary, coverUrl: await localizeImage(c.cover), content: c.content, metrics: c.metrics, isActive: true, sortOrder: i },
    });
  }

  // ── Blogs ──────────────────────────────────────────────
  for (let i = 0; i < data.blogs.length; i++) {
    const b = data.blogs[i];
    await prisma.blogPost.create({
      data: { slug: b.slug, title: b.title, excerpt: b.excerpt, category: b.category, author: b.author, coverUrl: await localizeImage(b.cover), content: b.content, readTime: `${Math.max(1, Math.round(b.content.replace(/<[^>]*>/g, " ").split(/\s+/).length / 200))} min read`, views: b.views, publishedAt: new Date(b.date), isActive: b.status !== "draft", sortOrder: i },
    });
  }

  // ── Products (+ gallery images) ────────────────────────
  const DEFAULT_INCLUSIONS = [
    "Detailed mechanical design with FEA review.",
    "Mill-to-shop material traceability.",
    "Third-party inspection and code stamping.",
    "QA dossier and as-built drawings on despatch.",
  ];
  const gallery = [];
  for (const g of data.GALLERY) gallery.push({ ...g, url: await localizeImage(g.url) });

  for (let i = 0; i < data.products.length; i++) {
    const p = data.products[i];
    const cover = gallery[i % gallery.length].url;
    await prisma.product.create({
      data: {
        slug: p.slug,
        title: p.title,
        summary: p.summary,
        coverUrl: cover,
        content: `<p>${p.summary}</p><h2>How we build it</h2><p>Every unit starts from a process datasheet and is validated against the applicable code before fabrication.</p>`,
        featured: p.featured,
        specs: p.specs,
        applications: p.applications,
        materials: p.materials,
        compliance: p.compliance,
        benefits: p.benefits,
        inclusions: p.inclusions || DEFAULT_INCLUSIONS,
        isActive: true,
        sortOrder: i,
        images: { create: gallery.map((g, gi) => ({ url: g.url, alt: g.alt, label: g.label, sortOrder: gi })) },
      },
    });
  }

  // ── Careers ────────────────────────────────────────────
  await prisma.jobOpening.createMany({
    data: data.careers.map((c, i) => ({
      title: c.title,
      department: c.department,
      location: c.location,
      type: c.type,
      description: c.description,
      isActive: c.status !== "draft",
      sortOrder: i,
    })),
  });

  // ── Leads ──────────────────────────────────────────────
  await prisma.lead.createMany({
    data: data.leads.map((l, i) => ({ name: l.name, email: l.email, phone: l.phone, company: l.company, subject: l.subject, message: l.message, source: l.source, leadStatus: l.leadStatus, isActive: true, sortOrder: i, createdAt: new Date(l.createdAt) })),
  });

  // ── Settings + social + hours ──────────────────────────
  await prisma.siteSetting.create({
    data: {
      name: data.settings.name,
      shortName: data.settings.shortName,
      parent: data.settings.parent,
      tagline: data.settings.tagline,
      description: data.settings.description,
      address: data.settings.address,
      phone: data.settings.phone,
      email: data.settings.email,
    },
  });
  await prisma.socialLink.createMany({ data: data.settings.social.map((s, i) => ({ label: s.label, href: s.href, sortOrder: i })) });
  await prisma.businessHour.createMany({ data: data.settings.hours.map((h, i) => ({ label: h.label, value: h.value, sortOrder: i })) });

  // ── A few seed activity entries for the dashboard feed ─
  await prisma.auditLog.createMany({
    data: [
      { actor: "Priya Iyer", action: "published", target: "Selecting the right heat exchanger", module: "Blogs" },
      { actor: "Amit Patil", action: "updated", target: "Pressure Vessels", module: "Products" },
      { actor: "Devansh Rao", action: "added", target: "Tomáš Novák", module: "Leads" },
      { actor: "Riya Sharma", action: "archived", target: "Old testimonial", module: "Testimonials" },
    ],
  });

  console.log("\n\n✅ Seed complete.");
}

main()
  .catch((e) => {
    console.error("\n❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
