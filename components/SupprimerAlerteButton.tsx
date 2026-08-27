"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supprimerAlerte } from "@/app/actions";

export default function SupprimerAlerteButton({
  chantierId,
  alerteId,
}: {
  chantierId: string;
  alerteId: string;
}) {
  const router = useRouter();
  const [enCours, setEnCours] = useState(false);

  async function handleClick() {
    setEnCours(true);
    try {
      await supprimerAlerte(chantierId, alerteId);
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
      className="text-muted hover:text-red-600 text-xs disabled:opacity-40"
      aria-label="Supprimer l'alerte"
    >
      Retirer
    </button>
  );
}
