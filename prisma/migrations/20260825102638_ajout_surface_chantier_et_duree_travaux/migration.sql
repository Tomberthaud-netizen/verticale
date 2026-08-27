-- CreateTable
CREATE TABLE "DureeTypeTravaux" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "joursParM2" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Chantier" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nom" TEXT NOT NULL,
    "dateDebut" DATETIME NOT NULL,
    "equipe" TEXT NOT NULL,
    "adresse" TEXT NOT NULL DEFAULT '',
    "surfaceM2" REAL NOT NULL DEFAULT 0,
    "entreprise" TEXT NOT NULL DEFAULT 'VERTICALE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "prixAchat" REAL,
    "prixRevente" REAL,
    "paye" BOOLEAN NOT NULL DEFAULT false,
    "datePaiement" DATETIME,
    "dateLimitePaiement" DATETIME,
    "sousTraitantId" TEXT,
    CONSTRAINT "Chantier_sousTraitantId_fkey" FOREIGN KEY ("sousTraitantId") REFERENCES "SousTraitant" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Chantier" ("adresse", "createdAt", "dateDebut", "dateLimitePaiement", "datePaiement", "entreprise", "equipe", "id", "nom", "paye", "prixAchat", "prixRevente", "sousTraitantId", "updatedAt") SELECT "adresse", "createdAt", "dateDebut", "dateLimitePaiement", "datePaiement", "entreprise", "equipe", "id", "nom", "paye", "prixAchat", "prixRevente", "sousTraitantId", "updatedAt" FROM "Chantier";
DROP TABLE "Chantier";
ALTER TABLE "new_Chantier" RENAME TO "Chantier";
CREATE INDEX "Chantier_sousTraitantId_idx" ON "Chantier"("sousTraitantId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "DureeTypeTravaux_type_key" ON "DureeTypeTravaux"("type");
