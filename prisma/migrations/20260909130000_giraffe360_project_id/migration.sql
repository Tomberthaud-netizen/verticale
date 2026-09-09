-- AlterTable
ALTER TABLE `Chantier` ADD COLUMN `giraffe360ProjectId` VARCHAR(191) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `Chantier_giraffe360ProjectId_key` ON `Chantier`(`giraffe360ProjectId`);
