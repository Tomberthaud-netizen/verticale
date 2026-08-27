export interface EcartChiffrage {
  ecartMontant: number;
  ecartPourcentage: number;
}

/**
 * Écart de chiffrage = différence entre le réel (facturé) et l'estimatif (devis), en valeur
 * et en pourcentage de l'estimatif. `null` si l'estimatif est nul (pourcentage indéfini).
 */
export function calculerEcartChiffrage(estimatifHT: number, reelHT: number): EcartChiffrage | null {
  if (estimatifHT === 0) return null;
  const ecartMontant = reelHT - estimatifHT;
  return { ecartMontant, ecartPourcentage: (ecartMontant / estimatifHT) * 100 };
}

/** Reste à facturer sur une affaire gagnée = total du devis - montant déjà facturé. */
export function calculerResteAFacturer(totalHT: number, dejaFactureHT: number): number {
  return totalHT - dejaFactureHT;
}
