"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { retirerChantierCarte } from "@/app/actions";
import { LABEL_RETIRER_CARTE, type Entreprise } from "@/constants/entreprises";

export default function RetirerChantierCarteButton({
  chantierId,
  nomChantier,
  entreprise,
}: {
  chantierId: string;
  nomChantier: string;
  entreprise: Entreprise;
}) {
  const router = useRouter();
  const [enCours, setEnCours] = useState(false);
  const libelle = LABEL_RETIRER_CARTE[entreprise];

  async function handleClick() {
    const confirme = window.confirm(`Retirer « ${nomChantier} » de la carte ?`);
    if (!confirme) return;

    setEnCours(true);
    try {
      await retirerChantierCarte(chantierId);
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
      className="mt-1 rounded-md border border-border text-xs font-medium px-2 py-1 hover:bg-surface transition-colors disabled:opacity-50"
    >
      {enCours ? "…" : libelle}
    </button>
  );
}
