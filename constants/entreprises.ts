/** Entreprises pouvant être assignées à un chantier. Ajouter ici pour en proposer de nouvelles. */
export const ENTREPRISES = ["VERTICALE", "CB2B"] as const;

export type Entreprise = (typeof ENTREPRISES)[number];

/** Libellé du bouton retirant un chantier terminé de la carte du Calendrier Global — le
 * vocabulaire diffère selon l'activité de l'entreprise (achat-revente vs. rénovation pour tiers). */
export const LABEL_RETIRER_CARTE: Record<Entreprise, string> = {
  VERTICALE: "VENDU",
  CB2B: "Fin de chantier",
};
