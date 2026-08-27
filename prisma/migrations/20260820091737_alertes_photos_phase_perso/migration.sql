-- AlterTable
ALTER TABLE "Phase" ADD COLUMN "nom" TEXT;

-- CreateTable
CREATE TABLE "Alerte" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "chantierId" TEXT NOT NULL,
    "joursAvantLivraison" INTEGER NOT NULL,
    CONSTRAINT "Alerte_chantierId_fkey" FOREIGN KEY ("chantierId") REFERENCES "Chantier" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Photo" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "chantierId" TEXT NOT NULL,
    "nomFichier" TEXT NOT NULL,
    "cheminFichier" TEXT NOT NULL,
    "dateAjout" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Photo_chantierId_fkey" FOREIGN KEY ("chantierId") REFERENCES "Chantier" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Alerte_chantierId_idx" ON "Alerte"("chantierId");

-- CreateIndex
CREATE INDEX "Photo_chantierId_idx" ON "Photo"("chantierId");
