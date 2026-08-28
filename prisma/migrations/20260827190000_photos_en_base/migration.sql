-- Les photos existantes référencent des fichiers stockés sur le disque du serveur, perdus lors
-- d'un déploiement précédent (l'hébergement recrée un dossier neuf à chaque déploiement). Leur
-- contenu est irrécupérable ; on nettoie ces lignes orphelines avant de rendre `donnees` obligatoire.
DELETE FROM `Photo`;

-- AlterTable
ALTER TABLE `Photo` DROP COLUMN `cheminFichier`,
    ADD COLUMN `donnees` LONGBLOB NOT NULL,
    ADD COLUMN `typeMime` VARCHAR(191) NOT NULL;
