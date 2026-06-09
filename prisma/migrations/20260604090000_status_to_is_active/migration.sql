-- Replace the string `status` column with a boolean `is_active` (1 = active, 0 = inactive).
ALTER TABLE `features`      ADD COLUMN `is_active` BOOLEAN NOT NULL DEFAULT true, DROP COLUMN `status`;
ALTER TABLE `testimonials`  ADD COLUMN `is_active` BOOLEAN NOT NULL DEFAULT true, DROP COLUMN `status`;
ALTER TABLE `industries`    ADD COLUMN `is_active` BOOLEAN NOT NULL DEFAULT true, DROP COLUMN `status`;
ALTER TABLE `products`      ADD COLUMN `is_active` BOOLEAN NOT NULL DEFAULT true, DROP COLUMN `status`;
ALTER TABLE `blog_posts`    ADD COLUMN `is_active` BOOLEAN NOT NULL DEFAULT true, DROP COLUMN `status`;
ALTER TABLE `case_studies`  ADD COLUMN `is_active` BOOLEAN NOT NULL DEFAULT true, DROP COLUMN `status`;
ALTER TABLE `faqs`          ADD COLUMN `is_active` BOOLEAN NOT NULL DEFAULT true, DROP COLUMN `status`;
ALTER TABLE `team_members`  ADD COLUMN `is_active` BOOLEAN NOT NULL DEFAULT true, DROP COLUMN `status`;
ALTER TABLE `logos`         ADD COLUMN `is_active` BOOLEAN NOT NULL DEFAULT true, DROP COLUMN `status`;
ALTER TABLE `job_openings`  ADD COLUMN `is_active` BOOLEAN NOT NULL DEFAULT true, DROP COLUMN `status`;
ALTER TABLE `leads`         ADD COLUMN `is_active` BOOLEAN NOT NULL DEFAULT true, DROP COLUMN `status`;
