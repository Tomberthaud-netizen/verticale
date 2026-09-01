"use server";

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import type { EvenementType } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { SEUILS_ALERTE_DEFAUT, type PhaseType } from "@/lib/dates";
import type { Entreprise } from "@/constants/entreprises";
import { calculerTotalHT, genererNumeroDevis, prefixeEntreprise } from "@/lib/devis";
import { actualiserPrix, trouverIndicePourDate } from "@/lib/indiceBT";
import { trouverMeilleureLigne, trouverMeilleureReference } from "@/lib/suggestionPrix";
import { genererPdfDevisBuffer } from "@/lib/pdfDevis";
import { determinerCheminBureau, determinerDossierEntreprise, determinerSousDossierDevis, nettoyerNomDossier } from "@/lib/exportDevis";
import { requireAcces } from "@/lib/authContext";
import { getEntrepriseActive } from "@/lib/entrepriseActive";
import { envoyerEmail } from "@/lib/mail";
import { remplacerPlaceholders } from "@/lib/emailTemplate";
import { geocoderAdresse } from "@/lib/geocodage";

/** Entreprise propriétaire d'un chantier — pour vérifier l'accès à une ressource précise. */
async function entrepriseDuChantier(chantierId: string): Promise<Entreprise> {
  const chantier = await prisma.chantier.findUnique({ where: { id: chantierId }, select: { entreprise: true } });
  if (!chantier) throw new Error("Chantier introuvable.");
  return chantier.entreprise as Entreprise;
}

/** Entreprise propriétaire d'un devis — pour vérifier l'accès à une ressource précise. */
async function entrepriseDuDevis(devisId: string): Promise<Entreprise> {
  const devis = await prisma.devis.findUnique({ where: { id: devisId }, select: { entreprise: true } });
  if (!devis) throw new Error("Devis introuvable.");
  return devis.entreprise as Entreprise;
}

export interface CreateChantierPhaseInput {
  type: PhaseType;
  nom?: string;
  nombreJoursOuvres: number;
}

export interface CreateChantierInput {
  nom: string;
  dateDebut: string;
  equipe: string;
  adresse: string;
  surfaceM2: number;
  sousTraitantId?: string | null;
  phases: CreateChantierPhaseInput[];
}

export async function createChantier(data: CreateChantierInput) {
  const entreprise = await getEntrepriseActive();
  await requireAcces("VUE_ENSEMBLE", entreprise);
  const nom = data.nom.trim();
  const equipe = data.equipe.trim();
  const adresse = data.adresse.trim();
  if (!nom || !equipe || !adresse || !data.dateDebut || data.phases.length === 0) {
    throw new Error("Nom, équipe, adresse exacte, date de démarrage et au moins une phase sont obligatoires.");
  }
  if (!data.surfaceM2 || data.surfaceM2 <= 0) {
    throw new Error("La surface (m²) doit être un nombre positif.");
  }
  if (data.sousTraitantId) {
    const sousTraitant = await prisma.sousTraitant.findUnique({
      where: { id: data.sousTraitantId },
      select: { entreprise: true },
    });
    if (!sousTraitant || sousTraitant.entreprise !== entreprise) {
      throw new Error("Ce sous-traitant n'appartient pas à cette entreprise.");
    }
  }
  for (const phase of data.phases) {
    if (!phase.nombreJoursOuvres || phase.nombreJoursOuvres <= 0) {
      throw new Error("Chaque phase doit avoir un nombre de jours ouvrés positif.");
    }
    if (phase.type === "PERSONNALISEE" && !phase.nom?.trim()) {
      throw new Error("Une phase personnalisée doit avoir un nom.");
    }
  }

  const coordonnees = await geocoderAdresse(adresse);

  const chantier = await prisma.chantier.create({
    data: {
      nom,
      equipe,
      adresse,
      latitude: coordonnees?.latitude,
      longitude: coordonnees?.longitude,
      surfaceM2: data.surfaceM2,
      entreprise,
      dateDebut: new Date(data.dateDebut),
      sousTraitantId: data.sousTraitantId || null,
      phases: {
        create: data.phases.map((p, i) => ({
          type: p.type,
          nom: p.type === "PERSONNALISEE" ? p.nom?.trim() : null,
          nombreJoursOuvres: p.nombreJoursOuvres,
          ordre: i + 1,
        })),
      },
      alertes: {
        create: SEUILS_ALERTE_DEFAUT.map((joursAvantLivraison) => ({ joursAvantLivraison })),
      },
    },
  });

  revalidatePath("/");
  revalidatePath("/calendrier");
  return { id: chantier.id };
}

export interface AdresseChantierInput {
  adresse: string;
  etage?: string;
  porte?: string;
  codes?: string;
  emplacementCles?: string;
}

export async function modifierAdresseChantier(chantierId: string, data: AdresseChantierInput) {
  await requireAcces("VUE_ENSEMBLE", await entrepriseDuChantier(chantierId));
  const adresseNettoyee = data.adresse.trim();
  if (!adresseNettoyee) throw new Error("L'adresse exacte est obligatoire.");
  const coordonnees = await geocoderAdresse(adresseNettoyee);
  await prisma.chantier.update({
    where: { id: chantierId },
    data: {
      adresse: adresseNettoyee,
      latitude: coordonnees?.latitude,
      longitude: coordonnees?.longitude,
      etage: data.etage?.trim() || null,
      porte: data.porte?.trim() || null,
      codes: data.codes?.trim() || null,
      emplacementCles: data.emplacementCles?.trim() || null,
    },
  });
  revalidatePath(`/chantiers/${chantierId}`);
  revalidatePath("/calendrier");
}

export async function affecterSousTraitant(chantierId: string, sousTraitantId: string | null) {
  const entreprise = await entrepriseDuChantier(chantierId);
  await requireAcces("VUE_ENSEMBLE", entreprise);
  if (sousTraitantId) {
    const sousTraitant = await prisma.sousTraitant.findUnique({
      where: { id: sousTraitantId },
      select: { entreprise: true },
    });
    if (!sousTraitant || sousTraitant.entreprise !== entreprise) {
      throw new Error("Ce sous-traitant n'appartient pas à cette entreprise.");
    }
  }
  await prisma.chantier.update({ where: { id: chantierId }, data: { sousTraitantId } });
  revalidatePath(`/chantiers/${chantierId}`);
}

export async function supprimerChantier(chantierId: string) {
  await requireAcces("VUE_ENSEMBLE", await entrepriseDuChantier(chantierId));
  await prisma.chantier.delete({ where: { id: chantierId } });
  revalidatePath("/");
  revalidatePath("/calendrier");
}

export interface ModifierFinancesInput {
  prixAchat: number | null;
  prixRevente: number | null;
}

export async function modifierFinances(chantierId: string, data: ModifierFinancesInput) {
  await requireAcces("VUE_ENSEMBLE", await entrepriseDuChantier(chantierId));
  for (const [cle, valeur] of Object.entries(data)) {
    if (valeur != null && (Number.isNaN(valeur) || valeur < 0)) {
      throw new Error(`Le champ "${cle}" doit être un nombre positif.`);
    }
  }
  await prisma.chantier.update({
    where: { id: chantierId },
    data: {
      prixAchat: data.prixAchat,
      prixRevente: data.prixRevente,
    },
  });
  revalidatePath(`/chantiers/${chantierId}`);
  revalidatePath("/");
}

export interface AddDateImportanteInput {
  nom: string;
  date: string;
  type: EvenementType;
  typePersonnalise?: string;
}

export async function addDateImportante(chantierId: string, data: AddDateImportanteInput) {
  await requireAcces("VUE_ENSEMBLE", await entrepriseDuChantier(chantierId));
  const nom = data.nom.trim();
  if (!nom || !data.date) {
    throw new Error("Nom et date sont obligatoires.");
  }
  if (data.type === "AUTRE" && !data.typePersonnalise?.trim()) {
    throw new Error("Précisez le type d'événement personnalisé.");
  }
  await prisma.dateImportante.create({
    data: {
      chantierId,
      nom,
      date: new Date(data.date),
      type: data.type,
      typePersonnalise: data.type === "AUTRE" ? data.typePersonnalise?.trim() : null,
    },
  });
  revalidatePath(`/chantiers/${chantierId}`);
  revalidatePath("/");
}

export interface AddRetardInput {
  nombreJours: number;
  dateAjout: string;
  commentaire?: string;
}

export async function addRetard(chantierId: string, data: AddRetardInput) {
  await requireAcces("VUE_ENSEMBLE", await entrepriseDuChantier(chantierId));
  if (!data.nombreJours || data.nombreJours <= 0 || !data.dateAjout) {
    throw new Error("Le nombre de jours et la date d'ajout sont obligatoires.");
  }
  await prisma.retard.create({
    data: {
      chantierId,
      nombreJours: data.nombreJours,
      dateAjout: new Date(data.dateAjout),
      commentaire: data.commentaire?.trim() || null,
    },
  });
  revalidatePath(`/chantiers/${chantierId}`);
  revalidatePath("/");
  revalidatePath("/calendrier");
}

export interface AddAlerteInput {
  joursAvantLivraison: number;
}

export async function addAlerte(chantierId: string, data: AddAlerteInput) {
  await requireAcces("VUE_ENSEMBLE", await entrepriseDuChantier(chantierId));
  if (!data.joursAvantLivraison || data.joursAvantLivraison <= 0) {
    throw new Error("Le délai de l'alerte doit être un nombre de jours positif.");
  }
  await prisma.alerte.create({
    data: { chantierId, joursAvantLivraison: data.joursAvantLivraison },
  });
  revalidatePath(`/chantiers/${chantierId}`);
  revalidatePath("/");
}

export async function supprimerAlerte(chantierId: string, alerteId: string) {
  await requireAcces("VUE_ENSEMBLE", await entrepriseDuChantier(chantierId));
  await prisma.alerte.delete({ where: { id: alerteId } });
  revalidatePath(`/chantiers/${chantierId}`);
  revalidatePath("/");
}

const TYPES_MIME_AUTORISES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

export async function ajouterPhoto(chantierId: string, formData: FormData) {
  await requireAcces("VUE_ENSEMBLE", await entrepriseDuChantier(chantierId));
  const fichiers = formData.getAll("photo").filter((f): f is File => f instanceof File && f.size > 0);
  if (fichiers.length === 0) {
    throw new Error("Sélectionnez au moins une photo à ajouter.");
  }
  for (const fichier of fichiers) {
    if (!TYPES_MIME_AUTORISES.has(fichier.type)) {
      throw new Error("Format d'image non pris en charge (JPEG, PNG, WEBP ou GIF).");
    }
  }

  await prisma.photo.createMany({
    data: await Promise.all(
      fichiers.map(async (fichier) => ({
        chantierId,
        nomFichier: fichier.name,
        typeMime: fichier.type,
        donnees: Buffer.from(await fichier.arrayBuffer()),
      }))
    ),
  });

  revalidatePath(`/chantiers/${chantierId}`);
}

export async function supprimerPhoto(chantierId: string, photoId: string) {
  await requireAcces("VUE_ENSEMBLE", await entrepriseDuChantier(chantierId));
  await prisma.photo.deleteMany({ where: { id: photoId, chantierId } });
  revalidatePath(`/chantiers/${chantierId}`);
}

export interface LigneDevisInput {
  designation: string;
  unite?: string;
  quantite: number;
  prixUnitaire: number;
}

export interface CreateDevisInput {
  intitule: string;
  chantierId?: string | null;
  responsableId?: string | null;
  clientNom?: string;
  clientAdresse?: string;
  clientEmail?: string;
  dateDevis: string;
  validiteJours?: number | null;
  tauxTVA: number;
  remiseHT?: number;
  notes?: string;
  lignes: LigneDevisInput[];
}

function validerDevisInput(data: CreateDevisInput) {
  if (!data.intitule.trim()) {
    throw new Error("L'intitulé du devis est obligatoire.");
  }
  if (!data.dateDevis) {
    throw new Error("La date du devis est obligatoire.");
  }
  if (data.tauxTVA == null || data.tauxTVA < 0) {
    throw new Error("Le taux de TVA doit être positif ou nul.");
  }
  if (data.validiteJours != null && data.validiteJours <= 0) {
    throw new Error("La durée de validité doit être positive.");
  }
  if (data.lignes.length === 0) {
    throw new Error("Ajoutez au moins une ligne de travaux.");
  }
  if (data.remiseHT != null && data.remiseHT < 0) {
    throw new Error("La remise commerciale doit être positive ou nulle.");
  }
  if (data.remiseHT != null && data.remiseHT > calculerTotalHT(data.lignes)) {
    throw new Error("La remise commerciale ne peut pas dépasser le total HT des lignes.");
  }
  if (!data.chantierId && !data.clientAdresse?.trim()) {
    throw new Error("L'adresse exacte est obligatoire pour un devis non lié à un chantier.");
  }
  for (const ligne of data.lignes) {
    if (!ligne.designation.trim()) {
      throw new Error("Chaque ligne doit avoir une désignation.");
    }
    if (!ligne.quantite || ligne.quantite <= 0) {
      throw new Error("Chaque ligne doit avoir une quantité positive.");
    }
    if (ligne.prixUnitaire == null || ligne.prixUnitaire < 0) {
      throw new Error("Chaque ligne doit avoir un prix unitaire positif ou nul.");
    }
  }
}

export async function createDevis(data: CreateDevisInput) {
  const entreprise = await getEntrepriseActive();
  await requireAcces("DEVIS", entreprise);
  validerDevisInput(data);
  if (data.chantierId && (await entrepriseDuChantier(data.chantierId)) !== entreprise) {
    throw new Error("Ce chantier n'appartient pas à cette entreprise.");
  }
  const annee = new Date(data.dateDevis).getFullYear();

  const devis = await prisma.$transaction(async (tx) => {
    const sequenceDejaExistante = await tx.devis.count({
      where: {
        entreprise,
        numero: { startsWith: `${prefixeEntreprise(entreprise)}-${annee}-` },
      },
    });
    const numero = genererNumeroDevis(entreprise, annee, sequenceDejaExistante);
    return tx.devis.create({
      data: {
        numero,
        intitule: data.intitule.trim(),
        entreprise,
        chantierId: data.chantierId || null,
        responsableId: data.responsableId || null,
        clientNom: data.clientNom?.trim() || null,
        clientAdresse: data.clientAdresse?.trim() || null,
        clientEmail: data.clientEmail?.trim() || null,
        dateDevis: new Date(data.dateDevis),
        validiteJours: data.validiteJours ?? null,
        tauxTVA: data.tauxTVA,
        remiseHT: data.remiseHT ?? 0,
        notes: data.notes?.trim() || null,
        lignes: {
          create: data.lignes.map((l, i) => ({
            designation: l.designation.trim(),
            unite: l.unite?.trim() || null,
            quantite: l.quantite,
            prixUnitaire: l.prixUnitaire,
            ordre: i + 1,
          })),
        },
      },
    });
  });

  revalidatePath("/devis");
  if (data.chantierId) revalidatePath(`/chantiers/${data.chantierId}`);
  return { id: devis.id };
}

export async function modifierDevis(devisId: string, data: CreateDevisInput) {
  const existant = await prisma.devis.findUnique({ where: { id: devisId } });
  if (!existant) throw new Error("Devis introuvable.");
  const entreprise = existant.entreprise as Entreprise;
  await requireAcces("DEVIS", entreprise);
  validerDevisInput(data);
  if (existant.valide) {
    throw new Error("Ce devis est validé et figé : il ne peut plus être modifié. Utilisez Création de TS ou Réédition.");
  }
  if (data.chantierId && (await entrepriseDuChantier(data.chantierId)) !== entreprise) {
    throw new Error("Ce chantier n'appartient pas à cette entreprise.");
  }

  await prisma.$transaction(async (tx) => {
    await tx.ligneDevis.deleteMany({ where: { devisId } });
    await tx.devis.update({
      where: { id: devisId },
      data: {
        intitule: data.intitule.trim(),
        chantierId: data.chantierId || null,
        responsableId: data.responsableId || null,
        clientNom: data.clientNom?.trim() || null,
        clientAdresse: data.clientAdresse?.trim() || null,
        clientEmail: data.clientEmail?.trim() || null,
        dateDevis: new Date(data.dateDevis),
        validiteJours: data.validiteJours ?? null,
        tauxTVA: data.tauxTVA,
        remiseHT: data.remiseHT ?? 0,
        notes: data.notes?.trim() || null,
        lignes: {
          create: data.lignes.map((l, i) => ({
            designation: l.designation.trim(),
            unite: l.unite?.trim() || null,
            quantite: l.quantite,
            prixUnitaire: l.prixUnitaire,
            ordre: i + 1,
          })),
        },
      },
    });
  });

  revalidatePath("/devis");
  revalidatePath(`/devis/${devisId}`);
  if (existant.chantierId) revalidatePath(`/chantiers/${existant.chantierId}`);
  if (data.chantierId) revalidatePath(`/chantiers/${data.chantierId}`);
}

export async function supprimerDevis(devisId: string) {
  const existant = await prisma.devis.findUnique({
    where: { id: devisId },
    select: { valide: true, chantierId: true, entreprise: true },
  });
  if (!existant) throw new Error("Devis introuvable.");
  await requireAcces("DEVIS", existant.entreprise as Entreprise);
  if (existant.valide) {
    throw new Error("Ce devis est validé et figé : il ne peut plus être supprimé.");
  }
  const devis = await prisma.devis.delete({ where: { id: devisId } });
  revalidatePath("/devis");
  if (devis.chantierId) revalidatePath(`/chantiers/${devis.chantierId}`);
}

/**
 * Fige le devis (son contenu ne pourra plus être modifié) et exporte son PDF sur le Bureau,
 * dans "Devis <entreprise>/<chantier ou adresse+nom du client>/<numéro>.pdf".
 */
export async function validerDevis(devisId: string) {
  const devis = await prisma.devis.findUnique({
    where: { id: devisId },
    include: {
      lignes: { orderBy: { ordre: "asc" } },
      chantier: { select: { nom: true } },
      responsable: { select: { nom: true, prenom: true, telephone: true } },
    },
  });
  if (!devis) throw new Error("Devis introuvable.");
  await requireAcces("DEVIS", devis.entreprise as Entreprise);
  if (devis.valide) throw new Error("Ce devis est déjà validé.");

  const buffer = await genererPdfDevisBuffer(devis);

  const bureau = await determinerCheminBureau();
  const dossierCible = path.join(
    bureau,
    determinerDossierEntreprise(devis.entreprise),
    determinerSousDossierDevis({
      chantierNom: devis.chantier?.nom ?? null,
      clientNom: devis.clientNom,
      clientAdresse: devis.clientAdresse,
    })
  );
  await mkdir(dossierCible, { recursive: true });
  await writeFile(path.join(dossierCible, `${nettoyerNomDossier(devis.numero)}.pdf`), buffer);

  await prisma.devis.update({ where: { id: devisId }, data: { valide: true, dateValidation: new Date() } });

  revalidatePath(`/devis/${devisId}`);
  revalidatePath("/devis");
  revalidatePath("/finance");
}

/** Envoie le devis validé par e-mail au client, PDF en pièce jointe, et journalise l'envoi dans la chronologie. */
export async function envoyerDevisParEmail(devisId: string) {
  const devis = await prisma.devis.findUnique({
    where: { id: devisId },
    include: {
      lignes: { orderBy: { ordre: "asc" } },
      chantier: { select: { nom: true } },
      responsable: { select: { nom: true, prenom: true, telephone: true } },
    },
  });
  if (!devis) throw new Error("Devis introuvable.");
  await requireAcces("DEVIS", devis.entreprise as Entreprise);
  if (!devis.clientEmail) throw new Error("Renseignez l'e-mail du client dans la fiche devis pour activer l'envoi.");

  const parametresEmail = await prisma.parametresEmail.findUnique({ where: { id: "singleton" } });
  const valeurs = {
    numero: devis.numero,
    intitule: devis.intitule,
    entreprise: devis.entreprise,
    clientNom: devis.clientNom || "Madame, Monsieur",
  };
  const objet = remplacerPlaceholders(
    parametresEmail?.objet ?? "Votre devis {numero} — {entreprise}",
    valeurs
  );
  const corps = remplacerPlaceholders(
    parametresEmail?.corps ??
      "Bonjour {clientNom},\n\nVeuillez trouver ci-joint votre devis {numero} concernant « {intitule} ».\n\nCordialement,",
    valeurs
  );

  const buffer = await genererPdfDevisBuffer(devis);
  await envoyerEmail({
    to: devis.clientEmail,
    subject: objet,
    text: corps,
    attachments: [{ filename: `${devis.numero}.pdf`, content: buffer, contentType: "application/pdf" }],
  });

  await prisma.evenementDevis.create({
    data: { devisId, type: "EMAIL", contenu: `Devis envoyé par e-mail à ${devis.clientEmail}.` },
  });

  revalidatePath(`/devis/${devisId}`);
}

/**
 * "Création de TS" : nouveau devis vierge (aucune ligne reprise) reprenant client, entreprise
 * et chantier du devis d'origine, avec son intitulé suivi de " TS" (travaux supplémentaires).
 */
export async function creerDevisTS(devisId: string) {
  const source = await prisma.devis.findUnique({ where: { id: devisId } });
  if (!source) throw new Error("Devis introuvable.");
  await requireAcces("DEVIS", source.entreprise as Entreprise);

  const annee = new Date().getFullYear();
  const nouveau = await prisma.$transaction(async (tx) => {
    const sequenceDejaExistante = await tx.devis.count({
      where: { entreprise: source.entreprise, numero: { startsWith: `${prefixeEntreprise(source.entreprise)}-${annee}-` } },
    });
    const numero = genererNumeroDevis(source.entreprise, annee, sequenceDejaExistante);
    return tx.devis.create({
      data: {
        numero,
        intitule: `${source.intitule} TS`,
        entreprise: source.entreprise,
        chantierId: source.chantierId,
        clientNom: source.clientNom,
        clientAdresse: source.clientAdresse,
        clientEmail: source.clientEmail,
        tauxTVA: source.tauxTVA,
        lignes: { create: [{ designation: "", unite: null, quantite: 1, prixUnitaire: 0, ordre: 1 }] },
      },
    });
  });

  revalidatePath("/devis");
  return { id: nouveau.id };
}

/**
 * "Réédition" : copie intégrale du devis (mêmes lignes) avec une nouvelle date (aujourd'hui)
 * et un nouveau numéro, non validée — pour renvoyer une offre équivalente.
 */
export async function reediterDevis(devisId: string) {
  const source = await prisma.devis.findUnique({
    where: { id: devisId },
    include: { lignes: { orderBy: { ordre: "asc" } } },
  });
  if (!source) throw new Error("Devis introuvable.");
  await requireAcces("DEVIS", source.entreprise as Entreprise);

  const annee = new Date().getFullYear();
  const nouveau = await prisma.$transaction(async (tx) => {
    const sequenceDejaExistante = await tx.devis.count({
      where: { entreprise: source.entreprise, numero: { startsWith: `${prefixeEntreprise(source.entreprise)}-${annee}-` } },
    });
    const numero = genererNumeroDevis(source.entreprise, annee, sequenceDejaExistante);
    return tx.devis.create({
      data: {
        numero,
        intitule: source.intitule,
        entreprise: source.entreprise,
        chantierId: source.chantierId,
        clientNom: source.clientNom,
        clientAdresse: source.clientAdresse,
        clientEmail: source.clientEmail,
        validiteJours: source.validiteJours,
        tauxTVA: source.tauxTVA,
        remiseHT: source.remiseHT,
        notes: source.notes,
        lignes: {
          create: source.lignes.map((l) => ({
            designation: l.designation,
            unite: l.unite,
            quantite: l.quantite,
            prixUnitaire: l.prixUnitaire,
            ordre: l.ordre,
          })),
        },
      },
    });
  });

  revalidatePath("/devis");
  return { id: nouveau.id };
}

export interface SuggestionPrixResult {
  prixSource: number;
  dateSourceISO: string | null;
  origine: "DEVIS" | "CATALOGUE";
  sourceLabel: string;
  confiance: "HAUTE" | "MOYENNE" | "BASSE" | null;
  prixActualise: number | null;
}

/**
 * Propose un prix unitaire pour une désignation saisie. Priorité à l'historique réel des
 * devis Verticale (ligne la plus récente avec une désignation identique ou proche) ; à
 * défaut, repli sur le catalogue de prix extrait des devis de sous-traitants historiques.
 * Le prix retenu est actualisé à la date cible via l'indice BT01.
 */
export async function suggererPrix(
  designation: string,
  dateCible: string
): Promise<SuggestionPrixResult | null> {
  await requireAcces("DEVIS");
  if (!designation.trim() || !dateCible) return null;

  const indices = await prisma.indiceBT.findMany();
  const indiceCible = trouverIndicePourDate(indices, new Date(dateCible));

  const lignesBrutes = await prisma.ligneDevis.findMany({
    select: {
      designation: true,
      prixUnitaire: true,
      devis: { select: { dateDevis: true, numero: true, intitule: true } },
    },
  });
  const lignes = lignesBrutes.map((l) => ({
    designation: l.designation,
    prixUnitaire: l.prixUnitaire,
    dateDevis: l.devis.dateDevis,
    devisNumero: l.devis.numero,
    devisIntitule: l.devis.intitule,
  }));
  const meilleureLigne = trouverMeilleureLigne(lignes, designation);
  if (meilleureLigne) {
    const indiceSource = trouverIndicePourDate(indices, meilleureLigne.dateDevis);
    return {
      prixSource: meilleureLigne.prixUnitaire,
      dateSourceISO: meilleureLigne.dateDevis.toISOString(),
      origine: "DEVIS",
      sourceLabel: `${meilleureLigne.devisNumero} — ${meilleureLigne.devisIntitule}`,
      confiance: null,
      prixActualise: actualiserPrix(meilleureLigne.prixUnitaire, indiceSource, indiceCible),
    };
  }

  const referencesBrutes = await prisma.prixReference.findMany({
    select: { designation: true, prixUnitaire: true, dateReference: true, lot: true, confiance: true },
  });
  const meilleureReference = trouverMeilleureReference(referencesBrutes, designation);
  if (!meilleureReference) return null;

  const indiceSource = meilleureReference.dateReference
    ? trouverIndicePourDate(indices, meilleureReference.dateReference)
    : null;
  return {
    prixSource: meilleureReference.prixUnitaire,
    dateSourceISO: meilleureReference.dateReference?.toISOString() ?? null,
    origine: "CATALOGUE",
    sourceLabel: meilleureReference.lot ? `Catalogue — ${meilleureReference.lot}` : "Catalogue",
    confiance: meilleureReference.confiance,
    prixActualise: actualiserPrix(meilleureReference.prixUnitaire, indiceSource, indiceCible),
  };
}

const FORMAT_PERIODE = /^\d{4}-(0[1-9]|1[0-2])$/;

export async function upsertIndiceBT(periode: string, valeur: number) {
  await requireAcces("DEVIS");
  if (!FORMAT_PERIODE.test(periode)) {
    throw new Error("La période doit être au format AAAA-MM.");
  }
  if (!Number.isFinite(valeur) || valeur <= 0) {
    throw new Error("La valeur de l'indice doit être un nombre positif.");
  }
  await prisma.indiceBT.upsert({
    where: { periode },
    update: { valeur },
    create: { periode, valeur },
  });
  revalidatePath("/devis/indice-bt");
}

export async function supprimerIndiceBT(id: string) {
  await requireAcces("DEVIS");
  await prisma.indiceBT.delete({ where: { id } });
  revalidatePath("/devis/indice-bt");
}

export async function lierDevisAuChantier(devisId: string, chantierId: string) {
  const entreprise = await entrepriseDuDevis(devisId);
  await requireAcces("DEVIS", entreprise);
  const chantier = await prisma.chantier.findUnique({ where: { id: chantierId }, select: { id: true, entreprise: true } });
  if (!chantier) throw new Error("Chantier introuvable.");
  if (chantier.entreprise !== entreprise) throw new Error("Ce chantier n'appartient pas à cette entreprise.");

  await prisma.devis.update({ where: { id: devisId }, data: { chantierId } });
  revalidatePath(`/devis/${devisId}`);
  revalidatePath(`/chantiers/${chantierId}`);
  revalidatePath("/");
}

export async function delierDevisDuChantier(devisId: string) {
  await requireAcces("DEVIS", await entrepriseDuDevis(devisId));
  const avant = await prisma.devis.findUnique({
    where: { id: devisId },
    select: { chantierId: true, clientAdresse: true },
  });
  if (!avant) throw new Error("Devis introuvable.");
  if (!avant.clientAdresse?.trim()) {
    throw new Error("Renseignez d'abord une adresse exacte avant de délier ce devis de son chantier.");
  }
  await prisma.devis.update({ where: { id: devisId }, data: { chantierId: null } });
  revalidatePath(`/devis/${devisId}`);
  if (avant.chantierId) revalidatePath(`/chantiers/${avant.chantierId}`);
  revalidatePath("/");
}

/**
 * Planning prévisionnel d'un devis validé non lié à un chantier (date de début + durée en
 * jours ouvrés), pour le faire apparaître sur le Calendrier Global avant qu'un chantier en
 * bonne et due forme existe. `dateDebut`/`dureeJoursOuvres` à null retire le planning.
 */
export async function modifierPlanningDevis(
  devisId: string,
  data: { dateDebut: string | null; dureeJoursOuvres: number | null }
) {
  const devis = await prisma.devis.findUnique({
    where: { id: devisId },
    select: { entreprise: true, valide: true, chantierId: true },
  });
  if (!devis) throw new Error("Devis introuvable.");
  await requireAcces("DEVIS", devis.entreprise as Entreprise);
  if (!devis.valide) throw new Error("Le planning prévisionnel n'est disponible qu'une fois le devis validé.");
  if (devis.chantierId) throw new Error("Ce devis est déjà lié à un chantier : son planning suit celui du chantier.");
  if (data.dateDebut && (!data.dureeJoursOuvres || data.dureeJoursOuvres <= 0)) {
    throw new Error("Indiquez une durée en jours ouvrés positive.");
  }
  if (data.dureeJoursOuvres && !data.dateDebut) {
    throw new Error("Indiquez une date de début.");
  }

  await prisma.devis.update({
    where: { id: devisId },
    data: {
      dateDebutPrevisionnelle: data.dateDebut ? new Date(data.dateDebut) : null,
      dureeJoursOuvres: data.dureeJoursOuvres || null,
    },
  });
  revalidatePath(`/devis/${devisId}`);
  revalidatePath("/calendrier");
}

/**
 * Coût de revient interne (matériaux + honoraires), jamais affiché au client ni sur le PDF.
 * Éditable même une fois le devis validé, comme le suivi de l'affaire.
 */
export async function modifierCoutsDevis(
  devisId: string,
  data: { coutMateriauxHT: number | null; coutHonorairesHT: number | null }
) {
  await requireAcces("DEVIS", await entrepriseDuDevis(devisId));
  if (data.coutMateriauxHT != null && (!Number.isFinite(data.coutMateriauxHT) || data.coutMateriauxHT < 0)) {
    throw new Error("Le coût des matériaux doit être un nombre positif.");
  }
  if (data.coutHonorairesHT != null && (!Number.isFinite(data.coutHonorairesHT) || data.coutHonorairesHT < 0)) {
    throw new Error("Le coût des honoraires doit être un nombre positif.");
  }

  await prisma.devis.update({
    where: { id: devisId },
    data: { coutMateriauxHT: data.coutMateriauxHT, coutHonorairesHT: data.coutHonorairesHT },
  });
  revalidatePath(`/devis/${devisId}`);
}

export async function ajouterLigneFinanciere(chantierId: string, libelle: string, montant: number) {
  await requireAcces("VUE_ENSEMBLE", await entrepriseDuChantier(chantierId));
  const libelleNettoye = libelle.trim();
  if (!libelleNettoye) throw new Error("L'intitulé est obligatoire.");
  if (!Number.isFinite(montant) || montant < 0) {
    throw new Error("Le montant doit être un nombre positif.");
  }
  await prisma.ligneFinanciereChantier.create({
    data: { chantierId, libelle: libelleNettoye, montant },
  });
  revalidatePath(`/chantiers/${chantierId}`);
  revalidatePath("/");
}

export async function supprimerLigneFinanciere(chantierId: string, ligneId: string) {
  await requireAcces("VUE_ENSEMBLE", await entrepriseDuChantier(chantierId));
  await prisma.ligneFinanciereChantier.delete({ where: { id: ligneId } });
  revalidatePath(`/chantiers/${chantierId}`);
  revalidatePath("/");
}
