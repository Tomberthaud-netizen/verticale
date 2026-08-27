"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { creerDevisTS, reediterDevis, validerDevis } from "@/app/actions";
import EnvoyerParMailButton from "@/components/EnvoyerParMailButton";

export interface EnvoiMailInfos {
  clientEmail: string | null;
}

export default function DevisValidationActions({
  devisId,
  valide,
  envoiMail,
}: {
  devisId: string;
  valide: boolean;
  envoiMail?: EnvoiMailInfos;
}) {
  const router = useRouter();
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  async function handleValider() {
    const confirme = window.confirm(
      "Valider ce devis ? Son contenu sera figé (plus aucune modification possible) et un PDF sera enregistré sur le Bureau."
    );
    if (!confirme) return;
    setErreur(null);
    setEnCours(true);
    try {
      await validerDevis(devisId);
      router.refresh();
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "Une erreur est survenue.");
    } finally {
      setEnCours(false);
    }
  }

  async function handleCreerTS() {
    setErreur(null);
    setEnCours(true);
    try {
      const { id } = await creerDevisTS(devisId);
      router.push(`/devis/${id}/modifier`);
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "Une erreur est survenue.");
      setEnCours(false);
    }
  }

  async function handleReediter() {
    setErreur(null);
    setEnCours(true);
    try {
      const { id } = await reediterDevis(devisId);
      router.push(`/devis/${id}/modifier`);
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "Une erreur est survenue.");
      setEnCours(false);
    }
  }

  return (
    <div className="flex flex-col gap-2 border-t border-border pt-6 print:hidden">
      {erreur && <p className="text-sm text-red-600">{erreur}</p>}
      {valide ? (
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            Devis validé — figé
          </span>
          <button
            type="button"
            onClick={handleCreerTS}
            disabled={enCours}
            className="rounded-md border border-border text-sm font-medium px-4 py-2 hover:bg-surface transition-colors disabled:opacity-50"
          >
            Création de TS
          </button>
          <button
            type="button"
            onClick={handleReediter}
            disabled={enCours}
            className="rounded-md border border-border text-sm font-medium px-4 py-2 hover:bg-surface transition-colors disabled:opacity-50"
          >
            Réédition
          </button>
          {envoiMail && <EnvoyerParMailButton devisId={devisId} clientEmail={envoiMail.clientEmail} />}
        </div>
      ) : (
        <button
          type="button"
          onClick={handleValider}
          disabled={enCours}
          className="self-start rounded-md bg-foreground text-background text-sm font-medium px-5 py-2.5 hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {enCours ? "Validation…" : "Validation du devis"}
        </button>
      )}
    </div>
  );
}
