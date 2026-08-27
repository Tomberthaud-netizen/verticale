export interface IndiceBTEntry {
  periode: string; // format "YYYY-MM"
  valeur: number;
}

/** Période "YYYY-MM" correspondant à une date. */
export function periodeDeDate(date: Date): string {
  const annee = date.getFullYear();
  const mois = String(date.getMonth() + 1).padStart(2, "0");
  return `${annee}-${mois}`;
}

function periodeVersIndexMois(periode: string): number {
  const [annee, mois] = periode.split("-").map(Number);
  return annee * 12 + (mois - 1);
}

/**
 * Valeur d'indice pour la période exacte d'une date, ou à défaut celle de la période
 * disponible la plus proche dans le temps. `null` si aucun indice n'est fourni.
 */
export function trouverIndicePourDate(indices: IndiceBTEntry[], date: Date): number | null {
  if (indices.length === 0) return null;

  const cible = periodeDeDate(date);
  const exact = indices.find((i) => i.periode === cible);
  if (exact) return exact.valeur;

  const cibleIndex = periodeVersIndexMois(cible);
  let meilleur: IndiceBTEntry | null = null;
  let meilleurEcart = Infinity;
  for (const entree of indices) {
    const ecart = Math.abs(periodeVersIndexMois(entree.periode) - cibleIndex);
    if (ecart < meilleurEcart) {
      meilleur = entree;
      meilleurEcart = ecart;
    }
  }
  return meilleur?.valeur ?? null;
}

/**
 * Prix actualisé = prix source × (indice à la date cible / indice à la date source).
 * `null` si un des deux indices est manquant ou nul.
 */
export function actualiserPrix(
  prixSource: number,
  indiceSource: number | null,
  indiceCible: number | null
): number | null {
  if (indiceSource == null || indiceCible == null || indiceSource === 0) return null;
  return prixSource * (indiceCible / indiceSource);
}
