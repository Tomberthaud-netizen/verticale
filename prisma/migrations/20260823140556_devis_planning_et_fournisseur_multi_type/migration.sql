-- AlterTable
ALTER TABLE "Devis" ADD COLUMN "dateDebutPrevisionnelle" DATETIME;
ALTER TABLE "Devis" ADD COLUMN "dureeJoursOuvres" INTEGER;

-- CreateTable
CREATE TABLE "FournisseurType" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fournisseurId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    CONSTRAINT "FournisseurType_fournisseurId_fkey" FOREIGN KEY ("fournisseurId") REFERENCES "Fournisseur" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "FournisseurType_fournisseurId_idx" ON "FournisseurType"("fournisseurId");

-- CreateIndex
CREATE UNIQUE INDEX "FournisseurType_fournisseurId_type_key" ON "FournisseurType"("fournisseurId", "type");
