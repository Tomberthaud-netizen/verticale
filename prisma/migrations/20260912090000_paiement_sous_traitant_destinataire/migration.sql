ALTER TABLE `PaiementSousTraitant` ADD COLUMN `sousTraitantId` VARCHAR(191) NOT NULL;
CREATE INDEX `PaiementSousTraitant_sousTraitantId_idx` ON `PaiementSousTraitant`(`sousTraitantId`);
ALTER TABLE `PaiementSousTraitant` ADD CONSTRAINT `PaiementSousTraitant_sousTraitantId_fkey` FOREIGN KEY (`sousTraitantId`) REFERENCES `SousTraitant`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `Entreprise` ADD COLUMN `formeJuridique` VARCHAR(191) NULL;

ALTER TABLE `Devis` ADD COLUMN `clientTelephone` VARCHAR(191) NULL;
