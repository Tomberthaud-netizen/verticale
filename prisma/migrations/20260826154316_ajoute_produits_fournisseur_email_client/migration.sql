-- AlterTable
ALTER TABLE "Devis" ADD COLUMN "clientEmail" TEXT;

-- CreateTable
CREATE TABLE "ParametresEmail" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'singleton',
    "objet" TEXT NOT NULL DEFAULT 'Votre devis {numero} — {entreprise}',
    "corps" TEXT NOT NULL DEFAULT 'Bonjour {clientNom},

Veuillez trouver ci-joint votre devis {numero} concernant « {intitule} ».

Cordialement,',
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ProduitFournisseur" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fournisseurId" TEXT NOT NULL,
    "designation" TEXT NOT NULL,
    "lot" TEXT,
    "unite" TEXT,
    "prixUnitaire" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "prixReferenceId" TEXT,
    CONSTRAINT "ProduitFournisseur_fournisseurId_fkey" FOREIGN KEY ("fournisseurId") REFERENCES "Fournisseur" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ProduitFournisseur_prixReferenceId_fkey" FOREIGN KEY ("prixReferenceId") REFERENCES "PrixReference" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "ProduitFournisseur_prixReferenceId_key" ON "ProduitFournisseur"("prixReferenceId");

-- CreateIndex
CREATE INDEX "ProduitFournisseur_fournisseurId_idx" ON "ProduitFournisseur"("fournisseurId");
