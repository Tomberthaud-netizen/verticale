import type { StatutAffaire } from "@prisma/client";
import { STATUT_AFFAIRE_INFO } from "@/constants/affaires";

export default function StatutAffaireBadge({ statut }: { statut: StatutAffaire }) {
  const info = STATUT_AFFAIRE_INFO[statut];
  return (
    <span
      className="text-xs font-medium px-2.5 py-1 rounded-full"
      style={{ backgroundColor: info.bg, color: info.text }}
    >
      {info.label}
    </span>
  );
}
