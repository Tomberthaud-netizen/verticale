-- AlterTable
ALTER TABLE `PaiementSousTraitant` ADD COLUMN `notes` TEXT NULL;

-- CreateTable
CREATE TABLE `FacturePreparee` (
    `id` VARCHAR(191) NOT NULL,
    `entreprise` VARCHAR(191) NOT NULL DEFAULT 'VERTICALE',
    `devisId` VARCHAR(191) NOT NULL,
    `chantierId` VARCHAR(191) NULL,
    `paiementSousTraitantId` VARCHAR(191) NOT NULL,
    `montantHT` DOUBLE NOT NULL,
    `notes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `FacturePreparee_paiementSousTraitantId_key`(`paiementSousTraitantId`),
    INDEX `FacturePreparee_devisId_idx`(`devisId`),
    INDEX `FacturePreparee_chantierId_idx`(`chantierId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `FacturePreparee` ADD CONSTRAINT `FacturePreparee_devisId_fkey` FOREIGN KEY (`devisId`) REFERENCES `Devis`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FacturePreparee` ADD CONSTRAINT `FacturePreparee_chantierId_fkey` FOREIGN KEY (`chantierId`) REFERENCES `Chantier`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FacturePreparee` ADD CONSTRAINT `FacturePreparee_paiementSousTraitantId_fkey` FOREIGN KEY (`paiementSousTraitantId`) REFERENCES `PaiementSousTraitant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

