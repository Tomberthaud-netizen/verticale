export interface LigneDevisInput {
  quantite: number;
  prixUnitaire: number;
}

/** Total HT d'une ligne = quantité × prix unitaire. */
export function calculerTotalLigne(ligne: LigneDevisInput): number {
  return ligne.quantite * ligne.prixUnitaire;
}

/** Total HT du devis = somme des totaux de chaque ligne. */
export function calculerTotalHT(lignes: LigneDevisInput[]): number {
  return lignes.reduce((somme, ligne) => somme + calculerTotalLigne(ligne), 0);
}

/** Total HT net = total HT brut moins la remise commerciale (jamais négatif). */
export function calculerTotalHTNet(totalHTBrut: number, remiseHT: number | null | undefined): number {
  return Math.max(0, totalHTBrut - (remiseHT ?? 0));
}

/** Montant de TVA = total HT × taux / 100. */
export function calculerMontantTVA(totalHT: number, tauxTVA: number): number {
  return totalHT * (tauxTVA / 100);
}

/** Total TTC = total HT + montant de TVA. */
export function calculerTotalTTC(totalHT: number, montantTVA: number): number {
  return totalHT + montantTVA;
}

const PREFIXES_ENTREPRISE: Record<string, string> = {
  VERTICALE: "VRT",
  CB2B: "CB2B",
};

export function prefixeEntreprise(entreprise: string): string {
  return PREFIXES_ENTREPRISE[entreprise] ?? entreprise;
}

/**
 * Numéro de devis lisible : PREFIXE-ANNEE-SEQUENCE (ex. VRT-2026-0007).
 * `sequenceDejaExistante` = nombre de devis déjà émis par cette entreprise sur cette année.
 */
export function genererNumeroDevis(
  entreprise: string,
  annee: number,
  sequenceDejaExistante: number
): string {
  const sequence = String(sequenceDejaExistante + 1).padStart(4, "0");
  return `${prefixeEntreprise(entreprise)}-${annee}-${sequence}`;
}
