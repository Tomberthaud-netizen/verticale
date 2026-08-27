-- CreateTable
CREATE TABLE "IndiceBT" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "periode" TEXT NOT NULL,
    "valeur" REAL NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "IndiceBT_periode_key" ON "IndiceBT"("periode");
