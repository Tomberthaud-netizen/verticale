-- AlterTable
-- Un chantier provisoire (importé) n'a pas encore de date de démarrage ni d'équipe : dateDebut
-- devient nullable, equipe prend un défaut vide (comme adresse). Additif uniquement — toutes
-- les lignes existantes ont déjà ces deux champs renseignés.
ALTER TABLE `Chantier` MODIFY `dateDebut` DATETIME(3) NULL;
ALTER TABLE `Chantier` MODIFY `equipe` VARCHAR(191) NOT NULL DEFAULT '';
