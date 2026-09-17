"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { modifierPhasesChantier } from "@/app/actions";
import { PHASE_COLORS } from "@/constants/colors";
import type { PhaseType } from "@/lib/dates";

const PHASE_TYPES: PhaseType[] = ["DEMOLITION", "RENOVATION", "AMENAGEMENT", "DECORATION", "PERSONNALISEE"];

interface PhaseDraft {
  key: string;
  type: PhaseType;
  nom: string;
  nombreJoursOuvres: number;
}

let nextKey = 1;

export interface PhaseExistante {
  id: string;
  type: PhaseType;
  nom: string | null;
  nombreJoursOuvres: number;
}

export default function PhasesChantierPanel({
  chantierId,
  phases,
}: {
  chantierId: string;
  phases: PhaseExistante[];
}) {
  const router = useRouter();
  const [edition, setEdition] = useState(false);

  function versDrafts(): PhaseDraft[] {
    return phases.map((p) => ({ key: String(nextKey++), type: p.type, nom: p.nom ?? "", nombreJoursOuvres: p.nombreJoursOuvres }));
  }

  const [drafts, setDrafts] = useState<PhaseDraft[]>(versDrafts);
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  function annuler() {
    setDrafts(versDrafts());
    setErreur(null);
    setEdition(false);
  }

  function ajouterPhase() {
    setDrafts((prev) => [...prev, { key: String(nextKey++), type: "DEMOLITION", nom: "", nombreJoursOuvres: 5 }]);
  }

  function supprimerPhase(key: string) {
    setDrafts((prev) => prev.filter((p) => p.key !== key));
  }

  function modifierPhase(key: string, patch: Partial<PhaseDraft>) {
    setDrafts((prev) => prev.map((p) => (p.key === key ? { ...p, ...patch } : p)));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErreur(null);
    if (drafts.length === 0) {
      setErreur("Ajoutez au moins une phase.");
      return;
    }
    if (drafts.some((p) => p.type === "PERSONNALISEE" && !p.nom.trim())) {
      setErreur("Donnez un nom à chaque phase personnalisée.");
      return;
    }
    setEnCours(true);
    try {
      await modifierPhasesChantier(
        chantierId,
        drafts.map((p) => ({
          type: p.type,
          nom: p.type === "PERSONNALISEE" ? p.nom.trim() : undefined,
          nombreJoursOuvres: p.nombreJoursOuvres,
        }))
      );
      setEdition(false);
      router.refresh();
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "Une erreur est survenue.");
    } finally {
      setEnCours(false);
    }
  }

  if (!edition) {
    return (
      <div className="flex items-center justify-between gap-3 print:hidden">
        <p className="text-xs text-muted">Durées et enchaînement des phases modifiables à tout moment.</p>
        <button
          type="button"
          onClick={() => setEdition(true)}
          className="shrink-0 text-sm font-medium text-foreground underline underline-offset-2"
        >
          Modifier les phases
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 print:hidden">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Modifier les phases</h3>
        <button
          type="button"
          onClick={ajouterPhase}
          className="text-sm font-medium text-foreground underline underline-offset-2"
        >
          + Ajouter une phase
        </button>
      </div>

      <div className="flex flex-col gap-2">
        {drafts.map((phase, i) => (
          <div key={phase.key} className="flex items-center gap-3 border border-border rounded-md p-3 bg-surface">
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: PHASE_COLORS[phase.type].bg }}
            />
            <span className="text-sm text-muted w-6 shrink-0">{i + 1}.</span>
            <select
              value={phase.type}
              onChange={(e) => modifierPhase(phase.key, { type: e.target.value as PhaseType })}
              className="border border-border rounded-md px-2 py-1.5 text-sm bg-surface"
            >
              {PHASE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {PHASE_COLORS[t].label}
                </option>
              ))}
            </select>
            {phase.type === "PERSONNALISEE" && (
              <input
                type="text"
                required
                value={phase.nom}
                onChange={(e) => modifierPhase(phase.key, { nom: e.target.value })}
                placeholder="Nom de la phase"
                className="border border-border rounded-md px-2 py-1.5 text-sm w-36 bg-surface"
              />
            )}
            <input
              type="number"
              min={1}
              required
              value={phase.nombreJoursOuvres}
              onChange={(e) => modifierPhase(phase.key, { nombreJoursOuvres: Number(e.target.value) })}
              className="border border-border rounded-md px-2 py-1.5 text-sm w-24 bg-surface"
            />
            <span className="text-sm text-muted">jours ouvrés</span>
            <button
              type="button"
              onClick={() => supprimerPhase(phase.key)}
              disabled={drafts.length === 1}
              className="ml-auto text-sm text-muted hover:text-red-600 disabled:opacity-30 disabled:hover:text-muted"
            >
              Retirer
            </button>
          </div>
        ))}
      </div>

      {erreur && <p className="text-sm text-red-600">{erreur}</p>}
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={enCours}
          className="self-start rounded-md bg-foreground text-background text-sm font-medium px-5 py-2.5 hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {enCours ? "Enregistrement…" : "Enregistrer"}
        </button>
        <button
          type="button"
          onClick={annuler}
          disabled={enCours}
          className="text-sm text-muted hover:underline disabled:opacity-50"
        >
          Annuler
        </button>
      </div>
    </form>
  );
}
