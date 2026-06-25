-- AlterTable
-- TEXT columns cannot carry a DEFAULT on MySQL (error 1101), so the column is
-- added as nullable. The app reads it as `cardImageUrl || coverUrl`, so NULL on
-- existing rows simply falls back to the cover image.
ALTER TABLE `case_studies` ADD COLUMN `card_image_url` TEXT NULL;
