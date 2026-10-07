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
