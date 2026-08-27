"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { marquerChantierPaye, marquerDevisPaye } from "@/app/financeActions";

export default function BoutonPaye({
  cible,
  id,
  paye,
}: {
  cible: "devis" | "chantier";
  id: string;
  paye: boolean;
}) {
  const router = useRouter();
  const [enCours, setEnCours] = useState(false);

  async function handleClick() {
    setEnCours(true);
    try {
      if (cible === "devis") {
        await marquerDevisPaye(id, !paye);
      } else {
        await marquerChantierPaye(id, !paye);
      }
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
      className={`shrink-0 rounded-md text-sm font-medium px-3 py-1.5 transition-colors disabled:opacity-50 ${
        paye
          ? "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
          : "bg-foreground text-background hover:opacity-90"
      }`}
    >
      {enCours ? "…" : paye ? "✓ Encaissé" : "Marquer encaissé"}
    </button>
  );
}
