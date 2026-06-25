-- Job applications submitted from the Careers page (with an uploaded resume).
CREATE TABLE `job_applications` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(150) NOT NULL,
  `email` VARCHAR(190) NOT NULL,
  `phone` VARCHAR(40) NOT NULL DEFAULT '',
  `role` VARCHAR(150) NOT NULL,
  `portfolio` VARCHAR(255) NOT NULL DEFAULT '',
  `message` TEXT NOT NULL,
  `resume_url` VARCHAR(500) NOT NULL,
  `resume_name` VARCHAR(255) NOT NULL DEFAULT '',
  `source` VARCHAR(120) NOT NULL DEFAULT 'Careers page',
  `app_status` VARCHAR(20) NOT NULL DEFAULT 'new',
  `is_active` BOOLEAN NOT NULL DEFAULT true,
  `is_deleted` BOOLEAN NOT NULL DEFAULT false,
  `sort_order` INTEGER NOT NULL DEFAULT 0,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,

  PRIMARY KEY (`id`),
  INDEX `job_applications_is_deleted_app_status_created_at_idx` (`is_deleted`, `app_status`, `created_at`),
  INDEX `job_applications_is_deleted_created_at_idx` (`is_deleted`, `created_at`),
  INDEX `job_applications_is_deleted_sort_order_idx` (`is_deleted`, `sort_order`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
