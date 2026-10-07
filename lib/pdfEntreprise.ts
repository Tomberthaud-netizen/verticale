import { readFile } from "node:fs/promises";
import path from "node:path";
import { prisma } from "@/lib/prisma";
import { ENTREPRISES_INFO, type EntrepriseInfo } from "@/constants/entreprisesInfo";

/** Logo (data URI) et coordonnées d'une entreprise, communs aux PDF de devis et de bon de commande. */
export async function chargerIdentiteEntreprisePdf(
  entreprise: string
): Promise<{ logoDataUri: string | null; info: EntrepriseInfo }> {
  const entrepriseDb = await prisma.entreprise.findUnique({ where: { code: entreprise } });

  let logoDataUri: string | null = null;
  if (entrepriseDb?.logoDonnees && entrepriseDb.logoTypeMime) {
    // Logo envoyé depuis Administration › Informations société, stocké en base (voir le
    // commentaire sur Entreprise.logoPath dans prisma/schema.prisma).
    logoDataUri = `data:${entrepriseDb.logoTypeMime};base64,${Buffer.from(entrepriseDb.logoDonnees).toString("base64")}`;
  } else if (entreprise === "VERTICALE") {
    // Repli sur le logo par défaut du site, fourni dans le dépôt (jamais un upload runtime,
    // donc pas concerné par la perte de fichiers au déploiement).
    try {
      const buffer = await readFile(path.join(process.cwd(), "public", "logo.jpg"));
      logoDataUri = `data:image/jpeg;base64,${buffer.toString("base64")}`;
    } catch {
      logoDataUri = null;
    }
  }

  const infoDefaut = ENTREPRISES_INFO[entreprise] ?? ENTREPRISES_INFO.VERTICALE;
  const info: EntrepriseInfo = entrepriseDb
    ? {
        nom: entrepriseDb.nom,
        tagline: entrepriseDb.tagline ?? undefined,
        adresse: [entrepriseDb.adresse, [entrepriseDb.codePostal, entrepriseDb.ville].filter(Boolean).join(" ")]
          .filter(Boolean)
          .join(", "),
        telephone: entrepriseDb.telephone ?? undefined,
        email: entrepriseDb.email ?? undefined,
        siret: entrepriseDb.siret ?? undefined,
        siren: entrepriseDb.siret ? entrepriseDb.siret.slice(0, 9) : undefined,
        tvaIntracom: entrepriseDb.tvaIntracom ?? undefined,
        formeJuridique: entrepriseDb.formeJuridique ?? undefined,
      }
    : infoDefaut;

  return { logoDataUri, info };
}
