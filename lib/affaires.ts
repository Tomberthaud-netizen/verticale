export interface AffaireEnJeu {
  montant: number;
}

/** Montant total en jeu = somme des montants des affaires non closes (ni brouillon, ni gagnée/perdue). */
export function calculerMontantEnJeu(affaires: AffaireEnJeu[]): number {
  return affaires.reduce((somme, a) => somme + a.montant, 0);
}
