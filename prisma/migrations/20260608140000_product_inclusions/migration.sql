-- Per-product "Always included" list (previously a static constant on the website).
ALTER TABLE `products` ADD COLUMN `inclusions` JSON NULL;

-- Backfill existing products with the standard inclusions.
UPDATE `products`
SET `inclusions` = '["Detailed mechanical design with FEA review.","Mill-to-shop material traceability.","Third-party inspection and code stamping.","QA dossier and as-built drawings on despatch."]'
WHERE `inclusions` IS NULL;
