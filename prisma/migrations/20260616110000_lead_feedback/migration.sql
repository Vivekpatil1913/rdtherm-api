-- Closing reason / feedback captured when a lead is moved to the "closed" stage.
ALTER TABLE `leads` ADD COLUMN `feedback` VARCHAR(255) NULL;
