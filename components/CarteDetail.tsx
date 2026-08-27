"use client";

import { useEffect, useState, type ReactNode } from "react";

interface CarteDetailProps {
  titre: string;
  valeur: string;
  valeurClassName?: string;
  sousTitre?: string;
  detail: ReactNode;
}

/** Carte de statistique cliquable : ouvre le détail des lignes qui composent le chiffre affiché. */
export default function CarteDetail({ titre, valeur, valeurClassName, sousTitre, detail }: CarteDetailProps) {
  const [ouvert, setOuvert] = useState(false);

  useEffect(() => {
    if (!ouvert) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOuvert(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [ouvert]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOuvert(true)}
        className="bg-surface border border-border rounded-lg p-4 flex-1 min-w-[160px] text-left hover:border-foreground/40 hover:shadow-sm transition-all cursor-pointer"
      >
        <p className="text-sm text-muted font-medium">{titre}</p>
        <p className={`text-2xl font-semibold mt-1 ${valeurClassName ?? ""}`}>{valeur}</p>
        {sousTitre && <p className="text-xs text-muted mt-1">{sousTitre}</p>}
      </button>
      {ouvert && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-6"
          onClick={() => setOuvert(false)}
        >
          <div
            className="bg-surface rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-border shrink-0">
              <div>
                <h2 className="text-sm font-medium text-muted">{titre}</h2>
                <p className={`text-xl font-semibold ${valeurClassName ?? ""}`}>{valeur}</p>
              </div>
              <button
                type="button"
                onClick={() => setOuvert(false)}
                className="text-muted hover:text-foreground text-xl leading-none shrink-0"
                aria-label="Fermer le détail"
              >
                ×
              </button>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto p-4 text-sm">{detail}</div>
          </div>
        </div>
      )}
    </>
  );
}
