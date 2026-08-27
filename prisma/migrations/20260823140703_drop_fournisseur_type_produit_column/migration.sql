/*
  Warnings:

  - You are about to drop the column `typeProduit` on the `Fournisseur` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Fournisseur" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nom" TEXT NOT NULL,
    "entreprise" TEXT NOT NULL DEFAULT 'VERTICALE',
    "siret" TEXT,
    "contactNom" TEXT,
    "contactPrenom" TEXT,
    "telephone" TEXT,
    "email" TEXT,
    "conditionPaiement" TEXT,
    "adresse" TEXT,
    "codePostal" TEXT,
    "ville" TEXT,
    "pays" TEXT DEFAULT 'France',
    "siteWeb" TEXT,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Fournisseur" ("actif", "adresse", "codePostal", "conditionPaiement", "contactNom", "contactPrenom", "createdAt", "email", "entreprise", "id", "nom", "notes", "pays", "siret", "siteWeb", "telephone", "updatedAt", "ville") SELECT "actif", "adresse", "codePostal", "conditionPaiement", "contactNom", "contactPrenom", "createdAt", "email", "entreprise", "id", "nom", "notes", "pays", "siret", "siteWeb", "telephone", "updatedAt", "ville" FROM "Fournisseur";
DROP TABLE "Fournisseur";
ALTER TABLE "new_Fournisseur" RENAME TO "Fournisseur";
CREATE INDEX "Fournisseur_entreprise_idx" ON "Fournisseur"("entreprise");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
