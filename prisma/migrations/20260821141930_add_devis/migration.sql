-- CreateTable
CREATE TABLE "Devis" (
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
    CONSTRAINT "Devis_chantierId_fkey" FOREIGN KEY ("chantierId") REFERENCES "Chantier" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LigneDevis" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "devisId" TEXT NOT NULL,
    "designation" TEXT NOT NULL,
    "unite" TEXT,
    "quantite" REAL NOT NULL,
    "prixUnitaire" REAL NOT NULL,
    "ordre" INTEGER NOT NULL,
    CONSTRAINT "LigneDevis_devisId_fkey" FOREIGN KEY ("devisId") REFERENCES "Devis" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Devis_numero_key" ON "Devis"("numero");

-- CreateIndex
CREATE INDEX "Devis_chantierId_idx" ON "Devis"("chantierId");

-- CreateIndex
CREATE INDEX "LigneDevis_devisId_idx" ON "LigneDevis"("devisId");
