-- CreateTable
CREATE TABLE "Personne" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nom" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "telephone" TEXT,
    "motDePasseHash" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "AccesPersonne" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "personneId" TEXT NOT NULL,
    "onglet" TEXT NOT NULL,
    CONSTRAINT "AccesPersonne_personneId_fkey" FOREIGN KEY ("personneId") REFERENCES "Personne" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Personne_email_key" ON "Personne"("email");

-- CreateIndex
CREATE INDEX "AccesPersonne_personneId_idx" ON "AccesPersonne"("personneId");

-- CreateIndex
CREATE UNIQUE INDEX "AccesPersonne_personneId_onglet_key" ON "AccesPersonne"("personneId", "onglet");
