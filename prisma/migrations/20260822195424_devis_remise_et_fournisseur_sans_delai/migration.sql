/*
  Warnings:

  - You are about to drop the column `delaiLivraison` on the `Fournisseur` table. All the data in the column will be lost.

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
    "remiseHT" REAL NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "statutAffaire" TEXT NOT NULL DEFAULT 'BROUILLON',
    "responsableId" TEXT,
    "prochaineActionDate" DATETIME,
    "prochaineActionNote" TEXT,
    "valide" BOOLEAN NOT NULL DEFAULT false,
    "dateValidation" DATETIME,
    CONSTRAINT "Devis_chantierId_fkey" FOREIGN KEY ("chantierId") REFERENCES "Chantier" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Devis_responsableId_fkey" FOREIGN KEY ("responsableId") REFERENCES "Personne" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Devis" ("chantierId", "clientAdresse", "clientNom", "createdAt", "dateDevis", "dateValidation", "entreprise", "id", "intitule", "notes", "numero", "prochaineActionDate", "prochaineActionNote", "responsableId", "statutAffaire", "tauxTVA", "updatedAt", "valide", "validiteJours") SELECT "chantierId", "clientAdresse", "clientNom", "createdAt", "dateDevis", "dateValidation", "entreprise", "id", "intitule", "notes", "numero", "prochaineActionDate", "prochaineActionNote", "responsableId", "statutAffaire", "tauxTVA", "updatedAt", "valide", "validiteJours" FROM "Devis";
DROP TABLE "Devis";
ALTER TABLE "new_Devis" RENAME TO "Devis";
CREATE UNIQUE INDEX "Devis_numero_key" ON "Devis"("numero");
CREATE INDEX "Devis_chantierId_idx" ON "Devis"("chantierId");
CREATE INDEX "Devis_responsableId_idx" ON "Devis"("responsableId");
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
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Fournisseur" ("actif", "adresse", "codePostal", "conditionPaiement", "contactNom", "contactPrenom", "createdAt", "email", "id", "nom", "notes", "pays", "siret", "siteWeb", "telephone", "typeProduit", "updatedAt", "ville") SELECT "actif", "adresse", "codePostal", "conditionPaiement", "contactNom", "contactPrenom", "createdAt", "email", "id", "nom", "notes", "pays", "siret", "siteWeb", "telephone", "typeProduit", "updatedAt", "ville" FROM "Fournisseur";
DROP TABLE "Fournisseur";
ALTER TABLE "new_Fournisseur" RENAME TO "Fournisseur";
CREATE INDEX "Fournisseur_typeProduit_idx" ON "Fournisseur"("typeProduit");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
