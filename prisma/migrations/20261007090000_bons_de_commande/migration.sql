-- CreateTable
CREATE TABLE `BonCommande` (
    `id` VARCHAR(191) NOT NULL,
    `numero` VARCHAR(191) NOT NULL,
    `entreprise` VARCHAR(191) NOT NULL DEFAULT 'VERTICALE',
    `devisId` VARCHAR(191) NULL,
    `devisNumero` VARCHAR(191) NOT NULL,
    `intitule` VARCHAR(191) NOT NULL,
    `adresse` TEXT NULL,
    `sousTraitantId` VARCHAR(191) NOT NULL,
    `diviseur` DOUBLE NOT NULL,
    `dateBon` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `notes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `BonCommande_numero_key`(`numero`),
    INDEX `BonCommande_devisId_idx`(`devisId`),
    INDEX `BonCommande_sousTraitantId_idx`(`sousTraitantId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LigneBonCommande` (
    `id` VARCHAR(191) NOT NULL,
    `bonCommandeId` VARCHAR(191) NOT NULL,
    `designation` VARCHAR(191) NOT NULL,
    `detail` TEXT NULL,
    `unite` VARCHAR(191) NULL,
    `quantite` DOUBLE NOT NULL,
    `prixUnitaire` DOUBLE NOT NULL,
    `ordre` INTEGER NOT NULL,

    INDEX `LigneBonCommande_bonCommandeId_idx`(`bonCommandeId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `BonCommande` ADD CONSTRAINT `BonCommande_devisId_fkey` FOREIGN KEY (`devisId`) REFERENCES `Devis`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BonCommande` ADD CONSTRAINT `BonCommande_sousTraitantId_fkey` FOREIGN KEY (`sousTraitantId`) REFERENCES `SousTraitant`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LigneBonCommande` ADD CONSTRAINT `LigneBonCommande_bonCommandeId_fkey` FOREIGN KEY (`bonCommandeId`) REFERENCES `BonCommande`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

