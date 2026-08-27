import type { StatutPaiementFacture } from "@/lib/factures";

export const STATUT_PAIEMENT_INFO: Record<StatutPaiementFacture, { label: string; bg: string; text: string }> = {
  EMISE: { label: "Émise", bg: "#eef2ff", text: "#4338ca" },
  PARTIELLE: { label: "Partiellement payée", bg: "#fef3c7", text: "#92400e" },
  PAYEE: { label: "Payée", bg: "#ecfdf5", text: "#047857" },
  EN_RETARD: { label: "En retard", bg: "#fef2f2", text: "#b91c1c" },
  ANNULEE: { label: "Annulée", bg: "#f1f5f9", text: "#475569" },
};
