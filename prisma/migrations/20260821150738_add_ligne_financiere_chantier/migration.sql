-- CreateTable
CREATE TABLE "LigneFinanciereChantier" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "chantierId" TEXT NOT NULL,
    "libelle" TEXT NOT NULL,
    "montant" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LigneFinanciereChantier_chantierId_fkey" FOREIGN KEY ("chantierId") REFERENCES "Chantier" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "LigneFinanciereChantier_chantierId_idx" ON "LigneFinanciereChantier"("chantierId");
