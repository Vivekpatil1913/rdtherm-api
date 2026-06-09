-- Performance indexes for server-side pagination / filtering / sorting at scale.
-- Composite indexes lead with is_deleted (always filtered) + the sort/filter column.

CREATE INDEX `features_is_deleted_sort_order_idx` ON `features` (`is_deleted`, `sort_order`);
CREATE INDEX `features_is_deleted_group_idx` ON `features` (`is_deleted`, `group`);

CREATE INDEX `testimonials_is_deleted_sort_order_idx` ON `testimonials` (`is_deleted`, `sort_order`);
CREATE INDEX `testimonials_is_deleted_is_active_idx` ON `testimonials` (`is_deleted`, `is_active`);

CREATE INDEX `industries_is_deleted_sort_order_idx` ON `industries` (`is_deleted`, `sort_order`);
CREATE INDEX `industries_key_idx` ON `industries` (`key`);

CREATE INDEX `products_is_deleted_sort_order_idx` ON `products` (`is_deleted`, `sort_order`);
CREATE INDEX `products_is_deleted_is_active_idx` ON `products` (`is_deleted`, `is_active`);
CREATE INDEX `products_is_deleted_featured_idx` ON `products` (`is_deleted`, `featured`);
CREATE INDEX `products_slug_idx` ON `products` (`slug`);

CREATE INDEX `blog_posts_is_deleted_sort_order_idx` ON `blog_posts` (`is_deleted`, `sort_order`);
CREATE INDEX `blog_posts_is_deleted_published_at_idx` ON `blog_posts` (`is_deleted`, `published_at`);
CREATE INDEX `blog_posts_is_deleted_views_idx` ON `blog_posts` (`is_deleted`, `views`);
CREATE INDEX `blog_posts_is_deleted_category_idx` ON `blog_posts` (`is_deleted`, `category`);
CREATE INDEX `blog_posts_slug_idx` ON `blog_posts` (`slug`);

CREATE INDEX `case_studies_is_deleted_sort_order_idx` ON `case_studies` (`is_deleted`, `sort_order`);
CREATE INDEX `case_studies_slug_idx` ON `case_studies` (`slug`);

CREATE INDEX `faqs_is_deleted_sort_order_idx` ON `faqs` (`is_deleted`, `sort_order`);

CREATE INDEX `team_members_is_deleted_sort_order_idx` ON `team_members` (`is_deleted`, `sort_order`);
CREATE INDEX `team_members_is_deleted_group_idx` ON `team_members` (`is_deleted`, `group`);

CREATE INDEX `logos_is_deleted_kind_sort_order_idx` ON `logos` (`is_deleted`, `kind`, `sort_order`);
CREATE INDEX `logos_is_deleted_sort_order_idx` ON `logos` (`is_deleted`, `sort_order`);

CREATE INDEX `job_openings_is_deleted_sort_order_idx` ON `job_openings` (`is_deleted`, `sort_order`);
CREATE INDEX `job_openings_is_deleted_department_idx` ON `job_openings` (`is_deleted`, `department`);

CREATE INDEX `leads_is_deleted_lead_status_created_at_idx` ON `leads` (`is_deleted`, `lead_status`, `created_at`);
CREATE INDEX `leads_is_deleted_created_at_idx` ON `leads` (`is_deleted`, `created_at`);
CREATE INDEX `leads_is_deleted_sort_order_idx` ON `leads` (`is_deleted`, `sort_order`);
