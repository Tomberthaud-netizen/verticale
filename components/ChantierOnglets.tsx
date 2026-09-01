"use client";

import { useState, type ReactNode } from "react";

interface ChantierOngletsProps {
  /** undefined = sous-onglet masqué pour cette personne (voir AccesSousOnglet). */
  planning?: ReactNode;
  finances?: ReactNode;
  adresse?: ReactNode;
}

const DEFINITIONS = [
  { id: "planning" as const, label: "Planning" },
  { id: "finances" as const, label: "Finances" },
  { id: "adresse" as const, label: "Adresse" },
];

export default function ChantierOnglets({ planning, finances, adresse }: ChantierOngletsProps) {
  const contenus = { planning, finances, adresse };
  const disponibles = DEFINITIONS.filter((d) => contenus[d.id] !== undefined);
  const [onglet, setOnglet] = useState<"planning" | "finances" | "adresse" | undefined>(disponibles[0]?.id);

  if (disponibles.length === 0) {
    return <p className="text-sm text-muted">Aucun accès à cette fiche.</p>;
  }

  return (
    <div>
      <div className="flex gap-1 border-b border-border mb-6 print:hidden">
        {disponibles.map((d) => (
          <button
            key={d.id}
            type="button"
            onClick={() => setOnglet(d.id)}
            className={`px-4 py-2 text-sm font-medium rounded-t-md border-b-2 transition-colors ${
              onglet === d.id
                ? "border-foreground text-foreground"
                : "border-transparent text-muted hover:text-foreground"
            }`}
          >
            {d.label}
          </button>
        ))}
      </div>

      {/* Le planning reste imprimable même si un autre onglet est actif à l'écran. */}
      {planning !== undefined && <div className={onglet === "planning" ? "" : "hidden print:block"}>{planning}</div>}
      {finances !== undefined && (
        <div className={`print:hidden ${onglet === "finances" ? "" : "hidden"}`}>{finances}</div>
      )}
      {adresse !== undefined && <div className={`print:hidden ${onglet === "adresse" ? "" : "hidden"}`}>{adresse}</div>}
    </div>
  );
}
