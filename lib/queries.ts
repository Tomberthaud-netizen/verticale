import type { AccesOnglet } from "@prisma/client";
import { prisma } from "./prisma";
import { fusionnerDesignations } from "./suggestionPrix";
import type { Entreprise } from "@/constants/entreprises";
import { ACCES_ONGLETS, ACCES_LABELS } from "@/constants/acces";
import { LOTS } from "@/constants/lots";

/** `entreprise` omise = tous les chantiers, toutes entreprises confondues (Calendrier Global uniquement). */
export function getChantiers(entreprise?: Entreprise) {
  return prisma.chantier.findMany({
    where: entreprise ? { entreprise } : undefined,
    include: {
      phases: { orderBy: { ordre: "asc" } },
      datesImportantes: true,
      retards: true,
      alertes: true,
      photos: { select: { id: true, chantierId: true, nomFichier: true, dateAjout: true } },
      devis: { include: { lignes: true } },
      lignesFinancieres: { orderBy: { createdAt: "asc" } },
      paiementsSousTraitant: true,
    },
    orderBy: { dateDebut: "asc" },
  });
}

export function getChantier(id: string) {
  return prisma.chantier.findUnique({
    where: { id },
    include: {
      phases: { orderBy: { ordre: "asc" } },
      datesImportantes: { orderBy: { date: "asc" } },
      retards: { orderBy: { dateAjout: "asc" } },
      alertes: { orderBy: { joursAvantLivraison: "desc" } },
      photos: {
        select: { id: true, chantierId: true, nomFichier: true, dateAjout: true },
        orderBy: { dateAjout: "desc" },
      },
      devis: { include: { lignes: true } },
      lignesFinancieres: { orderBy: { createdAt: "asc" } },
      paiementsSousTraitant: { orderBy: { dateAjout: "asc" } },
      sousTraitant: { select: { id: true, nom: true } },
    },
  });
}

/** Liste légère des chantiers, pour le sélecteur "lier à un chantier" depuis un devis. */
export function getChantiersNoms(entreprise: Entreprise) {
  return prisma.chantier.findMany({ where: { entreprise }, select: { id: true, nom: true }, orderBy: { nom: "asc" } });
}

export interface FiltreDevis {
  intitule?: string;
  clientNom?: string;
}

export function getDevisListe(entreprise: Entreprise, filtres: FiltreDevis = {}) {
  return prisma.devis.findMany({
    where: {
      entreprise,
      ...(filtres.intitule ? { intitule: { contains: filtres.intitule } } : {}),
      ...(filtres.clientNom ? { clientNom: { contains: filtres.clientNom } } : {}),
    },
    include: {
      lignes: true,
      chantier: { select: { id: true, nom: true } },
      responsable: { select: { id: true, nom: true, prenom: true } },
    },
    orderBy: { dateDevis: "desc" },
  });
}

/** Devis validés, pour l'onglet Finance › En cours (marquage encaissé → CA). */
export function getDevisValides(entreprise: Entreprise) {
  return prisma.devis.findMany({
    where: { entreprise, valide: true },
    include: { lignes: true, chantier: { select: { id: true, nom: true } } },
    orderBy: { dateValidation: "desc" },
  });
}

/** Devis non liés à un chantier, pour les faire apparaître sur la Vue d'ensemble. */
export function getDevisSansChantier(entreprise: Entreprise) {
  return prisma.devis.findMany({
    where: { chantierId: null, entreprise },
    include: {
      lignes: true,
      chantier: { select: { id: true, nom: true } },
      responsable: { select: { id: true, nom: true, prenom: true } },
    },
    orderBy: { dateDevis: "desc" },
  });
}

/**
 * Devis validés, non liés à un chantier, avec un planning prévisionnel renseigné (date de
 * début + durée) — pour les faire apparaître sur le Calendrier Global. Toutes entreprises
 * confondues (le Calendrier Global reste commun aux deux sociétés).
 */
export function getDevisPlanifiesSansChantier() {
  return prisma.devis.findMany({
    where: {
      valide: true,
      chantierId: null,
      dateDebutPrevisionnelle: { not: null },
      dureeJoursOuvres: { not: null },
    },
    select: {
      id: true,
      numero: true,
      intitule: true,
      entreprise: true,
      dateDebutPrevisionnelle: true,
      dureeJoursOuvres: true,
    },
  });
}

export function getDevis(id: string) {
  return prisma.devis.findUnique({
    where: { id },
    include: {
      lignes: { orderBy: { ordre: "asc" } },
      chantier: { select: { id: true, nom: true, adresse: true } },
      responsable: { select: { id: true, nom: true, prenom: true, telephone: true } },
      evenements: { orderBy: { date: "desc" } },
    },
  });
}

/** Personnes disponibles comme responsable d'une affaire (nom + prénom uniquement). */
export function getPersonnesNoms() {
  return prisma.personne.findMany({
    select: { id: true, nom: true, prenom: true },
    orderBy: [{ nom: "asc" }, { prenom: "asc" }],
  });
}

/**
 * Désignations proposées à la saisie : le catalogue de types de travaux courants, complété
 * par celles déjà utilisées dans de vrais devis (pour les intitulés personnalisés).
 */
export async function getDesignationsExistantes(): Promise<string[]> {
  const [catalogue, lignes] = await Promise.all([
    prisma.typeDeTravaux.findMany({ select: { designation: true }, orderBy: { designation: "asc" } }),
    prisma.ligneDevis.findMany({ select: { designation: true }, distinct: ["designation"] }),
  ]);
  return fusionnerDesignations(
    catalogue.map((c) => c.designation),
    lignes.map((l) => l.designation)
  );
}

/** Historique de toutes les lignes de devis, pour la suggestion de prix par désignation. */
export async function getLignesHistorique() {
  const lignes = await prisma.ligneDevis.findMany({
    select: {
      designation: true,
      prixUnitaire: true,
      devis: { select: { dateDevis: true, numero: true, intitule: true } },
    },
  });
  return lignes.map((l) => ({
    designation: l.designation,
    prixUnitaire: l.prixUnitaire,
    dateDevis: l.devis.dateDevis,
    devisNumero: l.devis.numero,
    devisIntitule: l.devis.intitule,
  }));
}

export function getIndicesBT() {
  return prisma.indiceBT.findMany({ orderBy: { periode: "desc" } });
}

export function getPersonnes() {
  return prisma.personne.findMany({
    include: { acces: true },
    orderBy: [{ nom: "asc" }, { prenom: "asc" }],
  });
}

export function getPersonne(id: string) {
  return prisma.personne.findUnique({ where: { id }, include: { acces: true, accesSousOnglets: true } });
}

export interface FiltreFournisseur {
  nom?: string;
  type?: string;
}

export function getFournisseurs(entreprise: Entreprise, filtres: FiltreFournisseur = {}) {
  return prisma.fournisseur.findMany({
    where: {
      entreprise,
      ...(filtres.nom ? { nom: { contains: filtres.nom } } : {}),
      ...(filtres.type ? { typesProduit: { some: { type: { contains: filtres.type } } } } : {}),
    },
    include: { typesProduit: true },
    orderBy: { nom: "asc" },
  });
}

export function getFournisseur(id: string) {
  return prisma.fournisseur.findUnique({
    where: { id },
    include: {
      typesProduit: true,
      produits: {
        include: { prixReference: { select: { prixUnitaire: true } } },
        orderBy: { designation: "asc" },
      },
    },
  });
}

/**
 * Types de produit proposés à la saisie pour un fournisseur : la liste de corps de métier
 * courants, complétée par ceux déjà utilisés sur d'autres fournisseurs (pour les types
 * personnalisés tapés à la main).
 */
export async function getTypesProduitExistants(): Promise<string[]> {
  const rows = await prisma.fournisseurType.findMany({ select: { type: true }, distinct: ["type"] });
  return fusionnerDesignations([...LOTS], rows.map((r) => r.type));
}

/** Noms des fournisseurs existants, pour l'autocomplétion de la barre de recherche. */
export async function getFournisseurNoms(entreprise: Entreprise): Promise<string[]> {
  const rows = await prisma.fournisseur.findMany({
    where: { entreprise },
    select: { nom: true },
    orderBy: { nom: "asc" },
  });
  return rows.map((r) => r.nom);
}

export interface FiltreSousTraitant {
  nom?: string;
  contact?: string;
  type?: string;
}

export function getSousTraitants(entreprise: Entreprise, filtres: FiltreSousTraitant = {}) {
  return prisma.sousTraitant.findMany({
    where: {
      entreprise,
      ...(filtres.nom ? { nom: { contains: filtres.nom } } : {}),
      ...(filtres.contact
        ? { OR: [{ contactNom: { contains: filtres.contact } }, { contactPrenom: { contains: filtres.contact } }] }
        : {}),
      ...(filtres.type ? { typesTravaux: { some: { type: { contains: filtres.type } } } } : {}),
    },
    include: {
      typesTravaux: true,
      chantiers: { select: { id: true, nom: true, dateDebut: true }, orderBy: { dateDebut: "desc" }, take: 1 },
    },
    orderBy: { nom: "asc" },
  });
}

/**
 * Types de travaux proposés à la saisie pour un sous-traitant : la liste de corps de métier
 * courants, complétée par ceux déjà utilisés sur d'autres sous-traitants.
 */
export async function getTypesTravauxExistants(): Promise<string[]> {
  const rows = await prisma.sousTraitantType.findMany({ select: { type: true }, distinct: ["type"] });
  return fusionnerDesignations([...LOTS], rows.map((r) => r.type));
}

/** Noms d'entreprise et noms de contact des sous-traitants existants, pour l'autocomplétion de la recherche. */
export async function getSousTraitantSuggestions(
  entreprise: Entreprise
): Promise<{ noms: string[]; contacts: string[] }> {
  const rows = await prisma.sousTraitant.findMany({
    where: { entreprise },
    select: { nom: true, contactNom: true, contactPrenom: true },
    orderBy: { nom: "asc" },
  });
  const noms = rows.map((r) => r.nom);
  const contacts = Array.from(
    new Set(rows.map((r) => [r.contactPrenom, r.contactNom].filter(Boolean).join(" ")).filter((c) => c.length > 0))
  );
  return { noms, contacts };
}

export function getSousTraitant(id: string) {
  return prisma.sousTraitant.findUnique({
    where: { id },
    include: {
      typesTravaux: true,
      chantiers: { select: { id: true, nom: true, dateDebut: true }, orderBy: { dateDebut: "desc" } },
    },
  });
}

/** Liste légère des sous-traitants, pour le sélecteur d'affectation depuis un chantier. */
export function getSousTraitantsNoms(entreprise: Entreprise) {
  return prisma.sousTraitant.findMany({
    where: { entreprise },
    select: { id: true, nom: true },
    orderBy: { nom: "asc" },
  });
}

/** Prix de référence du catalogue pour un type de produit, pour donner une idée des prix pratiqués. */
export function getPrixReferenceParLot(lot: string) {
  return prisma.prixReference.findMany({
    where: { lot },
    orderBy: [{ designation: "asc" }],
    take: 100,
  });
}

export function getPrixReference(id: string) {
  return prisma.prixReference.findUnique({ where: { id } });
}

const TAILLE_PAGE_CATALOGUE = 50;

export interface FiltreCatalogue {
  recherche?: string;
  lot?: string;
  page?: number;
  horsBtp?: boolean;
}

/** Catalogue de prix extraits des PDF, paginé et filtrable par désignation/lot. */
export async function getCataloguePrix({ recherche, lot, page = 1, horsBtp }: FiltreCatalogue) {
  const where = {
    ...(lot ? { lot } : {}),
    ...(recherche ? { designation: { contains: recherche } } : {}),
    ...(horsBtp ? { horsBtp: true } : {}),
  };
  const [items, total] = await Promise.all([
    prisma.prixReference.findMany({
      where,
      orderBy: [{ designation: "asc" }],
      skip: (page - 1) * TAILLE_PAGE_CATALOGUE,
      take: TAILLE_PAGE_CATALOGUE,
    }),
    prisma.prixReference.count({ where }),
  ]);
  return { items, total, page, taillePage: TAILLE_PAGE_CATALOGUE };
}

/** Nombre de lignes du catalogue signalées comme sans rapport avec un poste de travaux BTP. */
export function getNombreHorsBtp() {
  return prisma.prixReference.count({ where: { horsBtp: true } });
}

/** Toutes les lignes du catalogue extrait des PDF, sans pagination — pour l'export Excel. */
export function getToutLeCataloguePrix() {
  return prisma.prixReference.findMany({ orderBy: [{ lot: "asc" }, { designation: "asc" }] });
}

/** Durées moyennes (jours ouvrés / m²) par type de travaux, pour la suggestion de durée de phase. */
export function getDureesTypesTravaux() {
  return prisma.dureeTypeTravaux.findMany({ orderBy: { type: "asc" } });
}

/** Catalogue des modèles de rénovation (Administration › Modèles de rénovation). */
export function getModelesRenovation() {
  return prisma.modeleRenovation.findMany({ orderBy: { nom: "asc" } });
}

/** Un modèle de rénovation par son nom exact (insensible à la casse), pour la suggestion Finances. */
export function getModeleRenovationParNom(nom: string) {
  return prisma.modeleRenovation.findFirst({ where: { nom: { equals: nom.trim() } } });
}

export async function getLotsDuCatalogue(): Promise<string[]> {
  const rows = await prisma.prixReference.findMany({ select: { lot: true }, distinct: ["lot"] });
  return rows.map((r) => r.lot).filter((l): l is string => Boolean(l)).sort();
}

const TAILLE_PAGE_PRIX_REELS = 15;

async function toutesLesLignesDevisReelles() {
  const lignes = await prisma.ligneDevis.findMany({
    select: {
      id: true,
      designation: true,
      unite: true,
      prixUnitaire: true,
      devis: { select: { id: true, numero: true, dateDevis: true, valide: true } },
    },
    orderBy: { devis: { dateDevis: "desc" } },
  });
  const vues = new Set<string>();
  const resultat: typeof lignes = [];
  for (const ligne of lignes) {
    const cle = ligne.designation.trim().toLowerCase();
    if (vues.has(cle)) continue;
    vues.add(cle);
    resultat.push(ligne);
  }
  return resultat;
}

/** Prix unitaires issus des devis réels créés dans l'app (distincts par désignation, le plus récent), paginés. */
export async function getPrixDevisReels(page = 1) {
  const toutes = await toutesLesLignesDevisReelles();
  const total = toutes.length;
  const items = toutes.slice((page - 1) * TAILLE_PAGE_PRIX_REELS, page * TAILLE_PAGE_PRIX_REELS);
  return { items, total, page, taillePage: TAILLE_PAGE_PRIX_REELS };
}

/** Toutes les lignes réelles, sans pagination — pour l'export Excel. */
export function getToutesLesLignesDevisReelles() {
  return toutesLesLignesDevisReelles();
}

export function getFactures(entreprise: Entreprise) {
  return prisma.facture.findMany({
    where: { entreprise },
    include: {
      chantier: { select: { id: true, nom: true } },
      devis: { select: { id: true, intitule: true } },
      paiements: { orderBy: { datePaiement: "asc" } },
    },
    orderBy: { dateFacture: "desc" },
  });
}

export function getFacture(id: string) {
  return prisma.facture.findUnique({
    where: { id },
    include: {
      chantier: { select: { id: true, nom: true } },
      devis: { select: { id: true, intitule: true } },
      paiements: { orderBy: { datePaiement: "desc" } },
    },
  });
}

/** Chantiers gagnés/en cours pour rattacher une facture (nom + prixRevente indicatif). */
export function getChantiersPourFacture(entreprise: Entreprise) {
  return prisma.chantier.findMany({ where: { entreprise }, select: { id: true, nom: true }, orderBy: { nom: "asc" } });
}

/** Devis avec leurs factures liées, pour les écarts de chiffrage et le carnet de commande. */
export function getDevisAvecFactures(entreprise: Entreprise) {
  return prisma.devis.findMany({
    where: { entreprise },
    include: {
      lignes: true,
      chantier: { select: { id: true, nom: true } },
      factures: { where: { statut: { not: "ANNULEE" } } },
    },
    orderBy: { dateDevis: "desc" },
  });
}

/** Devis pour rattacher une facture (numéro + intitulé + total). */
export function getDevisPourFacture(entreprise: Entreprise) {
  return prisma.devis.findMany({
    where: { entreprise },
    select: { id: true, numero: true, intitule: true, clientNom: true, clientAdresse: true, entreprise: true },
    orderBy: { dateDevis: "desc" },
  });
}

// ---------------------------------------------------------------------------------------------
// Administration : informations société, connexions, réglages du site.
// ---------------------------------------------------------------------------------------------

/** Coordonnées légales + logo de chaque entreprise (VERTICALE, CB2B). Une ligne par entreprise. */
export function getEntreprisesInfo() {
  return prisma.entreprise.findMany({ orderBy: { code: "asc" } });
}

export function getEntrepriseInfo(code: Entreprise) {
  return prisma.entreprise.findUnique({ where: { code } });
}

/** Connexions encore actives (non déconnectées et pas encore expirées), les plus récentes d'abord. */
export function getConnexionsActives() {
  const seuilExpiration = new Date(Date.now() - 7 * 24 * 3600 * 1000);
  return prisma.connexion.findMany({
    where: { deconnecteLe: null, connecteLe: { gte: seuilExpiration } },
    include: { personne: { select: { id: true, nom: true, prenom: true, email: true } } },
    orderBy: { connecteLe: "desc" },
  });
}

/** Historique des connexions (toutes, y compris terminées/expirées), les plus récentes d'abord. */
export function getHistoriqueConnexions(limite = 50) {
  return prisma.connexion.findMany({
    include: { personne: { select: { id: true, nom: true, prenom: true, email: true } } },
    orderBy: { connecteLe: "desc" },
    take: limite,
  });
}

/** Modèle d'e-mail pour l'envoi d'un devis validé (Administration › Email). */
export async function getParametresEmail() {
  const parametres = await prisma.parametresEmail.findUnique({ where: { id: "singleton" } });
  return (
    parametres ?? {
      id: "singleton",
      objet: "Votre devis {numero} — {entreprise}",
      corps:
        "Bonjour {clientNom},\n\nVeuillez trouver ci-joint votre devis {numero} concernant « {intitule} ».\n\nCordialement,",
      updatedAt: new Date(),
    }
  );
}

export async function getCouleurPrincipale(): Promise<string> {
  const parametres = await prisma.parametresSite.findUnique({ where: { id: "singleton" } });
  return parametres?.couleurPrincipale ?? "#1c1917";
}

/**
 * Libellé affiché et ordre d'affichage pour chaque onglet du menu, en fusionnant les
 * personnalisations éventuelles (Administration › Réglages) avec les valeurs par défaut
 * (constants/acces.ts). Un onglet jamais personnalisé garde son libellé et sa position d'origine.
 */
export async function getLibellesEtOrdresOnglets(): Promise<{
  libelles: Record<AccesOnglet, string>;
  ordres: Record<AccesOnglet, number>;
}> {
  const parametres = await prisma.parametreOnglet.findMany();
  const parParOnglet = new Map(parametres.map((p) => [p.onglet, p]));

  const libelles = { ...ACCES_LABELS };
  const ordres = {} as Record<AccesOnglet, number>;
  ACCES_ONGLETS.forEach((onglet, index) => {
    const param = parParOnglet.get(onglet);
    libelles[onglet] = param?.libellePersonnalise?.trim() || ACCES_LABELS[onglet];
    ordres[onglet] = param?.ordre ?? index;
  });

  return { libelles, ordres };
}
