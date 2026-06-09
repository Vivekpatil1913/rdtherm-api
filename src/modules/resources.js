const { createCrudRouter } = require("./crud.factory");
const { slugify, sanitizeRichText, readingTime } = require("../utils/helpers");

const arr = (v) => (Array.isArray(v) ? v : []);
const dateOnly = (d) => (d ? new Date(d).toISOString().slice(0, 10) : null);

/** Common base fields every record exposes to the admin (id, isActive, order, timestamps). */
function base(r) {
  return {
    id: r.id,
    isActive: r.isActive,
    order: r.sortOrder,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  };
}

/** New records are active by default; create can opt out via isActive. */
const activeOnCreate = (b) => (b.isActive !== undefined ? !!b.isActive : true);

/* ───────────────────────── Testimonials ───────────────────────── */
const testimonialSchema = {
  author: { type: "name", required: true, min: 2, max: 50, label: "Author" },
  role: { type: "string", required: true, max: 50, label: "Role" },
  body: { type: "string", required: true, min: 10, max: 300, label: "Testimonial" },
  rating: { type: "integer", min: 1, max: 5, label: "Rating" },
  avatarUrl: { type: "string", required: true, label: "Avatar" },
};
const testimonials = createCrudRouter({
  model: "testimonial",
  singular: "Testimonial",
  module: "Testimonials",
  searchFields: ["author", "role", "body"],
  sortMap: { author: "author", rating: "rating" },
  toResponse: (r) => ({ ...base(r), author: r.author, role: r.role, body: r.body, rating: r.rating, avatarUrl: r.avatarUrl || "" }),
  toCreate: (b) => ({ author: b.author, role: b.role, body: b.body, rating: Number(b.rating) || 5, avatarUrl: b.avatarUrl || null, isActive: activeOnCreate(b) }),
  toUpdate: (b) => ({ author: b.author, role: b.role, body: b.body, rating: Number(b.rating) || 5, avatarUrl: b.avatarUrl || null }),
  createSchema: testimonialSchema,
  updateSchema: testimonialSchema,
});

/* ───────────────────────── Industries ───────────────────────── */
const industrySchema = {
  label: { type: "string", required: true, min: 2, max: 50, label: "Industry name" },
  description: { type: "string", required: true, min: 10, max: 300, label: "Description" },
  key: { type: "string", max: 120, label: "Key" },
  cover: { type: "string", required: true, label: "Cover image" },
};
const industries = createCrudRouter({
  model: "industry",
  singular: "Industry",
  module: "Industries",
  uniqueField: "key",
  searchFields: ["label", "description", "key"],
  sortMap: { label: "label" },
  toResponse: (r) => ({ ...base(r), key: r.key, label: r.label, description: r.description, cover: r.coverUrl }),
  toCreate: (b) => ({ key: b.key || slugify(b.label), label: b.label, description: b.description, coverUrl: b.cover || "", isActive: activeOnCreate(b) }),
  toUpdate: (b) => ({ key: b.key || slugify(b.label), label: b.label, description: b.description, coverUrl: b.cover || "" }),
  createSchema: industrySchema,
  updateSchema: industrySchema,
});

/* ───────────────────────── Products ───────────────────────── */
const productSchema = {
  title: { type: "string", required: true, min: 2, max: 50, label: "Product name" },
  summary: { type: "string", required: true, min: 10, max: 300, label: "Summary" },
  cover: { type: "string", required: true, label: "Cover image" },
  content: { type: "html", required: true, label: "Content" },
  slug: { type: "string", max: 190, label: "Slug" },
  specs: { type: "array", itemType: "string", required: true, min: 1, label: "Specs" },
  applications: { type: "array", itemType: "string", required: true, min: 1, label: "Applications" },
  materials: { type: "array", itemType: "string", required: true, min: 1, label: "Materials" },
  compliance: { type: "array", itemType: "string", required: true, min: 1, label: "Compliance" },
  benefits: { type: "array", itemType: "string", required: true, min: 1, label: "Benefits" },
  inclusions: { type: "array", itemType: "string", required: true, min: 1, label: "Always included" },
  images: { type: "array", itemType: "object", required: true, min: 1, max: 5, label: "Gallery images" },
  featured: { type: "boolean", label: "Featured" },
};
const MAX_GALLERY_IMAGES = 5;
const productImageWrites = (images) =>
  arr(images)
    .filter((im) => im && im.url)
    .slice(0, MAX_GALLERY_IMAGES)
    .map((im, i) => ({ url: im.url, alt: im.alt || "", label: im.label || null, sortOrder: i }));

const products = createCrudRouter({
  model: "product",
  singular: "Product",
  module: "Products",
  uniqueField: "slug",
  searchFields: ["title", "summary", "slug"],
  filters: { featured: "featured" },
  sortMap: { title: "title" },
  include: { images: { orderBy: { sortOrder: "asc" } } },
  listOmit: ["content"],
  toResponse: (r) => ({
    ...base(r),
    slug: r.slug,
    title: r.title,
    summary: r.summary,
    cover: r.coverUrl,
    content: r.content,
    featured: r.featured,
    specs: arr(r.specs),
    applications: arr(r.applications),
    materials: arr(r.materials),
    compliance: arr(r.compliance),
    benefits: arr(r.benefits),
    inclusions: arr(r.inclusions),
    images: (r.images || []).map((i) => ({ url: i.url, alt: i.alt, label: i.label || undefined })),
  }),
  toCreate: (b) => ({
    slug: b.slug || slugify(b.title),
    title: b.title,
    summary: b.summary,
    coverUrl: b.cover || "",
    content: sanitizeRichText(b.content),
    featured: !!b.featured,
    specs: arr(b.specs),
    applications: arr(b.applications),
    materials: arr(b.materials),
    compliance: arr(b.compliance),
    benefits: arr(b.benefits),
    inclusions: arr(b.inclusions),
    isActive: activeOnCreate(b),
    images: { create: productImageWrites(b.images) },
  }),
  toUpdate: (b) => ({
    slug: b.slug || slugify(b.title),
    title: b.title,
    summary: b.summary,
    coverUrl: b.cover || "",
    content: sanitizeRichText(b.content),
    featured: !!b.featured,
    specs: arr(b.specs),
    applications: arr(b.applications),
    materials: arr(b.materials),
    compliance: arr(b.compliance),
    benefits: arr(b.benefits),
    inclusions: arr(b.inclusions),
    images: { deleteMany: {}, create: productImageWrites(b.images) },
  }),
  createSchema: productSchema,
  updateSchema: productSchema,
});

/* ───────────────────────── Blogs ───────────────────────── */
const blogSchema = {
  title: { type: "string", required: true, min: 6, max: 50, label: "Title" },
  excerpt: { type: "string", required: true, max: 150, label: "Excerpt" },
  cover: { type: "string", required: true, label: "Cover image" },
  content: { type: "html", label: "Content" },
  category: { type: "string", max: 80, label: "Category" },
  author: { type: "string", max: 50, label: "Author" },
  date: { type: "string", label: "Publish date" },
  slug: { type: "string", max: 190, label: "Slug" },
};
const blogs = createCrudRouter({
  model: "blogPost",
  singular: "Article",
  module: "Blogs",
  uniqueField: "slug",
  searchFields: ["title", "excerpt", "category", "author"],
  filters: { category: "category" },
  sortMap: { title: "title", date: "publishedAt", views: "views" },
  listOmit: ["content"],
  toResponse: (r) => ({
    ...base(r),
    slug: r.slug,
    title: r.title,
    excerpt: r.excerpt,
    category: r.category,
    author: r.author,
    date: dateOnly(r.publishedAt) || dateOnly(r.createdAt),
    readTime: r.readTime,
    cover: r.coverUrl,
    content: r.content,
    views: r.views,
  }),
  toCreate: (b) => ({
    slug: b.slug || slugify(b.title),
    title: b.title,
    excerpt: b.excerpt,
    category: b.category || "Manufacturing",
    author: b.author || "R&D Therm Editorial",
    coverUrl: b.cover || "",
    content: sanitizeRichText(b.content),
    readTime: readingTime(b.content),
    views: 0,
    publishedAt: b.date ? new Date(b.date) : new Date(),
    isActive: activeOnCreate(b),
  }),
  toUpdate: (b) => ({
    slug: b.slug || slugify(b.title),
    title: b.title,
    excerpt: b.excerpt,
    category: b.category,
    author: b.author,
    coverUrl: b.cover || "",
    content: sanitizeRichText(b.content),
    readTime: readingTime(b.content),
    publishedAt: b.date ? new Date(b.date) : undefined,
  }),
  createSchema: blogSchema,
  updateSchema: blogSchema,
});

/* ───────────────────────── Case studies ───────────────────────── */
const caseSchema = {
  title: { type: "string", required: true, min: 6, max: 50, label: "Title" },
  client: { type: "string", required: true, max: 50, label: "Client" },
  summary: { type: "string", required: true, min: 10, max: 300, label: "Summary" },
  industry: { type: "string", required: true, max: 50, label: "Industry" },
  cover: { type: "string", required: true, label: "Cover image" },
  content: { type: "html", label: "Content" },
  metrics: { type: "array", itemType: "object", label: "Metrics" },
};
const caseStudies = createCrudRouter({
  model: "caseStudy",
  singular: "Case Study",
  module: "Case Studies",
  uniqueField: "slug",
  searchFields: ["title", "client", "industry", "summary"],
  sortMap: { title: "title" },
  listOmit: ["content"],
  toResponse: (r) => ({
    ...base(r),
    slug: r.slug,
    title: r.title,
    client: r.client,
    industry: r.industry,
    summary: r.summary,
    cover: r.coverUrl,
    content: r.content,
    metrics: arr(r.metrics),
  }),
  toCreate: (b) => ({
    slug: b.slug || slugify(b.title),
    title: b.title,
    client: b.client,
    industry: b.industry || "",
    summary: b.summary,
    coverUrl: b.cover || "",
    content: sanitizeRichText(b.content),
    metrics: arr(b.metrics),
    isActive: activeOnCreate(b),
  }),
  toUpdate: (b) => ({
    slug: b.slug || slugify(b.title),
    title: b.title,
    client: b.client,
    industry: b.industry || "",
    summary: b.summary,
    coverUrl: b.cover || "",
    content: sanitizeRichText(b.content),
    metrics: arr(b.metrics),
  }),
  createSchema: caseSchema,
  updateSchema: caseSchema,
});

/* ───────────────────────── FAQs ───────────────────────── */
const faqSchema = {
  question: { type: "string", required: true, min: 8, max: 100, label: "Question" },
  answer: { type: "string", required: true, min: 15, max: 250, label: "Answer" },
};
const faqs = createCrudRouter({
  model: "faq",
  singular: "FAQ",
  module: "FAQs",
  searchFields: ["question", "answer"],
  toResponse: (r) => ({ ...base(r), question: r.question, answer: r.answer }),
  toCreate: (b) => ({ question: b.question, answer: b.answer, isActive: activeOnCreate(b) }),
  toUpdate: (b) => ({ question: b.question, answer: b.answer }),
  createSchema: faqSchema,
  updateSchema: faqSchema,
});

/* ───────────────────────── Team ───────────────────────── */
const teamSchema = {
  name: { type: "name", required: true, min: 2, max: 50, label: "Name" },
  role: { type: "string", required: true, max: 50, label: "Role" },
  bio: { type: "string", required: true, min: 10, max: 510, label: "Bio" },
  photo: { type: "string", required: true, label: "Photo" },
  group: { type: "enum", values: ["director", "team"], label: "Group" },
};
const team = createCrudRouter({
  model: "teamMember",
  singular: "Member",
  module: "Team",
  searchFields: ["name", "role", "bio"],
  filters: { group: "group" },
  sortMap: { name: "name" },
  toResponse: (r) => ({ ...base(r), name: r.name, role: r.role, bio: r.bio, photo: r.photoUrl, group: r.group }),
  toCreate: (b) => ({ name: b.name, role: b.role, bio: b.bio, photoUrl: b.photo || "", group: b.group || "team", isActive: activeOnCreate(b) }),
  toUpdate: (b) => ({ name: b.name, role: b.role, bio: b.bio, photoUrl: b.photo || "", group: b.group }),
  createSchema: teamSchema,
  updateSchema: teamSchema,
});

/* ───────────────────────── Logos ───────────────────────── */
const logoSchema = {
  name: { type: "string", required: true, max: 190, label: "Name" },
  imageUrl: { type: "string", required: true, label: "Logo image" },
  kind: { type: "enum", values: ["client", "integration", "certification"], label: "Type" },
};
const logos = createCrudRouter({
  model: "logo",
  singular: "Logo",
  module: "Logos",
  searchFields: ["name"],
  filters: { kind: "kind" },
  sortMap: { name: "name" },
  toResponse: (r) => ({ ...base(r), name: r.name, imageUrl: r.imageUrl || "", kind: r.kind }),
  toCreate: (b) => ({ name: b.name, imageUrl: b.imageUrl || null, kind: b.kind || "client", isActive: activeOnCreate(b) }),
  toUpdate: (b) => ({ name: b.name, imageUrl: b.imageUrl || null, kind: b.kind || "client" }),
  createSchema: logoSchema,
  updateSchema: logoSchema,
});

/* ───────────────────────── Careers ───────────────────────── */
const jobSchema = {
  title: { type: "string", required: true, min: 4, max: 50, label: "Job title" },
  description: { type: "string", required: true, min: 15, max: 200, label: "Description" },
  department: { type: "string", max: 120, label: "Department" },
  location: { type: "string", required: true, max: 100, label: "Location" },
  type: { type: "string", max: 60, label: "Type" },
};
const careers = createCrudRouter({
  model: "jobOpening",
  singular: "Opening",
  module: "Careers",
  searchFields: ["title", "department", "location"],
  filters: { department: "department" },
  sortMap: { title: "title", department: "department" },
  toResponse: (r) => ({ ...base(r), title: r.title, department: r.department, location: r.location, type: r.type, description: r.description }),
  toCreate: (b) => ({ title: b.title, department: b.department || "Engineering", location: b.location || "Nashik, India", type: b.type || "Full-time", description: b.description, isActive: activeOnCreate(b) }),
  toUpdate: (b) => ({ title: b.title, department: b.department, location: b.location, type: b.type, description: b.description }),
  createSchema: jobSchema,
  updateSchema: jobSchema,
});

/* ───────────────────────── Leads ───────────────────────── */
const leads = createCrudRouter({
  model: "lead",
  singular: "Lead",
  module: "Leads",
  searchFields: ["name", "email", "company", "subject"],
  filters: { leadStatus: "leadStatus" },
  statusField: "leadStatus",
  sortMap: { name: "name", createdAt: "createdAt" },
  toResponse: (r) => ({
    id: r.id,
    isActive: r.isActive,
    order: r.sortOrder,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
    name: r.name,
    email: r.email,
    phone: r.phone,
    company: r.company,
    subject: r.subject,
    message: r.message,
    source: r.source,
    leadStatus: r.leadStatus,
  }),
  toCreate: (b) => ({
    name: b.name,
    email: b.email,
    phone: b.phone || "",
    company: b.company || "",
    subject: b.subject || "",
    message: b.message,
    source: b.source || "Admin",
    leadStatus: b.leadStatus || "new",
    isActive: true,
  }),
  toUpdate: (b) => ({ leadStatus: b.leadStatus }),
  updateSchema: {
    leadStatus: { type: "enum", required: true, values: ["new", "in-progress", "qualified", "closed"], label: "Status" },
  },
});

module.exports = {
  testimonials,
  industries,
  products,
  blogs,
  caseStudies,
  faqs,
  team,
  logos,
  careers,
  leads,
};
