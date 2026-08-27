"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supprimerFournisseur } from "@/app/fournisseursActions";

export default function SupprimerFournisseurButton({ fournisseurId, nom }: { fournisseurId: string; nom: string }) {
  const router = useRouter();
  const [enCours, setEnCours] = useState(false);

  async function handleClick() {
    const confirme = window.confirm(`Supprimer définitivement le fournisseur « ${nom} » ?`);
    if (!confirme) return;
    setEnCours(true);
    try {
      await supprimerFournisseur(fournisseurId);
      router.push("/fournisseurs");
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
