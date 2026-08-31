import { addDays, differenceInCalendarDays, startOfDay } from "date-fns";

export type PhaseType = "DEMOLITION" | "RENOVATION" | "AMENAGEMENT" | "PERSONNALISEE";
export type EtatChantier = "A_VENIR" | "EN_COURS" | "TERMINE";

/** Seuils d'alerte (en jours avant la livraison) créés par défaut pour chaque chantier. */
export const SEUILS_ALERTE_DEFAUT = [15, 7, 3, 1];

export interface PhaseInput {
  id: string;
  type: PhaseType;
  nom?: string | null;
  nombreJoursOuvres: number;
  ordre: number;
}

export interface SegmentPhase {
  dateDebut: Date;
  dateFin: Date;
}

export interface PhaseCalculee extends PhaseInput {
  /** Début du tout premier segment de la phase. */
  dateDebut: Date;
  /** Fin du tout dernier segment de la phase. */
  dateFin: Date;
  /** Découpage réel pour le Gantt : plus d'un segment si un retard a interrompu la phase en son
   * milieu (la phase reprend après le retard, pour le nombre de jours ouvrés qu'il lui restait). */
  segments: SegmentPhase[];
}

export interface RetardInput {
  id: string;
  nombreJours: number;
  dateAjout: Date;
  commentaire?: string | null;
}

export interface RetardCalcule extends RetardInput {
  dateDebut: Date;
  dateFin: Date;
}

export interface DateImportanteInput {
  id: string;
  nom: string;
  date: Date;
  chantierId?: string;
}

/** Un samedi ou un dimanche. */
export function estWeekend(date: Date): boolean {
  const jour = date.getDay();
  return jour === 0 || jour === 6;
}

/** Avance la date jusqu'au prochain jour ouvré (lundi-vendredi), inclus si déjà ouvré. */
export function jourOuvreSuivantOuMeme(date: Date): Date {
  let d = new Date(date);
  while (estWeekend(d)) d = addDays(d, 1);
  return d;
}

/** Premier jour ouvré strictement après la date donnée. */
export function jourOuvreSuivant(date: Date): Date {
  return jourOuvreSuivantOuMeme(addDays(date, 1));
}

/** Ajoute `amount` jours ouvrés à une date (en sautant les week-ends). */
export function ajouterJoursOuvres(date: Date, amount: number): Date {
  let d = new Date(date);
  let restant = amount;
  const pas = restant < 0 ? -1 : 1;
  while (restant !== 0) {
    d = addDays(d, pas);
    if (!estWeekend(d)) restant -= pas;
  }
  return d;
}

/**
 * Date de fin d'une période de `nombreJoursOuvres` jours ouvrés démarrant à `debut`
 * (le jour de début compte comme le 1er jour ouvré).
 */
export function calculerFinPeriode(debut: Date, nombreJoursOuvres: number): Date {
  const debutOuvre = jourOuvreSuivantOuMeme(debut);
  if (nombreJoursOuvres <= 1) return debutOuvre;
  return ajouterJoursOuvres(debutOuvre, nombreJoursOuvres - 1);
}

/** Enchaîne les phases dans l'ordre à partir de la date de démarrage du chantier. */
export function calculerPhases(dateDebutChantier: Date, phases: PhaseInput[]): PhaseCalculee[] {
  const triees = [...phases].sort((a, b) => a.ordre - b.ordre);
  const resultat: PhaseCalculee[] = [];
  let curseur = jourOuvreSuivantOuMeme(dateDebutChantier);
  for (const phase of triees) {
    const dateDebut = curseur;
    const dateFin = calculerFinPeriode(dateDebut, phase.nombreJoursOuvres);
    resultat.push({ ...phase, dateDebut, dateFin, segments: [{ dateDebut, dateFin }] });
    curseur = jourOuvreSuivant(dateFin);
  }
  return resultat;
}

/** Date de fin du chantier une fois toutes les phases enchaînées, avant prise en compte des retards. */
export function calculerDateFinPhases(dateDebutChantier: Date, phases: PhaseInput[]): Date {
  const calculees = calculerPhases(dateDebutChantier, phases);
  if (calculees.length === 0) return jourOuvreSuivantOuMeme(dateDebutChantier);
  return calculees[calculees.length - 1].dateFin;
}

export interface PlanningChantier {
  phases: PhaseCalculee[];
  retards: RetardCalcule[];
  dateFin: Date;
}

/** Nombre de jours ouvrés entre `debut` (inclus) et `finExclusive` (exclue). */
function joursOuvresEntre(debut: Date, finExclusive: Date): number {
  let compte = 0;
  let d = debut;
  while (d.getTime() < finExclusive.getTime()) {
    if (!estWeekend(d)) compte++;
    d = addDays(d, 1);
  }
  return compte;
}

/**
 * Enchaîne les phases dans l'ordre. Chaque retard est inséré exactement à sa date d'ajout, en
 * plein milieu de la phase qui était "en cours" ce jour-là (déterminée sur le planning initial,
 * sans retards) : la phase est coupée en deux — le travail déjà fait avant le retard, puis le
 * retard, puis le reste de la phase reprend juste après — ce qui repousse d'autant toutes les
 * phases suivantes. Un retard ajouté après la fin de toutes les phases s'ajoute à la toute fin.
 */
export function calculerPlanningChantier(
  dateDebutChantier: Date,
  phases: PhaseInput[],
  retards: RetardInput[]
): PlanningChantier {
  const phasesTriees = [...phases].sort((a, b) => a.ordre - b.ordre);
  if (phasesTriees.length === 0) {
    return { phases: [], retards: [], dateFin: jourOuvreSuivantOuMeme(dateDebutChantier) };
  }

  // Planning initial (sans retards), pour déterminer quelle phase était "en cours" à la date
  // d'ajout de chaque retard : la dernière phase déjà démarrée à cette date.
  const phasesInitiales = calculerPhases(dateDebutChantier, phasesTriees);
  function trouverIndexPhase(dateAjout: Date): number {
    let index = 0;
    for (let i = 0; i < phasesInitiales.length; i++) {
      if (phasesInitiales[i].dateDebut.getTime() <= dateAjout.getTime()) index = i;
    }
    return index;
  }

  const retardsParPhase = new Map<number, RetardInput[]>();
  for (const retard of [...retards].sort((a, b) => a.dateAjout.getTime() - b.dateAjout.getTime())) {
    const index = trouverIndexPhase(retard.dateAjout);
    retardsParPhase.set(index, [...(retardsParPhase.get(index) ?? []), retard]);
  }

  const phasesCalculees: PhaseCalculee[] = [];
  const retardsCalcules: RetardCalcule[] = [];
  let curseur = jourOuvreSuivantOuMeme(dateDebutChantier);
  let dateFin = curseur;

  phasesTriees.forEach((phase, i) => {
    const segments: SegmentPhase[] = [];
    let joursRestants = phase.nombreJoursOuvres;
    let curseurPhase = curseur;

    for (const retard of retardsParPhase.get(i) ?? []) {
      const dateAjoutOuvre = jourOuvreSuivantOuMeme(retard.dateAjout);
      const pointDeCoupure = dateAjoutOuvre.getTime() > curseurPhase.getTime() ? dateAjoutOuvre : curseurPhase;
      const joursAvant = Math.min(joursOuvresEntre(curseurPhase, pointDeCoupure), joursRestants);

      if (joursAvant > 0) {
        const segDateFin = calculerFinPeriode(curseurPhase, joursAvant);
        segments.push({ dateDebut: curseurPhase, dateFin: segDateFin });
        joursRestants -= joursAvant;
        curseurPhase = jourOuvreSuivant(segDateFin);
      }

      const dateDebutRetard = curseurPhase;
      const dateFinRetard = calculerFinPeriode(dateDebutRetard, retard.nombreJours);
      retardsCalcules.push({ ...retard, dateDebut: dateDebutRetard, dateFin: dateFinRetard });
      curseurPhase = jourOuvreSuivant(dateFinRetard);
      dateFin = dateFinRetard;
    }

    if (joursRestants > 0) {
      const segDateFin = calculerFinPeriode(curseurPhase, joursRestants);
      segments.push({ dateDebut: curseurPhase, dateFin: segDateFin });
      curseurPhase = jourOuvreSuivant(segDateFin);
      dateFin = segDateFin;
    }
    // Sécurité : nombreJoursOuvres est toujours >= 1, donc `segments` ne peut être vide ici.

    phasesCalculees.push({
      ...phase,
      dateDebut: segments[0].dateDebut,
      dateFin: segments[segments.length - 1].dateFin,
      segments,
    });
    curseur = curseurPhase;
  });

  return { phases: phasesCalculees, retards: retardsCalcules, dateFin };
}

/** État dérivé du chantier en fonction de la date du jour. */
export function calculerEtatChantier(
  dateDebut: Date,
  dateFin: Date,
  aujourdHui: Date = new Date()
): EtatChantier {
  const today = startOfDay(aujourdHui);
  const debut = startOfDay(dateDebut);
  const fin = startOfDay(dateFin);
  if (debut > today) return "A_VENIR";
  if (today > fin) return "TERMINE";
  return "EN_COURS";
}

/** Pourcentage d'avancement du chantier (0-100) entre sa date de début et sa date de fin calculée. */
export function calculerAvancement(
  dateDebut: Date,
  dateFinCalculee: Date,
  aujourdHui: Date = new Date()
): number {
  const debut = startOfDay(dateDebut);
  const fin = startOfDay(dateFinCalculee);
  const today = startOfDay(aujourdHui);
  const dureeTotale = differenceInCalendarDays(fin, debut);
  if (today <= debut) return 0;
  if (today >= fin || dureeTotale <= 0) return 100;
  const ecoule = differenceInCalendarDays(today, debut);
  return Math.round((ecoule / dureeTotale) * 100);
}

/**
 * Retard moyen (en jours) calculé sur les chantiers ayant au moins un retard enregistré.
 * Retourne 0 si aucun chantier n'a de retard.
 */
export function calculerRetardMoyen(
  chantiers: { retards: { nombreJours: number }[] }[]
): number {
  const chantiersAvecRetard = chantiers.filter((c) => c.retards.length > 0);
  if (chantiersAvecRetard.length === 0) return 0;
  const total = chantiersAvecRetard.reduce(
    (somme, c) => somme + c.retards.reduce((s, r) => s + r.nombreJours, 0),
    0
  );
  return total / chantiersAvecRetard.length;
}

/** Prochaine date importante (toutes chantiers confondus) et nombre de jours restants. */
export function trouverProchaineDateImportante(
  dates: DateImportanteInput[],
  aujourdHui: Date = new Date()
): { dateImportante: DateImportanteInput; joursRestants: number } | null {
  const today = startOfDay(aujourdHui);
  const futures = dates
    .filter((d) => startOfDay(d.date).getTime() >= today.getTime())
    .sort((a, b) => a.date.getTime() - b.date.getTime());
  if (futures.length === 0) return null;
  const prochaine = futures[0];
  const joursRestants = differenceInCalendarDays(startOfDay(prochaine.date), today);
  return { dateImportante: prochaine, joursRestants };
}

/**
 * Dates importantes à afficher dans un résumé compact (vue d'ensemble) : celles dépassées
 * depuis plus de `toleranceJours` jours sont masquées (plus pertinentes une fois trop
 * anciennes), les autres sont triées de la plus proche à la plus lointaine.
 */
export function filtrerDatesImportantesRecentes<T extends DateImportanteInput>(
  dates: T[],
  aujourdHui: Date = new Date(),
  toleranceJours: number = 2
): T[] {
  const today = startOfDay(aujourdHui);
  return dates
    .filter((d) => differenceInCalendarDays(today, startOfDay(d.date)) <= toleranceJours)
    .sort((a, b) => a.date.getTime() - b.date.getTime());
}

export interface AlerteInput {
  id: string;
  joursAvantLivraison: number;
}

export interface AlerteCalculee extends AlerteInput {
  dateDeclenchement: Date;
  declenchee: boolean;
}

/**
 * Calcule pour chaque seuil d'alerte sa date de déclenchement (livraison - N jours)
 * et si elle est déjà déclenchée à la date donnée. Triées par seuil décroissant.
 */
export function calculerAlertes(
  dateFinCalculee: Date,
  alertes: AlerteInput[],
  aujourdHui: Date = new Date()
): AlerteCalculee[] {
  const today = startOfDay(aujourdHui);
  return [...alertes]
    .sort((a, b) => b.joursAvantLivraison - a.joursAvantLivraison)
    .map((alerte) => {
      const dateDeclenchement = startOfDay(addDays(dateFinCalculee, -alerte.joursAvantLivraison));
      return {
        ...alerte,
        dateDeclenchement,
        declenchee: today.getTime() >= dateDeclenchement.getTime(),
      };
    });
}
