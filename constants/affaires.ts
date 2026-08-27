import type { StatutAffaire, TypeEvenementDevis } from "@prisma/client";

export const STATUTS_AFFAIRE: StatutAffaire[] = ["BROUILLON", "ENVOYE", "RELANCE", "GAGNE", "PERDU"];

export const STATUT_AFFAIRE_INFO: Record<StatutAffaire, { label: string; bg: string; text: string }> = {
  BROUILLON: { label: "Brouillon", bg: "#f1f5f9", text: "#475569" },
  ENVOYE: { label: "Envoyé", bg: "#eef2ff", text: "#4338ca" },
  RELANCE: { label: "Relancé", bg: "#fef3c7", text: "#92400e" },
  GAGNE: { label: "Gagné", bg: "#ecfdf5", text: "#047857" },
  PERDU: { label: "Perdu", bg: "#fef2f2", text: "#b91c1c" },
};

/** Statuts considérés "en jeu" pour le montant pondéré du portefeuille (ni brouillon, ni clos). */
export const STATUTS_EN_JEU: StatutAffaire[] = ["ENVOYE", "RELANCE"];

export const TYPES_EVENEMENT_DEVIS: TypeEvenementDevis[] = ["NOTE", "APPEL", "EMAIL", "RELANCE"];

export const TYPE_EVENEMENT_DEVIS_LABELS: Record<TypeEvenementDevis, string> = {
  NOTE: "Note",
  APPEL: "Appel",
  EMAIL: "E-mail",
  RELANCE: "Relance",
};
