-- AlterTable
ALTER TABLE `Phase` MODIFY `type` ENUM('DEMOLITION', 'RENOVATION', 'AMENAGEMENT', 'DECORATION', 'PERSONNALISEE') NOT NULL;

-- AlterTable
ALTER TABLE `Chantier` ADD COLUMN `etage` VARCHAR(191) NULL,
    ADD COLUMN `porte` VARCHAR(191) NULL,
    ADD COLUMN `codes` TEXT NULL,
    ADD COLUMN `emplacementCles` TEXT NULL;

-- CreateTable
CREATE TABLE `ModeleRenovation` (
    `id` VARCHAR(191) NOT NULL,
    `nom` VARCHAR(191) NOT NULL,
    `coutMoyenM2` DOUBLE NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `ModeleRenovation_nom_key`(`nom`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
