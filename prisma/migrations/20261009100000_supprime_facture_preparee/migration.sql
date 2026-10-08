-- DropForeignKey
ALTER TABLE `FacturePreparee` DROP FOREIGN KEY `FacturePreparee_chantierId_fkey`;

-- DropForeignKey
ALTER TABLE `FacturePreparee` DROP FOREIGN KEY `FacturePreparee_devisId_fkey`;

-- DropForeignKey
ALTER TABLE `FacturePreparee` DROP FOREIGN KEY `FacturePreparee_paiementSousTraitantId_fkey`;

-- DropTable
DROP TABLE `FacturePreparee`;

