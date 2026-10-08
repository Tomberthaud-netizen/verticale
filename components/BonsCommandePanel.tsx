"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { creerBonCommande, supprimerBonCommande } from "@/app/bonsCommandeActions";
import {
  calculerPrixUnitaireBonCommande,
  calculerTotalHTBonCommande,
  estDiviseurValide,
} from "@/lib/bonCommande";
import { formaterMontantPrecis } from "@/lib/finances";

interface BonCommandeResume {
  id: string;
  numero: string;
  sousTraitantNom: string;
  diviseur: number | null;
  dateBon: Date;
  lignes: { quantite: number; prixUnitaire: number }[];
}

export default function BonsCommandePanel({
  devisId,
  sousTraitants,
  lignesDevis,
  bons,
}: {
  devisId: string;
  sousTraitants: { id: string; nom: string }[];
  lignesDevis: { quantite: number; prixUnitaire: number }[];
  bons: BonCommandeResume[];
}) {
  const router = useRouter();
  const [sousTraitantId, setSousTraitantId] = useState("");
  const [diviseur, setDiviseur] = useState("");
  const [notes, setNotes] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  const diviseurNombre = Number(diviseur);
  const apercuTotal = estDiviseurValide(diviseurNombre)
    ? calculerTotalHTBonCommande(
        lignesDevis.map((l) => ({
          quantite: l.quantite,
          prixUnitaire: calculerPrixUnitaireBonCommande(l.prixUnitaire, diviseurNombre),
        }))
      )
    : null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErreur(null);
    setEnCours(true);
    try {
      await creerBonCommande(devisId, { sousTraitantId, diviseur: diviseurNombre, notes: notes || undefined });
      setSousTraitantId("");
      setDiviseur("");
      setNotes("");
      router.refresh();
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "Une erreur est survenue.");
    } finally {
      setEnCours(false);
    }
  }

  async function supprimer(bon: BonCommandeResume) {
    if (!window.confirm(`Supprimer définitivement le bon de commande ${bon.numero} ?`)) return;
    setErreur(null);
    try {
      await supprimerBonCommande(bon.id);
      router.refresh();
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "Une erreur est survenue.");
    }
  }

  return (
    <section className="flex flex-col gap-3 print:hidden">
      <h2 className="text-sm font-semibold text-muted uppercase tracking-wide">Bons de commande</h2>

      {bons.length > 0 && (
        <ul className="flex flex-col gap-2">
          {bons.map((bon) => (
            <li
              key={bon.id}
              className="flex flex-wrap items-center justify-between gap-3 border border-border rounded-md px-3 py-2 bg-surface text-sm"
            >
              <div className="min-w-0">
                <p className="font-medium">
                  {bon.numero} <span className="text-muted font-normal">· {bon.sousTraitantNom}</span>
                </p>
                <p className="text-xs text-muted">
                  {format(bon.dateBon, "d MMM yyyy", { locale: fr })}
                  {bon.diviseur != null && <> · prix du devis ÷ {bon.diviseur}</>} · Total HT{" "}
                  {formaterMontantPrecis(calculerTotalHTBonCommande(bon.lignes))}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <a
                  href={`/api/bons-commande/${bon.id}/pdf`}
                  className="rounded-md border border-border text-sm font-medium px-3 py-1.5 hover:bg-background transition-colors"
                >
                  Télécharger le PDF
                </a>
                <button
                  type="button"
                  onClick={() => supprimer(bon)}
                  className="text-xs text-muted hover:text-red-600"
                >
                  Supprimer
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {sousTraitants.length === 0 ? (
        <p className="text-sm text-muted">
          Aucun sous-traitant pour cette entreprise —{" "}
          <Link href="/sous-traitants/nouveau" className="underline">
            en créer un
          </Link>{" "}
          pour pouvoir émettre un bon de commande.
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-3 max-w-2xl">
          <div className="grid sm:grid-cols-2 gap-3">
            <label className="flex flex-col gap-1 text-sm font-medium">
              Sous-traitant concerné
              <select
                required
                value={sousTraitantId}
                onChange={(e) => setSousTraitantId(e.target.value)}
                className="border border-border rounded-md px-3 py-2 text-sm font-normal bg-surface"
              >
                <option value="" disabled>
                  Sélectionner un sous-traitant
                </option>
                {sousTraitants.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nom}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm font-medium">
              Diviser les prix unitaires du devis par
              <input
                required
                type="number"
                min={0.01}
                step="any"
                value={diviseur}
                onChange={(e) => setDiviseur(e.target.value)}
                placeholder="Ex : 1.5"
                className="border border-border rounded-md px-3 py-2 text-sm font-normal bg-surface"
              />
            </label>
          </div>
          <label className="flex flex-col gap-1 text-sm font-medium">
            Conditions particulières (optionnel)
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="border border-border rounded-md px-3 py-2 text-sm font-normal bg-surface resize-y"
            />
          </label>
          {apercuTotal != null && (
            <p className="text-sm text-muted">
              Total HT du bon de commande : <strong className="text-foreground">{formaterMontantPrecis(apercuTotal)}</strong>
            </p>
          )}
          {erreur && <p className="text-sm text-red-600">{erreur}</p>}
          <button
            type="submit"
            disabled={enCours}
            className="self-start rounded-md bg-foreground text-background text-sm font-medium px-4 py-2 hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {enCours ? "Création…" : "Créer un bon de commande"}
          </button>
        </form>
      )}
      {sousTraitants.length === 0 && erreur && <p className="text-sm text-red-600">{erreur}</p>}
    </section>
  );
}
