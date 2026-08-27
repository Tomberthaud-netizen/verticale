import { PHASE_COLORS, RETARD_COLOR, libellePhase } from "@/constants/colors";
import { jourOuvreSuivant, jourOuvreSuivantOuMeme } from "./dates";
import type { ChantierCalcule } from "./chantier";

/** Liste des jours ouvrés (lundi-vendredi) entre `debut` et `fin`, inclus. */
export function construireEchelleJoursOuvres(debut: Date, fin: Date): Date[] {
  const debutOuvre = jourOuvreSuivantOuMeme(debut);
  const jours: Date[] = [];
  let curseur = debutOuvre;
  while (curseur.getTime() <= fin.getTime()) {
    jours.push(curseur);
    curseur = jourOuvreSuivant(curseur);
  }
  if (jours.length === 0) jours.push(debutOuvre);
  return jours;
}

export interface PositionSegment {
  startIndex: number;
  endIndex: number;
}

/** Place un segment [debut, fin] sur une échelle de jours ouvrés donnée. */
export function positionnerSegment(
  echelle: Date[],
  debut: Date,
  fin: Date
): PositionSegment | null {
  const startIndex = echelle.findIndex((j) => j.getTime() >= debut.getTime());
  let endIndex = -1;
  for (let i = echelle.length - 1; i >= 0; i--) {
    if (echelle[i].getTime() <= fin.getTime()) {
      endIndex = i;
      break;
    }
  }
  if (startIndex === -1 || endIndex === -1 || endIndex < startIndex) return null;
  return { startIndex, endIndex };
}

/** Place un point (date isolée) sur une échelle de jours ouvrés : le jour ouvré le plus proche, au plus tard. */
export function positionnerPoint(echelle: Date[], date: Date): number {
  if (echelle.length === 0) return -1;
  const idx = echelle.findIndex((j) => j.getTime() >= date.getTime());
  return idx === -1 ? echelle.length - 1 : idx;
}

export interface GanttRepere {
  id: string;
  date: Date;
  label: string;
  type: "alerte" | "dateImportante";
}

/** Construit les repères (alertes + dates importantes) d'un chantier calculé, pour affichage sur le Gantt. */
export function construireReperes(chantier: ChantierCalcule): GanttRepere[] {
  const reperesAlertes: GanttRepere[] = chantier.alertes.map((a) => ({
    id: a.id,
    date: a.dateDeclenchement,
    label: `J-${a.joursAvantLivraison}`,
    type: "alerte",
  }));

  const reperesDates: GanttRepere[] = chantier.datesImportantes.map((d) => ({
    id: d.id,
    date: d.date,
    label: d.nom,
    type: "dateImportante",
  }));

  return [...reperesAlertes, ...reperesDates];
}

export interface GanttSegment {
  id: string;
  debut: Date;
  fin: Date;
  bg: string;
  border: string;
  label: string;
}

/**
 * Construit les segments (phases + retards) d'un chantier calculé, prêts pour le Gantt. Une
 * phase interrompue par un retard produit plusieurs segments (même couleur/libellé), un par
 * morceau de son découpage réel.
 */
export function construireSegments(chantier: ChantierCalcule): GanttSegment[] {
  const segmentsPhases: GanttSegment[] = chantier.phases.flatMap((phase) =>
    phase.segments.map((segment, i) => ({
      id: phase.segments.length > 1 ? `${phase.id}-${i}` : phase.id,
      debut: segment.dateDebut,
      fin: segment.dateFin,
      bg: PHASE_COLORS[phase.type].bg,
      border: PHASE_COLORS[phase.type].border,
      label: libellePhase(phase),
    }))
  );

  const segmentsRetards: GanttSegment[] = chantier.retards.map((retard) => ({
    id: retard.id,
    debut: retard.dateDebut,
    fin: retard.dateFin,
    bg: RETARD_COLOR.bg,
    border: RETARD_COLOR.border,
    label: RETARD_COLOR.label,
  }));

  return [...segmentsPhases, ...segmentsRetards];
}
