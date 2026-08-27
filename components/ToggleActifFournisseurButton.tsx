"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { basculerActifFournisseur } from "@/app/fournisseursActions";

export default function ToggleActifFournisseurButton({
  fournisseurId,
  actif,
}: {
  fournisseurId: string;
  actif: boolean;
}) {
  const router = useRouter();
  const [enCours, setEnCours] = useState(false);

  async function handleClick() {
    setEnCours(true);
    try {
      await basculerActifFournisseur(fournisseurId, !actif);
      router.refresh();
    } finally {
      setEnCours(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={enCours}
      className={`text-xs font-medium px-2.5 py-1 rounded-full border transition-colors disabled:opacity-50 ${
        actif
          ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
          : "bg-background text-muted border-border hover:bg-surface"
      }`}
    >
      {enCours ? "…" : actif ? "Actif" : "Inactif"}
    </button>
  );
}
