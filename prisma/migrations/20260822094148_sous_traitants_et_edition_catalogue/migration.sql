-- CreateTable
CREATE TABLE "SousTraitant" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nom" TEXT NOT NULL,
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

-- CreateTable
CREATE TABLE "SousTraitantType" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sousTraitantId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    CONSTRAINT "SousTraitantType_sousTraitantId_fkey" FOREIGN KEY ("sousTraitantId") REFERENCES "SousTraitant" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

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
    "prixRevente" REAL,
    "sousTraitantId" TEXT,
    CONSTRAINT "Chantier_sousTraitantId_fkey" FOREIGN KEY ("sousTraitantId") REFERENCES "SousTraitant" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Chantier" ("createdAt", "dateDebut", "entreprise", "equipe", "id", "nom", "prixAchat", "prixRevente", "updatedAt") SELECT "createdAt", "dateDebut", "entreprise", "equipe", "id", "nom", "prixAchat", "prixRevente", "updatedAt" FROM "Chantier";
DROP TABLE "Chantier";
ALTER TABLE "new_Chantier" RENAME TO "Chantier";
CREATE INDEX "Chantier_sousTraitantId_idx" ON "Chantier"("sousTraitantId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "SousTraitantType_sousTraitantId_idx" ON "SousTraitantType"("sousTraitantId");

-- CreateIndex
CREATE UNIQUE INDEX "SousTraitantType_sousTraitantId_type_key" ON "SousTraitantType"("sousTraitantId", "type");
