"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { modifierDateLimitePaiementChantier, modifierDateLimitePaiementDevis } from "@/app/financeActions";

export default function DateLimitePaiementInput({
  cible,
  id,
  dateLimitePaiement,
}: {
  cible: "devis" | "chantier";
  id: string;
  dateLimitePaiement: Date | null;
}) {
  const router = useRouter();
  const [valeur, setValeur] = useState(dateLimitePaiement ? format(dateLimitePaiement, "yyyy-MM-dd") : "");
  const [enCours, setEnCours] = useState(false);

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const nouvelleValeur = e.target.value;
    setValeur(nouvelleValeur);
    setEnCours(true);
    try {
      if (cible === "devis") {
        await modifierDateLimitePaiementDevis(id, nouvelleValeur || null);
      } else {
        await modifierDateLimitePaiementChantier(id, nouvelleValeur || null);
      }
      router.refresh();
    } finally {
      setEnCours(false);
    }
  }

  return (
    <label className="flex flex-col gap-0.5 text-xs text-muted">
      Date limite de paiement
      <input
        type="date"
        value={valeur}
        onChange={handleChange}
        disabled={enCours}
        className="border border-border rounded-md px-2 py-1.5 text-sm bg-surface disabled:opacity-50"
      />
    </label>
  );
}
