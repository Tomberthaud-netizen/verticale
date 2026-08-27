/** Entreprises pouvant être assignées à un chantier. Ajouter ici pour en proposer de nouvelles. */
export const ENTREPRISES = ["VERTICALE", "CB2B"] as const;

export type Entreprise = (typeof ENTREPRISES)[number];
