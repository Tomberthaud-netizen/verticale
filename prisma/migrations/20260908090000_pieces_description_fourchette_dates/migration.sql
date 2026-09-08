-- AlterTable
ALTER TABLE `Chantier` ADD COLUMN `nombrePieces` INTEGER NULL, ADD COLUMN `description` TEXT NULL;

-- AlterTable
ALTER TABLE `DateImportante` ADD COLUMN `dateFin` DATETIME(3) NULL;
