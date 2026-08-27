"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { annulerFacture, supprimerFacture } from "@/app/financeActions";

export default function GererFactureButtons({ factureId, statut }: { factureId: string; statut: string }) {
  const router = useRouter();
  const [enCours, setEnCours] = useState(false);

  async function handleAnnuler() {
    const confirme = window.confirm("Annuler cette facture ? Elle restera visible mais marquée comme annulée.");
    if (!confirme) return;
    setEnCours(true);
    try {
      await annulerFacture(factureId);
      router.refresh();
    } finally {
      setEnCours(false);
    }
  }

  async function handleSupprimer() {
    const confirme = window.confirm("Supprimer définitivement cette facture et ses paiements ?");
    if (!confirme) return;
    setEnCours(true);
    try {
      await supprimerFacture(factureId);
      router.push("/finance");
    } finally {
      setEnCours(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      {statut !== "ANNULEE" && (
        <button
          type="button"
          onClick={handleAnnuler}
          disabled={enCours}
          className="rounded-md border border-border text-sm font-medium px-3 py-1.5 hover:bg-surface transition-colors disabled:opacity-50"
        >
          Annuler
        </button>
      )}
      <button
        type="button"
        onClick={handleSupprimer}
        disabled={enCours}
        className="rounded-md border border-red-200 text-red-600 text-sm font-medium px-3 py-1.5 hover:bg-red-50 transition-colors disabled:opacity-50"
      >
        Supprimer
      </button>
    </div>
  );
}
