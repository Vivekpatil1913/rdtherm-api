-- Decision note captured when an application is moved to the "rejected" stage.
ALTER TABLE `job_applications` ADD COLUMN `feedback` VARCHAR(255) NULL;
