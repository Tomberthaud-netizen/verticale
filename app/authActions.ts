"use server";

import { randomUUID } from "node:crypto";
import { cookies, headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { hacherMotDePasse, verifierMotDePasse } from "@/lib/motDePasse";
import { creerJetonSession, verifierJetonSession, NOM_COOKIE_SESSION } from "@/lib/session";
import { ACCES_ONGLETS } from "@/constants/acces";

const DUREE_COOKIE_SECONDES = 7 * 24 * 3600;

/** IP du visiteur, au mieux (en-tête posé par le proxy/hébergeur — absent en local). */
async function adresseIp(): Promise<string | null> {
  const magasin = await headers();
  const transmise = magasin.get("x-forwarded-for");
  if (transmise) return transmise.split(",")[0].trim();
  return magasin.get("x-real-ip");
}

async function ouvrirSession(personneId: string) {
  const sid = randomUUID();
  const jeton = await creerJetonSession(personneId, sid);
  const magasin = await cookies();
  magasin.set(NOM_COOKIE_SESSION, jeton, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: DUREE_COOKIE_SECONDES,
  });

  const enTetes = await headers();
  await prisma.connexion.create({
    data: {
      personneId,
      sessionId: sid,
      ip: await adresseIp(),
      appareil: enTetes.get("user-agent"),
    },
  });
}

export async function connexion(email: string, motDePasse: string) {
  const emailNettoye = email.trim().toLowerCase();
  const personne = await prisma.personne.findUnique({ where: { email: emailNettoye } });
  if (!personne || !verifierMotDePasse(motDePasse, personne.motDePasseHash)) {
    throw new Error("Adresse e-mail ou mot de passe incorrect.");
  }
  await ouvrirSession(personne.id);
}

export async function deconnexion() {
  const magasin = await cookies();
  const jeton = magasin.get(NOM_COOKIE_SESSION)?.value;
  const payload = await verifierJetonSession(jeton);
  magasin.delete(NOM_COOKIE_SESSION);

  if (payload) {
    await prisma.connexion
      .update({ where: { sessionId: payload.sid }, data: { deconnecteLe: new Date() } })
      .catch(() => {
        // la ligne de connexion a pu être nettoyée entre-temps : pas bloquant.
      });
  }
}

export interface CreerPremierCompteInput {
  nom: string;
  prenom: string;
  email: string;
  telephone?: string;
  motDePasse: string;
}

/** Crée le tout premier compte (accès complet automatique). Refuse si un compte existe déjà. */
export async function creerPremierCompte(data: CreerPremierCompteInput) {
  const nombreExistant = await prisma.personne.count();
  if (nombreExistant > 0) {
    throw new Error("Un compte existe déjà. Connectez-vous, ou demandez à un administrateur de vous créer un accès.");
  }

  const nom = data.nom.trim();
  const prenom = data.prenom.trim();
  const email = data.email.trim().toLowerCase();
  if (!nom || !prenom || !email) {
    throw new Error("Nom, prénom et e-mail sont obligatoires.");
  }
  if (data.motDePasse.length < 8) {
    throw new Error("Le mot de passe doit contenir au moins 8 caractères.");
  }

  const personne = await prisma.personne.create({
    data: {
      nom,
      prenom,
      email,
      telephone: data.telephone?.trim() || null,
      motDePasseHash: hacherMotDePasse(data.motDePasse),
      estAdmin: true,
      acces: { create: ACCES_ONGLETS.map((onglet) => ({ onglet })) },
    },
  });

  await ouvrirSession(personne.id);
  return { id: personne.id };
}
