"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { StatutAffaire } from "@prisma/client";
import { modifierStatutAffaire } from "@/app/affairesActions";
import { STATUTS_AFFAIRE, STATUT_AFFAIRE_INFO } from "@/constants/affaires";

export default function StatutAffaireSelect({ devisId, statut }: { devisId: string; statut: StatutAffaire }) {
  const router = useRouter();
  const [enCours, setEnCours] = useState(false);

  async function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    setEnCours(true);
    try {
      await modifierStatutAffaire(devisId, e.target.value);
      router.refresh();
    } finally {
      setEnCours(false);
    }
  }

  return (
    <select
      value={statut}
      onChange={handleChange}
      disabled={enCours}
      className="border border-border rounded-md px-2 py-1.5 text-sm bg-surface disabled:opacity-50"
    >
      {STATUTS_AFFAIRE.map((s) => (
        <option key={s} value={s}>
          {STATUT_AFFAIRE_INFO[s].label}
        </option>
      ))}
    </select>
  );
}
