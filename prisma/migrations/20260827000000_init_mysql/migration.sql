-- CreateTable
CREATE TABLE `Chantier` (
    `id` VARCHAR(191) NOT NULL,
    `nom` VARCHAR(191) NOT NULL,
    `dateDebut` DATETIME(3) NOT NULL,
    `equipe` VARCHAR(191) NOT NULL,
    `adresse` VARCHAR(191) NOT NULL DEFAULT '',
    `surfaceM2` DOUBLE NOT NULL DEFAULT 0,
    `entreprise` VARCHAR(191) NOT NULL DEFAULT 'VERTICALE',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `prixAchat` DOUBLE NULL,
    `prixRevente` DOUBLE NULL,
    `paye` BOOLEAN NOT NULL DEFAULT false,
    `datePaiement` DATETIME(3) NULL,
    `dateLimitePaiement` DATETIME(3) NULL,
    `sousTraitantId` VARCHAR(191) NULL,

    INDEX `Chantier_sousTraitantId_idx`(`sousTraitantId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Phase` (
    `id` VARCHAR(191) NOT NULL,
    `chantierId` VARCHAR(191) NOT NULL,
    `type` ENUM('DEMOLITION', 'RENOVATION', 'AMENAGEMENT', 'PERSONNALISEE') NOT NULL,
    `nom` VARCHAR(191) NULL,
    `nombreJoursOuvres` INTEGER NOT NULL,
    `ordre` INTEGER NOT NULL,

    INDEX `Phase_chantierId_idx`(`chantierId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DateImportante` (
    `id` VARCHAR(191) NOT NULL,
    `chantierId` VARCHAR(191) NOT NULL,
    `nom` VARCHAR(191) NOT NULL,
    `date` DATETIME(3) NOT NULL,
    `type` ENUM('LIVRAISON', 'REUNION', 'INSPECTION', 'AUTRE') NOT NULL DEFAULT 'AUTRE',
    `typePersonnalise` VARCHAR(191) NULL,

    INDEX `DateImportante_chantierId_idx`(`chantierId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Retard` (
    `id` VARCHAR(191) NOT NULL,
    `chantierId` VARCHAR(191) NOT NULL,
    `nombreJours` INTEGER NOT NULL,
    `dateAjout` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `commentaire` TEXT NULL,

    INDEX `Retard_chantierId_idx`(`chantierId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Alerte` (
    `id` VARCHAR(191) NOT NULL,
    `chantierId` VARCHAR(191) NOT NULL,
    `joursAvantLivraison` INTEGER NOT NULL,

    INDEX `Alerte_chantierId_idx`(`chantierId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Photo` (
    `id` VARCHAR(191) NOT NULL,
    `chantierId` VARCHAR(191) NOT NULL,
    `nomFichier` VARCHAR(191) NOT NULL,
    `cheminFichier` VARCHAR(191) NOT NULL,
    `dateAjout` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Photo_chantierId_idx`(`chantierId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Devis` (
    `id` VARCHAR(191) NOT NULL,
    `numero` VARCHAR(191) NOT NULL,
    `intitule` VARCHAR(191) NOT NULL,
    `entreprise` VARCHAR(191) NOT NULL DEFAULT 'VERTICALE',
    `chantierId` VARCHAR(191) NULL,
    `clientNom` VARCHAR(191) NULL,
    `clientAdresse` TEXT NULL,
    `clientEmail` VARCHAR(191) NULL,
    `dateDevis` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `validiteJours` INTEGER NULL,
    `tauxTVA` DOUBLE NOT NULL DEFAULT 20,
    `remiseHT` DOUBLE NOT NULL DEFAULT 0,
    `notes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `statutAffaire` ENUM('BROUILLON', 'ENVOYE', 'RELANCE', 'GAGNE', 'PERDU') NOT NULL DEFAULT 'BROUILLON',
    `responsableId` VARCHAR(191) NULL,
    `prochaineActionDate` DATETIME(3) NULL,
    `prochaineActionNote` TEXT NULL,
    `valide` BOOLEAN NOT NULL DEFAULT false,
    `dateValidation` DATETIME(3) NULL,
    `paye` BOOLEAN NOT NULL DEFAULT false,
    `datePaiement` DATETIME(3) NULL,
    `dateLimitePaiement` DATETIME(3) NULL,
    `dateDebutPrevisionnelle` DATETIME(3) NULL,
    `dureeJoursOuvres` INTEGER NULL,
    `coutMateriauxHT` DOUBLE NULL,
    `coutHonorairesHT` DOUBLE NULL,

    UNIQUE INDEX `Devis_numero_key`(`numero`),
    INDEX `Devis_chantierId_idx`(`chantierId`),
    INDEX `Devis_responsableId_idx`(`responsableId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `EvenementDevis` (
    `id` VARCHAR(191) NOT NULL,
    `devisId` VARCHAR(191) NOT NULL,
    `type` ENUM('NOTE', 'APPEL', 'EMAIL', 'RELANCE') NOT NULL,
    `contenu` TEXT NOT NULL,
    `date` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `EvenementDevis_devisId_idx`(`devisId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LigneDevis` (
    `id` VARCHAR(191) NOT NULL,
    `devisId` VARCHAR(191) NOT NULL,
    `designation` VARCHAR(191) NOT NULL,
    `unite` VARCHAR(191) NULL,
    `quantite` DOUBLE NOT NULL,
    `prixUnitaire` DOUBLE NOT NULL,
    `ordre` INTEGER NOT NULL,

    INDEX `LigneDevis_devisId_idx`(`devisId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `IndiceBT` (
    `id` VARCHAR(191) NOT NULL,
    `periode` VARCHAR(191) NOT NULL,
    `valeur` DOUBLE NOT NULL,

    UNIQUE INDEX `IndiceBT_periode_key`(`periode`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TypeDeTravaux` (
    `id` VARCHAR(191) NOT NULL,
    `designation` VARCHAR(191) NOT NULL,
    `lot` VARCHAR(191) NULL,

    UNIQUE INDEX `TypeDeTravaux_designation_key`(`designation`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DureeTypeTravaux` (
    `id` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `joursParM2` DOUBLE NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `DureeTypeTravaux_type_key`(`type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PrixReference` (
    `id` VARCHAR(191) NOT NULL,
    `designation` VARCHAR(191) NOT NULL,
    `lot` VARCHAR(191) NULL,
    `prixUnitaire` DOUBLE NOT NULL,
    `unite` VARCHAR(191) NULL,
    `dateReference` DATETIME(3) NULL,
    `sourceFichier` VARCHAR(191) NOT NULL,
    `confiance` ENUM('HAUTE', 'MOYENNE', 'BASSE') NOT NULL,
    `prixMarcheReference` DOUBLE NULL,
    `ecartPrixMarche` DOUBLE NULL,
    `sourceVerification` VARCHAR(191) NULL,
    `verifiePrixLe` DATETIME(3) NULL,
    `horsBtp` BOOLEAN NOT NULL DEFAULT false,
    `horsBtpRaison` TEXT NULL,

    INDEX `PrixReference_designation_idx`(`designation`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ParametresEmail` (
    `id` VARCHAR(191) NOT NULL DEFAULT 'singleton',
    `objet` VARCHAR(191) NOT NULL DEFAULT 'Votre devis {numero} — {entreprise}',
    `corps` TEXT NOT NULL,
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LigneFinanciereChantier` (
    `id` VARCHAR(191) NOT NULL,
    `chantierId` VARCHAR(191) NOT NULL,
    `libelle` VARCHAR(191) NOT NULL,
    `montant` DOUBLE NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `LigneFinanciereChantier_chantierId_idx`(`chantierId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Personne` (
    `id` VARCHAR(191) NOT NULL,
    `nom` VARCHAR(191) NOT NULL,
    `prenom` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `telephone` VARCHAR(191) NULL,
    `motDePasseHash` VARCHAR(191) NOT NULL,
    `estAdmin` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Personne_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Entreprise` (
    `code` VARCHAR(191) NOT NULL,
    `nom` VARCHAR(191) NOT NULL,
    `tagline` VARCHAR(191) NULL,
    `adresse` VARCHAR(191) NULL,
    `codePostal` VARCHAR(191) NULL,
    `ville` VARCHAR(191) NULL,
    `telephone` VARCHAR(191) NULL,
    `email` VARCHAR(191) NULL,
    `siret` VARCHAR(191) NULL,
    `tvaIntracom` VARCHAR(191) NULL,
    `logoPath` VARCHAR(191) NULL,
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`code`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Connexion` (
    `id` VARCHAR(191) NOT NULL,
    `personneId` VARCHAR(191) NOT NULL,
    `sessionId` VARCHAR(191) NOT NULL,
    `ip` VARCHAR(191) NULL,
    `appareil` VARCHAR(191) NULL,
    `connecteLe` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `deconnecteLe` DATETIME(3) NULL,

    UNIQUE INDEX `Connexion_sessionId_key`(`sessionId`),
    INDEX `Connexion_personneId_idx`(`personneId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ParametresSite` (
    `id` VARCHAR(191) NOT NULL DEFAULT 'singleton',
    `couleurPrincipale` VARCHAR(191) NOT NULL DEFAULT '#1c1917',

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ParametreOnglet` (
    `onglet` ENUM('VUE_ENSEMBLE', 'CALENDRIER', 'DEVIS', 'ADMINISTRATION', 'FOURNISSEURS', 'FINANCE', 'DIRECTION', 'CATALOGUE', 'SOUS_TRAITANTS') NOT NULL,
    `libellePersonnalise` VARCHAR(191) NULL,
    `ordre` INTEGER NOT NULL,

    PRIMARY KEY (`onglet`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AccesPersonne` (
    `id` VARCHAR(191) NOT NULL,
    `personneId` VARCHAR(191) NOT NULL,
    `onglet` ENUM('VUE_ENSEMBLE', 'CALENDRIER', 'DEVIS', 'ADMINISTRATION', 'FOURNISSEURS', 'FINANCE', 'DIRECTION', 'CATALOGUE', 'SOUS_TRAITANTS') NOT NULL,
    `entreprise` VARCHAR(191) NULL,

    INDEX `AccesPersonne_personneId_idx`(`personneId`),
    UNIQUE INDEX `AccesPersonne_personneId_onglet_key`(`personneId`, `onglet`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Fournisseur` (
    `id` VARCHAR(191) NOT NULL,
    `nom` VARCHAR(191) NOT NULL,
    `entreprise` VARCHAR(191) NOT NULL DEFAULT 'VERTICALE',
    `siret` VARCHAR(191) NULL,
    `contactNom` VARCHAR(191) NULL,
    `contactPrenom` VARCHAR(191) NULL,
    `telephone` VARCHAR(191) NULL,
    `email` VARCHAR(191) NULL,
    `conditionPaiement` VARCHAR(191) NULL,
    `adresse` VARCHAR(191) NULL,
    `codePostal` VARCHAR(191) NULL,
    `ville` VARCHAR(191) NULL,
    `pays` VARCHAR(191) NULL DEFAULT 'France',
    `siteWeb` VARCHAR(191) NULL,
    `actif` BOOLEAN NOT NULL DEFAULT true,
    `notes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Fournisseur_entreprise_idx`(`entreprise`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ProduitFournisseur` (
    `id` VARCHAR(191) NOT NULL,
    `fournisseurId` VARCHAR(191) NOT NULL,
    `designation` VARCHAR(191) NOT NULL,
    `lot` VARCHAR(191) NULL,
    `unite` VARCHAR(191) NULL,
    `prixUnitaire` DOUBLE NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `prixReferenceId` VARCHAR(191) NULL,

    UNIQUE INDEX `ProduitFournisseur_prixReferenceId_key`(`prixReferenceId`),
    INDEX `ProduitFournisseur_fournisseurId_idx`(`fournisseurId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `FournisseurType` (
    `id` VARCHAR(191) NOT NULL,
    `fournisseurId` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,

    INDEX `FournisseurType_fournisseurId_idx`(`fournisseurId`),
    UNIQUE INDEX `FournisseurType_fournisseurId_type_key`(`fournisseurId`, `type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Facture` (
    `id` VARCHAR(191) NOT NULL,
    `numero` VARCHAR(191) NOT NULL,
    `entreprise` VARCHAR(191) NOT NULL DEFAULT 'VERTICALE',
    `devisId` VARCHAR(191) NULL,
    `chantierId` VARCHAR(191) NULL,
    `clientNom` VARCHAR(191) NULL,
    `clientAdresse` TEXT NULL,
    `montantHT` DOUBLE NOT NULL,
    `coutRealisationHT` DOUBLE NULL,
    `tauxTVA` DOUBLE NOT NULL DEFAULT 20,
    `dateFacture` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `dateEcheance` DATETIME(3) NULL,
    `statut` ENUM('EMISE', 'ANNULEE') NOT NULL DEFAULT 'EMISE',
    `notes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Facture_numero_key`(`numero`),
    INDEX `Facture_devisId_idx`(`devisId`),
    INDEX `Facture_chantierId_idx`(`chantierId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Paiement` (
    `id` VARCHAR(191) NOT NULL,
    `factureId` VARCHAR(191) NOT NULL,
    `montant` DOUBLE NOT NULL,
    `datePaiement` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `moyen` VARCHAR(191) NULL,
    `notes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Paiement_factureId_idx`(`factureId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SousTraitant` (
    `id` VARCHAR(191) NOT NULL,
    `nom` VARCHAR(191) NOT NULL,
    `entreprise` VARCHAR(191) NOT NULL DEFAULT 'VERTICALE',
    `siret` VARCHAR(191) NULL,
    `contactNom` VARCHAR(191) NULL,
    `contactPrenom` VARCHAR(191) NULL,
    `telephone` VARCHAR(191) NULL,
    `email` VARCHAR(191) NULL,
    `adresse` VARCHAR(191) NULL,
    `codePostal` VARCHAR(191) NULL,
    `ville` VARCHAR(191) NULL,
    `pays` VARCHAR(191) NULL DEFAULT 'France',
    `notes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `SousTraitant_entreprise_idx`(`entreprise`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SousTraitantType` (
    `id` VARCHAR(191) NOT NULL,
    `sousTraitantId` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,

    INDEX `SousTraitantType_sousTraitantId_idx`(`sousTraitantId`),
    UNIQUE INDEX `SousTraitantType_sousTraitantId_type_key`(`sousTraitantId`, `type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Chantier` ADD CONSTRAINT `Chantier_sousTraitantId_fkey` FOREIGN KEY (`sousTraitantId`) REFERENCES `SousTraitant`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Phase` ADD CONSTRAINT `Phase_chantierId_fkey` FOREIGN KEY (`chantierId`) REFERENCES `Chantier`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DateImportante` ADD CONSTRAINT `DateImportante_chantierId_fkey` FOREIGN KEY (`chantierId`) REFERENCES `Chantier`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Retard` ADD CONSTRAINT `Retard_chantierId_fkey` FOREIGN KEY (`chantierId`) REFERENCES `Chantier`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Alerte` ADD CONSTRAINT `Alerte_chantierId_fkey` FOREIGN KEY (`chantierId`) REFERENCES `Chantier`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Photo` ADD CONSTRAINT `Photo_chantierId_fkey` FOREIGN KEY (`chantierId`) REFERENCES `Chantier`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Devis` ADD CONSTRAINT `Devis_chantierId_fkey` FOREIGN KEY (`chantierId`) REFERENCES `Chantier`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Devis` ADD CONSTRAINT `Devis_responsableId_fkey` FOREIGN KEY (`responsableId`) REFERENCES `Personne`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EvenementDevis` ADD CONSTRAINT `EvenementDevis_devisId_fkey` FOREIGN KEY (`devisId`) REFERENCES `Devis`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LigneDevis` ADD CONSTRAINT `LigneDevis_devisId_fkey` FOREIGN KEY (`devisId`) REFERENCES `Devis`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LigneFinanciereChantier` ADD CONSTRAINT `LigneFinanciereChantier_chantierId_fkey` FOREIGN KEY (`chantierId`) REFERENCES `Chantier`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Connexion` ADD CONSTRAINT `Connexion_personneId_fkey` FOREIGN KEY (`personneId`) REFERENCES `Personne`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AccesPersonne` ADD CONSTRAINT `AccesPersonne_personneId_fkey` FOREIGN KEY (`personneId`) REFERENCES `Personne`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProduitFournisseur` ADD CONSTRAINT `ProduitFournisseur_fournisseurId_fkey` FOREIGN KEY (`fournisseurId`) REFERENCES `Fournisseur`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProduitFournisseur` ADD CONSTRAINT `ProduitFournisseur_prixReferenceId_fkey` FOREIGN KEY (`prixReferenceId`) REFERENCES `PrixReference`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FournisseurType` ADD CONSTRAINT `FournisseurType_fournisseurId_fkey` FOREIGN KEY (`fournisseurId`) REFERENCES `Fournisseur`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Facture` ADD CONSTRAINT `Facture_devisId_fkey` FOREIGN KEY (`devisId`) REFERENCES `Devis`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Facture` ADD CONSTRAINT `Facture_chantierId_fkey` FOREIGN KEY (`chantierId`) REFERENCES `Chantier`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Paiement` ADD CONSTRAINT `Paiement_factureId_fkey` FOREIGN KEY (`factureId`) REFERENCES `Facture`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SousTraitantType` ADD CONSTRAINT `SousTraitantType_sousTraitantId_fkey` FOREIGN KEY (`sousTraitantId`) REFERENCES `SousTraitant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

