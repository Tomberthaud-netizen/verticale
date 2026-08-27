"use client";

import { useState, type ReactNode } from "react";

interface SousOngletsProps {
  onglets: { id: string; label: string; content: ReactNode }[];
  ongletParDefaut?: string;
}

export default function SousOnglets({ onglets, ongletParDefaut }: SousOngletsProps) {
  const [actif, setActif] = useState(ongletParDefaut ?? onglets[0]?.id);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex gap-1 border-b border-border print:hidden">
        {onglets.map((o) => (
          <button
            key={o.id}
            type="button"
            onClick={() => setActif(o.id)}
            className={`px-4 py-2 text-sm font-medium rounded-t-md border-b-2 transition-colors ${
              actif === o.id
                ? "border-foreground text-foreground"
                : "border-transparent text-muted hover:text-foreground"
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
      {onglets.map((o) => (
        <div key={o.id} className={actif === o.id ? "" : "hidden"}>
          {o.content}
        </div>
      ))}
    </div>
  );
}
