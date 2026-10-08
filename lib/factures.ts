export type StatutPaiementFacture = "PAYEE" | "PARTIELLE" | "EN_RETARD" | "EMISE" | "ANNULEE";

const PREFIXES_ENTREPRISE_FACTURE: Record<string, string> = {
  VERTICALE: "FAC-VRT",
  CB2B: "FAC-CB2B",
};

/** Numéro de facture lisible : PREFIXE-ANNEE-SEQUENCE (ex. FAC-VRT-2026-0007). */
export function genererNumeroFacture(entreprise: string, annee: number, sequenceDejaExistante: number): string {
  const prefixe = PREFIXES_ENTREPRISE_FACTURE[entreprise] ?? `FAC-${entreprise}`;
  const sequence = String(sequenceDejaExistante + 1).padStart(4, "0");
  return `${prefixe}-${annee}-${sequence}`;
}

/** Montant total déjà encaissé sur une facture = somme de ses paiements. */
export function calculerMontantPaye(paiements: { montant: number }[]): number {
  return paiements.reduce((somme, p) => somme + p.montant, 0);
}

/**
 * Statut de paiement dérivé d'une facture : ANNULEE prime toujours ; sinon PAYEE si le
 * montant encaissé couvre le TTC, PARTIELLE si un acompte a été versé, EN_RETARD si
 * l'échéance est dépassée sans paiement, sinon EMISE (en attente).
 */
export function calculerStatutPaiement(
  statutBase: "EMISE" | "ANNULEE",
  montantTTC: number,
  montantPaye: number,
  dateEcheance: Date | null,
  aujourdHui: Date = new Date()
): StatutPaiementFacture {
  if (statutBase === "ANNULEE") return "ANNULEE";
  if (montantTTC > 0 && montantPaye >= montantTTC) return "PAYEE";
  if (montantPaye > 0) return "PARTIELLE";
  if (dateEcheance && dateEcheance < aujourdHui) return "EN_RETARD";
  return "EMISE";
}

/** Bénéfice réel = montant vendu HT - coût de réalisation HT. `null` si le coût n'est pas renseigné. */
export function calculerBeneficeReel(montantHT: number, coutRealisationHT: number | null): number | null {
  if (coutRealisationHT == null) return null;
  return montantHT - coutRealisationHT;
}

/**
 * Date à laquelle une facture a été intégralement encaissée : la date du paiement qui fait
 * atteindre le montant TTC, en cumulant les paiements par ordre chronologique. `null` si la
 * facture n'est pas encore intégralement payée.
 */
export function trouverDateEncaissementComplet(
  paiements: { montant: number; datePaiement: Date }[],
  montantTTC: number
): Date | null {
  if (montantTTC <= 0) return null;
  const tries = [...paiements].sort((a, b) => a.datePaiement.getTime() - b.datePaiement.getTime());
  let cumul = 0;
  for (const paiement of tries) {
    cumul += paiement.montant;
    if (cumul >= montantTTC) return paiement.datePaiement;
  }
  return null;
}

const MS_PAR_JOUR = 24 * 60 * 60 * 1000;

/**
 * Alerte de retard d'encaissement : une facture encore impayée (même partiellement) dont
 * l'émission remonte à plus de `seuilJours` (1,5 mois ≈ 45 jours par défaut).
 */
export function estAlerteRetardEncaissement(
  dateFacture: Date,
  montantTTC: number,
  montantPaye: number,
  aujourdHui: Date = new Date(),
  seuilJours = 45
): boolean {
  if (montantTTC > 0 && montantPaye >= montantTTC) return false;
  const joursEcoules = Math.floor((aujourdHui.getTime() - dateFacture.getTime()) / MS_PAR_JOUR);
  return joursEcoules > seuilJours;
}
