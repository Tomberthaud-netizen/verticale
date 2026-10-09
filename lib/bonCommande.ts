import { calculerTotalHT, prefixeEntreprise } from "./devis";

/** Prix unitaire d'un bon de commande = prix unitaire du devis ÷ diviseur, arrondi au centime. */
export function calculerPrixUnitaireBonCommande(prixUnitaireDevis: number, diviseur: number): number {
  return Math.round((prixUnitaireDevis / diviseur) * 100) / 100;
}

/** Total HT d'un bon de commande (somme quantité × prix unitaire déjà divisé de chaque ligne). */
export function calculerTotalHTBonCommande(lignes: { quantite: number; prixUnitaire: number }[]): number {
  return calculerTotalHT(lignes);
}

/** Un diviseur valide est un nombre fini strictement positif (diviser par 0 ou négatif n'a pas de sens). */
export function estDiviseurValide(diviseur: number): boolean {
  return Number.isFinite(diviseur) && diviseur > 0;
}

/** Numéro lisible : BC-PREFIXE-ANNEE-SEQUENCE (ex. BC-VRT-2026-0003). */
export function genererNumeroBonCommande(entreprise: string, annee: number, sequenceDejaExistante: number): string {
  return `BC-${prefixeEntreprise(entreprise)}-${annee}-${String(sequenceDejaExistante + 1).padStart(4, "0")}`;
}

/**
 * Plus grand numéro de séquence déjà utilisé parmi les numéros commençant par `prefixe` (0 s'il n'y
 * en a pas). Plus fiable qu'un simple comptage : si un numéro a été renommé ou supprimé, le
 * prochain numéro ne retombe pas sur un numéro existant.
 */
export function sequenceMaxBonCommande(numeros: string[], prefixe: string): number {
  let max = 0;
  for (const numero of numeros) {
    if (!numero.startsWith(prefixe)) continue;
    const suite = numero.slice(prefixe.length);
    if (/^\d+$/.test(suite)) max = Math.max(max, Number(suite));
  }
  return max;
}

/**
 * Prix unitaire de facture = prix unitaire du bon de commande majoré de `pourcentage` %, arrondi
 * au centime (ex. 100 € avec +20 % → 120 €).
 */
export function calculerPrixUnitaireAvecAugmentation(prixUnitaire: number, pourcentage: number): number {
  return Math.round(prixUnitaire * (1 + pourcentage / 100) * 100) / 100;
}

/**
 * Montant HT de la facture issue d'un bon de commande : chaque prix unitaire est majoré (et arrondi
 * au centime) avant d'être multiplié par la quantité, comme sur un document ligne par ligne.
 */
export function calculerMontantFactureDepuisBonCommande(
  lignes: { quantite: number; prixUnitaire: number }[],
  pourcentage: number
): number {
  return calculerTotalHT(
    lignes.map((l) => ({
      quantite: l.quantite,
      prixUnitaire: calculerPrixUnitaireAvecAugmentation(l.prixUnitaire, pourcentage),
    }))
  );
}

/** Un pourcentage d'augmentation valide est un nombre fini, positif ou nul. */
export function estPourcentageValide(pourcentage: number): boolean {
  return Number.isFinite(pourcentage) && pourcentage >= 0;
}

export interface LigneBonCommandeSaisie {
  designation: string;
  detail?: string;
  unite?: string;
  quantite: number;
  prixUnitaire: number;
}

/**
 * Valide les lignes saisies pour un bon de commande : au moins une ligne, chacune avec une
 * désignation, une quantité strictement positive et un prix unitaire numérique. Retourne le
 * message d'erreur à afficher, ou null si tout est correct.
 */
export function validerLignesBonCommande(lignes: LigneBonCommandeSaisie[]): string | null {
  if (lignes.length === 0) return "Ajoutez au moins une ligne au bon de commande.";
  for (const ligne of lignes) {
    if (!ligne.designation.trim()) return "Chaque ligne doit avoir une désignation.";
    if (!Number.isFinite(ligne.quantite) || ligne.quantite <= 0) return "Chaque ligne doit avoir une quantité positive.";
    if (!Number.isFinite(ligne.prixUnitaire)) return "Chaque ligne doit avoir un prix unitaire.";
  }
  return null;
}
