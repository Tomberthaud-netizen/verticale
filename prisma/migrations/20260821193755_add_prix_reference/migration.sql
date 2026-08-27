-- CreateTable
CREATE TABLE "PrixReference" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "designation" TEXT NOT NULL,
    "lot" TEXT,
    "prixUnitaire" REAL NOT NULL,
    "unite" TEXT,
    "dateReference" DATETIME,
    "sourceFichier" TEXT NOT NULL,
    "confiance" TEXT NOT NULL
);

-- CreateIndex
CREATE INDEX "PrixReference_designation_idx" ON "PrixReference"("designation");
