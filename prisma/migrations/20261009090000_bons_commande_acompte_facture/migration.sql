-- AlterTable
ALTER TABLE `BonCommande` ADD COLUMN `chantierId` VARCHAR(191) NULL,
    ADD COLUMN `envoyeLe` DATETIME(3) NULL,
    ADD COLUMN `paiementSousTraitantId` VARCHAR(191) NULL,
    MODIFY `devisNumero` VARCHAR(191) NULL,
    MODIFY `diviseur` DOUBLE NULL;

-- AlterTable
ALTER TABLE `Facture` ADD COLUMN `bonCommandeId` VARCHAR(191) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `BonCommande_paiementSousTraitantId_key` ON `BonCommande`(`paiementSousTraitantId`);

-- CreateIndex
CREATE INDEX `BonCommande_chantierId_idx` ON `BonCommande`(`chantierId`);

-- CreateIndex
CREATE UNIQUE INDEX `Facture_bonCommandeId_key` ON `Facture`(`bonCommandeId`);

-- AddForeignKey
ALTER TABLE `Facture` ADD CONSTRAINT `Facture_bonCommandeId_fkey` FOREIGN KEY (`bonCommandeId`) REFERENCES `BonCommande`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BonCommande` ADD CONSTRAINT `BonCommande_chantierId_fkey` FOREIGN KEY (`chantierId`) REFERENCES `Chantier`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BonCommande` ADD CONSTRAINT `BonCommande_paiementSousTraitantId_fkey` FOREIGN KEY (`paiementSousTraitantId`) REFERENCES `PaiementSousTraitant`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

