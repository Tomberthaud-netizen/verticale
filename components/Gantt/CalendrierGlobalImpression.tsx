"use client";

import { useState, type ReactNode } from "react";
import type { Entreprise } from "@/constants/entreprises";
import { formaterDatePourNomFichier } from "@/lib/pdfFormat";

type CibleImpression = "calendrier" | "carte";

/** Voir PrintButton : nom de fichier suggéré par le navigateur = document.title au moment de
 * l'impression. "Planning GLOBAL" pour bien le distinguer du "Planning" d'un chantier seul. */
const PREFIXE_NOM_FICHIER: Record<CibleImpression, string> = {
  calendrier: "Planning GLOBAL",
  carte: "Carte",
};

export default function CalendrierGlobalImpression({
  titre,
  legende,
  carte,
  agendaSync,
  calendrier,
  entreprise,
}: {
  titre: ReactNode;
  legende: ReactNode;
  carte: ReactNode;
  agendaSync: ReactNode;
  calendrier: ReactNode;
  entreprise: Entreprise;
}) {
  const [cible, setCible] = useState<CibleImpression>("calendrier");

  function imprimer() {
    // window.print() ne bloque pas dans Chrome (voir PrintButton) : le titre n'est restauré
    // qu'à la fermeture de l'aperçu, sinon Chrome lit le titre déjà remis à zéro.
    const titreOriginal = document.title;
    document.title = `${PREFIXE_NOM_FICHIER[cible]} – ${formaterDatePourNomFichier()} – ${entreprise}`;
    const restaurer = () => {
      document.title = titreOriginal;
      window.removeEventListener("afterprint", restaurer);
    };
    window.addEventListener("afterprint", restaurer);
    window.print();
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        {titre}
        <div className="flex items-center gap-2 print:hidden">
          {carte && (
            <div className="flex gap-1 rounded-md border border-border p-0.5">
              {(["calendrier", "carte"] as const).map((valeur) => (
                <button
                  key={valeur}
                  type="button"
                  onClick={() => setCible(valeur)}
                  className={`text-sm font-medium px-2.5 py-1 rounded transition-colors ${
                    cible === valeur ? "bg-foreground text-background" : "text-muted hover:text-foreground"
                  }`}
                >
                  {valeur === "calendrier" ? "Calendrier" : "Carte"}
                </button>
              ))}
            </div>
          )}
          <button
            type="button"
            onClick={imprimer}
            className="shrink-0 rounded-md border border-border text-sm font-medium px-3 py-1.5 hover:bg-background transition-colors"
          >
            Imprimer / Export PDF
          </button>
        </div>
        <div className={cible === "calendrier" ? "" : "print:hidden"}>{legende}</div>
      </div>
      {carte && <div className={cible === "carte" ? "" : "print:hidden"}>{carte}</div>}
      {agendaSync}
      <div className={cible === "calendrier" ? "" : "print:hidden"}>{calendrier}</div>
    </div>
  );
}
