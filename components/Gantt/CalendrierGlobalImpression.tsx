"use client";

import { useState, type ReactNode } from "react";

type CibleImpression = "calendrier" | "carte";

export default function CalendrierGlobalImpression({
  titre,
  legende,
  carte,
  agendaSync,
  calendrier,
}: {
  titre: ReactNode;
  legende: ReactNode;
  carte: ReactNode;
  agendaSync: ReactNode;
  calendrier: ReactNode;
}) {
  const [cible, setCible] = useState<CibleImpression>("calendrier");

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
            onClick={() => window.print()}
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
