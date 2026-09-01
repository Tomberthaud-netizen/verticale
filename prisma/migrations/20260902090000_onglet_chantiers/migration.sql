-- AlterTable
ALTER TABLE `AccesPersonne` MODIFY `onglet` ENUM('VUE_ENSEMBLE', 'CALENDRIER', 'DEVIS', 'ADMINISTRATION', 'FOURNISSEURS', 'FINANCE', 'DIRECTION', 'CATALOGUE', 'SOUS_TRAITANTS', 'CHANTIERS') NOT NULL;

-- AlterTable
ALTER TABLE `ParametreOnglet` MODIFY `onglet` ENUM('VUE_ENSEMBLE', 'CALENDRIER', 'DEVIS', 'ADMINISTRATION', 'FOURNISSEURS', 'FINANCE', 'DIRECTION', 'CATALOGUE', 'SOUS_TRAITANTS', 'CHANTIERS') NOT NULL;

-- Donne accès au nouvel onglet "Chantiers" à qui a déjà accès à "Devis" (même périmètre entreprise),
-- pour que ce nouvel onglet ne soit pas silencieusement invisible pour les comptes existants.
INSERT INTO `AccesPersonne` (`id`, `personneId`, `onglet`, `entreprise`)
SELECT UUID(), `personneId`, 'CHANTIERS', `entreprise`
FROM `AccesPersonne`
WHERE `onglet` = 'DEVIS';
