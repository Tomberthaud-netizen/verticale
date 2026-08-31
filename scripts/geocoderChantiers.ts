/**
 * Résout les coordonnées (latitude/longitude) de tous les chantiers dont l'adresse n'a pas
 * encore été géocodée — utile une fois, pour les chantiers créés avant l'ajout de la carte
 * (les nouveaux chantiers sont géocodés automatiquement à la création / modification d'adresse).
 *
 * Usage : npx tsx scripts/geocoderChantiers.ts
 */
import "dotenv/config";
import { prisma } from "../lib/prisma";
import { geocoderAdresse } from "../lib/geocodage";

async function main() {
  const chantiers = await prisma.chantier.findMany({
    where: { latitude: null, adresse: { not: "" } },
    select: { id: true, nom: true, adresse: true },
  });

  if (chantiers.length === 0) {
    console.log("Rien à géocoder.");
    return;
  }

  for (const chantier of chantiers) {
    const coordonnees = await geocoderAdresse(chantier.adresse);
    if (coordonnees) {
      await prisma.chantier.update({
        where: { id: chantier.id },
        data: { latitude: coordonnees.latitude, longitude: coordonnees.longitude },
      });
      console.log(`OK — ${chantier.nom} : ${coordonnees.latitude}, ${coordonnees.longitude}`);
    } else {
      console.log(`Échec — ${chantier.nom} (« ${chantier.adresse} » introuvable)`);
    }
    // Respecte la politique d'usage de Nominatim (1 requête/seconde maximum).
    await new Promise((r) => setTimeout(r, 1100));
  }
}

main()
  .catch((err) => {
    console.error("Échec :", err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
