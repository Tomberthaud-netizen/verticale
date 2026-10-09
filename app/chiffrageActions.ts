"use server";

import { revalidatePath } from "next/cache";
import { Prisma, type BaseCalculChiffrage } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAcces } from "@/lib/authContext";
import { ENTREPRISES, type Entreprise } from "@/constants/entreprises";
import { UNITES_LIGNE } from "@/constants/unites";
import { genererNumeroDevis, prefixeEntreprise } from "@/lib/devis";
import { chercherSuggestionPrix, type SuggestionPrixResult } from "@/lib/suggestionPrixServeur";
import {
  BASES_CALCUL,
  HAUTEUR_PAR_DEFAUT_M,
  POSTES_BAREME_TYPES,
  TYPES_PIECE,
  arrondir2,
  calculerLignesChiffrage,
} from "@/lib/chiffrage";

const TAILLE_MAX_PLAN = 15 * 1024 * 1024;
const TYPES_MIME_PLAN = new Set(["image/png", "image/jpeg", "image/webp", "application/pdf"]);

async function exiger() {
  return requireAcces("CHIFFRAGE");
}

function revaloriser(projetId?: string) {
  revalidatePath("/chiffrage");
  if (projetId) revalidatePath(`/chiffrage/${projetId}`);
}

// ---------------------------------------------------------------------------------------------
// Projets
// ---------------------------------------------------------------------------------------------

export interface ProjetChiffrageInput {
  nom: string;
  adresse?: string;
  notes?: string;
  /** Chantier déjà créé auquel rattacher le chiffrage (facultatif). */
  chantierId?: string | null;
}

async function verifierChantier(chantierId: string | null | undefined): Promise<string | null> {
  if (!chantierId) return null;
  const chantier = await prisma.chantier.findUnique({ where: { id: chantierId }, select: { id: true } });
  if (!chantier) throw new Error("Chantier introuvable.");
  return chantier.id;
}

export async function creerProjetChiffrage(data: ProjetChiffrageInput) {
  await exiger();
  const nom = data.nom.trim();
  if (!nom) throw new Error("Le nom du projet est obligatoire.");
  const chantierId = await verifierChantier(data.chantierId);
  const projet = await prisma.projetChiffrage.create({
    data: { nom, adresse: data.adresse?.trim() || null, notes: data.notes?.trim() || null, chantierId },
  });
  revaloriser();
  return { id: projet.id };
}

export async function modifierProjetChiffrage(projetId: string, data: ProjetChiffrageInput) {
  await exiger();
  const nom = data.nom.trim();
  if (!nom) throw new Error("Le nom du projet est obligatoire.");
  const chantierId = await verifierChantier(data.chantierId);
  await prisma.projetChiffrage.update({
    where: { id: projetId },
    data: { nom, adresse: data.adresse?.trim() || null, notes: data.notes?.trim() || null, chantierId },
  });
  revaloriser(projetId);
}

export async function supprimerProjetChiffrage(projetId: string) {
  await exiger();
  await prisma.projetChiffrage.delete({ where: { id: projetId } });
  revaloriser();
}

// ---------------------------------------------------------------------------------------------
// Plan
// ---------------------------------------------------------------------------------------------

export async function definirPlanChiffrage(projetId: string, formData: FormData) {
  await exiger();
  const fichier = formData.get("plan");
  if (!(fichier instanceof File) || fichier.size === 0) throw new Error("Sélectionnez un fichier de plan.");
  if (!TYPES_MIME_PLAN.has(fichier.type)) {
    throw new Error("Format non pris en charge : envoyez une image (JPEG, PNG, WEBP) ou un PDF.");
  }
  if (fichier.size > TAILLE_MAX_PLAN) throw new Error("Le plan dépasse 15 Mo.");
  const donnees = Buffer.from(await fichier.arrayBuffer());

  // Un nouveau plan remet l'échelle à zéro (elle dépend de l'image).
  await prisma.planChiffrage.upsert({
    where: { projetId },
    create: { projetId, nomFichier: fichier.name, typeMime: fichier.type, donnees },
    update: { nomFichier: fichier.name, typeMime: fichier.type, donnees, echellePxParM: null, dateAjout: new Date() },
  });
  revaloriser(projetId);
}

export async function supprimerPlanChiffrage(projetId: string) {
  await exiger();
  await prisma.planChiffrage.deleteMany({ where: { projetId } });
  revaloriser(projetId);
}

export async function definirEchellePlan(projetId: string, pxParM: number) {
  await exiger();
  if (!Number.isFinite(pxParM) || pxParM <= 0) throw new Error("Échelle invalide.");
  const { count } = await prisma.planChiffrage.updateMany({ where: { projetId }, data: { echellePxParM: pxParM } });
  if (count === 0) throw new Error("Ajoutez d'abord un plan.");
  revaloriser(projetId);
}

// ---------------------------------------------------------------------------------------------
// Pièces
// ---------------------------------------------------------------------------------------------

export interface PieceChiffrageInput {
  nom: string;
  typePiece: string;
  surfaceM2: number;
  perimetreM: number;
  hauteurM?: number;
  /** Points du contour tracé sur le plan (pixels de l'image), conservés pour le réafficher. */
  contour?: [number, number][] | null;
}

function validerPiece(data: PieceChiffrageInput) {
  if (!data.nom.trim()) throw new Error("Le nom de la pièce est obligatoire.");
  if (!TYPES_PIECE.some((t) => t.cle === data.typePiece)) throw new Error("Type de pièce inconnu.");
  if (!Number.isFinite(data.surfaceM2) || data.surfaceM2 <= 0) throw new Error("La surface doit être un nombre positif.");
  if (!Number.isFinite(data.perimetreM) || data.perimetreM <= 0) throw new Error("Le périmètre doit être un nombre positif.");
  const hauteur = data.hauteurM ?? HAUTEUR_PAR_DEFAUT_M;
  if (!Number.isFinite(hauteur) || hauteur <= 0) throw new Error("La hauteur sous plafond doit être un nombre positif.");
}

function contourEnJson(contour: PieceChiffrageInput["contour"]): string | null {
  if (!contour || contour.length < 3) return null;
  return JSON.stringify(contour.map(([x, y]) => [Math.round(x), Math.round(y)]));
}

export async function ajouterPieceChiffrage(projetId: string, data: PieceChiffrageInput) {
  await exiger();
  validerPiece(data);
  const dernier = await prisma.pieceChiffrage.aggregate({ where: { projetId }, _max: { ordre: true } });
  await prisma.pieceChiffrage.create({
    data: {
      projetId,
      nom: data.nom.trim(),
      typePiece: data.typePiece,
      surfaceM2: arrondir2(data.surfaceM2),
      perimetreM: arrondir2(data.perimetreM),
      hauteurM: data.hauteurM ?? HAUTEUR_PAR_DEFAUT_M,
      contour: contourEnJson(data.contour),
      ordre: (dernier._max.ordre ?? 0) + 1,
    },
  });
  revaloriser(projetId);
}

export async function modifierPieceChiffrage(pieceId: string, data: PieceChiffrageInput) {
  await exiger();
  validerPiece(data);
  const piece = await prisma.pieceChiffrage.update({
    where: { id: pieceId },
    data: {
      nom: data.nom.trim(),
      typePiece: data.typePiece,
      surfaceM2: arrondir2(data.surfaceM2),
      perimetreM: arrondir2(data.perimetreM),
      hauteurM: data.hauteurM ?? HAUTEUR_PAR_DEFAUT_M,
    },
    select: { projetId: true },
  });
  revaloriser(piece.projetId);
}

export async function supprimerPieceChiffrage(pieceId: string) {
  await exiger();
  const piece = await prisma.pieceChiffrage.delete({ where: { id: pieceId }, select: { projetId: true } });
  revaloriser(piece.projetId);
}

// ---------------------------------------------------------------------------------------------
// Chiffrage (lignes)
// ---------------------------------------------------------------------------------------------

/** Recalcule toutes les lignes du chiffrage à partir des pièces et du barème (remplace les lignes existantes). */
export async function calculerChiffrage(projetId: string) {
  await exiger();
  const [pieces, postes] = await Promise.all([
    prisma.pieceChiffrage.findMany({ where: { projetId }, orderBy: { ordre: "asc" } }),
    prisma.posteBareme.findMany({ orderBy: { ordre: "asc" } }),
  ]);
  if (pieces.length === 0) throw new Error("Ajoutez au moins une pièce avant de calculer le chiffrage.");
  if (!postes.some((p) => p.actif)) {
    throw new Error("Le barème est vide : créez vos postes dans « Barème » avant de calculer.");
  }
  const lignes = calculerLignesChiffrage(pieces, postes);
  if (lignes.length === 0) throw new Error("Aucun poste du barème ne s'applique aux pièces de ce projet.");

  await prisma.$transaction([
    prisma.ligneChiffrage.deleteMany({ where: { projetId } }),
    prisma.ligneChiffrage.createMany({
      data: lignes.map((l, i) => ({ projetId, ...l, detail: l.detail || null, ordre: i + 1 })),
    }),
  ]);
  revaloriser(projetId);
  return { lignes: lignes.length };
}

export interface LigneChiffrageInput {
  lot: string;
  designation: string;
  detail?: string;
  unite?: string;
  quantite: number;
  prixUnitaire: number;
}

/** Enregistre les lignes du chiffrage après modification manuelle (quantités, prix, ajouts, retraits). */
export async function enregistrerLignesChiffrage(projetId: string, lignes: LigneChiffrageInput[]) {
  await exiger();
  for (const l of lignes) {
    if (!l.designation.trim()) throw new Error("Chaque ligne doit avoir une désignation.");
    if (!Number.isFinite(l.quantite) || l.quantite <= 0) throw new Error("Chaque ligne doit avoir une quantité positive.");
    if (!Number.isFinite(l.prixUnitaire)) throw new Error("Chaque ligne doit avoir un prix unitaire.");
  }
  await prisma.$transaction([
    prisma.ligneChiffrage.deleteMany({ where: { projetId } }),
    prisma.ligneChiffrage.createMany({
      data: lignes.map((l, i) => ({
        projetId,
        lot: l.lot.trim() || "Divers",
        designation: l.designation.trim(),
        detail: l.detail?.trim() || null,
        unite: l.unite?.trim() || null,
        quantite: l.quantite,
        prixUnitaire: l.prixUnitaire,
        ordre: i + 1,
      })),
    }),
  ]);
  revaloriser(projetId);
}

export interface DevisDepuisChiffrageInput {
  entreprise: string;
  intitule: string;
  clientNom: string;
  clientAdresse?: string;
  tauxTVA: number;
}

/** Crée un devis (brouillon) pré-rempli avec les lignes du chiffrage, au nom de l'entreprise choisie. */
export async function creerDevisDepuisChiffrage(projetId: string, data: DevisDepuisChiffrageInput) {
  await exiger();
  const projet = await prisma.projetChiffrage.findUnique({
    where: { id: projetId },
    include: {
      lignes: { orderBy: { ordre: "asc" } },
      chantier: { select: { id: true, entreprise: true, adresse: true } },
    },
  });
  if (!projet) throw new Error("Projet introuvable.");
  // Rattaché à un chantier : le devis suit ce chantier et son entreprise.
  const entrepriseChoisie = projet.chantier?.entreprise ?? data.entreprise;
  if (!(ENTREPRISES as readonly string[]).includes(entrepriseChoisie)) throw new Error("Entreprise inconnue.");
  const entreprise = entrepriseChoisie as Entreprise;
  await requireAcces("DEVIS", entreprise);
  if (projet.lignes.length === 0) throw new Error("Calculez d'abord le chiffrage : il n'a aucune ligne.");
  const sansPrix = projet.lignes.filter((l) => l.prixUnitaire === 0).length;
  if (sansPrix > 0) {
    throw new Error(
      `${sansPrix} ligne${sansPrix > 1 ? "s sont" : " est"} sans prix : complétez les prix (dans le barème ou dans le chiffrage) avant de créer le devis.`
    );
  }
  const intitule = data.intitule.trim();
  if (!intitule) throw new Error("L'intitulé du devis est obligatoire.");
  if (!data.clientNom.trim()) throw new Error("Le nom du client est obligatoire.");
  const adresse = data.clientAdresse?.trim() || projet.adresse?.trim() || projet.chantier?.adresse?.trim();
  if (!adresse && !projet.chantier) throw new Error("L'adresse exacte est obligatoire (adresse du client ou du projet).");
  if (!Number.isFinite(data.tauxTVA) || data.tauxTVA < 0) throw new Error("Le taux de TVA doit être positif ou nul.");

  const annee = new Date().getFullYear();
  try {
    const devis = await prisma.$transaction(async (tx) => {
      const sequenceDejaExistante = await tx.devis.count({
        where: { entreprise, numero: { startsWith: `${prefixeEntreprise(entreprise)}-${annee}-` } },
      });
      return tx.devis.create({
        data: {
          numero: genererNumeroDevis(entreprise, annee, sequenceDejaExistante),
          intitule,
          entreprise,
          chantierId: projet.chantier?.id ?? null,
          clientNom: data.clientNom.trim(),
          clientAdresse: adresse || null,
          dateDevis: new Date(),
          tauxTVA: data.tauxTVA,
          lignes: {
            create: projet.lignes.map((l, i) => ({
              designation: l.designation,
              detail: l.detail,
              unite: l.unite,
              quantite: l.quantite,
              prixUnitaire: l.prixUnitaire,
              ordre: i + 1,
            })),
          },
        },
      });
    });
    revalidatePath("/devis");
    return { id: devis.id, numero: devis.numero };
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      throw new Error("Numéro de devis déjà pris : réessayez dans un instant.");
    }
    throw err;
  }
}

// ---------------------------------------------------------------------------------------------
// Barème
// ---------------------------------------------------------------------------------------------

export interface PosteBaremeInput {
  lot: string;
  designation: string;
  unite: string;
  base: string;
  prixUnitaire: number;
  typesPieces: string[];
  actif: boolean;
}

function validerPoste(data: PosteBaremeInput) {
  if (!data.lot.trim()) throw new Error("Choisissez le lot du poste.");
  if (!data.designation.trim()) throw new Error("La désignation du poste est obligatoire.");
  if (!(UNITES_LIGNE as readonly string[]).includes(data.unite)) throw new Error("Unité inconnue.");
  if (!BASES_CALCUL.some((b) => b.cle === data.base)) throw new Error("Base de calcul inconnue.");
  if (!Number.isFinite(data.prixUnitaire) || data.prixUnitaire < 0) throw new Error("Le prix doit être un nombre positif ou nul.");
  for (const t of data.typesPieces) {
    if (!TYPES_PIECE.some((p) => p.cle === t)) throw new Error("Type de pièce inconnu.");
  }
}

export async function creerPosteBareme(data: PosteBaremeInput) {
  await exiger();
  validerPoste(data);
  const dernier = await prisma.posteBareme.aggregate({ _max: { ordre: true } });
  await prisma.posteBareme.create({
    data: {
      lot: data.lot.trim(),
      designation: data.designation.trim(),
      unite: data.unite,
      base: data.base as BaseCalculChiffrage,
      prixUnitaire: data.prixUnitaire,
      typesPieces: data.typesPieces.join(","),
      actif: data.actif,
      ordre: (dernier._max.ordre ?? 0) + 1,
    },
  });
  revalidatePath("/chiffrage/bareme");
}

export async function modifierPosteBareme(posteId: string, data: PosteBaremeInput) {
  await exiger();
  validerPoste(data);
  await prisma.posteBareme.update({
    where: { id: posteId },
    data: {
      lot: data.lot.trim(),
      designation: data.designation.trim(),
      unite: data.unite,
      base: data.base as BaseCalculChiffrage,
      prixUnitaire: data.prixUnitaire,
      typesPieces: data.typesPieces.join(","),
      actif: data.actif,
    },
  });
  revalidatePath("/chiffrage/bareme");
}

export async function supprimerPosteBareme(posteId: string) {
  await exiger();
  await prisma.posteBareme.delete({ where: { id: posteId } });
  revalidatePath("/chiffrage/bareme");
}

/** Ajoute les postes types (sans prix) qui ne sont pas déjà dans le barème. */
export async function ajouterPostesBaremeTypes() {
  await exiger();
  const existants = await prisma.posteBareme.findMany({ select: { designation: true, ordre: true } });
  const noms = new Set(existants.map((p) => p.designation.trim().toLowerCase()));
  let ordre = existants.reduce((m, p) => Math.max(m, p.ordre), 0);
  const aAjouter = POSTES_BAREME_TYPES.filter((p) => !noms.has(p.designation.toLowerCase()));
  if (aAjouter.length === 0) return { ajoutes: 0 };
  await prisma.posteBareme.createMany({
    data: aAjouter.map((p) => ({ ...p, prixUnitaire: 0, actif: true, ordre: ++ordre })),
  });
  revalidatePath("/chiffrage/bareme");
  return { ajoutes: aAjouter.length };
}

/**
 * Suggestion de prix pour un poste (historique des devis, puis catalogue), à la date du jour,
 * limitée aux prix exprimés dans la même unité que le poste.
 */
export async function suggererPrixPoste(designation: string, unite: string): Promise<SuggestionPrixResult | null> {
  await exiger();
  return chercherSuggestionPrix(designation, new Date().toISOString().slice(0, 10), unite);
}
