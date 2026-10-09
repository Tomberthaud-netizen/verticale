"use client";

import { UNITES_LIGNE } from "@/constants/unites";

export interface LigneEdition {
  key: string;
  designation: string;
  detail: string;
  unite: string;
  quantite: string;
  prixUnitaire: string;
}

let prochaineCle = 1;

export function ligneVide(): LigneEdition {
  return { key: String(prochaineCle++), designation: "", detail: "", unite: "", quantite: "1", prixUnitaire: "" };
}

export function versEdition(l: {
  designation: string;
  detail: string | null;
  unite: string | null;
  quantite: number;
  prixUnitaire: number;
}): LigneEdition {
  return {
    key: String(prochaineCle++),
    designation: l.designation,
    detail: l.detail ?? "",
    unite: l.unite ?? "",
    quantite: String(l.quantite),
    prixUnitaire: String(l.prixUnitaire),
  };
}

/** Convertit les saisies (texte) en lignes numériques prêtes à être envoyées aux actions serveur. */
export function lignesEditionVersSaisie(lignes: LigneEdition[]) {
  return lignes.map((l) => ({
    designation: l.designation,
    detail: l.detail,
    unite: l.unite,
    quantite: Number(l.quantite),
    prixUnitaire: Number(l.prixUnitaire),
  }));
}

/** Tableau d'édition des lignes d'un bon de commande (désignation, détail, unité, quantité, PU). */
export default function LignesBonCommandeEditeur({
  lignes,
  onChange,
}: {
  lignes: LigneEdition[];
  onChange: (lignes: LigneEdition[]) => void;
}) {
  function modifierLigne(key: string, patch: Partial<LigneEdition>) {
    onChange(lignes.map((l) => (l.key === key ? { ...l, ...patch } : l)));
  }

  return (
    <>
      <div className="flex flex-col gap-2">
        {lignes.map((l) => (
          <div
            key={l.key}
            className="grid gap-2 items-center border border-border rounded-md p-2 bg-background"
            style={{ gridTemplateColumns: "1.4fr 1.4fr 5rem 5rem 7rem auto" }}
          >
            <input
              required
              value={l.designation}
              onChange={(e) => modifierLigne(l.key, { designation: e.target.value })}
              placeholder="Désignation"
              className="border border-border rounded-md px-2 py-1.5 text-sm bg-surface min-w-0"
            />
            <input
              value={l.detail}
              onChange={(e) => modifierLigne(l.key, { detail: e.target.value })}
              placeholder="Détail (optionnel)"
              className="border border-border rounded-md px-2 py-1.5 text-sm bg-surface min-w-0"
            />
            <select
              value={l.unite}
              onChange={(e) => modifierLigne(l.key, { unite: e.target.value })}
              className="border border-border rounded-md px-2 py-1.5 text-sm bg-surface min-w-0"
            >
              <option value="">Unité</option>
              {l.unite && !(UNITES_LIGNE as readonly string[]).includes(l.unite) && (
                <option value={l.unite}>{l.unite}</option>
              )}
              {UNITES_LIGNE.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
            <input
              required
              type="number"
              min={0.01}
              step="any"
              value={l.quantite}
              onChange={(e) => modifierLigne(l.key, { quantite: e.target.value })}
              placeholder="Qté"
              className="border border-border rounded-md px-2 py-1.5 text-sm bg-surface min-w-0"
            />
            <input
              required
              type="number"
              step="0.01"
              value={l.prixUnitaire}
              onChange={(e) => modifierLigne(l.key, { prixUnitaire: e.target.value })}
              placeholder="PU HT (€)"
              className="border border-border rounded-md px-2 py-1.5 text-sm bg-surface min-w-0"
            />
            <button
              type="button"
              onClick={() => onChange(lignes.filter((x) => x.key !== l.key))}
              disabled={lignes.length === 1}
              className="text-sm text-muted hover:text-red-600 disabled:opacity-30 disabled:hover:text-muted"
            >
              Retirer
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={() => onChange([...lignes, ligneVide()])}
        className="self-start text-sm font-medium underline underline-offset-2"
      >
        + Ajouter une ligne
      </button>
    </>
  );
}
