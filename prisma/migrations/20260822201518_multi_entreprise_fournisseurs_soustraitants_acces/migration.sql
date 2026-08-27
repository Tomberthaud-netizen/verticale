-- AlterTable
ALTER TABLE "AccesPersonne" ADD COLUMN "entreprise" TEXT;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Fournisseur" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nom" TEXT NOT NULL,
    "entreprise" TEXT NOT NULL DEFAULT 'VERTICALE',
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
CREATE INDEX "Fournisseur_entreprise_idx" ON "Fournisseur"("entreprise");
CREATE TABLE "new_SousTraitant" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nom" TEXT NOT NULL,
    "entreprise" TEXT NOT NULL DEFAULT 'VERTICALE',
    "siret" TEXT,
    "contactNom" TEXT,
    "contactPrenom" TEXT,
    "telephone" TEXT,
    "email" TEXT,
    "adresse" TEXT,
    "codePostal" TEXT,
    "ville" TEXT,
    "pays" TEXT DEFAULT 'France',
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_SousTraitant" ("adresse", "codePostal", "contactNom", "contactPrenom", "createdAt", "email", "id", "nom", "notes", "pays", "siret", "telephone", "updatedAt", "ville") SELECT "adresse", "codePostal", "contactNom", "contactPrenom", "createdAt", "email", "id", "nom", "notes", "pays", "siret", "telephone", "updatedAt", "ville" FROM "SousTraitant";
DROP TABLE "SousTraitant";
ALTER TABLE "new_SousTraitant" RENAME TO "SousTraitant";
CREATE INDEX "SousTraitant_entreprise_idx" ON "SousTraitant"("entreprise");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
