"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAcces } from "@/lib/authContext";
import { getEntrepriseActive } from "@/lib/entrepriseActive";
import { genererNumeroFacture } from "@/lib/factures";
import type { Entreprise } from "@/constants/entreprises";

export interface CreerFactureInput {
  devisId?: string;
  chantierId?: string;
  clientNom?: string;
  clientAdresse?: string;
  montantHT: number;
  coutRealisationHT?: number;
  tauxTVA: number;
  dateFacture: string;
  dateEcheance?: string;
  notes?: string;
}

/** Entreprise propriétaire d'une facture — pour vérifier l'accès à une ressource précise. */
async function entrepriseDeFacture(factureId: string): Promise<Entreprise> {
  const facture = await prisma.facture.findUnique({ where: { id: factureId }, select: { entreprise: true } });
  if (!facture) throw new Error("Facture introuvable.");
  return facture.entreprise as Entreprise;
}

async function validerLiensEntreprise(entreprise: Entreprise, data: CreerFactureInput) {
  if (data.devisId) {
    const devis = await prisma.devis.findUnique({ where: { id: data.devisId }, select: { entreprise: true } });
    if (!devis || devis.entreprise !== entreprise) throw new Error("Ce devis n'appartient pas à cette entreprise.");
  }
  if (data.chantierId) {
    const chantier = await prisma.chantier.findUnique({ where: { id: data.chantierId }, select: { entreprise: true } });
    if (!chantier || chantier.entreprise !== entreprise) {
      throw new Error("Ce chantier n'appartient pas à cette entreprise.");
    }
  }
}

function validerFactureInput(data: CreerFactureInput) {
  if (!data.dateFacture) throw new Error("La date de facture est obligatoire.");
  if (!Number.isFinite(data.montantHT) || data.montantHT < 0) {
    throw new Error("Le montant HT doit être un nombre positif.");
  }
  if (data.coutRealisationHT != null && (!Number.isFinite(data.coutRealisationHT) || data.coutRealisationHT < 0)) {
    throw new Error("Le coût de réalisation doit être un nombre positif.");
  }
  if (!Number.isFinite(data.tauxTVA) || data.tauxTVA < 0) {
    throw new Error("Le taux de TVA doit être un nombre positif.");
  }
}

export async function creerFacture(data: CreerFactureInput) {
  const entreprise = await getEntrepriseActive();
  await requireAcces("FINANCE", entreprise);
  validerFactureInput(data);
  await validerLiensEntreprise(entreprise, data);
  const annee = new Date(data.dateFacture).getFullYear();

  const facture = await prisma.$transaction(async (tx) => {
    const sequenceDejaExistante = await tx.facture.count({
      where: {
        entreprise,
        numero: { startsWith: `FAC-${entreprise === "CB2B" ? "CB2B" : "VRT"}-${annee}-` },
      },
    });
    const numero = genererNumeroFacture(entreprise, annee, sequenceDejaExistante);
    return tx.facture.create({
      data: {
        numero,
        entreprise,
        devisId: data.devisId || null,
        chantierId: data.chantierId || null,
        clientNom: data.clientNom?.trim() || null,
        clientAdresse: data.clientAdresse?.trim() || null,
        montantHT: data.montantHT,
        coutRealisationHT: data.coutRealisationHT ?? null,
        tauxTVA: data.tauxTVA,
        dateFacture: new Date(data.dateFacture),
        dateEcheance: data.dateEcheance ? new Date(data.dateEcheance) : null,
        notes: data.notes?.trim() || null,
      },
    });
  });

  revalidatePath("/finance");
  return { id: facture.id };
}

export async function modifierFacture(factureId: string, data: CreerFactureInput) {
  const entreprise = await entrepriseDeFacture(factureId);
  await requireAcces("FINANCE", entreprise);
  validerFactureInput(data);
  await validerLiensEntreprise(entreprise, data);
  await prisma.facture.update({
    where: { id: factureId },
    data: {
      devisId: data.devisId || null,
      chantierId: data.chantierId || null,
      clientNom: data.clientNom?.trim() || null,
      clientAdresse: data.clientAdresse?.trim() || null,
      montantHT: data.montantHT,
      coutRealisationHT: data.coutRealisationHT ?? null,
      tauxTVA: data.tauxTVA,
      dateFacture: new Date(data.dateFacture),
      dateEcheance: data.dateEcheance ? new Date(data.dateEcheance) : null,
      notes: data.notes?.trim() || null,
    },
  });
  revalidatePath("/finance");
  revalidatePath(`/finance/factures/${factureId}`);
}

export async function annulerFacture(factureId: string) {
  await requireAcces("FINANCE", await entrepriseDeFacture(factureId));
  await prisma.facture.update({ where: { id: factureId }, data: { statut: "ANNULEE" } });
  revalidatePath("/finance");
  revalidatePath(`/finance/factures/${factureId}`);
}

export async function supprimerFacture(factureId: string) {
  await requireAcces("FINANCE", await entrepriseDeFacture(factureId));
  await prisma.facture.delete({ where: { id: factureId } });
  revalidatePath("/finance");
}

export interface AjouterPaiementInput {
  montant: number;
  datePaiement: string;
  moyen?: string;
  notes?: string;
}

export async function ajouterPaiement(factureId: string, data: AjouterPaiementInput) {
  await requireAcces("FINANCE", await entrepriseDeFacture(factureId));
  if (!Number.isFinite(data.montant) || data.montant <= 0) {
    throw new Error("Le montant du paiement doit être positif.");
  }
  if (!data.datePaiement) throw new Error("La date de paiement est obligatoire.");

  await prisma.paiement.create({
    data: {
      factureId,
      montant: data.montant,
      datePaiement: new Date(data.datePaiement),
      moyen: data.moyen?.trim() || null,
      notes: data.notes?.trim() || null,
    },
  });
  revalidatePath("/finance");
  revalidatePath(`/finance/factures/${factureId}`);
}

export async function supprimerPaiement(factureId: string, paiementId: string) {
  await requireAcces("FINANCE", await entrepriseDeFacture(factureId));
  await prisma.paiement.delete({ where: { id: paiementId } });
  revalidatePath("/finance");
  revalidatePath(`/finance/factures/${factureId}`);
}

/** Marque un devis validé comme encaissé (ou revient en arrière) : fait entrer son montant HT dans le CA. */
export async function marquerDevisPaye(devisId: string, paye: boolean) {
  const devis = await prisma.devis.findUnique({
    where: { id: devisId },
    select: { entreprise: true, valide: true },
  });
  if (!devis) throw new Error("Devis introuvable.");
  await requireAcces("FINANCE", devis.entreprise as Entreprise);
  if (!devis.valide) throw new Error("Seul un devis validé peut être marqué comme encaissé.");
  await prisma.devis.update({
    where: { id: devisId },
    data: { paye, datePaiement: paye ? new Date() : null },
  });
  revalidatePath("/finance");
}

/** Marque un chantier (achat/revente) comme encaissé (ou revient en arrière) : fait entrer son prix de revente dans le CA. */
export async function marquerChantierPaye(chantierId: string, paye: boolean) {
  const chantier = await prisma.chantier.findUnique({
    where: { id: chantierId },
    select: { entreprise: true },
  });
  if (!chantier) throw new Error("Chantier introuvable.");
  await requireAcces("FINANCE", chantier.entreprise as Entreprise);
  await prisma.chantier.update({
    where: { id: chantierId },
    data: { paye, datePaiement: paye ? new Date() : null },
  });
  revalidatePath("/finance");
}

/** Date limite de paiement d'un devis validé : fait apparaître une alerte en Vue d'ensemble si dépassée. */
export async function modifierDateLimitePaiementDevis(devisId: string, date: string | null) {
  const devis = await prisma.devis.findUnique({ where: { id: devisId }, select: { entreprise: true } });
  if (!devis) throw new Error("Devis introuvable.");
  await requireAcces("FINANCE", devis.entreprise as Entreprise);
  await prisma.devis.update({
    where: { id: devisId },
    data: { dateLimitePaiement: date ? new Date(date) : null },
  });
  revalidatePath("/finance");
}

/** Date limite de paiement d'un chantier (achat/revente) : fait apparaître une alerte en Vue d'ensemble si dépassée. */
export async function modifierDateLimitePaiementChantier(chantierId: string, date: string | null) {
  const chantier = await prisma.chantier.findUnique({ where: { id: chantierId }, select: { entreprise: true } });
  if (!chantier) throw new Error("Chantier introuvable.");
  await requireAcces("FINANCE", chantier.entreprise as Entreprise);
  await prisma.chantier.update({
    where: { id: chantierId },
    data: { dateLimitePaiement: date ? new Date(date) : null },
  });
  revalidatePath("/finance");
}
