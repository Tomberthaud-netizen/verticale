import type { StatutPaiementFacture } from "@/lib/factures";
import { STATUT_PAIEMENT_INFO } from "@/constants/factures";

export default function StatutPaiementBadge({ statut }: { statut: StatutPaiementFacture }) {
  const info = STATUT_PAIEMENT_INFO[statut];
  return (
    <span className="text-xs font-medium px-2.5 py-1 rounded-full" style={{ backgroundColor: info.bg, color: info.text }}>
      {info.label}
    </span>
  );
}
