import type { Prisma } from "@prisma/client";
import { genererNumeroBonCommande } from "./bonCommande";
import { prefixeEntreprise } from "./devis";

/** Prochain numéro de bon de commande de l'entreprise pour l'année en cours (à appeler dans la transaction de création). */
export async function prochainNumeroBonCommande(
  tx: Prisma.TransactionClient,
  entreprise: string,
  annee: number = new Date().getFullYear()
): Promise<string> {
  const sequenceDejaExistante = await tx.bonCommande.count({
    where: { entreprise, numero: { startsWith: `BC-${prefixeEntreprise(entreprise)}-${annee}-` } },
  });
  return genererNumeroBonCommande(entreprise, annee, sequenceDejaExistante);
}
