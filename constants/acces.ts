import type { AccesOnglet, AccesSousOnglet } from "@prisma/client";

export const ACCES_ONGLETS: AccesOnglet[] = [
  "VUE_ENSEMBLE",
  "CALENDRIER",
  "DEVIS",
  "CHANTIERS",
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
  CHANTIERS: "Chantiers",
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

/** Sous-onglets de la fiche chantier (onglet CHANTIERS), pour un accès plus fin par personne. */
export const SOUS_ONGLETS_CHANTIER: AccesSousOnglet[] = [
  "CHANTIER_PLANNING",
  "CHANTIER_FINANCES",
  "CHANTIER_ADRESSE",
];

export const ACCES_SOUS_ONGLET_LABELS: Record<AccesSousOnglet, string> = {
  CHANTIER_PLANNING: "Planning",
  CHANTIER_FINANCES: "Finances",
  CHANTIER_ADRESSE: "Adresse",
};
