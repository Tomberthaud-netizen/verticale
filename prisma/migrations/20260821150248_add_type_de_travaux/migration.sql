-- CreateTable
CREATE TABLE "TypeDeTravaux" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "designation" TEXT NOT NULL,
    "lot" TEXT
);

-- CreateIndex
CREATE UNIQUE INDEX "TypeDeTravaux_designation_key" ON "TypeDeTravaux"("designation");
