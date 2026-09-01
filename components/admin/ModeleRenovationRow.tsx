"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { modifierModeleRenovation, supprimerModeleRenovation } from "@/app/administrationActions";

export default function ModeleRenovationRow({
  item,
}: {
  item: { id: string; nom: string; coutMoyenM2: number | null };
}) {
  const router = useRouter();
  const [valeur, setValeur] = useState(item.coutMoyenM2 != null ? String(item.coutMoyenM2) : "");
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErreur(null);
    setEnCours(true);
    try {
      await modifierModeleRenovation(item.id, valeur ? Number(valeur) : null);
      router.refresh();
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "Une erreur est survenue.");
    } finally {
      setEnCours(false);
    }
  }

  async function handleSupprimer() {
    if (!window.confirm(`Supprimer le modèle "${item.nom}" ?`)) return;
    setEnCours(true);
    try {
      await supprimerModeleRenovation(item.id);
      router.refresh();
    } finally {
      setEnCours(false);
    }
  }

  return (
    <tr className="border-b border-border align-top">
      <td className="py-2 pr-2 font-medium">{item.nom}</td>
      <td className="py-2 pr-2">
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <input
            type="number"
            min={0.01}
            step="0.01"
            value={valeur}
            onChange={(e) => setValeur(e.target.value)}
            placeholder="Ex : 850"
            className="border border-border rounded-md px-2 py-1 text-sm bg-surface w-28"
          />
          <span className="text-muted text-xs shrink-0">€ / m²</span>
          <button
            type="submit"
            disabled={enCours}
            className="rounded-md border border-border text-xs font-medium px-2.5 py-1.5 hover:bg-background transition-colors disabled:opacity-50"
          >
            {enCours ? "…" : "Enregistrer"}
          </button>
        </form>
        {erreur && <p className="text-xs text-red-600 mt-1">{erreur}</p>}
      </td>
      <td className="py-2 pr-0 text-right">
        <button
          type="button"
          onClick={handleSupprimer}
          disabled={enCours}
          className="text-xs text-muted hover:text-red-600 disabled:opacity-50"
        >
          Supprimer
        </button>
      </td>
    </tr>
  );
}
