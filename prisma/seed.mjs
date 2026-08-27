import { PrismaClient } from "@prisma/client";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const prisma = new PrismaClient();

const indicesBT = JSON.parse(readFileSync(path.join(__dirname, "seed-data", "indices-bt.json"), "utf-8"));
const typesTravaux = JSON.parse(readFileSync(path.join(__dirname, "seed-data", "types-travaux.json"), "utf-8"));
const catalogueDePrix = JSON.parse(
  readFileSync(path.join(__dirname, "seed-data", "catalogue-prix-extrait.json"), "utf-8")
);

async function main() {
  for (const [periode, valeur] of Object.entries(indicesBT.valeurs)) {
    await prisma.indiceBT.upsert({
      where: { periode },
      update: { valeur },
      create: { periode, valeur },
    });
  }
  console.log(`Indices BT : ${Object.keys(indicesBT.valeurs).length} périodes synchronisées (${indicesBT.source}).`);

  for (const { designation, lot } of typesTravaux.items) {
    await prisma.typeDeTravaux.upsert({
      where: { designation },
      update: { lot },
      create: { designation, lot },
    });
  }
  console.log(`Catalogue de types de travaux : ${typesTravaux.items.length} désignations synchronisées.`);

  const dureesParDefaut = ["Démolition", "Rénovation", "Aménagement"];
  for (const type of dureesParDefaut) {
    await prisma.dureeTypeTravaux.upsert({ where: { type }, update: {}, create: { type } });
  }
  console.log(`Catalogue de durées par type de travaux : ${dureesParDefaut.length} types par défaut assurés.`);

  const entreprisesParDefaut = [
    { code: "VERTICALE", nom: "Verticale", tagline: "Vos espaces immobiliers" },
    { code: "CB2B", nom: "CB2B" },
  ];
  for (const { code, nom, tagline } of entreprisesParDefaut) {
    await prisma.entreprise.upsert({ where: { code }, update: {}, create: { code, nom, tagline } });
  }
  console.log(`Entreprises : ${entreprisesParDefaut.length} fiches par défaut assurées.`);

  await prisma.prixReference.deleteMany({});
  await prisma.prixReference.createMany({
    data: catalogueDePrix.items.map((item) => ({
      designation: item.designation,
      lot: item.lot ?? null,
      prixUnitaire: item.prixUnitaire,
      unite: item.unite ?? null,
      dateReference: item.dateReference ? new Date(item.dateReference) : null,
      sourceFichier: item.sourceFichier,
      confiance: item.confiance.toUpperCase(),
      prixMarcheReference: item.prixMarcheReference ?? null,
      ecartPrixMarche: item.ecartPrixMarche ?? null,
      sourceVerification: item.sourceVerification ?? null,
      verifiePrixLe: item.verifiePrixLe ? new Date(item.verifiePrixLe) : null,
      horsBtp: item.horsBtp ?? false,
      horsBtpRaison: item.horsBtpRaison ?? null,
    })),
  });
  console.log(`Prix de référence (extraits des devis sous-traitants) : ${catalogueDePrix.items.length} lignes synchronisées.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
