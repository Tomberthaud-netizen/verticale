"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { modifierCoutsDevis } from "@/app/actions";
import { formaterMontant } from "@/lib/finances";

interface CoutsDevisFormProps {
  devisId: string;
  coutMateriauxHT: number | null;
  coutHonorairesHT: number | null;
  totalHT: number;
}

export default function CoutsDevisForm({
  devisId,
  coutMateriauxHT,
  coutHonorairesHT,
  totalHT,
}: CoutsDevisFormProps) {
  const router = useRouter();
  const [materiaux, setMateriaux] = useState(coutMateriauxHT != null ? String(coutMateriauxHT) : "");
  const [honoraires, setHonoraires] = useState(coutHonorairesHT != null ? String(coutHonorairesHT) : "");
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  const materiauxNombre = materiaux ? Number(materiaux) : null;
  const honorairesNombre = honoraires ? Number(honoraires) : null;
  const coutTotal = (materiauxNombre ?? 0) + (honorairesNombre ?? 0);
  const margeConnue = materiauxNombre != null || honorairesNombre != null;
  const marge = totalHT - coutTotal;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErreur(null);
    setEnCours(true);
    try {
      await modifierCoutsDevis(devisId, { coutMateriauxHT: materiauxNombre, coutHonorairesHT: honorairesNombre });
      router.refresh();
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "Une erreur est survenue.");
    } finally {
      setEnCours(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <p className="text-xs text-muted">
        Coût de revient interne, jamais affiché au client ni sur le PDF du devis.
      </p>
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-sm font-medium">
          Coût matériaux (HT)
          <input
            type="number"
            min={0}
            step="0.01"
            value={materiaux}
            onChange={(e) => setMateriaux(e.target.value)}
            placeholder="Ex : 4500"
            className="border border-border rounded-md px-3 py-2 text-sm font-normal bg-surface w-40"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Honoraires (HT)
          <input
            type="number"
            min={0}
            step="0.01"
            value={honoraires}
            onChange={(e) => setHonoraires(e.target.value)}
            placeholder="Ex : 1200"
            className="border border-border rounded-md px-3 py-2 text-sm font-normal bg-surface w-40"
          />
        </label>
        <button
          type="submit"
          disabled={enCours}
          className="rounded-md border border-border text-sm font-medium px-4 py-2 hover:bg-surface transition-colors disabled:opacity-50"
        >
          {enCours ? "Enregistrement…" : "Enregistrer"}
        </button>
      </div>
      {erreur && <p className="text-sm text-red-600">{erreur}</p>}

      <div className="flex flex-wrap gap-4 max-w-xl">
        <div className="bg-surface border border-border rounded-lg p-4 flex-1 min-w-[140px]">
          <p className="text-sm text-muted font-medium">Coût total (HT)</p>
          <p className="text-xl font-semibold mt-1">{formaterMontant(coutTotal)}</p>
        </div>
        <div className="bg-surface border border-border rounded-lg p-4 flex-1 min-w-[140px]">
          <p className="text-sm text-muted font-medium">Marge estimée</p>
          <p className={`text-xl font-semibold mt-1 ${margeConnue && marge < 0 ? "text-red-600" : ""}`}>
            {margeConnue ? formaterMontant(marge) : "—"}
          </p>
          <p className="text-xs text-muted mt-1">Total HT du devis − coût total</p>
        </div>
      </div>
    </form>
  );
}
