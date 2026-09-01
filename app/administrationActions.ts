"use server";

import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/authContext";
import { ACCES_ONGLETS } from "@/constants/acces";
import type { Entreprise } from "@/constants/entreprises";
import type { AccesOnglet } from "@prisma/client";

export interface InformationsSocieteInput {
  nom: string;
  tagline?: string;
  adresse?: string;
  codePostal?: string;
  ville?: string;
  telephone?: string;
  email?: string;
  siret?: string;
  tvaIntracom?: string;
}

/** Crée ou met à jour les coordonnées légales d'une entreprise (Administration › Informations société). */
export async function modifierInformationsSociete(code: Entreprise, data: InformationsSocieteInput) {
  await requireAdmin();
  const nom = data.nom.trim();
  if (!nom) throw new Error("Le nom de l'entreprise est obligatoire.");

  await prisma.entreprise.upsert({
    where: { code },
    update: {
      nom,
      tagline: data.tagline?.trim() || null,
      adresse: data.adresse?.trim() || null,
      codePostal: data.codePostal?.trim() || null,
      ville: data.ville?.trim() || null,
      telephone: data.telephone?.trim() || null,
      email: data.email?.trim() || null,
      siret: data.siret?.trim() || null,
      tvaIntracom: data.tvaIntracom?.trim() || null,
    },
    create: {
      code,
      nom,
      tagline: data.tagline?.trim() || null,
      adresse: data.adresse?.trim() || null,
      codePostal: data.codePostal?.trim() || null,
      ville: data.ville?.trim() || null,
      telephone: data.telephone?.trim() || null,
      email: data.email?.trim() || null,
      siret: data.siret?.trim() || null,
      tvaIntracom: data.tvaIntracom?.trim() || null,
    },
  });
  revalidatePath("/administration");
}

const EXTENSIONS_AUTORISEES: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/svg+xml": ".svg",
};

/** Envoie/remplace le logo d'une entreprise, affiché dans le sélecteur d'entreprise et les PDF. */
export async function uploaderLogo(code: Entreprise, formData: FormData) {
  await requireAdmin();
  const fichier = formData.get("logo");
  if (!(fichier instanceof File) || fichier.size === 0) {
    throw new Error("Sélectionnez un logo à envoyer.");
  }
  const extension = EXTENSIONS_AUTORISEES[fichier.type];
  if (!extension) {
    throw new Error("Format d'image non pris en charge (JPEG, PNG, WEBP ou SVG).");
  }

  const dossier = path.join(process.cwd(), "public", "uploads", "logos");
  await mkdir(dossier, { recursive: true });
  const nomFichier = `${code.toLowerCase()}-${randomUUID()}${extension}`;
  const octets = Buffer.from(await fichier.arrayBuffer());
  await writeFile(path.join(dossier, nomFichier), octets);
  const cheminFichier = `/uploads/logos/${nomFichier}`;

  const existant = await prisma.entreprise.findUnique({ where: { code }, select: { logoPath: true, nom: true } });
  await prisma.entreprise.upsert({
    where: { code },
    update: { logoPath: cheminFichier },
    create: { code, nom: existant?.nom || code, logoPath: cheminFichier },
  });

  if (existant?.logoPath) {
    try {
      await unlink(path.join(process.cwd(), "public", existant.logoPath));
    } catch {
      // l'ancien fichier a peut-être déjà été supprimé
    }
  }

  revalidatePath("/administration");
  revalidatePath("/", "layout");
}

/** Modifie la couleur principale du site (Administration › Réglages). */
export async function modifierCouleurPrincipale(couleur: string) {
  await requireAdmin();
  const valeur = couleur.trim();
  if (!/^#[0-9a-fA-F]{6}$/.test(valeur)) {
    throw new Error("Couleur invalide : utilisez un code hexadécimal (ex. #1c1917).");
  }
  await prisma.parametresSite.upsert({
    where: { id: "singleton" },
    update: { couleurPrincipale: valeur },
    create: { id: "singleton", couleurPrincipale: valeur },
  });
  revalidatePath("/", "layout");
}

/** Modifie le modèle d'e-mail utilisé pour l'envoi d'un devis validé (Administration › Email). */
export async function modifierParametresEmail(objet: string, corps: string) {
  await requireAdmin();
  const objetNettoye = objet.trim();
  const corpsNettoye = corps.trim();
  if (!objetNettoye) throw new Error("L'objet du mail est obligatoire.");
  if (!corpsNettoye) throw new Error("Le corps du mail est obligatoire.");
  await prisma.parametresEmail.upsert({
    where: { id: "singleton" },
    update: { objet: objetNettoye, corps: corpsNettoye },
    create: { id: "singleton", objet: objetNettoye, corps: corpsNettoye },
  });
  revalidatePath("/administration/email");
}

/** Ajoute un modèle de rénovation au catalogue (Administration › Modèles de rénovation). */
export async function ajouterModeleRenovation(nom: string) {
  await requireAdmin();
  const nomNettoye = nom.trim();
  if (!nomNettoye) throw new Error("Le nom du modèle est obligatoire.");
  const existant = await prisma.modeleRenovation.findUnique({ where: { nom: nomNettoye } });
  if (existant) throw new Error("Ce modèle de rénovation existe déjà.");
  await prisma.modeleRenovation.create({ data: { nom: nomNettoye } });
  revalidatePath("/administration/modeles-renovation");
  revalidatePath("/chantiers/nouveau");
}

/** Modifie le coût moyen au m² d'un modèle de rénovation. */
export async function modifierModeleRenovation(id: string, coutMoyenM2: number | null) {
  await requireAdmin();
  if (coutMoyenM2 != null && (!Number.isFinite(coutMoyenM2) || coutMoyenM2 <= 0)) {
    throw new Error("Le coût moyen au m² doit être un nombre positif.");
  }
  await prisma.modeleRenovation.update({ where: { id }, data: { coutMoyenM2 } });
  revalidatePath("/administration/modeles-renovation");
}

export async function supprimerModeleRenovation(id: string) {
  await requireAdmin();
  await prisma.modeleRenovation.delete({ where: { id } });
  revalidatePath("/administration/modeles-renovation");
  revalidatePath("/chantiers/nouveau");
}

export interface ParametreOngletInput {
  onglet: AccesOnglet;
  libellePersonnalise: string | null;
  ordre: number;
}

/** Remplace l'ordre et les libellés personnalisés de tous les onglets du menu. */
export async function modifierParametresOnglets(parametres: ParametreOngletInput[]) {
  await requireAdmin();
  for (const p of parametres) {
    if (!ACCES_ONGLETS.includes(p.onglet)) throw new Error("Onglet inconnu.");
  }
  await prisma.$transaction(
    parametres.map((p) =>
      prisma.parametreOnglet.upsert({
        where: { onglet: p.onglet },
        update: { libellePersonnalise: p.libellePersonnalise?.trim() || null, ordre: p.ordre },
        create: { onglet: p.onglet, libellePersonnalise: p.libellePersonnalise?.trim() || null, ordre: p.ordre },
      })
    )
  );
  revalidatePath("/", "layout");
}
