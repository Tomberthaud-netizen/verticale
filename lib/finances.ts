/**
 * Prix du chantier = somme des cases financières (lignes manuelles + devis liés).
 * Chaque case ne compte qu'une fois son montant, quelle que soit son origine.
 */
export function calculerPrixChantier(cases: { montant: number }[]): number {
  return cases.reduce((somme, c) => somme + c.montant, 0);
}

/** Coût réel = prix d'achat du bien + prix du chantier. `null` si aucun des deux n'est renseigné. */
export function calculerCoutReel(
  prixAchat: number | null | undefined,
  prixChantier: number | null | undefined
): number | null {
  if (prixAchat == null && prixChantier == null) return null;
  return (prixAchat ?? 0) + (prixChantier ?? 0);
}

/** Bénéfice prévisionnel = prix de revente - coût réel. `null` si l'un des deux manque. */
export function calculerBeneficePrevisionnel(
  prixRevente: number | null | undefined,
  coutReel: number | null
): number | null {
  if (prixRevente == null || coutReel == null) return null;
  return prixRevente - coutReel;
}

/** Marge réalisée = bénéfice réel / chiffre d'affaires HT, en pourcentage. `null` si le CA est nul ou absent. */
export function calculerMargePourcentage(beneficeReel: number, ca: number): number | null {
  if (!ca) return null;
  return (beneficeReel / ca) * 100;
}

/**
 * Une échéance de paiement (devis validé ou chantier achat/revente) est dépassée si elle est
 * renseignée, déjà passée, et que le montant n'a pas encore été marqué comme encaissé.
 */
export function estEcheancePaiementDepassee(
  dateLimitePaiement: Date | null | undefined,
  paye: boolean,
  aujourdHui: Date = new Date()
): boolean {
  if (paye || !dateLimitePaiement) return false;
  return dateLimitePaiement < aujourdHui;
}

export function formaterMontant(montant: number | null | undefined): string {
  if (montant == null) return "—";
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(
    montant
  );
}
