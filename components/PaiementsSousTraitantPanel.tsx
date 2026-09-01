"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { ajouterPaiementSousTraitant, supprimerPaiementSousTraitant } from "@/app/actions";
import { formaterMontant } from "@/lib/finances";
import type { PaiementSousTraitantCalcule } from "@/lib/chantier";

export default function PaiementsSousTraitantPanel({
  chantierId,
  paiements,
}: {
  chantierId: string;
  paiements: PaiementSousTraitantCalcule[];
}) {
  const router = useRouter();
  const [montant, setMontant] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  const total = paiements.reduce((s, p) => s + p.montant, 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErreur(null);
    setEnCours(true);
    try {
      await ajouterPaiementSousTraitant(chantierId, Number(montant));
      setMontant("");
      router.refresh();
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "Une erreur est survenue.");
    } finally {
      setEnCours(false);
    }
  }

  async function handleSupprimer(paiementId: string) {
    await supprimerPaiementSousTraitant(chantierId, paiementId);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-4 max-w-2xl">
      <p className="text-sm text-muted -mt-1">
        Montants versés au sous-traitant de ce chantier, datés du jour où vous les ajoutez ici.
        Le premier est l&apos;Acompte, les suivants les Situations.
      </p>

      {paiements.length > 0 ? (
        <ul className="flex flex-col gap-1.5">
          {paiements.map((p) => (
            <li
              key={p.id}
              className="flex justify-between items-center gap-3 border border-border rounded-md px-3 py-2 bg-surface text-sm"
            >
              <span className="flex items-center gap-2 min-w-0">
                <span className="font-medium">{p.libelle}</span>
                <span className="text-muted">{format(p.dateAjout, "d MMMM yyyy", { locale: fr })}</span>
              </span>
              <span className="flex items-center gap-3 shrink-0">
                <span className="tabular-nums font-medium">{formaterMontant(p.montant)}</span>
                <button
                  type="button"
                  onClick={() => handleSupprimer(p.id)}
                  className="text-muted hover:text-red-600"
                >
                  Supprimer
                </button>
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted">Aucun paiement enregistré pour le moment.</p>
      )}

      {paiements.length > 0 && (
        <div className="bg-surface border border-border rounded-lg p-4 max-w-[220px]">
          <p className="text-sm text-muted font-medium">Total versé</p>
          <p className="text-2xl font-semibold mt-1">{formaterMontant(total)}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-sm font-medium">
          Montant {paiements.length === 0 ? "de l'acompte" : "de la situation"}
          <input
            required
            type="number"
            min={0.01}
            step="0.01"
            value={montant}
            onChange={(e) => setMontant(e.target.value)}
            placeholder="Ex : 5000"
            className="border border-border rounded-md px-3 py-2 text-sm font-normal bg-surface w-40"
          />
        </label>
        <button
          type="submit"
          disabled={enCours}
          className="rounded-md border border-border text-sm font-medium px-4 py-2 hover:bg-background transition-colors disabled:opacity-50"
        >
          {enCours ? "Ajout…" : "+ Ajouter"}
        </button>
        {erreur && <p className="text-sm text-red-600 w-full">{erreur}</p>}
      </form>
    </div>
  );
}
