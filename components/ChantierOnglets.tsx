"use client";

import { useState, type ReactNode } from "react";

interface ChantierOngletsProps {
  planning: ReactNode;
  finances: ReactNode;
  adresse: ReactNode;
}

export default function ChantierOnglets({ planning, finances, adresse }: ChantierOngletsProps) {
  const [onglet, setOnglet] = useState<"planning" | "finances" | "adresse">("planning");

  return (
    <div>
      <div className="flex gap-1 border-b border-border mb-6 print:hidden">
        <button
          type="button"
          onClick={() => setOnglet("planning")}
          className={`px-4 py-2 text-sm font-medium rounded-t-md border-b-2 transition-colors ${
            onglet === "planning"
              ? "border-foreground text-foreground"
              : "border-transparent text-muted hover:text-foreground"
          }`}
        >
          Planning
        </button>
        <button
          type="button"
          onClick={() => setOnglet("finances")}
          className={`px-4 py-2 text-sm font-medium rounded-t-md border-b-2 transition-colors ${
            onglet === "finances"
              ? "border-foreground text-foreground"
              : "border-transparent text-muted hover:text-foreground"
          }`}
        >
          Finances
        </button>
        <button
          type="button"
          onClick={() => setOnglet("adresse")}
          className={`px-4 py-2 text-sm font-medium rounded-t-md border-b-2 transition-colors ${
            onglet === "adresse"
              ? "border-foreground text-foreground"
              : "border-transparent text-muted hover:text-foreground"
          }`}
        >
          Adresse
        </button>
      </div>

      {/* Le planning reste imprimable même si un autre onglet est actif à l'écran. */}
      <div className={onglet === "planning" ? "" : "hidden print:block"}>{planning}</div>
      <div className={`print:hidden ${onglet === "finances" ? "" : "hidden"}`}>{finances}</div>
      <div className={`print:hidden ${onglet === "adresse" ? "" : "hidden"}`}>{adresse}</div>
    </div>
  );
}
