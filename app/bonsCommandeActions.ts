"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { aAcces, getPersonneConnectee, requireAcces } from "@/lib/authContext";
import type { Entreprise } from "@/constants/entreprises";
import {
  calculerMontantFactureDepuisBonCommande,
  calculerPrixUnitaireBonCommande,
  calculerTotalHTBonCommande,
  estDiviseurValide,
  estPourcentageValide,
} from "@/lib/bonCommande";
import { prochainNumeroBonCommande } from "@/lib/bonCommandeNumero";
import { genererNumeroFacture } from "@/lib/factures";
import { construireDonneesPdfBonCommande, genererPdfBonCommandeBuffer } from "@/lib/pdfBonCommande";
import { chargerIdentiteEntreprisePdf } from "@/lib/pdfEntreprise";
import { envoyerEmail } from "@/lib/mail";

/**
 * Un bon de commande se gère depuis la fiche d'un devis (onglet Devis) ou depuis l'onglet
 * "Bons de commande" (sous Chantiers) : l'un ou l'autre accès suffit.
 */
async function exigerAccesBonsCommande(entreprise: Entreprise) {
  const personne = await getPersonneConnectee();
  if (personne && (aAcces(personne, "CHANTIERS", entreprise) || aAcces(personne, "DEVIS", entreprise))) {
    return personne;
  }
  return requireAcces("CHANTIERS", entreprise); // redirige vers /login ou /acces-refuse
}

export interface CreerBonCommandeInput {
  sousTraitantId: string;
  /** Les prix unitaires du devis sont divisés par ce nombre pour obtenir ceux du bon de commande. */
  diviseur: number;
  notes?: string;
}

/** Bon de commande dérivé d'un devis : mêmes lignes et quantités, prix unitaires ÷ diviseur. */
export async function creerBonCommande(devisId: string, data: CreerBonCommandeInput) {
  const devis = await prisma.devis.findUnique({
    where: { id: devisId },
    include: { lignes: { orderBy: { ordre: "asc" } }, chantier: { select: { adresse: true } } },
  });
  if (!devis) throw new Error("Devis introuvable.");
  const entreprise = devis.entreprise as Entreprise;
  await exigerAccesBonsCommande(entreprise);

  if (!estDiviseurValide(data.diviseur)) {
    throw new Error("Le diviseur doit être un nombre strictement positif.");
  }
  if (!data.sousTraitantId) {
    throw new Error("Choisissez le sous-traitant concerné par ce bon de commande.");
  }
  // Les sous-traitants sont communs à toutes les entreprises : on vérifie seulement qu'il existe.
  const sousTraitant = await prisma.sousTraitant.findUnique({ where: { id: data.sousTraitantId }, select: { id: true } });
  if (!sousTraitant) throw new Error("Sous-traitant introuvable.");

  const lignes = devis.lignes.filter((l) => l.designation.trim());
  if (lignes.length === 0) throw new Error("Ce devis n'a aucune ligne à reprendre dans un bon de commande.");

  const bon = await prisma.$transaction(async (tx) => {
    return tx.bonCommande.create({
      data: {
        numero: await prochainNumeroBonCommande(tx, entreprise),
        entreprise,
        devisId: devis.id,
        devisNumero: devis.numero,
        chantierId: devis.chantierId,
        intitule: devis.intitule,
        adresse: devis.chantier?.adresse?.trim() || devis.clientAdresse?.trim() || null,
        sousTraitantId: data.sousTraitantId,
        diviseur: data.diviseur,
        notes: data.notes?.trim() || null,
        lignes: {
          create: lignes.map((l, i) => ({
            designation: l.designation,
            detail: l.detail,
            unite: l.unite,
            quantite: l.quantite,
            prixUnitaire: calculerPrixUnitaireBonCommande(l.prixUnitaire, data.diviseur),
            ordre: i + 1,
          })),
        },
      },
    });
  });

  revalidatePath(`/devis/${devisId}`);
  revalidatePath("/bons-commande");
  return { id: bon.id };
}

export async function supprimerBonCommande(bonCommandeId: string) {
  const bon = await prisma.bonCommande.findUnique({
    where: { id: bonCommandeId },
    select: { entreprise: true, devisId: true },
  });
  if (!bon) throw new Error("Bon de commande introuvable.");
  await exigerAccesBonsCommande(bon.entreprise as Entreprise);
  await prisma.bonCommande.delete({ where: { id: bonCommandeId } });
  if (bon.devisId) revalidatePath(`/devis/${bon.devisId}`);
  revalidatePath("/bons-commande");
}

/** Envoie le bon de commande (PDF en pièce jointe) à l'e-mail du sous-traitant concerné. */
export async function envoyerBonCommandeParEmail(bonCommandeId: string) {
  const bon = await prisma.bonCommande.findUnique({
    where: { id: bonCommandeId },
    include: { sousTraitant: true, lignes: { orderBy: { ordre: "asc" } } },
  });
  if (!bon) throw new Error("Bon de commande introuvable.");
  await exigerAccesBonsCommande(bon.entreprise as Entreprise);

  const st = bon.sousTraitant;
  const destinataire = st.email?.trim();
  if (!destinataire) {
    throw new Error(`Renseignez l'e-mail du sous-traitant « ${st.nom} » dans sa fiche pour pouvoir lui envoyer le bon de commande.`);
  }

  const { info } = await chargerIdentiteEntreprisePdf(bon.entreprise);
  const interlocuteur = [st.contactPrenom, st.contactNom].filter(Boolean).join(" ") || st.nom;
  const buffer = await genererPdfBonCommandeBuffer(construireDonneesPdfBonCommande(bon));
  await envoyerEmail({
    to: destinataire,
    subject: `Bon de commande ${bon.numero} — ${info.nom}`,
    text: `Bonjour ${interlocuteur},\n\nVeuillez trouver ci-joint le bon de commande ${bon.numero} concernant « ${bon.intitule} ».\n\nMerci de nous confirmer sa bonne réception.\n\nCordialement,\n${info.nom}`,
    attachments: [{ filename: `${bon.numero}.pdf`, content: buffer, contentType: "application/pdf" }],
  });

  await prisma.bonCommande.update({ where: { id: bonCommandeId }, data: { envoyeLe: new Date() } });
  revalidatePath("/bons-commande");
  if (bon.devisId) revalidatePath(`/devis/${bon.devisId}`);
}

export interface ConvertirBonCommandeInput {
  /** Augmentation (en %) appliquée à chaque prix unitaire du bon de commande. */
  pourcentage: number;
  clientNom: string;
  clientAdresse?: string;
  tauxTVA: number;
  notes?: string;
}

/**
 * Transforme un bon de commande en facture client : chaque prix unitaire est majoré du
 * pourcentage saisi. Le montant du bon de commande (ce qu'on doit au sous-traitant) devient le
 * "coût de réalisation" de la facture, pour que le bénéfice réel se calcule tout seul.
 */
export async function convertirBonCommandeEnFacture(bonCommandeId: string, data: ConvertirBonCommandeInput) {
  const bon = await prisma.bonCommande.findUnique({
    where: { id: bonCommandeId },
    include: { lignes: true, facture: { select: { numero: true } } },
  });
  if (!bon) throw new Error("Bon de commande introuvable.");
  const entreprise = bon.entreprise as Entreprise;
  await requireAcces("FINANCE", entreprise);

  if (bon.facture) throw new Error(`Ce bon de commande a déjà été transformé en facture (${bon.facture.numero}).`);
  if (!estPourcentageValide(data.pourcentage)) {
    throw new Error("Le pourcentage d'augmentation doit être un nombre positif ou nul.");
  }
  const clientNom = data.clientNom.trim();
  if (!clientNom) throw new Error("Le nom du client est obligatoire.");
  if (!Number.isFinite(data.tauxTVA) || data.tauxTVA < 0) throw new Error("Le taux de TVA doit être un nombre positif.");

  const montantHT = calculerMontantFactureDepuisBonCommande(bon.lignes, data.pourcentage);
  const coutRealisationHT = calculerTotalHTBonCommande(bon.lignes);
  const annee = new Date().getFullYear();

  try {
    const facture = await prisma.$transaction(async (tx) => {
      const sequenceDejaExistante = await tx.facture.count({
        where: { entreprise, numero: { startsWith: `FAC-${entreprise === "CB2B" ? "CB2B" : "VRT"}-${annee}-` } },
      });
      return tx.facture.create({
        data: {
          numero: genererNumeroFacture(entreprise, annee, sequenceDejaExistante),
          entreprise,
          devisId: bon.devisId,
          chantierId: bon.chantierId,
          clientNom,
          clientAdresse: data.clientAdresse?.trim() || null,
          montantHT,
          coutRealisationHT,
          tauxTVA: data.tauxTVA,
          dateFacture: new Date(),
          notes: data.notes?.trim() || `Facture issue du bon de commande ${bon.numero} (+${data.pourcentage} % sur les prix unitaires).`,
          bonCommandeId: bon.id,
        },
      });
    });
    revalidatePath("/finance");
    revalidatePath("/bons-commande");
    return { id: facture.id, numero: facture.numero };
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      throw new Error("Ce bon de commande a déjà été transformé en facture.");
    }
    throw err;
  }
}
