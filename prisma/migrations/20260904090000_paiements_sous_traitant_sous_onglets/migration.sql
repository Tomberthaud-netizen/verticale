-- CreateTable
CREATE TABLE `PaiementSousTraitant` (
    `id` VARCHAR(191) NOT NULL,
    `chantierId` VARCHAR(191) NOT NULL,
    `montant` DOUBLE NOT NULL,
    `dateAjout` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `PaiementSousTraitant_chantierId_idx`(`chantierId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AccesSousOngletPersonne` (
    `id` VARCHAR(191) NOT NULL,
    `personneId` VARCHAR(191) NOT NULL,
    `sousOnglet` ENUM('CHANTIER_PLANNING', 'CHANTIER_FINANCES', 'CHANTIER_ADRESSE') NOT NULL,

    INDEX `AccesSousOngletPersonne_personneId_idx`(`personneId`),
    UNIQUE INDEX `AccesSousOngletPersonne_personneId_sousOnglet_key`(`personneId`, `sousOnglet`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `PaiementSousTraitant` ADD CONSTRAINT `PaiementSousTraitant_chantierId_fkey` FOREIGN KEY (`chantierId`) REFERENCES `Chantier`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AccesSousOngletPersonne` ADD CONSTRAINT `AccesSousOngletPersonne_personneId_fkey` FOREIGN KEY (`personneId`) REFERENCES `Personne`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- Donne accès aux 3 sous-onglets de "Chantiers" à qui a déjà accès à cet onglet, pour que le
-- nouveau contrôle plus fin ne masque rien silencieusement pour les comptes existants.
INSERT INTO `AccesSousOngletPersonne` (`id`, `personneId`, `sousOnglet`)
SELECT UUID(), `personneId`, 'CHANTIER_PLANNING' FROM `AccesPersonne` WHERE `onglet` = 'CHANTIERS'
UNION ALL
SELECT UUID(), `personneId`, 'CHANTIER_FINANCES' FROM `AccesPersonne` WHERE `onglet` = 'CHANTIERS'
UNION ALL
SELECT UUID(), `personneId`, 'CHANTIER_ADRESSE' FROM `AccesPersonne` WHERE `onglet` = 'CHANTIERS';
