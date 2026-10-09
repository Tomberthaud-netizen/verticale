import { prisma } from "@/lib/prisma";
import { actualiserPrix, trouverIndicePourDate } from "@/lib/indiceBT";
import { memeUnite, trouverMeilleureLigne, trouverMeilleureReference } from "@/lib/suggestionPrix";

export interface SuggestionPrixResult {
  prixSource: number;
  dateSourceISO: string | null;
  origine: "DEVIS" | "CATALOGUE";
  sourceLabel: string;
  confiance: "HAUTE" | "MOYENNE" | "BASSE" | null;
  prixActualise: number | null;
  /** Unité du prix source (quand elle est connue). */
  unite?: string | null;
}

/**
 * Propose un prix unitaire pour une désignation saisie. Priorité à l'historique réel des
 * devis (ligne la plus récente avec une désignation identique ou proche) ; à défaut, repli sur
 * le catalogue de prix extrait des devis de sous-traitants historiques. Le prix retenu est
 * actualisé à la date cible via l'indice BT01. Aucune vérification d'accès ici : à faire par l'appelant.
 * Si `unite` est fournie, seuls les prix exprimés dans cette même unité sont retenus (évite de
 * proposer un forfait pour un prix au m²).
 */
export async function chercherSuggestionPrix(
  designation: string,
  dateCible: string,
  unite?: string
): Promise<SuggestionPrixResult | null> {
  if (!designation.trim() || !dateCible) return null;

  const indices = await prisma.indiceBT.findMany();
  const indiceCible = trouverIndicePourDate(indices, new Date(dateCible));

  const lignesBrutes = await prisma.ligneDevis.findMany({
    select: {
      designation: true,
      prixUnitaire: true,
      unite: true,
      devis: { select: { dateDevis: true, numero: true, intitule: true } },
    },
  });
  const lignes = lignesBrutes
    .filter((l) => !unite || memeUnite(l.unite, unite))
    .map((l) => ({
    designation: l.designation,
    prixUnitaire: l.prixUnitaire,
    unite: l.unite,
    dateDevis: l.devis.dateDevis,
    devisNumero: l.devis.numero,
    devisIntitule: l.devis.intitule,
  }));
  const meilleureLigne = trouverMeilleureLigne(lignes, designation);
  if (meilleureLigne) {
    const indiceSource = trouverIndicePourDate(indices, meilleureLigne.dateDevis);
    return {
      prixSource: meilleureLigne.prixUnitaire,
      dateSourceISO: meilleureLigne.dateDevis.toISOString(),
      origine: "DEVIS",
      sourceLabel: `${meilleureLigne.devisNumero} — ${meilleureLigne.devisIntitule}`,
      confiance: null,
      prixActualise: actualiserPrix(meilleureLigne.prixUnitaire, indiceSource, indiceCible),
      unite: meilleureLigne.unite ?? null,
    };
  }

  const referencesBrutes = await prisma.prixReference.findMany({
    select: { designation: true, prixUnitaire: true, unite: true, dateReference: true, lot: true, confiance: true },
  });
  const references = unite ? referencesBrutes.filter((r) => memeUnite(r.unite, unite)) : referencesBrutes;
  const meilleureReference = trouverMeilleureReference(references, designation);
  if (!meilleureReference) return null;

  const indiceSource = meilleureReference.dateReference
    ? trouverIndicePourDate(indices, meilleureReference.dateReference)
    : null;
  return {
    prixSource: meilleureReference.prixUnitaire,
    dateSourceISO: meilleureReference.dateReference?.toISOString() ?? null,
    origine: "CATALOGUE",
    sourceLabel: meilleureReference.lot ? `Catalogue — ${meilleureReference.lot}` : "Catalogue",
    confiance: meilleureReference.confiance,
    prixActualise: actualiserPrix(meilleureReference.prixUnitaire, indiceSource, indiceCible),
    unite: meilleureReference.unite ?? null,
  };
}
