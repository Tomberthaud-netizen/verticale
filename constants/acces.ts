import type { AccesOnglet } from "@prisma/client";

export const ACCES_ONGLETS: AccesOnglet[] = [
  "VUE_ENSEMBLE",
  "CALENDRIER",
  "DEVIS",
  "FOURNISSEURS",
  "SOUS_TRAITANTS",
  "FINANCE",
  "DIRECTION",
  "CATALOGUE",
  "ADMINISTRATION",
];

export const ACCES_LABELS: Record<AccesOnglet, string> = {
  VUE_ENSEMBLE: "Vue d'ensemble",
  CALENDRIER: "Calendrier Global",
  DEVIS: "Devis",
  FOURNISSEURS: "Fournisseurs",
  SOUS_TRAITANTS: "Sous-traitants",
  FINANCE: "Finance",
  DIRECTION: "Direction",
  CATALOGUE: "Catalogue",
  ADMINISTRATION: "Administration",
};

/**
 * Onglets non cloisonnés par entreprise : communs à VERTICALE et CB2B, un seul accès
 * (pas de distinction par société). Tous les autres onglets sont propres à une entreprise.
 */
export const ONGLETS_SANS_ENTREPRISE: AccesOnglet[] = ["CALENDRIER", "ADMINISTRATION", "CATALOGUE"];
