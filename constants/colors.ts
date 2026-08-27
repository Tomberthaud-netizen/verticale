import type { EvenementType } from "@prisma/client";
import type { PhaseType } from "@/lib/dates";

export const PHASE_COLORS: Record<PhaseType, { bg: string; border: string; label: string }> = {
  DEMOLITION: { bg: "#e05d44", border: "#b8432e", label: "Démolition" },
  RENOVATION: { bg: "#3b82f6", border: "#2563eb", label: "Rénovation" },
  AMENAGEMENT: { bg: "#22a35d", border: "#16803f", label: "Aménagement" },
  PERSONNALISEE: { bg: "#8b5cf6", border: "#7c3aed", label: "Personnalisée" },
};

export const RETARD_COLOR = { bg: "#3f3f46", border: "#27272a", label: "Retard" };

/** Devis validé, planning prévisionnel (pas encore un chantier en bonne et due forme). */
export const DEVIS_PROJETE_COLOR = { bg: "#eab308", border: "#a16207", label: "Prévisionnel (devis)" };

export const ETAT_COLORS: Record<"A_VENIR" | "EN_COURS" | "TERMINE", { bg: string; text: string; label: string }> = {
  A_VENIR: { bg: "#eef2ff", text: "#4338ca", label: "À venir" },
  EN_COURS: { bg: "#ecfdf5", text: "#047857", label: "En cours" },
  TERMINE: { bg: "#f4f4f5", text: "#52525b", label: "Terminé" },
};

/** Libellé affiché pour une phase : son nom personnalisé si présent, sinon le libellé par défaut du type. */
export function libellePhase(phase: { type: PhaseType; nom?: string | null }): string {
  if (phase.type === "PERSONNALISEE" && phase.nom) return phase.nom;
  return PHASE_COLORS[phase.type].label;
}

export const EVENEMENT_TYPE_COLORS: Record<EvenementType, { bg: string; text: string; label: string }> = {
  LIVRAISON: { bg: "#ccfbf1", text: "#0f766e", label: "Livraison" },
  REUNION: { bg: "#fce7f3", text: "#be185d", label: "Réunion" },
  INSPECTION: { bg: "#e0f2fe", text: "#0369a1", label: "Inspection" },
  AUTRE: { bg: "#f1f5f9", text: "#475569", label: "Autre" },
};

/** Libellé affiché pour un événement : son type personnalisé si "Autre", sinon le libellé du type. */
export function libelleEvenement(evenement: {
  type: EvenementType;
  typePersonnalise?: string | null;
}): string {
  if (evenement.type === "AUTRE" && evenement.typePersonnalise) return evenement.typePersonnalise;
  return EVENEMENT_TYPE_COLORS[evenement.type].label;
}
