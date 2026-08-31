"use client";

import { useMemo, useState } from "react";
import GanttChart, { HAUTEUR_IMPRESSION_CIBLE, type GanttRow } from "./GanttChart";
import type { EtatChantier } from "@/lib/dates";
import { ENTREPRISES } from "@/constants/entreprises";

interface ChantierRow {
  id: string;
  nom: string;
  etat: EtatChantier;
  entreprise: string;
  row: GanttRow;
}

interface Props {
  echelle: Date[];
  chantiers: ChantierRow[];
}

const FILTRES: { value: EtatChantier | "TOUS"; label: string }[] = [
  { value: "TOUS", label: "Tous" },
  { value: "EN_COURS", label: "En cours" },
  { value: "A_VENIR", label: "À venir" },
  { value: "TERMINE", label: "Terminé" },
];

export default function CalendrierGlobal({ echelle, chantiers }: Props) {
  const [filtre, setFiltre] = useState<EtatChantier | "TOUS">("TOUS");
  const [portee, setPortee] = useState<string>("TOUS");

  const chantiersFiltres = useMemo(
    () => chantiers.filter((c) => filtre === "TOUS" || c.etat === filtre),
    [chantiers, filtre]
  );

  const entreprises = useMemo(() => {
    const connues = ENTREPRISES.filter((ent) => chantiersFiltres.some((c) => c.entreprise === ent));
    const autres = Array.from(
      new Set(chantiersFiltres.map((c) => c.entreprise).filter((e) => !ENTREPRISES.includes(e as never)))
    );
    return [...connues, ...autres];
  }, [chantiersFiltres]);

  const optionsPortee = useMemo(
    () => [{ value: "TOUS", label: "Les deux" }, ...entreprises.map((e) => ({ value: e, label: e }))],
    [entreprises]
  );

  const rowsParEntreprise = useMemo(
    () =>
      new Map(
        entreprises.map((ent) => [ent, chantiersFiltres.filter((c) => c.entreprise === ent).map((c) => c.row)])
      ),
    [entreprises, chantiersFiltres]
  );

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-4 print:hidden">
        <div className="flex gap-2">
          {FILTRES.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setFiltre(f.value)}
              className={`text-sm font-medium px-3 py-1.5 rounded-full border transition-colors ${
                filtre === f.value
                  ? "bg-foreground text-background border-foreground"
                  : "border-border text-muted hover:text-foreground"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        {entreprises.length > 1 && (
          <label className="flex items-center gap-2 text-sm text-muted">
            À imprimer :
            <select
              value={portee}
              onChange={(e) => setPortee(e.target.value)}
              className="border border-border rounded-md px-2 py-1 text-sm bg-surface"
            >
              {optionsPortee.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      {entreprises.length === 0 && <p className="text-sm text-muted">Aucun chantier pour ce filtre.</p>}

      {(() => {
        // Les sections imprimées ensemble se partagent la même page : chacune ne doit viser
        // qu'une fraction de la hauteur disponible, sans quoi elles se compressent trop fort
        // (ou débordent sur une 2e page) une fois empilées.
        const sectionsImprimees = portee === "TOUS" ? entreprises.length : 1;
        const hauteurParSection = Math.max(200, HAUTEUR_IMPRESSION_CIBLE / Math.max(1, sectionsImprimees) - 24);

        return entreprises.map((ent) => {
          const rows = rowsParEntreprise.get(ent) ?? [];
          const masquerImpression = portee !== "TOUS" && portee !== ent;
          return (
            <section key={ent} className={`flex flex-col gap-2 ${masquerImpression ? "print:hidden" : ""}`}>
              <h2 className="text-sm font-semibold text-muted uppercase tracking-wide">{ent}</h2>
              <GanttChart
                echelle={echelle}
                rows={rows}
                showRowLabels
                today={new Date()}
                titre={ent}
                hauteurImpressionCible={hauteurParSection}
                naviguable
              />
            </section>
          );
        });
      })()}
    </div>
  );
}
