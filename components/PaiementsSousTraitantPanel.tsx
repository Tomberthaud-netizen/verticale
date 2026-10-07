"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { ajouterPaiementSousTraitant, supprimerPaiementSousTraitant } from "@/app/actions";
import { formaterMontant } from "@/lib/finances";
import type { PaiementSousTraitantCalcule } from "@/lib/chantier";

/** Valeur du menu "Facture à préparer" signifiant explicitement "ne pas préparer de facture". */
const AUCUNE_FACTURE = "aucune";

export default function PaiementsSousTraitantPanel({
  chantierId,
  paiements,
  sousTraitants,
  devis,
}: {
  chantierId: string;
  paiements: PaiementSousTraitantCalcule[];
  sousTraitants: { id: string; nom: string }[];
  /** Devis du chantier : un brouillon de facture pré-remplie peut être préparé sur l'un d'eux. */
  devis: { id: string; numero: string; intitule: string }[];
}) {
  const router = useRouter();
  const [sousTraitantId, setSousTraitantId] = useState("");
  const [montant, setMontant] = useState("");
  const [notes, setNotes] = useState("");
  // Un seul devis : présélectionné. Plusieurs : choix explicite obligatoire (ou "Aucune facture").
  // Aucun devis : pas de menu, pas de facture préparée.
  const [devisChoisi, setDevisChoisi] = useState(
    devis.length === 0 ? AUCUNE_FACTURE : devis.length === 1 ? devis[0].id : ""
  );
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  const total = paiements.reduce((s, p) => s + p.montant, 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErreur(null);
    if (!sousTraitantId) {
      setErreur("Sélectionnez le sous-traitant à qui ce paiement est destiné.");
      return;
    }
    if (!devisChoisi) {
      setErreur("Choisissez le devis sur lequel préparer la facture, ou « Aucune facture ».");
      return;
    }
    setEnCours(true);
    try {
      await ajouterPaiementSousTraitant(chantierId, sousTraitantId, Number(montant), {
        notes: notes || undefined,
        devisId: devisChoisi === AUCUNE_FACTURE ? null : devisChoisi,
      });
      setMontant("");
      setNotes("");
      if (devis.length > 1) setDevisChoisi("");
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
        Montants versés à un sous-traitant de ce chantier, datés du jour où vous les ajoutez ici.
        Le premier versement à chaque sous-traitant est l&apos;Acompte, les suivants les Situations.
      </p>

      {paiements.length > 0 ? (
        <ul className="flex flex-col gap-1.5">
          {paiements.map((p) => (
            <li key={p.id} className="border border-border rounded-md px-3 py-2 bg-surface text-sm">
              <div className="flex justify-between items-center gap-3">
                <span className="flex items-center gap-2 min-w-0 flex-wrap">
                  <span className="font-medium">{p.libelle}</span>
                  <span className="text-muted">→ {p.sousTraitantNom}</span>
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
              </div>
              {p.notes && <p className="mt-1 text-xs text-muted whitespace-pre-wrap">{p.notes}</p>}
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
          Payé à
          <select
            required
            value={sousTraitantId}
            onChange={(e) => setSousTraitantId(e.target.value)}
            className="border border-border rounded-md px-3 py-2 text-sm font-normal bg-surface w-52"
          >
            <option value="">Sélectionner…</option>
            {sousTraitants.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nom}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Montant (HT)
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
        {devis.length > 0 && (
          <label className="flex flex-col gap-1 text-sm font-medium">
            Facture à préparer sur le devis
            <select
              required
              value={devisChoisi}
              onChange={(e) => setDevisChoisi(e.target.value)}
              className="border border-border rounded-md px-3 py-2 text-sm font-normal bg-surface w-64"
            >
              {devis.length > 1 && (
                <option value="" disabled>
                  Choisir…
                </option>
              )}
              {devis.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.numero} — {d.intitule}
                </option>
              ))}
              <option value={AUCUNE_FACTURE}>Aucune facture</option>
            </select>
          </label>
        )}
        <label className="flex flex-col gap-1 text-sm font-medium w-full">
          Informations annexes (optionnel)
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="Ex : virement du 12/10, référence facture sous-traitant…"
            className="border border-border rounded-md px-3 py-2 text-sm font-normal bg-surface resize-y"
          />
        </label>
        <button
          type="submit"
          disabled={enCours}
          className="rounded-md border border-border text-sm font-medium px-4 py-2 hover:bg-background transition-colors disabled:opacity-50"
        >
          {enCours ? "Ajout…" : "+ Ajouter"}
        </button>
        {devis.length === 0 && (
          <p className="text-xs text-muted w-full">
            Aucun devis sur ce chantier : aucune facture ne sera préparée avec ce paiement.
          </p>
        )}
        {erreur && <p className="text-sm text-red-600 w-full">{erreur}</p>}
      </form>
    </div>
  );
}
