"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAcces } from "@/lib/authContext";
import type { Entreprise } from "@/constants/entreprises";
import {
  calculerPrixUnitaireBonCommande,
  estDiviseurValide,
  genererNumeroBonCommande,
} from "@/lib/bonCommande";
import { prefixeEntreprise } from "@/lib/devis";

export interface CreerBonCommandeInput {
  sousTraitantId: string;
  /** Les prix unitaires du devis sont divisés par ce nombre pour obtenir ceux du bon de commande. */
  diviseur: number;
  notes?: string;
}

export async function creerBonCommande(devisId: string, data: CreerBonCommandeInput) {
  const devis = await prisma.devis.findUnique({
    where: { id: devisId },
    include: { lignes: { orderBy: { ordre: "asc" } }, chantier: { select: { adresse: true } } },
  });
  if (!devis) throw new Error("Devis introuvable.");
  const entreprise = devis.entreprise as Entreprise;
  await requireAcces("DEVIS", entreprise);

  if (!estDiviseurValide(data.diviseur)) {
    throw new Error("Le diviseur doit être un nombre strictement positif.");
  }
  if (!data.sousTraitantId) {
    throw new Error("Choisissez le sous-traitant concerné par ce bon de commande.");
  }
  const sousTraitant = await prisma.sousTraitant.findUnique({
    where: { id: data.sousTraitantId },
    select: { entreprise: true },
  });
  if (!sousTraitant) throw new Error("Sous-traitant introuvable.");
  if (sousTraitant.entreprise !== entreprise) {
    throw new Error("Ce sous-traitant n'appartient pas à cette entreprise.");
  }

  const lignes = devis.lignes.filter((l) => l.designation.trim());
  if (lignes.length === 0) throw new Error("Ce devis n'a aucune ligne à reprendre dans un bon de commande.");

  const annee = new Date().getFullYear();
  const bon = await prisma.$transaction(async (tx) => {
    const sequenceDejaExistante = await tx.bonCommande.count({
      where: { entreprise, numero: { startsWith: `BC-${prefixeEntreprise(entreprise)}-${annee}-` } },
    });
    return tx.bonCommande.create({
      data: {
        numero: genererNumeroBonCommande(entreprise, annee, sequenceDejaExistante),
        entreprise,
        devisId: devis.id,
        devisNumero: devis.numero,
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
  return { id: bon.id };
}

export async function supprimerBonCommande(bonCommandeId: string) {
  const bon = await prisma.bonCommande.findUnique({
    where: { id: bonCommandeId },
    select: { entreprise: true, devisId: true },
  });
  if (!bon) throw new Error("Bon de commande introuvable.");
  await requireAcces("DEVIS", bon.entreprise as Entreprise);
  await prisma.bonCommande.delete({ where: { id: bonCommandeId } });
  if (bon.devisId) revalidatePath(`/devis/${bon.devisId}`);
}
