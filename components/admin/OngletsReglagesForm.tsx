"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { modifierParametresOnglets } from "@/app/administrationActions";
import { ACCES_ONGLETS, ACCES_LABELS } from "@/constants/acces";
import type { AccesOnglet } from "@prisma/client";

interface Ligne {
  onglet: AccesOnglet;
  libelle: string;
}

export default function OngletsReglagesForm({
  libelles,
  ordres,
}: {
  libelles: Record<AccesOnglet, string>;
  ordres: Record<AccesOnglet, number>;
}) {
  const router = useRouter();
  const [lignes, setLignes] = useState<Ligne[]>(() =>
    [...ACCES_ONGLETS]
      .sort((a, b) => ordres[a] - ordres[b])
      .map((onglet) => ({ onglet, libelle: libelles[onglet] }))
  );
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  function modifierLibelle(onglet: AccesOnglet, libelle: string) {
    setLignes((prev) => prev.map((l) => (l.onglet === onglet ? { ...l, libelle } : l)));
  }

  function deplacer(index: number, direction: -1 | 1) {
    setLignes((prev) => {
      const cible = index + direction;
      if (cible < 0 || cible >= prev.length) return prev;
      const copie = [...prev];
      [copie[index], copie[cible]] = [copie[cible], copie[index]];
      return copie;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErreur(null);
    setEnCours(true);
    try {
      await modifierParametresOnglets(
        lignes.map((l, i) => ({
          onglet: l.onglet,
          libellePersonnalise: l.libelle.trim() === ACCES_LABELS[l.onglet] ? null : l.libelle.trim(),
          ordre: i,
        }))
      );
      router.refresh();
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "Une erreur est survenue.");
    } finally {
      setEnCours(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        {lignes.map((ligne, i) => (
          <div key={ligne.onglet} className="flex items-center gap-2 border border-border rounded-md p-2 bg-surface">
            <div className="flex flex-col shrink-0">
              <button
                type="button"
                onClick={() => deplacer(i, -1)}
                disabled={i === 0}
                className="text-muted hover:text-foreground disabled:opacity-20 leading-none px-1"
                aria-label="Monter"
              >
                ▲
              </button>
              <button
                type="button"
                onClick={() => deplacer(i, 1)}
                disabled={i === lignes.length - 1}
                className="text-muted hover:text-foreground disabled:opacity-20 leading-none px-1"
                aria-label="Descendre"
              >
                ▼
              </button>
            </div>
            <span className="text-xs text-muted w-32 shrink-0">{ACCES_LABELS[ligne.onglet]}</span>
            <input
              value={ligne.libelle}
              onChange={(e) => modifierLibelle(ligne.onglet, e.target.value)}
              className="flex-1 border border-border rounded-md px-2 py-1.5 text-sm bg-background"
            />
          </div>
        ))}
      </div>
      {erreur && <p className="text-sm text-red-600">{erreur}</p>}
      <button
        type="submit"
        disabled={enCours}
        className="self-start rounded-md bg-accent text-background text-sm font-medium px-4 py-2 hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        {enCours ? "Enregistrement…" : "Enregistrer l'ordre et les noms"}
      </button>
    </form>
  );
}
