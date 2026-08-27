-- CreateTable
CREATE TABLE "Fournisseur" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nom" TEXT NOT NULL,
    "specialite" TEXT,
    "contactNom" TEXT,
    "email" TEXT,
    "telephone" TEXT,
    "adresse" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Facture" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "numero" TEXT NOT NULL,
    "entreprise" TEXT NOT NULL DEFAULT 'VERTICALE',
    "devisId" TEXT,
    "chantierId" TEXT,
    "clientNom" TEXT,
    "clientAdresse" TEXT,
    "montantHT" REAL NOT NULL,
    "tauxTVA" REAL NOT NULL DEFAULT 20,
    "dateFacture" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dateEcheance" DATETIME,
    "statut" TEXT NOT NULL DEFAULT 'EMISE',
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Facture_devisId_fkey" FOREIGN KEY ("devisId") REFERENCES "Devis" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Facture_chantierId_fkey" FOREIGN KEY ("chantierId") REFERENCES "Chantier" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Paiement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "factureId" TEXT NOT NULL,
    "montant" REAL NOT NULL,
    "datePaiement" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "moyen" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Paiement_factureId_fkey" FOREIGN KEY ("factureId") REFERENCES "Facture" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Facture_numero_key" ON "Facture"("numero");

-- CreateIndex
CREATE INDEX "Facture_devisId_idx" ON "Facture"("devisId");

-- CreateIndex
CREATE INDEX "Facture_chantierId_idx" ON "Facture"("chantierId");

-- CreateIndex
CREATE INDEX "Paiement_factureId_idx" ON "Paiement"("factureId");
