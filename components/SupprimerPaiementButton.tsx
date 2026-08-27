"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supprimerPaiement } from "@/app/financeActions";

export default function SupprimerPaiementButton({ factureId, paiementId }: { factureId: string; paiementId: string }) {
  const router = useRouter();
  const [enCours, setEnCours] = useState(false);

  async function handleClick() {
    setEnCours(true);
    try {
      await supprimerPaiement(factureId, paiementId);
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
      className="text-xs text-muted hover:text-red-600 disabled:opacity-50"
    >
      {enCours ? "…" : "Supprimer"}
    </button>
  );
}
