export interface LigneHistorique {
  designation: string;
  prixUnitaire: number;
  dateDevis: Date;
  devisNumero: string;
  devisIntitule: string;
}

function normaliser(texte: string): string {
  return texte.trim().toLowerCase();
}

/**
 * Désignations déjà utilisées qui contiennent le texte recherché (insensible à la casse),
 * pour proposer des complétions pendant la saisie. Exclut la correspondance strictement
 * identique (rien à proposer de plus si c'est déjà exactement ça).
 */
export function filtrerDesignations(designations: string[], recherche: string, limite = 8): string[] {
  const cible = normaliser(recherche);
  if (!cible) return [];
  return designations.filter((d) => normaliser(d).includes(cible) && normaliser(d) !== cible).slice(0, limite);
}

/**
 * Fusionne le catalogue de désignations courantes et celles déjà utilisées dans de vrais
 * devis, en dédoublonnant (insensible à la casse) et en donnant priorité à l'intitulé du
 * catalogue quand les deux existent.
 */
export function fusionnerDesignations(catalogue: string[], historique: string[]): string[] {
  const vues = new Set<string>();
  const resultat: string[] = [];
  for (const designation of [...catalogue, ...historique]) {
    const cle = normaliser(designation);
    if (!cle || vues.has(cle)) continue;
    vues.add(cle);
    resultat.push(designation);
  }
  return resultat;
}

/**
 * Cherche, parmi l'historique des lignes de devis, la meilleure correspondance pour une
 * désignation saisie : correspondance exacte (insensible à la casse) en priorité, sinon
 * correspondance partielle (l'une contient l'autre). En cas de plusieurs résultats, retient
 * le plus récent (utile pour l'actualisation par indice BT).
 */
export function trouverMeilleureLigne(
  lignes: LigneHistorique[],
  designationRecherchee: string
): LigneHistorique | null {
  const cible = normaliser(designationRecherchee);
  if (!cible) return null;

  const exactes = lignes.filter((l) => normaliser(l.designation) === cible);
  const pool =
    exactes.length > 0
      ? exactes
      : lignes.filter((l) => {
          const d = normaliser(l.designation);
          return d.includes(cible) || cible.includes(d);
        });

  if (pool.length === 0) return null;

  return pool.reduce((plusRecent, l) => (l.dateDevis > plusRecent.dateDevis ? l : plusRecent));
}

export type NiveauConfiance = "HAUTE" | "MOYENNE" | "BASSE";

export interface ReferenceCatalogue {
  designation: string;
  prixUnitaire: number;
  dateReference: Date | null;
  lot: string | null;
  confiance: NiveauConfiance;
}

const RANG_CONFIANCE: Record<NiveauConfiance, number> = { HAUTE: 0, MOYENNE: 1, BASSE: 2 };

/**
 * Repli du catalogue de prix extrait des devis de sous-traitants : même logique de
 * correspondance que `trouverMeilleureLigne`, mais en départageant par fiabilité de
 * l'extraction (haute > moyenne > basse) avant la date la plus récente.
 */
export function trouverMeilleureReference(
  references: ReferenceCatalogue[],
  designationRecherchee: string
): ReferenceCatalogue | null {
  const cible = normaliser(designationRecherchee);
  if (!cible) return null;

  const exactes = references.filter((r) => normaliser(r.designation) === cible);
  const pool =
    exactes.length > 0
      ? exactes
      : references.filter((r) => {
          const d = normaliser(r.designation);
          return d.includes(cible) || cible.includes(d);
        });

  if (pool.length === 0) return null;

  return pool.reduce((meilleure, r) => {
    const rangR = RANG_CONFIANCE[r.confiance];
    const rangMeilleure = RANG_CONFIANCE[meilleure.confiance];
    if (rangR !== rangMeilleure) return rangR < rangMeilleure ? r : meilleure;
    const dateR = r.dateReference?.getTime() ?? 0;
    const dateMeilleure = meilleure.dateReference?.getTime() ?? 0;
    return dateR > dateMeilleure ? r : meilleure;
  });
}
