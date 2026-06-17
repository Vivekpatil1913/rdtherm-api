-- Add an "active" flag so a social icon can be hidden from the website
-- without deleting it (its URL is preserved while toggled off).
ALTER TABLE `social_links` ADD COLUMN `active` BOOLEAN NOT NULL DEFAULT true;
