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
    "paye" BOOLEAN NOT NULL DEFAULT false,
    "datePaiement" DATETIME,
    "sousTraitantId" TEXT,
    CONSTRAINT "Chantier_sousTraitantId_fkey" FOREIGN KEY ("sousTraitantId") REFERENCES "SousTraitant" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Chantier" ("createdAt", "dateDebut", "entreprise", "equipe", "id", "nom", "prixAchat", "prixRevente", "sousTraitantId", "updatedAt") SELECT "createdAt", "dateDebut", "entreprise", "equipe", "id", "nom", "prixAchat", "prixRevente", "sousTraitantId", "updatedAt" FROM "Chantier";
DROP TABLE "Chantier";
ALTER TABLE "new_Chantier" RENAME TO "Chantier";
CREATE INDEX "Chantier_sousTraitantId_idx" ON "Chantier"("sousTraitantId");
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
    "paye" BOOLEAN NOT NULL DEFAULT false,
    "datePaiement" DATETIME,
    "dateDebutPrevisionnelle" DATETIME,
    "dureeJoursOuvres" INTEGER,
    CONSTRAINT "Devis_chantierId_fkey" FOREIGN KEY ("chantierId") REFERENCES "Chantier" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Devis_responsableId_fkey" FOREIGN KEY ("responsableId") REFERENCES "Personne" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Devis" ("chantierId", "clientAdresse", "clientNom", "createdAt", "dateDebutPrevisionnelle", "dateDevis", "dateValidation", "dureeJoursOuvres", "entreprise", "id", "intitule", "notes", "numero", "prochaineActionDate", "prochaineActionNote", "remiseHT", "responsableId", "statutAffaire", "tauxTVA", "updatedAt", "valide", "validiteJours") SELECT "chantierId", "clientAdresse", "clientNom", "createdAt", "dateDebutPrevisionnelle", "dateDevis", "dateValidation", "dureeJoursOuvres", "entreprise", "id", "intitule", "notes", "numero", "prochaineActionDate", "prochaineActionNote", "remiseHT", "responsableId", "statutAffaire", "tauxTVA", "updatedAt", "valide", "validiteJours" FROM "Devis";
DROP TABLE "Devis";
ALTER TABLE "new_Devis" RENAME TO "Devis";
CREATE UNIQUE INDEX "Devis_numero_key" ON "Devis"("numero");
CREATE INDEX "Devis_chantierId_idx" ON "Devis"("chantierId");
CREATE INDEX "Devis_responsableId_idx" ON "Devis"("responsableId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
