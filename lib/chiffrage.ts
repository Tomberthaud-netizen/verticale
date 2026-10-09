import { calculerTotalHT } from "./devis";

export const TYPES_PIECE = [
  { cle: "ENTREE", libelle: "Entrée" },
  { cle: "SALON", libelle: "Salon / séjour" },
  { cle: "CUISINE", libelle: "Cuisine" },
  { cle: "CHAMBRE", libelle: "Chambre" },
  { cle: "SALLE_DE_BAIN", libelle: "Salle de bain" },
  { cle: "SALLE_D_EAU", libelle: "Salle d'eau" },
  { cle: "WC", libelle: "WC" },
  { cle: "COULOIR", libelle: "Couloir" },
  { cle: "BUANDERIE", libelle: "Buanderie" },
  { cle: "BUREAU", libelle: "Bureau" },
  { cle: "DRESSING", libelle: "Dressing" },
  { cle: "AUTRE", libelle: "Autre" },
] as const;

export function libelleTypePiece(cle: string): string {
  return TYPES_PIECE.find((t) => t.cle === cle)?.libelle ?? cle;
}

export type BaseCalcul = "SURFACE_SOL" | "SURFACE_MURS" | "SURFACE_PLAFOND" | "PERIMETRE" | "FORFAIT_PIECE";

export const BASES_CALCUL: { cle: BaseCalcul; libelle: string; unite: string }[] = [
  { cle: "SURFACE_SOL", libelle: "Surface au sol", unite: "M²" },
  { cle: "SURFACE_MURS", libelle: "Surface des murs (périmètre × hauteur)", unite: "M²" },
  { cle: "SURFACE_PLAFOND", libelle: "Surface du plafond", unite: "M²" },
  { cle: "PERIMETRE", libelle: "Périmètre (plinthes…)", unite: "ML" },
  { cle: "FORFAIT_PIECE", libelle: "Forfait par pièce", unite: "U" },
];

export function libelleBase(base: string): string {
  return BASES_CALCUL.find((b) => b.cle === base)?.libelle ?? base;
}

export const HAUTEUR_PAR_DEFAUT_M = 2.5;

export interface PieceCalcul {
  nom: string;
  typePiece: string;
  surfaceM2: number;
  perimetreM: number;
  hauteurM: number;
}

export interface PosteCalcul {
  lot: string;
  designation: string;
  unite: string;
  base: BaseCalcul;
  prixUnitaire: number;
  /** Types de pièces concernés, séparés par des virgules ; vide = toutes les pièces. */
  typesPieces: string;
  actif: boolean;
  ordre: number;
}

export interface LigneChiffrageCalculee {
  lot: string;
  designation: string;
  detail: string;
  unite: string;
  quantite: number;
  prixUnitaire: number;
}

export function arrondir2(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Nombre à la française, 2 décimales au plus (23,25 ; 12 ; 4,7). */
export function formaterNombre(n: number): string {
  return arrondir2(n).toLocaleString("fr-FR", { maximumFractionDigits: 2 });
}

export function surfaceDepuisDimensions(longueurM: number, largeurM: number): number {
  return arrondir2(longueurM * largeurM);
}

export function perimetreDepuisDimensions(longueurM: number, largeurM: number): number {
  return arrondir2(2 * (longueurM + largeurM));
}

/** Mesure d'une pièce correspondant à la base de calcul d'un poste. */
export function mesurePiece(piece: PieceCalcul, base: BaseCalcul): number {
  switch (base) {
    case "SURFACE_SOL":
    case "SURFACE_PLAFOND":
      return piece.surfaceM2;
    case "SURFACE_MURS":
      return piece.perimetreM * piece.hauteurM;
    case "PERIMETRE":
      return piece.perimetreM;
    case "FORFAIT_PIECE":
      return 1;
  }
}

export function listerTypesPieces(csv: string): string[] {
  return csv
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

export function posteConcernePiece(poste: Pick<PosteCalcul, "typesPieces">, typePiece: string): boolean {
  const types = listerTypesPieces(poste.typesPieces);
  return types.length === 0 || types.includes(typePiece);
}

/**
 * Calcule le chiffrage détaillé : pour chaque poste actif du barème (dans l'ordre), la quantité
 * est la somme des mesures des pièces concernées ; le détail liste ces pièces. Un poste sans
 * pièce concernée (ou à quantité nulle) n'apparaît pas. Les ouvertures (portes, fenêtres) ne
 * sont pas déduites des surfaces de murs.
 */
export function calculerLignesChiffrage(pieces: PieceCalcul[], postes: PosteCalcul[]): LigneChiffrageCalculee[] {
  const lignes: LigneChiffrageCalculee[] = [];
  const postesTries = [...postes].filter((p) => p.actif).sort((a, b) => a.ordre - b.ordre);
  for (const poste of postesTries) {
    const concernees = pieces.filter((p) => posteConcernePiece(poste, p.typePiece));
    if (concernees.length === 0) continue;
    const quantite = arrondir2(concernees.reduce((s, p) => s + mesurePiece(p, poste.base), 0));
    if (quantite <= 0) continue;
    const detail = concernees
      .map((p) =>
        poste.base === "FORFAIT_PIECE" ? p.nom : `${p.nom} ${formaterNombre(mesurePiece(p, poste.base))} ${poste.unite}`
      )
      .join(" · ");
    lignes.push({
      lot: poste.lot,
      designation: poste.designation,
      detail,
      unite: poste.unite,
      quantite,
      prixUnitaire: poste.prixUnitaire,
    });
  }
  return lignes;
}

export function calculerTotalHTChiffrage(lignes: { quantite: number; prixUnitaire: number }[]): number {
  return calculerTotalHT(lignes);
}

/** Sous-total HT par lot, dans l'ordre d'apparition des lots. */
export function totauxParLot(lignes: { lot: string; quantite: number; prixUnitaire: number }[]): { lot: string; totalHT: number }[] {
  const totaux = new Map<string, number>();
  for (const l of lignes) totaux.set(l.lot, (totaux.get(l.lot) ?? 0) + l.quantite * l.prixUnitaire);
  return [...totaux.entries()].map(([lot, totalHT]) => ({ lot, totalHT }));
}

// ---------------------------------------------------------------------------------------------
// Tracé de contour sur un plan
// ---------------------------------------------------------------------------------------------

export type Point = [number, number];

export function distancePoints(a: Point, b: Point): number {
  return Math.hypot(b[0] - a[0], b[1] - a[1]);
}

/** Pixels par mètre déduits de deux points cliqués dont on connaît l'écartement réel. */
export function echelleDepuisPoints(a: Point, b: Point, distanceReelleM: number): number | null {
  if (!Number.isFinite(distanceReelleM) || distanceReelleM <= 0) return null;
  const px = distancePoints(a, b);
  return px > 0 ? px / distanceReelleM : null;
}

/** Surface (m²) et périmètre (m) d'un polygone en pixels, selon l'échelle (px par mètre). */
export function mesurerContour(points: Point[], pxParM: number): { surfaceM2: number; perimetreM: number } | null {
  if (points.length < 3 || !(pxParM > 0)) return null;
  let aire2 = 0;
  let perimetre = 0;
  for (let i = 0; i < points.length; i++) {
    const [x1, y1] = points[i];
    const [x2, y2] = points[(i + 1) % points.length];
    aire2 += x1 * y2 - x2 * y1;
    perimetre += distancePoints(points[i], points[(i + 1) % points.length]);
  }
  return {
    surfaceM2: arrondir2(Math.abs(aire2) / 2 / (pxParM * pxParM)),
    perimetreM: arrondir2(perimetre / pxParM),
  };
}

// ---------------------------------------------------------------------------------------------
// Barème de départ
// ---------------------------------------------------------------------------------------------

const TOUTES: string[] = [];
const PIECES_D_EAU = ["SALLE_DE_BAIN", "SALLE_D_EAU", "WC"];
const PIECES_SOL_CARRELE = ["ENTREE", "CUISINE", "SALLE_DE_BAIN", "SALLE_D_EAU", "WC", "BUANDERIE"];
const PIECES_SOL_PARQUET = ["SALON", "CHAMBRE", "COULOIR", "BUREAU", "DRESSING"];

/**
 * Postes types proposés pour démarrer un barème : désignations, unités, bases de calcul et pièces
 * concernées, mais volontairement SANS prix (à 0) — c'est à l'utilisateur de saisir ses prix.
 */
export const POSTES_BAREME_TYPES: Omit<PosteCalcul, "prixUnitaire" | "actif" | "ordre">[] = [
  { lot: "Démolition", designation: "Dépose du revêtement de sol existant", unite: "M²", base: "SURFACE_SOL", typesPieces: TOUTES.join(",") },
  { lot: "Démolition", designation: "Dépose et évacuation de la cuisine existante", unite: "Ens", base: "FORFAIT_PIECE", typesPieces: "CUISINE" },
  { lot: "Plomberie Sanitaire Chauffage", designation: "Fourniture et pose des équipements sanitaires", unite: "Ens", base: "FORFAIT_PIECE", typesPieces: PIECES_D_EAU.join(",") },
  { lot: "Plomberie Sanitaire Chauffage", designation: "Alimentation et évacuation de la cuisine", unite: "Ens", base: "FORFAIT_PIECE", typesPieces: "CUISINE" },
  { lot: "Elec", designation: "Reprise de l'installation électrique", unite: "Ens", base: "FORFAIT_PIECE", typesPieces: TOUTES.join(",") },
  { lot: "Carrelage Faïence", designation: "Fourniture et pose de carrelage au sol", unite: "M²", base: "SURFACE_SOL", typesPieces: PIECES_SOL_CARRELE.join(",") },
  { lot: "Carrelage Faïence", designation: "Fourniture et pose de faïence murale", unite: "M²", base: "SURFACE_MURS", typesPieces: "SALLE_DE_BAIN,SALLE_D_EAU" },
  { lot: "Sols Souples", designation: "Fourniture et pose de parquet stratifié", unite: "M²", base: "SURFACE_SOL", typesPieces: PIECES_SOL_PARQUET.join(",") },
  { lot: "Sols Souples", designation: "Fourniture et pose de plinthes", unite: "ML", base: "PERIMETRE", typesPieces: PIECES_SOL_PARQUET.join(",") },
  { lot: "Peinture", designation: "Peinture des murs (préparation comprise)", unite: "M²", base: "SURFACE_MURS", typesPieces: TOUTES.join(",") },
  { lot: "Peinture", designation: "Peinture des plafonds (préparation comprise)", unite: "M²", base: "SURFACE_PLAFOND", typesPieces: TOUTES.join(",") },
  { lot: "Menuiserie Intérieure", designation: "Fourniture et pose d'un bloc-porte", unite: "U", base: "FORFAIT_PIECE", typesPieces: "ENTREE,CHAMBRE,SALLE_DE_BAIN,SALLE_D_EAU,WC,BUREAU" },
];
