-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Chantier" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nom" TEXT NOT NULL,
    "dateDebut" DATETIME NOT NULL,
    "equipe" TEXT NOT NULL,
    "entreprise" TEXT NOT NULL DEFAULT 'VERTICALE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "prixAchat" REAL,
    "prixRevente" REAL
);
INSERT INTO "new_Chantier" ("createdAt", "dateDebut", "entreprise", "equipe", "id", "nom", "prixAchat", "prixRevente", "updatedAt") SELECT "createdAt", "dateDebut", "entreprise", "equipe", "id", "nom", "prixAchat", "prixRevente", "updatedAt" FROM "Chantier";
DROP TABLE "Chantier";
ALTER TABLE "new_Chantier" RENAME TO "Chantier";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

