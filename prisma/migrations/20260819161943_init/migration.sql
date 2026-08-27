-- CreateTable
CREATE TABLE "Chantier" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nom" TEXT NOT NULL,
    "dateDebut" DATETIME NOT NULL,
    "equipe" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Phase" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "chantierId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "nombreJoursOuvres" INTEGER NOT NULL,
    "ordre" INTEGER NOT NULL,
    CONSTRAINT "Phase_chantierId_fkey" FOREIGN KEY ("chantierId") REFERENCES "Chantier" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DateImportante" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "chantierId" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    CONSTRAINT "DateImportante_chantierId_fkey" FOREIGN KEY ("chantierId") REFERENCES "Chantier" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Retard" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "chantierId" TEXT NOT NULL,
    "nombreJours" INTEGER NOT NULL,
    "dateAjout" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "commentaire" TEXT,
    CONSTRAINT "Retard_chantierId_fkey" FOREIGN KEY ("chantierId") REFERENCES "Chantier" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Phase_chantierId_idx" ON "Phase"("chantierId");

-- CreateIndex
CREATE INDEX "DateImportante_chantierId_idx" ON "DateImportante"("chantierId");

-- CreateIndex
CREATE INDEX "Retard_chantierId_idx" ON "Retard"("chantierId");
