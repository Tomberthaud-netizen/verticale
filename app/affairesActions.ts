"use server";

import { revalidatePath } from "next/cache";
import type { StatutAffaire, TypeEvenementDevis } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAcces } from "@/lib/authContext";
import { STATUTS_AFFAIRE, TYPES_EVENEMENT_DEVIS } from "@/constants/affaires";

async function chantierIdDuDevis(devisId: string): Promise<string | null> {
  const devis = await prisma.devis.findUnique({ where: { id: devisId }, select: { chantierId: true } });
  return devis?.chantierId ?? null;
}

function revaliderDevis(devisId: string, chantierId: string | null) {
  revalidatePath(`/devis/${devisId}`);
  revalidatePath("/devis");
  revalidatePath("/devis/portefeuille");
  if (chantierId) revalidatePath(`/chantiers/${chantierId}`);
}

export async function modifierStatutAffaire(devisId: string, statut: string) {
  await requireAcces("DEVIS");
  if (!STATUTS_AFFAIRE.includes(statut as StatutAffaire)) {
    throw new Error("Statut invalide.");
  }
  await prisma.devis.update({ where: { id: devisId }, data: { statutAffaire: statut as StatutAffaire } });
  revaliderDevis(devisId, await chantierIdDuDevis(devisId));
}

export interface ModifierSuiviAffaireInput {
  responsableId: string | null;
  prochaineActionDate: string | null;
  prochaineActionNote: string | null;
}

export async function modifierSuiviAffaire(devisId: string, data: ModifierSuiviAffaireInput) {
  await requireAcces("DEVIS");
  await prisma.devis.update({
    where: { id: devisId },
    data: {
      responsableId: data.responsableId || null,
      prochaineActionDate: data.prochaineActionDate ? new Date(data.prochaineActionDate) : null,
      prochaineActionNote: data.prochaineActionNote?.trim() || null,
    },
  });
  revaliderDevis(devisId, await chantierIdDuDevis(devisId));
}

export async function ajouterEvenementDevis(devisId: string, type: string, contenu: string) {
  await requireAcces("DEVIS");
  if (!TYPES_EVENEMENT_DEVIS.includes(type as TypeEvenementDevis)) {
    throw new Error("Type d'événement invalide.");
  }
  const contenuNettoye = contenu.trim();
  if (!contenuNettoye) {
    throw new Error("Le contenu de l'événement est obligatoire.");
  }
  await prisma.evenementDevis.create({
    data: { devisId, type: type as TypeEvenementDevis, contenu: contenuNettoye },
  });
  revalidatePath(`/devis/${devisId}`);
}

export async function supprimerEvenementDevis(devisId: string, evenementId: string) {
  await requireAcces("DEVIS");
  await prisma.evenementDevis.delete({ where: { id: evenementId } });
  revalidatePath(`/devis/${devisId}`);
}
