"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { affecterSousTraitant } from "@/app/actions";

interface SousTraitantChantierSelectProps {
  chantierId: string;
  sousTraitantActuel: { id: string; nom: string } | null;
  sousTraitants: { id: string; nom: string }[];
}

export default function SousTraitantChantierSelect({
  chantierId,
  sousTraitantActuel,
  sousTraitants,
}: SousTraitantChantierSelectProps) {
  const router = useRouter();
  const [enCours, setEnCours] = useState(false);

  async function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    setEnCours(true);
    try {
      await affecterSousTraitant(chantierId, e.target.value || null);
      router.refresh();
    } finally {
      setEnCours(false);
    }
  }

  return (
    <span className="inline-flex items-center gap-1.5 print:hidden">
      <span className="text-muted">Sous-traitant :</span>
      <select
        value={sousTraitantActuel?.id ?? ""}
        onChange={handleChange}
        disabled={enCours}
        className="border border-border rounded-md px-2 py-1 text-sm bg-surface disabled:opacity-50"
      >
        <option value="">Aucun</option>
        {sousTraitants.map((s) => (
          <option key={s.id} value={s.id}>
            {s.nom}
          </option>
        ))}
      </select>
      {sousTraitantActuel && (
        <Link href={`/sous-traitants/${sousTraitantActuel.id}`} className="underline text-xs">
          voir la fiche
        </Link>
      )}
    </span>
  );
}
