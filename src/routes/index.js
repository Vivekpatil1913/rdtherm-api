const express = require("express");

const authRoutes = require("../modules/auth/auth.routes");
const resources = require("../modules/resources");
const settings = require("../modules/settings/settings.routes");
const activityRoutes = require("../modules/activity/activity.routes");
const dashboardRoutes = require("../modules/dashboard/dashboard.routes");
const uploadRoutes = require("../modules/uploads/uploads.routes");
const publicRoutes = require("../modules/public/public.routes");

const router = express.Router();

// Public, unauthenticated (website + contact form).
router.use("/public", publicRoutes);

// Auth.
router.use("/auth", authRoutes);

// Protected admin resources.
router.use("/testimonials", resources.testimonials);
router.use("/industries", resources.industries);
router.use("/products", resources.products);
router.use("/blogs", resources.blogs);
router.use("/case-studies", resources.caseStudies);
router.use("/faqs", resources.faqs);
router.use("/team", resources.team);
router.use("/logos", resources.logos);
router.use("/careers", resources.careers);
router.use("/leads", resources.leads);
router.use("/quotes", resources.quotes);

router.use("/settings", settings.router);
router.use("/activity", activityRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/uploads", uploadRoutes);

module.exports = router;
