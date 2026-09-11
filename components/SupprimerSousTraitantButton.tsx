"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supprimerSousTraitant } from "@/app/sousTraitantsActions";

export default function SupprimerSousTraitantButton({ sousTraitantId, nom }: { sousTraitantId: string; nom: string }) {
  const router = useRouter();
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  async function handleClick() {
    const confirme = window.confirm(`Supprimer définitivement le sous-traitant « ${nom} » ?`);
    if (!confirme) return;
    setErreur(null);
    setEnCours(true);
    try {
      await supprimerSousTraitant(sousTraitantId);
      router.push("/sous-traitants");
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "Une erreur est survenue.");
      setEnCours(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={handleClick}
        disabled={enCours}
        className="print:hidden shrink-0 rounded-md border border-red-200 text-red-600 text-sm font-medium px-3 py-1.5 hover:bg-red-50 transition-colors disabled:opacity-50"
      >
        {enCours ? "Suppression…" : "Supprimer"}
      </button>
      {erreur && <p className="text-sm text-red-600">{erreur}</p>}
    </div>
  );
}
