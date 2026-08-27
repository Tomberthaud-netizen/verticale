"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supprimerSousTraitant } from "@/app/sousTraitantsActions";

export default function SupprimerSousTraitantButton({ sousTraitantId, nom }: { sousTraitantId: string; nom: string }) {
  const router = useRouter();
  const [enCours, setEnCours] = useState(false);

  async function handleClick() {
    const confirme = window.confirm(`Supprimer définitivement le sous-traitant « ${nom} » ?`);
    if (!confirme) return;
    setEnCours(true);
    try {
      await supprimerSousTraitant(sousTraitantId);
      router.push("/sous-traitants");
    } finally {
      setEnCours(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={enCours}
      className="print:hidden shrink-0 rounded-md border border-red-200 text-red-600 text-sm font-medium px-3 py-1.5 hover:bg-red-50 transition-colors disabled:opacity-50"
    >
      {enCours ? "Suppression…" : "Supprimer"}
    </button>
  );
}
