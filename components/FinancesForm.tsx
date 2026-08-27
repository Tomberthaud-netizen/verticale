"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ajouterLigneFinanciere,
  delierDevisDuChantier,
  modifierFinances,
  supprimerLigneFinanciere,
} from "@/app/actions";
import { calculerBeneficePrevisionnel, calculerCoutReel, formaterMontant } from "@/lib/finances";
import type { CaseFinanciereChantier } from "@/lib/chantier";

interface FinancesFormProps {
  chantierId: string;
  prixAchat: number | null;
  prixRevente: number | null;
  prixChantier: number | null;
  casesFinancieres: CaseFinanciereChantier[];
}

function versChaine(valeur: number | null): string {
  return valeur == null ? "" : String(valeur);
}

function versNombre(valeur: string): number | null {
  if (valeur.trim() === "") return null;
  const n = Number(valeur);
  return Number.isNaN(n) ? null : n;
}

export default function FinancesForm({
  chantierId,
  prixAchat: prixAchatInitial,
  prixRevente: prixRenteInitial,
  prixChantier,
  casesFinancieres,
}: FinancesFormProps) {
  const router = useRouter();
  const [prixAchat, setPrixAchat] = useState(versChaine(prixAchatInitial));
  const [prixRevente, setPrixRevente] = useState(versChaine(prixRenteInitial));
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  const [libelleCase, setLibelleCase] = useState("");
  const [montantCase, setMontantCase] = useState("");
  const [erreurCase, setErreurCase] = useState<string | null>(null);
  const [caseEnCours, setCaseEnCours] = useState(false);

  const prixAchatNum = versNombre(prixAchat);
  const prixRenteNum = versNombre(prixRevente);
  const coutReel = calculerCoutReel(prixAchatNum, prixChantier);
  const beneficePrevisionnel = calculerBeneficePrevisionnel(prixRenteNum, coutReel);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErreur(null);
    setEnCours(true);
    try {
      await modifierFinances(chantierId, { prixAchat: prixAchatNum, prixRevente: prixRenteNum });
      router.refresh();
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "Une erreur est survenue.");
    } finally {
      setEnCours(false);
    }
  }

  async function handleAjouterCase(e: React.FormEvent) {
    e.preventDefault();
    setErreurCase(null);
    setCaseEnCours(true);
    try {
      await ajouterLigneFinanciere(chantierId, libelleCase, Number(montantCase));
      setLibelleCase("");
      setMontantCase("");
      router.refresh();
    } catch (err) {
      setErreurCase(err instanceof Error ? err.message : "Une erreur est survenue.");
    } finally {
      setCaseEnCours(false);
    }
  }

  async function handleSupprimerCase(caseItem: CaseFinanciereChantier) {
    if (caseItem.origine === "MANUELLE") {
      await supprimerLigneFinanciere(chantierId, caseItem.id);
    } else if (caseItem.devisId) {
      await delierDevisDuChantier(caseItem.devisId);
    }
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <label className="flex flex-col gap-1 text-sm font-medium">
            Prix d&apos;achat du bien
            <input
              type="number"
              min={0}
              step="1"
              value={prixAchat}
              onChange={(e) => setPrixAchat(e.target.value)}
              placeholder="Ex : 150000"
              className="border border-border rounded-md px-3 py-2 text-sm font-normal bg-surface"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium">
            Prix de revente
            <input
              type="number"
              min={0}
              step="1"
              value={prixRevente}
              onChange={(e) => setPrixRevente(e.target.value)}
              placeholder="Ex : 250000"
              className="border border-border rounded-md px-3 py-2 text-sm font-normal bg-surface"
            />
          </label>
        </div>

        {erreur && <p className="text-sm text-red-600">{erreur}</p>}

        <button
          type="submit"
          disabled={enCours}
          className="self-start rounded-md bg-foreground text-background text-sm font-medium px-5 py-2.5 hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {enCours ? "Enregistrement…" : "Enregistrer"}
        </button>
      </form>

      <div className="flex flex-wrap gap-4">
        <div className="bg-surface border border-border rounded-lg p-4 flex-1 min-w-[180px]">
          <p className="text-sm text-muted font-medium">Prix du chantier</p>
          <p className="text-2xl font-semibold mt-1">{formaterMontant(prixChantier)}</p>
          <p className="text-xs text-muted mt-1">Somme des cases ci-dessous</p>
        </div>
        <div className="bg-surface border border-border rounded-lg p-4 flex-1 min-w-[180px]">
          <p className="text-sm text-muted font-medium">Coût Réel</p>
          <p className="text-2xl font-semibold mt-1">{formaterMontant(coutReel)}</p>
          <p className="text-xs text-muted mt-1">Prix d&apos;achat + prix du chantier</p>
        </div>
        <div className="bg-surface border border-border rounded-lg p-4 flex-1 min-w-[180px]">
          <p className="text-sm text-muted font-medium">Bénéfice prévisionnel</p>
          <p
            className={`text-2xl font-semibold mt-1 ${
              beneficePrevisionnel != null && beneficePrevisionnel < 0 ? "text-red-600" : ""
            }`}
          >
            {formaterMontant(beneficePrevisionnel)}
          </p>
          <p className="text-xs text-muted mt-1">Prix de revente − Coût Réel</p>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Cases du prix du chantier</h3>
          <Link
            href={`/devis/nouveau?chantierId=${chantierId}`}
            className="text-sm font-medium text-foreground underline underline-offset-2"
          >
            + Nouveau devis pour ce chantier
          </Link>
        </div>
        {casesFinancieres.length > 0 ? (
          <ul className="flex flex-col gap-1.5">
            {casesFinancieres.map((c) => (
              <li
                key={c.id}
                className="flex justify-between items-center gap-3 border border-border rounded-md px-3 py-2 bg-surface text-sm"
              >
                <span className="flex items-center gap-2 min-w-0">
                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${
                      c.origine === "DEVIS"
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-background border border-border text-muted"
                    }`}
                  >
                    {c.origine === "DEVIS" ? "Devis" : "Manuel"}
                  </span>
                  {c.origine === "DEVIS" && c.devisId ? (
                    <Link href={`/devis/${c.devisId}`} className="truncate hover:underline">
                      {c.libelle}
                    </Link>
                  ) : (
                    <span className="truncate">{c.libelle}</span>
                  )}
                </span>
                <span className="flex items-center gap-3 shrink-0">
                  <span className="tabular-nums font-medium">{formaterMontant(c.montant)}</span>
                  <button
                    type="button"
                    onClick={() => handleSupprimerCase(c)}
                    className="text-muted hover:text-red-600"
                  >
                    {c.origine === "DEVIS" ? "Délier" : "Supprimer"}
                  </button>
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted">
            Aucune case pour le moment. Ajoutez un montant manuellement ci-dessous, ou liez un devis à ce
            chantier depuis sa fiche.
          </p>
        )}

        <form onSubmit={handleAjouterCase} className="flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1 text-sm font-medium">
            Intitulé
            <input
              required
              value={libelleCase}
              onChange={(e) => setLibelleCase(e.target.value)}
              placeholder="Ex : Acompte matériaux"
              className="border border-border rounded-md px-3 py-2 text-sm font-normal bg-surface w-56"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium">
            Montant
            <input
              required
              type="number"
              min={0}
              step="1"
              value={montantCase}
              onChange={(e) => setMontantCase(e.target.value)}
              placeholder="Ex : 3000"
              className="border border-border rounded-md px-3 py-2 text-sm font-normal bg-surface w-36"
            />
          </label>
          {erreurCase && <p className="text-sm text-red-600 w-full">{erreurCase}</p>}
          <button
            type="submit"
            disabled={caseEnCours}
            className="rounded-md border border-border text-sm font-medium px-4 py-2 hover:bg-background transition-colors disabled:opacity-50"
          >
            {caseEnCours ? "Ajout…" : "+ Ajouter une case"}
          </button>
        </form>
      </div>
    </div>
  );
}
