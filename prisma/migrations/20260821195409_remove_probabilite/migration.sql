/*
  Warnings:

  - You are about to drop the column `probabilite` on the `Devis` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Devis" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "numero" TEXT NOT NULL,
    "intitule" TEXT NOT NULL,
    "entreprise" TEXT NOT NULL DEFAULT 'VERTICALE',
    "chantierId" TEXT,
    "clientNom" TEXT,
    "clientAdresse" TEXT,
    "dateDevis" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validiteJours" INTEGER,
    "tauxTVA" REAL NOT NULL DEFAULT 20,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "statutAffaire" TEXT NOT NULL DEFAULT 'BROUILLON',
    "responsableId" TEXT,
    "prochaineActionDate" DATETIME,
    "prochaineActionNote" TEXT,
    CONSTRAINT "Devis_chantierId_fkey" FOREIGN KEY ("chantierId") REFERENCES "Chantier" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Devis_responsableId_fkey" FOREIGN KEY ("responsableId") REFERENCES "Personne" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Devis" ("chantierId", "clientAdresse", "clientNom", "createdAt", "dateDevis", "entreprise", "id", "intitule", "notes", "numero", "prochaineActionDate", "prochaineActionNote", "responsableId", "statutAffaire", "tauxTVA", "updatedAt", "validiteJours") SELECT "chantierId", "clientAdresse", "clientNom", "createdAt", "dateDevis", "entreprise", "id", "intitule", "notes", "numero", "prochaineActionDate", "prochaineActionNote", "responsableId", "statutAffaire", "tauxTVA", "updatedAt", "validiteJours" FROM "Devis";
DROP TABLE "Devis";
ALTER TABLE "new_Devis" RENAME TO "Devis";
CREATE UNIQUE INDEX "Devis_numero_key" ON "Devis"("numero");
CREATE INDEX "Devis_chantierId_idx" ON "Devis"("chantierId");
CREATE INDEX "Devis_responsableId_idx" ON "Devis"("responsableId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
