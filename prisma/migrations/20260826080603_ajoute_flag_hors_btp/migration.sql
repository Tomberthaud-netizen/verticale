-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_PrixReference" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "designation" TEXT NOT NULL,
    "lot" TEXT,
    "prixUnitaire" REAL NOT NULL,
    "unite" TEXT,
    "dateReference" DATETIME,
    "sourceFichier" TEXT NOT NULL,
    "confiance" TEXT NOT NULL,
    "prixMarcheReference" REAL,
    "ecartPrixMarche" REAL,
    "sourceVerification" TEXT,
    "verifiePrixLe" DATETIME,
    "horsBtp" BOOLEAN NOT NULL DEFAULT false,
    "horsBtpRaison" TEXT
);
INSERT INTO "new_PrixReference" ("confiance", "dateReference", "designation", "ecartPrixMarche", "id", "lot", "prixMarcheReference", "prixUnitaire", "sourceFichier", "sourceVerification", "unite", "verifiePrixLe") SELECT "confiance", "dateReference", "designation", "ecartPrixMarche", "id", "lot", "prixMarcheReference", "prixUnitaire", "sourceFichier", "sourceVerification", "unite", "verifiePrixLe" FROM "PrixReference";
DROP TABLE "PrixReference";
ALTER TABLE "new_PrixReference" RENAME TO "PrixReference";
CREATE INDEX "PrixReference_designation_idx" ON "PrixReference"("designation");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
