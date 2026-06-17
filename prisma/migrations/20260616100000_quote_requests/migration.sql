-- Quote requests submitted from the Air Receiver configurator and custom builder.
-- Stores the customer details plus the selected configuration (label/value pairs) as JSON.
CREATE TABLE `quote_requests` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(150) NOT NULL,
  `email` VARCHAR(190) NOT NULL,
  `mobile` VARCHAR(40) NOT NULL,
  `company` VARCHAR(190) NOT NULL DEFAULT '',
  `country` VARCHAR(120) NOT NULL DEFAULT '',
  `city` VARCHAR(120) NOT NULL DEFAULT '',
  `message` TEXT NOT NULL,
  `product_name` VARCHAR(150) NOT NULL DEFAULT 'Air Receiver',
  `quote_type` VARCHAR(20) NOT NULL DEFAULT 'standard',
  `configuration` JSON NULL,
  `source` VARCHAR(120) NOT NULL DEFAULT 'Website',
  `quote_status` VARCHAR(20) NOT NULL DEFAULT 'new',
  `is_active` BOOLEAN NOT NULL DEFAULT true,
  `is_deleted` BOOLEAN NOT NULL DEFAULT false,
  `sort_order` INTEGER NOT NULL DEFAULT 0,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,

  PRIMARY KEY (`id`),
  INDEX `quote_requests_is_deleted_quote_status_created_at_idx` (`is_deleted`, `quote_status`, `created_at`),
  INDEX `quote_requests_is_deleted_created_at_idx` (`is_deleted`, `created_at`),
  INDEX `quote_requests_is_deleted_sort_order_idx` (`is_deleted`, `sort_order`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
