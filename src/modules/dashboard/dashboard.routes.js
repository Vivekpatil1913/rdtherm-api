const express = require("express");
const prisma = require("../../config/prisma");
const asyncHandler = require("../../utils/asyncHandler");
const { ok } = require("../../utils/response");
const { requireAuth } = require("../../middleware/auth");

const router = express.Router();

const live = { isDeleted: false };

/** Aggregated counts for the dashboard — one round trip. */
router.get(
  "/stats",
  requireAuth,
  asyncHandler(async (req, res) => {
    const [
      products,
      blogs,
      caseStudies,
      testimonials,
      team,
      faqs,
      industries,
      logos,
      careers,
      leads,
      leadsNew,
      quotesNew,
      applicationsNew,
      activeBlogs,
      activeProducts,
      recentLeads,
    ] = await Promise.all([
      prisma.product.count({ where: live }),
      prisma.blogPost.count({ where: live }),
      prisma.caseStudy.count({ where: live }),
      prisma.testimonial.count({ where: live }),
      prisma.teamMember.count({ where: live }),
      prisma.faq.count({ where: live }),
      prisma.industry.count({ where: live }),
      prisma.logo.count({ where: live }),
      prisma.jobOpening.count({ where: live }),
      prisma.lead.count({ where: live }),
      prisma.lead.count({ where: { ...live, leadStatus: "new" } }),
      prisma.quoteRequest.count({ where: { ...live, quoteStatus: "new" } }),
      prisma.jobApplication.count({ where: { ...live, appStatus: "new" } }),
      prisma.blogPost.count({ where: { ...live, isActive: true } }),
      prisma.product.count({ where: { ...live, isActive: true } }),
      prisma.lead.findMany({
        where: live,
        orderBy: { createdAt: "desc" },
        take: 6,
        select: { id: true, name: true, email: true, company: true, leadStatus: true, createdAt: true },
      }),
    ]);

    return ok(res, {
      totals: { products, blogs, caseStudies, testimonials, team, faqs, industries, logos, careers, leads },
      leadsNew,
      quotesNew,
      applicationsNew,
      activeBlogs,
      activeProducts,
      recentLeads,
    });
  }),
);

module.exports = router;
