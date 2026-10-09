import type { Prisma } from "@prisma/client";
import { genererNumeroBonCommande, sequenceMaxBonCommande } from "./bonCommande";
import { prefixeEntreprise } from "./devis";

/** Prochain numéro de bon de commande de l'entreprise pour l'année en cours (à appeler dans la transaction de création). */
export async function prochainNumeroBonCommande(
  tx: Prisma.TransactionClient,
  entreprise: string,
  annee: number = new Date().getFullYear()
): Promise<string> {
  const prefixe = `BC-${prefixeEntreprise(entreprise)}-${annee}-`;
  const existants = await tx.bonCommande.findMany({
    where: { numero: { startsWith: prefixe } },
    select: { numero: true },
  });
  return genererNumeroBonCommande(entreprise, annee, sequenceMaxBonCommande(existants.map((b) => b.numero), prefixe));
}
