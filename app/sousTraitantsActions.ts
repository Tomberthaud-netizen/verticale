"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAcces } from "@/lib/authContext";
import { getEntrepriseActive } from "@/lib/entrepriseActive";
import type { Entreprise } from "@/constants/entreprises";
import { nettoyerSiret } from "@/lib/siret";

/** Entreprise propriétaire d'un sous-traitant — pour vérifier l'accès à une ressource précise. */
async function entrepriseDuSousTraitant(sousTraitantId: string): Promise<Entreprise> {
  const sousTraitant = await prisma.sousTraitant.findUnique({
    where: { id: sousTraitantId },
    select: { entreprise: true },
  });
  if (!sousTraitant) throw new Error("Sous-traitant introuvable.");
  return sousTraitant.entreprise as Entreprise;
}

export interface SousTraitantInput {
  nom: string;
  typesTravaux: string[];
  siret?: string;
  contactNom?: string;
  contactPrenom?: string;
  telephone?: string;
  email?: string;
  adresse?: string;
  codePostal?: string;
  ville?: string;
  pays?: string;
  notes?: string;
}

function validerEtNettoyer(data: SousTraitantInput) {
  const nom = data.nom.trim();
  if (!nom) throw new Error("Le nom de l'entreprise est obligatoire.");
  const typesTravaux = Array.from(new Set(data.typesTravaux.map((t) => t.trim()).filter(Boolean)));
  return {
    nom,
    typesTravaux,
    siret: data.siret ? nettoyerSiret(data.siret) || null : null,
    contactNom: data.contactNom?.trim() || null,
    contactPrenom: data.contactPrenom?.trim() || null,
    telephone: data.telephone?.trim() || null,
    email: data.email?.trim() || null,
    adresse: data.adresse?.trim() || null,
    codePostal: data.codePostal?.trim() || null,
    ville: data.ville?.trim() || null,
    pays: data.pays?.trim() || "France",
    notes: data.notes?.trim() || null,
  };
}

export async function creerSousTraitant(data: SousTraitantInput) {
  const entreprise = await getEntrepriseActive();
  await requireAcces("SOUS_TRAITANTS", entreprise);
  const { typesTravaux, ...reste } = validerEtNettoyer(data);
  const sousTraitant = await prisma.sousTraitant.create({
    data: { ...reste, entreprise, typesTravaux: { create: typesTravaux.map((type) => ({ type })) } },
  });
  revalidatePath("/sous-traitants");
  return { id: sousTraitant.id };
}

export async function modifierSousTraitant(sousTraitantId: string, data: SousTraitantInput) {
  await requireAcces("SOUS_TRAITANTS", await entrepriseDuSousTraitant(sousTraitantId));
  const { typesTravaux, ...reste } = validerEtNettoyer(data);
  await prisma.$transaction([
    prisma.sousTraitant.update({ where: { id: sousTraitantId }, data: reste }),
    prisma.sousTraitantType.deleteMany({ where: { sousTraitantId } }),
    prisma.sousTraitantType.createMany({ data: typesTravaux.map((type) => ({ sousTraitantId, type })) }),
  ]);
  revalidatePath("/sous-traitants");
  revalidatePath(`/sous-traitants/${sousTraitantId}`);
}

export async function supprimerSousTraitant(sousTraitantId: string) {
  await requireAcces("SOUS_TRAITANTS", await entrepriseDuSousTraitant(sousTraitantId));
  await prisma.sousTraitant.delete({ where: { id: sousTraitantId } });
  revalidatePath("/sous-traitants");
}
