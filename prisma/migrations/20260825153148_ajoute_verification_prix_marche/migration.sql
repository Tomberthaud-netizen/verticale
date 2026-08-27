-- AlterTable
ALTER TABLE "PrixReference" ADD COLUMN "ecartPrixMarche" REAL;
ALTER TABLE "PrixReference" ADD COLUMN "prixMarcheReference" REAL;
ALTER TABLE "PrixReference" ADD COLUMN "sourceVerification" TEXT;
ALTER TABLE "PrixReference" ADD COLUMN "verifiePrixLe" DATETIME;
