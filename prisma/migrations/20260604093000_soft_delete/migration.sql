-- Soft delete: add `is_deleted` (1 = deleted, 0 = active) to every content table.
ALTER TABLE `features`      ADD COLUMN `is_deleted` BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE `testimonials`  ADD COLUMN `is_deleted` BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE `industries`    ADD COLUMN `is_deleted` BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE `products`      ADD COLUMN `is_deleted` BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE `blog_posts`    ADD COLUMN `is_deleted` BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE `case_studies`  ADD COLUMN `is_deleted` BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE `faqs`          ADD COLUMN `is_deleted` BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE `team_members`  ADD COLUMN `is_deleted` BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE `logos`         ADD COLUMN `is_deleted` BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE `job_openings`  ADD COLUMN `is_deleted` BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE `leads`         ADD COLUMN `is_deleted` BOOLEAN NOT NULL DEFAULT false;

-- Drop slug/key UNIQUE constraints — uniqueness is now enforced in the API layer
-- (only among non-deleted records), so a soft-deleted slug/key can be reused.
ALTER TABLE `industries`   DROP INDEX `industries_key_key`;
ALTER TABLE `products`     DROP INDEX `products_slug_key`;
ALTER TABLE `blog_posts`   DROP INDEX `blog_posts_slug_key`;
ALTER TABLE `case_studies` DROP INDEX `case_studies_slug_key`;
