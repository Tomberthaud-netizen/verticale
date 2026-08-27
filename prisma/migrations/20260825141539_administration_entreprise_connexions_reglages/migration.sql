-- CreateTable
CREATE TABLE "Entreprise" (
    "code" TEXT NOT NULL PRIMARY KEY,
    "nom" TEXT NOT NULL,
    "tagline" TEXT,
    "adresse" TEXT,
    "codePostal" TEXT,
    "ville" TEXT,
    "telephone" TEXT,
    "email" TEXT,
    "siret" TEXT,
    "tvaIntracom" TEXT,
    "logoPath" TEXT,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Connexion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "personneId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "ip" TEXT,
    "appareil" TEXT,
    "connecteLe" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deconnecteLe" DATETIME,
    CONSTRAINT "Connexion_personneId_fkey" FOREIGN KEY ("personneId") REFERENCES "Personne" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ParametresSite" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'singleton',
    "couleurPrincipale" TEXT NOT NULL DEFAULT '#1c1917'
);

-- CreateTable
CREATE TABLE "ParametreOnglet" (
    "onglet" TEXT NOT NULL PRIMARY KEY,
    "libellePersonnalise" TEXT,
    "ordre" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Connexion_sessionId_key" ON "Connexion"("sessionId");

-- CreateIndex
CREATE INDEX "Connexion_personneId_idx" ON "Connexion"("personneId");
