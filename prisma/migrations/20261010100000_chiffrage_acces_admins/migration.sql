-- Donne l'accès au nouvel onglet "Chiffrage" aux administrateurs existants.
-- (Séparé de la migration de création et appliqué après la mise en ligne du code : un ancien
-- code ne connaît pas la valeur CHIFFRAGE de l'énumération et échouerait à lire ces lignes.)
INSERT INTO `AccesPersonne` (`id`, `personneId`, `onglet`, `entreprise`)
SELECT CONCAT('chf_', p.`id`), p.`id`, 'CHIFFRAGE', NULL
FROM `Personne` p
WHERE p.`estAdmin` = 1
  AND NOT EXISTS (
    SELECT 1 FROM `AccesPersonne` a WHERE a.`personneId` = p.`id` AND a.`onglet` = 'CHIFFRAGE'
  );
