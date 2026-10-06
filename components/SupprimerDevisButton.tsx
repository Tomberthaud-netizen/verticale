"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supprimerDevis } from "@/app/actions";

export default function SupprimerDevisButton({
  devisId,
  intituleDevis,
  valide = false,
}: {
  devisId: string;
  intituleDevis: string;
  valide?: boolean;
}) {
  const router = useRouter();
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  async function handleClick() {
    const confirme = window.confirm(
      valide
        ? `Ce devis est VALIDÉ. Le supprimer définitivement quand même : « ${intituleDevis} » ? Les factures liées sont conservées.`
        : `Supprimer définitivement le devis « ${intituleDevis} » ?`
    );
    if (!confirme) return;

    setErreur(null);
    setEnCours(true);
    try {
      await supprimerDevis(devisId);
      router.push("/devis");
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "Une erreur est survenue.");
    } finally {
      setEnCours(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        disabled={enCours}
        className="print:hidden shrink-0 rounded-md border border-red-200 text-red-600 text-sm font-medium px-3 py-1.5 hover:bg-red-50 transition-colors disabled:opacity-50"
      >
        {enCours ? "Suppression…" : "Supprimer le devis"}
      </button>
      {erreur && <p className="print:hidden w-full text-sm text-red-600">{erreur}</p>}
    </>
  );
}
