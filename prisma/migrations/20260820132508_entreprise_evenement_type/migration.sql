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
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Chantier" ("createdAt", "dateDebut", "equipe", "id", "nom", "updatedAt") SELECT "createdAt", "dateDebut", "equipe", "id", "nom", "updatedAt" FROM "Chantier";
DROP TABLE "Chantier";
ALTER TABLE "new_Chantier" RENAME TO "Chantier";
CREATE TABLE "new_DateImportante" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "chantierId" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'AUTRE',
    "typePersonnalise" TEXT,
    CONSTRAINT "DateImportante_chantierId_fkey" FOREIGN KEY ("chantierId") REFERENCES "Chantier" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_DateImportante" ("chantierId", "date", "id", "nom") SELECT "chantierId", "date", "id", "nom" FROM "DateImportante";
DROP TABLE "DateImportante";
ALTER TABLE "new_DateImportante" RENAME TO "DateImportante";
CREATE INDEX "DateImportante_chantierId_idx" ON "DateImportante"("chantierId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
