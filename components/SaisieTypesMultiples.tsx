"use client";

import { useState } from "react";
import { filtrerDesignations } from "@/lib/suggestionPrix";

interface SaisieTypesMultiplesProps {
  label: string;
  valeurs: string[];
  onChange: (valeurs: string[]) => void;
  suggestions: string[];
  placeholder?: string;
}

export default function SaisieTypesMultiples({
  label,
  valeurs,
  onChange,
  suggestions,
  placeholder,
}: SaisieTypesMultiplesProps) {
  const [saisie, setSaisie] = useState("");
  const [ouvert, setOuvert] = useState(false);

  function ajouter(valeur: string) {
    const nettoyee = valeur.trim();
    if (!nettoyee) return;
    if (!valeurs.some((v) => v.toLowerCase() === nettoyee.toLowerCase())) {
      onChange([...valeurs, nettoyee]);
    }
    setSaisie("");
    setOuvert(false);
  }

  function retirer(valeur: string) {
    onChange(valeurs.filter((v) => v !== valeur));
  }

  const completions = filtrerDesignations(
    suggestions.filter((s) => !valeurs.some((v) => v.toLowerCase() === s.toLowerCase())),
    saisie
  );

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm font-medium">{label}</span>
      {valeurs.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {valeurs.map((v) => (
            <span
              key={v}
              className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-foreground text-background"
            >
              {v}
              <button
                type="button"
                onClick={() => retirer(v)}
                className="hover:opacity-70"
                aria-label={`Retirer ${v}`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
      <div className="relative">
        <input
          type="text"
          value={saisie}
          onChange={(e) => {
            setSaisie(e.target.value);
            setOuvert(true);
          }}
          onFocus={() => setOuvert(true)}
          onBlur={() => setTimeout(() => setOuvert(false), 150)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              ajouter(saisie);
            }
            if (e.key === "Escape") setOuvert(false);
          }}
          placeholder={placeholder ?? "Tapez pour rechercher ou ajouter…"}
          className="w-full border border-border rounded-md px-3 py-2 text-sm font-normal bg-surface"
        />
        {ouvert && completions.length > 0 && (
          <ul className="absolute z-10 top-full left-0 right-0 mt-1 bg-surface border border-border rounded-md shadow-md max-h-48 overflow-y-auto">
            {completions.map((c) => (
              <li key={c}>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => ajouter(c)}
                  className="w-full text-left px-3 py-1.5 text-sm hover:bg-background"
                >
                  {c}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      {saisie.trim() && !suggestions.some((s) => s.toLowerCase() === saisie.trim().toLowerCase()) && (
        <p className="text-xs text-muted -mt-0.5">
          Appuyez sur Entrée pour ajouter « {saisie.trim()} » comme nouveau type.
        </p>
      )}
    </div>
  );
}
