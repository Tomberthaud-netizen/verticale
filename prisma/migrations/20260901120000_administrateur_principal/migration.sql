-- AlterTable
ALTER TABLE `Personne` ADD COLUMN `estAdminPrincipal` BOOLEAN NOT NULL DEFAULT false;

-- Désigne le compte t.berthaud@verticaleparis.fr comme administrateur principal (demandé
-- explicitement par l'utilisateur, cf. conversation du 2026-08-31).
UPDATE `Personne` SET `estAdminPrincipal` = true WHERE `email` = 't.berthaud@verticaleparis.fr';
