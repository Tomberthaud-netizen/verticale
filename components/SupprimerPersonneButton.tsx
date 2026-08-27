"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supprimerPersonne } from "@/app/personnesActions";

export default function SupprimerPersonneButton({ personneId, nomComplet }: { personneId: string; nomComplet: string }) {
  const router = useRouter();
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  async function handleClick() {
    const confirme = window.confirm(`Supprimer définitivement le compte de « ${nomComplet} » ?`);
    if (!confirme) return;

    setEnCours(true);
    setErreur(null);
    try {
      await supprimerPersonne(personneId);
      router.refresh();
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "Une erreur est survenue.");
    } finally {
      setEnCours(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={handleClick}
        disabled={enCours}
        className="text-sm text-muted hover:text-red-600 disabled:opacity-50"
      >
        {enCours ? "…" : "Supprimer"}
      </button>
      {erreur && <p className="text-xs text-red-600">{erreur}</p>}
    </div>
  );
}
