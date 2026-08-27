"use server";

import { revalidatePath } from "next/cache";
import type { ConfianceReference } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAcces } from "@/lib/authContext";

export interface PrixReferenceInput {
  designation: string;
  lot?: string;
  unite?: string;
  prixUnitaire: number;
  confiance: ConfianceReference;
}

export async function modifierPrixReference(id: string, data: PrixReferenceInput) {
  await requireAcces("CATALOGUE");
  const designation = data.designation.trim();
  if (!designation) throw new Error("La désignation est obligatoire.");
  if (!Number.isFinite(data.prixUnitaire) || data.prixUnitaire < 0) {
    throw new Error("Le prix unitaire doit être un nombre positif.");
  }
  await prisma.prixReference.update({
    where: { id },
    data: {
      designation,
      lot: data.lot?.trim() || null,
      unite: data.unite?.trim() || null,
      prixUnitaire: data.prixUnitaire,
      confiance: data.confiance,
    },
  });
  revalidatePath("/catalogue");
}

export async function supprimerPrixReference(id: string) {
  await requireAcces("CATALOGUE");
  await prisma.prixReference.delete({ where: { id } });
  revalidatePath("/catalogue");
}

export interface LigneDevisReelleInput {
  designation: string;
  unite?: string;
  prixUnitaire: number;
}

/**
 * Modifie une ligne de devis réelle depuis le Catalogue (section "Prix issus de vos devis réels").
 * Interdit si le devis d'origine est validé (figé), au même titre que sa modification depuis la fiche devis.
 */
export async function modifierLigneDevisReelle(ligneId: string, data: LigneDevisReelleInput) {
  await requireAcces("CATALOGUE");
  const designation = data.designation.trim();
  if (!designation) throw new Error("La désignation est obligatoire.");
  if (!Number.isFinite(data.prixUnitaire) || data.prixUnitaire < 0) {
    throw new Error("Le prix unitaire doit être un nombre positif.");
  }
  const ligne = await prisma.ligneDevis.findUnique({ where: { id: ligneId }, include: { devis: true } });
  if (!ligne) throw new Error("Ligne introuvable.");
  if (ligne.devis.valide) throw new Error("Ce devis est validé (figé) : sa ligne ne peut plus être modifiée ici.");
  await prisma.ligneDevis.update({
    where: { id: ligneId },
    data: { designation, unite: data.unite?.trim() || null, prixUnitaire: data.prixUnitaire },
  });
  revalidatePath("/catalogue");
  revalidatePath(`/devis/${ligne.devisId}`);
}

/** Ajoute un type de travaux au catalogue de durées (ex. un type personnalisé au-delà des 3 par défaut). */
export async function ajouterDureeTypeTravaux(type: string) {
  await requireAcces("CATALOGUE");
  const typeNettoye = type.trim();
  if (!typeNettoye) throw new Error("Le type de travaux est obligatoire.");
  const existant = await prisma.dureeTypeTravaux.findUnique({ where: { type: typeNettoye } });
  if (existant) throw new Error("Ce type de travaux existe déjà.");
  await prisma.dureeTypeTravaux.create({ data: { type: typeNettoye } });
  revalidatePath("/catalogue");
}

/** Modifie la durée moyenne (jours ouvrés / m²) d'un type de travaux. */
export async function modifierDureeTypeTravaux(id: string, joursParM2: number | null) {
  await requireAcces("CATALOGUE");
  if (joursParM2 != null && (!Number.isFinite(joursParM2) || joursParM2 <= 0)) {
    throw new Error("La durée moyenne doit être un nombre positif.");
  }
  await prisma.dureeTypeTravaux.update({ where: { id }, data: { joursParM2 } });
  revalidatePath("/catalogue");
  revalidatePath("/chantiers/nouveau");
}

export async function supprimerDureeTypeTravaux(id: string) {
  await requireAcces("CATALOGUE");
  await prisma.dureeTypeTravaux.delete({ where: { id } });
  revalidatePath("/catalogue");
  revalidatePath("/chantiers/nouveau");
}
