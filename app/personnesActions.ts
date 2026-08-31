"use server";

import { revalidatePath } from "next/cache";
import type { AccesOnglet } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { hacherMotDePasse } from "@/lib/motDePasse";
import { requireAdmin } from "@/lib/authContext";
import { envoyerEmail } from "@/lib/mail";
import { ACCES_ONGLETS, ONGLETS_SANS_ENTREPRISE } from "@/constants/acces";
import { ENTREPRISES } from "@/constants/entreprises";

/** Envoie ses identifiants à une personne nouvellement créée. N'échoue jamais : la création du
 * compte ne doit pas être bloquée par un souci d'envoi d'e-mail (SMTP non configuré, etc.). */
async function envoyerIdentifiants(email: string, motDePasse: string): Promise<boolean> {
  const url = process.env.SITE_URL || "https://verticale.site";
  try {
    await envoyerEmail({
      to: email,
      subject: "Vos identifiants — Suivi de chantiers Verticale",
      text: `Bonjour,\n\nVous trouverez ci-joint votre identifiant et votre mot de passe pour accéder au site.\n\nIdentifiant : ${email}\nMot de passe : ${motDePasse}\nURL : ${url}\n\nCordialement,`,
    });
    return true;
  } catch (err) {
    console.error("Échec de l'envoi des identifiants par e-mail :", err);
    return false;
  }
}

export interface AccesInput {
  onglet: string;
  entreprise: string | null;
}

function validerAcces(acces: AccesInput[]): { onglet: AccesOnglet; entreprise: string | null }[] {
  return acces
    .filter((a): a is AccesInput & { onglet: AccesOnglet } => (ACCES_ONGLETS as string[]).includes(a.onglet))
    .map((a) => ({
      onglet: a.onglet,
      // Onglet commun aux deux entreprises : l'entreprise n'a pas de sens, on force null.
      entreprise: ONGLETS_SANS_ENTREPRISE.includes(a.onglet)
        ? null
        : (ENTREPRISES as readonly string[]).includes(a.entreprise ?? "")
          ? a.entreprise
          : null,
    }));
}

async function compterAdmins(excludePersonneId?: string): Promise<number> {
  return prisma.personne.count({
    where: { estAdmin: true, ...(excludePersonneId ? { NOT: { id: excludePersonneId } } : {}) },
  });
}

export interface CreerPersonneInput {
  nom: string;
  prenom: string;
  email: string;
  telephone?: string;
  motDePasse: string;
  estAdmin: boolean;
  acces: AccesInput[];
}

export async function creerPersonne(data: CreerPersonneInput) {
  await requireAdmin();

  const nom = data.nom.trim();
  const prenom = data.prenom.trim();
  const email = data.email.trim().toLowerCase();
  if (!nom || !prenom || !email) {
    throw new Error("Nom, prénom et e-mail sont obligatoires.");
  }
  if (data.motDePasse.length < 8) {
    throw new Error("Le mot de passe doit contenir au moins 8 caractères.");
  }

  const existant = await prisma.personne.findUnique({ where: { email } });
  if (existant) throw new Error("Un compte existe déjà avec cette adresse e-mail.");

  const personne = await prisma.personne.create({
    data: {
      nom,
      prenom,
      email,
      telephone: data.telephone?.trim() || null,
      motDePasseHash: hacherMotDePasse(data.motDePasse),
      estAdmin: data.estAdmin,
      acces: { create: validerAcces(data.acces) },
    },
  });

  const emailEnvoye = await envoyerIdentifiants(email, data.motDePasse);

  revalidatePath("/administration");
  return { id: personne.id, emailEnvoye };
}

export interface ModifierPersonneInput {
  nom: string;
  prenom: string;
  email: string;
  telephone?: string;
  motDePasse?: string;
  estAdmin: boolean;
  acces: AccesInput[];
}

export async function modifierPersonne(personneId: string, data: ModifierPersonneInput) {
  const moi = await requireAdmin();

  const nom = data.nom.trim();
  const prenom = data.prenom.trim();
  const email = data.email.trim().toLowerCase();
  if (!nom || !prenom || !email) {
    throw new Error("Nom, prénom et e-mail sont obligatoires.");
  }
  if (data.motDePasse && data.motDePasse.length < 8) {
    throw new Error("Le mot de passe doit contenir au moins 8 caractères.");
  }

  const autreAvecEmail = await prisma.personne.findFirst({ where: { email, NOT: { id: personneId } } });
  if (autreAvecEmail) throw new Error("Un autre compte utilise déjà cette adresse e-mail.");

  const personneActuelle = await prisma.personne.findUnique({
    where: { id: personneId },
    select: { estAdmin: true, estAdminPrincipal: true },
  });

  if (personneActuelle?.estAdminPrincipal && !data.estAdmin) {
    throw new Error("Impossible de retirer les droits administrateur à l'administrateur principal.");
  }

  if (personneActuelle?.estAdmin && !data.estAdmin) {
    if (!moi.estAdminPrincipal) {
      throw new Error("Seul l'administrateur principal peut retirer les droits administrateur d'un compte.");
    }
    if ((await compterAdmins(personneId)) === 0) {
      throw new Error("Impossible de retirer les droits administrateur du dernier administrateur.");
    }
  }

  await prisma.$transaction(async (tx) => {
    await tx.accesPersonne.deleteMany({ where: { personneId } });
    await tx.personne.update({
      where: { id: personneId },
      data: {
        nom,
        prenom,
        email,
        telephone: data.telephone?.trim() || null,
        estAdmin: data.estAdmin,
        ...(data.motDePasse ? { motDePasseHash: hacherMotDePasse(data.motDePasse) } : {}),
        acces: { create: validerAcces(data.acces) },
      },
    });
  });

  revalidatePath("/administration");
}

export async function supprimerPersonne(personneId: string) {
  const moi = await requireAdmin();
  if (moi.id === personneId) {
    throw new Error("Vous ne pouvez pas supprimer votre propre compte.");
  }
  const total = await prisma.personne.count();
  if (total <= 1) {
    throw new Error("Impossible de supprimer le dernier compte.");
  }
  const cible = await prisma.personne.findUnique({
    where: { id: personneId },
    select: { estAdmin: true, estAdminPrincipal: true },
  });
  if (cible?.estAdminPrincipal) {
    throw new Error("Impossible de supprimer le compte de l'administrateur principal.");
  }
  if (cible?.estAdmin) {
    if (!moi.estAdminPrincipal) {
      throw new Error("Seul l'administrateur principal peut supprimer un compte administrateur.");
    }
    if ((await compterAdmins(personneId)) === 0) {
      throw new Error("Impossible de supprimer le dernier administrateur.");
    }
  }
  await prisma.personne.delete({ where: { id: personneId } });
  revalidatePath("/administration");
}
