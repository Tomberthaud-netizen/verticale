"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supprimerIndiceBT } from "@/app/actions";

export default function SupprimerIndiceBTButton({ id, periode }: { id: string; periode: string }) {
  const router = useRouter();
  const [enCours, setEnCours] = useState(false);

  async function handleClick() {
    const confirme = window.confirm(`Supprimer l'indice BT de la période ${periode} ?`);
    if (!confirme) return;
    setEnCours(true);
    try {
      await supprimerIndiceBT(id);
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
      className="text-sm text-muted hover:text-red-600 disabled:opacity-50"
    >
      Supprimer
    </button>
  );
}
