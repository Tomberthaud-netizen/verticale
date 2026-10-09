-- AlterTable
ALTER TABLE `AccesPersonne` MODIFY `onglet` ENUM('VUE_ENSEMBLE', 'CALENDRIER', 'DEVIS', 'ADMINISTRATION', 'FOURNISSEURS', 'FINANCE', 'DIRECTION', 'CATALOGUE', 'SOUS_TRAITANTS', 'CHANTIERS', 'CHIFFRAGE') NOT NULL;

-- AlterTable
ALTER TABLE `ParametreOnglet` DROP PRIMARY KEY,
    MODIFY `onglet` ENUM('VUE_ENSEMBLE', 'CALENDRIER', 'DEVIS', 'ADMINISTRATION', 'FOURNISSEURS', 'FINANCE', 'DIRECTION', 'CATALOGUE', 'SOUS_TRAITANTS', 'CHANTIERS', 'CHIFFRAGE') NOT NULL,
    ADD PRIMARY KEY (`onglet`);

-- CreateTable
CREATE TABLE `ProjetChiffrage` (
    `id` VARCHAR(191) NOT NULL,
    `nom` VARCHAR(191) NOT NULL,
    `adresse` VARCHAR(191) NULL,
    `notes` TEXT NULL,
    `chantierId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `ProjetChiffrage_chantierId_idx`(`chantierId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PlanChiffrage` (
    `id` VARCHAR(191) NOT NULL,
    `projetId` VARCHAR(191) NOT NULL,
    `nomFichier` VARCHAR(191) NOT NULL,
    `typeMime` VARCHAR(191) NOT NULL,
    `donnees` LONGBLOB NOT NULL,
    `echellePxParM` DOUBLE NULL,
    `dateAjout` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `PlanChiffrage_projetId_key`(`projetId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PieceChiffrage` (
    `id` VARCHAR(191) NOT NULL,
    `projetId` VARCHAR(191) NOT NULL,
    `nom` VARCHAR(191) NOT NULL,
    `typePiece` VARCHAR(191) NOT NULL,
    `surfaceM2` DOUBLE NOT NULL,
    `perimetreM` DOUBLE NOT NULL,
    `hauteurM` DOUBLE NOT NULL DEFAULT 2.5,
    `contour` TEXT NULL,
    `ordre` INTEGER NOT NULL,

    INDEX `PieceChiffrage_projetId_idx`(`projetId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LigneChiffrage` (
    `id` VARCHAR(191) NOT NULL,
    `projetId` VARCHAR(191) NOT NULL,
    `lot` VARCHAR(191) NOT NULL,
    `designation` VARCHAR(191) NOT NULL,
    `detail` TEXT NULL,
    `unite` VARCHAR(191) NULL,
    `quantite` DOUBLE NOT NULL,
    `prixUnitaire` DOUBLE NOT NULL,
    `ordre` INTEGER NOT NULL,

    INDEX `LigneChiffrage_projetId_idx`(`projetId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PosteBareme` (
    `id` VARCHAR(191) NOT NULL,
    `lot` VARCHAR(191) NOT NULL,
    `designation` VARCHAR(191) NOT NULL,
    `unite` VARCHAR(191) NOT NULL,
    `base` ENUM('SURFACE_SOL', 'SURFACE_MURS', 'SURFACE_PLAFOND', 'PERIMETRE', 'FORFAIT_PIECE') NOT NULL,
    `prixUnitaire` DOUBLE NOT NULL,
    `typesPieces` VARCHAR(191) NOT NULL DEFAULT '',
    `actif` BOOLEAN NOT NULL DEFAULT true,
    `ordre` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ProjetChiffrage` ADD CONSTRAINT `ProjetChiffrage_chantierId_fkey` FOREIGN KEY (`chantierId`) REFERENCES `Chantier`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PlanChiffrage` ADD CONSTRAINT `PlanChiffrage_projetId_fkey` FOREIGN KEY (`projetId`) REFERENCES `ProjetChiffrage`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PieceChiffrage` ADD CONSTRAINT `PieceChiffrage_projetId_fkey` FOREIGN KEY (`projetId`) REFERENCES `ProjetChiffrage`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LigneChiffrage` ADD CONSTRAINT `LigneChiffrage_projetId_fkey` FOREIGN KEY (`projetId`) REFERENCES `ProjetChiffrage`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

