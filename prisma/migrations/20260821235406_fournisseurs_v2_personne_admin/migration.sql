/*
  Warnings:

  - You are about to drop the column `specialite` on the `Fournisseur` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Fournisseur" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nom" TEXT NOT NULL,
    "typeProduit" TEXT,
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
    "delaiLivraison" TEXT,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Fournisseur" ("adresse", "contactNom", "createdAt", "email", "id", "nom", "notes", "telephone", "updatedAt") SELECT "adresse", "contactNom", "createdAt", "email", "id", "nom", "notes", "telephone", "updatedAt" FROM "Fournisseur";
DROP TABLE "Fournisseur";
ALTER TABLE "new_Fournisseur" RENAME TO "Fournisseur";
CREATE INDEX "Fournisseur_typeProduit_idx" ON "Fournisseur"("typeProduit");
CREATE TABLE "new_Personne" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nom" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "telephone" TEXT,
    "motDePasseHash" TEXT NOT NULL,
    "estAdmin" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Personne" ("createdAt", "email", "id", "motDePasseHash", "nom", "prenom", "telephone", "updatedAt") SELECT "createdAt", "email", "id", "motDePasseHash", "nom", "prenom", "telephone", "updatedAt" FROM "Personne";
DROP TABLE "Personne";
ALTER TABLE "new_Personne" RENAME TO "Personne";
CREATE UNIQUE INDEX "Personne_email_key" ON "Personne"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
