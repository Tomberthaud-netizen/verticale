"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { ajouterPaiement } from "@/app/financeActions";

export default function PaiementForm({ factureId }: { factureId: string }) {
  const router = useRouter();
  const [montant, setMontant] = useState("");
  const [datePaiement, setDatePaiement] = useState(() => format(new Date(), "yyyy-MM-dd"));
  const [moyen, setMoyen] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErreur(null);
    setEnCours(true);
    try {
      await ajouterPaiement(factureId, { montant: Number(montant), datePaiement, moyen: moyen || undefined });
      setMontant("");
      setMoyen("");
      router.refresh();
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "Une erreur est survenue.");
    } finally {
      setEnCours(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
      <label className="flex flex-col gap-1 text-sm font-medium">
        Montant encaissé
        <input
          required
          type="number"
          min={0}
          step="0.01"
          value={montant}
          onChange={(e) => setMontant(e.target.value)}
          className="border border-border rounded-md px-3 py-2 text-sm font-normal bg-surface w-36"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm font-medium">
        Date
        <input
          required
          type="date"
          value={datePaiement}
          onChange={(e) => setDatePaiement(e.target.value)}
          className="border border-border rounded-md px-3 py-2 text-sm font-normal bg-surface"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm font-medium">
        Moyen
        <input
          value={moyen}
          onChange={(e) => setMoyen(e.target.value)}
          placeholder="Virement, chèque…"
          className="border border-border rounded-md px-3 py-2 text-sm font-normal bg-surface"
        />
      </label>
      {erreur && <p className="text-sm text-red-600 w-full">{erreur}</p>}
      <button
        type="submit"
        disabled={enCours}
        className="rounded-md border border-border text-sm font-medium px-4 py-2 hover:bg-background transition-colors disabled:opacity-50"
      >
        {enCours ? "Ajout…" : "+ Ajouter un paiement"}
      </button>
    </form>
  );
}
